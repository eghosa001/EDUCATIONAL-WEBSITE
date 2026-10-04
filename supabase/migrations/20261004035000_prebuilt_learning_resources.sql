-- Pre-generated lesson resources for immediate learner access.
-- Generated material is grounded in published lesson content and is never labelled as historical exam material.

alter table public.lesson_practice_sets
  drop constraint if exists lesson_practice_sets_question_count;
alter table public.lesson_practice_sets
  add constraint lesson_practice_sets_question_count
  check (jsonb_array_length(questions) between 3 and 20);

create unique index if not exists flashcards_public_curriculum_lesson_unique
  on public.flashcards (lesson_id)
  where is_public = true
    and created_by is null
    and mode = 'curriculum-prebuilt';

create table if not exists public.learning_content_pipeline (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  flashcard_status text not null default 'pending'
    check (flashcard_status in ('pending','generated','validated','rejected','published')),
  practice_status text not null default 'pending'
    check (practice_status in ('pending','generated','validated','rejected','published')),
  verification_status text not null default 'pending'
    check (verification_status in ('pending','validated','rejected','published')),
  source_basis text not null default 'published-lesson',
  flashcard_count integer not null default 0 check (flashcard_count >= 0),
  practice_question_count integer not null default 0 check (practice_question_count >= 0),
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.learning_content_pipeline enable row level security;
drop policy if exists learning_content_pipeline_no_client_access on public.learning_content_pipeline;
create policy learning_content_pipeline_no_client_access
on public.learning_content_pipeline for all
to anon, authenticated
using (false)
with check (false);

revoke all on table public.learning_content_pipeline from public, anon, authenticated;
grant select, insert, update, delete on table public.learning_content_pipeline to service_role;

CREATE OR REPLACE FUNCTION public.clean_learning_resource_text(p_value text, p_max integer DEFAULT 520)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select left(
    regexp_replace(
      btrim(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(coalesce(p_value,''),'**',''),
                '__',''),
              '#',''),
            '|',' '),
          '>',' '),
        E'\t',' ')
      ),
      '[[:space:]]+',
      ' ',
      'g'
    ),
    greatest(1,least(coalesce(p_max,520),1200))
  );
$function$;

revoke all on function public.clean_learning_resource_text(text,integer) from public, anon, authenticated;
grant execute on function public.clean_learning_resource_text(text,integer) to service_role;

CREATE OR REPLACE FUNCTION public.append_grounded_flashcard(p_cards jsonb, p_front text, p_back text, p_kind text, p_cue text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare
  v_cards jsonb := coalesce(p_cards,'[]'::jsonb);
  v_front text := public.clean_learning_resource_text(p_front,220);
  v_back text := public.clean_learning_resource_text(p_back,560);
  v_kind text := left(coalesce(nullif(btrim(p_kind),''),'lesson'),40);
  v_cue text := public.clean_learning_resource_text(p_cue,100);
  v_count integer;
begin
  if length(v_front) < 6 or length(v_back) < 18 then return v_cards; end if;
  if lower(v_front) in ('what does "concept" mean in this lesson?','what does "term" mean in this lesson?') then return v_cards; end if;
  if exists (
    select 1
    from jsonb_array_elements(v_cards) c
    where lower(regexp_replace(coalesce(c->>'front',''),'[[:space:]]+',' ','g')) =
          lower(regexp_replace(v_front,'[[:space:]]+',' ','g'))
       or lower(regexp_replace(coalesce(c->>'back',''),'[[:space:]]+',' ','g')) =
          lower(regexp_replace(v_back,'[[:space:]]+',' ','g'))
  ) then return v_cards; end if;

  v_count := jsonb_array_length(v_cards);
  return v_cards || jsonb_build_array(jsonb_build_object(
    'front',v_front,
    'back',v_back,
    'difficulty',case when v_count < 3 then 'easy' when v_count < 7 then 'medium' else 'hard' end,
    'sourceKind',v_kind,
    'cue',v_cue
  ));
end;
$function$;

revoke all on function public.append_grounded_flashcard(jsonb,text,text,text,text) from public, anon, authenticated;
grant execute on function public.append_grounded_flashcard(jsonb,text,text,text,text) to service_role;

CREATE OR REPLACE FUNCTION public.prebuild_learning_resource_batch(p_limit integer DEFAULT 100)
 RETURNS TABLE(processed integer, published_flashcard_decks integer, published_practice_sets integer, rejected integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  r record;
  v_cards jsonb;
  v_questions jsonb;
  v_lines text[];
  v_line text;
  v_clean text;
  v_term text;
  v_rest text;
  v_heading text;
  v_next text;
  v_word text;
  v_words text[];
  v_point text;
  v_front text;
  v_back text;
  v_correct text;
  v_d1 text;
  v_d2 text;
  v_d3 text;
  v_options jsonb;
  v_fingerprint text;
  v_card_count integer;
  v_i integer;
  v_j integer;
  v_q integer;
  v_first integer;
  v_second integer;
  v_processed integer := 0;
  v_flash integer := 0;
  v_practice integer := 0;
  v_rejected integer := 0;
begin
  for r in
    select
      l.id,l.course_id,l.topic_id,l.title,l.written_content,l.key_points,l.learning_objectives,
      l.teaching_version,c.subject_id
    from public.lessons l
    join public.courses c on c.id=l.course_id
    where l.is_published=true
      and not exists (
        select 1 from public.learning_content_pipeline blocked
        where blocked.lesson_id=l.id and blocked.verification_status='rejected'
      )
      and (
        not exists (
          select 1 from public.flashcards f
          where f.lesson_id=l.id and f.is_public=true and f.created_by is null
            and f.mode='curriculum-prebuilt'
            and jsonb_array_length(f.cards) >= 8
        )
        or not exists (
          select 1 from public.lesson_practice_sets ps
          where ps.lesson_id=l.id and ps.source_version>=3
            and jsonb_array_length(ps.questions) >= 8
        )
      )
    order by l.id
    limit greatest(1,least(coalesce(p_limit,100),500))
  loop
    v_processed := v_processed + 1;
    begin
      v_cards := '[]'::jsonb;
      v_lines := regexp_split_to_array(
        replace(
          replace(coalesce(r.written_content,''), chr(92)||'r'||chr(92)||'n', chr(10)),
          chr(92)||'n',
          chr(10)
        ),
        E'\n'
      );

      -- Strongest source: a bold curriculum term occurring inside a substantive
      -- explanatory line/table row.
      if coalesce(array_length(v_lines,1),0) > 0 then
        for v_i in 1..array_length(v_lines,1) loop
          exit when jsonb_array_length(v_cards) >= 12;
          v_line := btrim(v_lines[v_i]);
          v_first := strpos(v_line,'**');
          if v_first > 0 then
            v_rest := substr(v_line,v_first+2);
            v_second := strpos(v_rest,'**');
            if v_second > 2 then
              v_term := public.clean_learning_resource_text(substr(v_rest,1,v_second-1),90);
              v_clean := public.clean_learning_resource_text(v_line,560);
              if length(v_term) between 3 and 90
                 and lower(v_term) not in ('term','concept','meaning','key concept','key concepts','s/n','feature','aspect','type','example','examples','answer','answers','answers:','self-check','false','true')
                 and v_term !~ '[.,:;?!]'
                 and coalesce(array_length(regexp_split_to_array(v_term,'[[:space:]]+'),1),0) <= 6
                 and length(v_clean) >= 24 then
                v_cards := public.append_grounded_flashcard(
                  v_cards,
                  'Which statement from the lesson best explains or uses "'||v_term||'"?',
                  v_clean,
                  'definition',
                  v_term
                );
              end if;
            end if;
          end if;
        end loop;
      end if;

      -- Section summaries give a direct prompt and a lesson-grounded explanation.
      if jsonb_array_length(v_cards) < 12 and coalesce(array_length(v_lines,1),0) > 0 then
        for v_i in 1..array_length(v_lines,1) loop
          exit when jsonb_array_length(v_cards) >= 12;
          v_line := btrim(v_lines[v_i]);
          if left(v_line,2)='##' then
            v_heading := public.clean_learning_resource_text(ltrim(v_line,'# '),100);
            v_next := null;
            for v_j in v_i+1..least(v_i+8,array_length(v_lines,1)) loop
              v_clean := public.clean_learning_resource_text(v_lines[v_j],560);
              if length(v_clean) >= 35
                 and left(ltrim(v_lines[v_j]),1) not in ('#','|') then
                v_next := v_clean;
                exit;
              end if;
            end loop;
            if v_next is not null and length(v_heading) between 3 and 100
               and lower(v_heading) not in ('introduction','summary','quick recap','key points','lesson summary','conclusion','self-check','answers','questions','practice','exercise','exercises')
               and lower(v_heading) !~ '(self[- ]?check|answers?|questions?|practice|exercise|examples?|importance|types?|uses?|causes?|effects?|advantages?|disadvantages?|steps?|features?|functions?)' then
              v_cards := public.append_grounded_flashcard(
                v_cards,
                'Explain "'||v_heading||'" as taught in this lesson.',
                v_next,
                'section',
                v_heading
              );
            end if;
          end if;
        end loop;
      end if;

      -- Additional substantive lesson lines, anchored to a meaningful keyword,
      -- fill lessons that use fewer explicit headings/bold terms.
      if jsonb_array_length(v_cards) < 10 and coalesce(array_length(v_lines,1),0) > 0 then
        for v_i in 1..array_length(v_lines,1) loop
          exit when jsonb_array_length(v_cards) >= 10;
          v_line := btrim(v_lines[v_i]);
          v_clean := public.clean_learning_resource_text(v_line,520);
          if length(v_clean) between 60 and 520
             and left(v_line,1) not in ('#','|')
             and v_clean !~* '^(welcome|in this lesson|learning objective|exam tip|answers?|answer key|self-check|questions?|practice|quiz|exercise|true([ :.-]|$)|false([ :.-]|$))' then
            v_words := regexp_split_to_array(v_clean,'[[:space:]]+');
            v_term := null;
            if coalesce(array_length(v_words,1),0)>0 then
              foreach v_word in array v_words loop
                v_word := regexp_replace(v_word,'[^[:alnum:]-]','','g');
                if length(v_word) between 5 and 28
                   and lower(v_word) not in (
                     'about','after','again','because','before','being','between','could','during',
                     'first','from','have','into','lesson','other','should','their','there','these',
                     'through','under','using','which','while','with','would','important','students',
                     'example','examples','following','different','include','includes','including',
                     'answer','answers','false','true','having','people','pupil','pupils','student',
                     'students','children','remember','question','questions','practice','exercise'
                   ) then
                  v_term := v_word;
                  exit;
                end if;
              end loop;
            end if;
            if v_term is not null then
              v_cards := public.append_grounded_flashcard(
                v_cards,
                'Which lesson statement is most closely associated with "'||v_term||'"?',
                v_clean,
                'lesson-fact',
                v_term
              );
            end if;
          end if;
        end loop;
      end if;

      -- Final flashcard-only fallback uses explicit stored key points/objectives.
      if jsonb_array_length(v_cards) < 10 then
        for v_point in
          select value
          from jsonb_array_elements_text(coalesce(r.key_points,'[]'::jsonb))
        loop
          exit when jsonb_array_length(v_cards) >= 10;
          v_clean := public.clean_learning_resource_text(v_point,420);
          if length(v_clean)>=18 and v_clean !~* 'NERDC[[:space:]]+2025[[:space:]]+curriculum[[:space:]]+focus[[:space:]]+for[[:space:]]+week' then
            v_cards := public.append_grounded_flashcard(
              v_cards,
              'What key point should you remember from "'||left(public.clean_learning_resource_text(r.title,100),100)||'"?',
              v_clean,
              'key-point',
              left(v_clean,80)
            );
          end if;
        end loop;
      end if;

      if jsonb_array_length(v_cards) < 10 then
        for v_point in
          select value
          from jsonb_array_elements_text(coalesce(r.learning_objectives,'[]'::jsonb))
        loop
          exit when jsonb_array_length(v_cards) >= 10;
          v_clean := public.clean_learning_resource_text(v_point,420);
          if length(v_clean)>=18 and v_clean !~* 'NERDC[[:space:]]+2025[[:space:]]+curriculum[[:space:]]+focus[[:space:]]+for[[:space:]]+week' then
            v_cards := public.append_grounded_flashcard(
              v_cards,
              'Which learning objective applies to "'||left(public.clean_learning_resource_text(r.title,90),90)||'"?',
              v_clean,
              'objective',
              left(v_clean,80)
            );
          end if;
        end loop;
      end if;

      v_card_count := jsonb_array_length(v_cards);
      if v_card_count < 8 then
        raise exception 'Only % unique grounded flashcards could be validated',v_card_count;
      end if;

      if v_card_count > 12 then
        select jsonb_agg(value order by ord)
        into v_cards
        from jsonb_array_elements(v_cards) with ordinality a(value,ord)
        where ord<=12;
        v_card_count := jsonb_array_length(v_cards);
      end if;

      insert into public.flashcards(
        course_id,lesson_id,topic_id,subject_id,title,description,cards,mode,is_public,created_by,updated_at
      ) values (
        r.course_id,r.id,r.topic_id,r.subject_id,
        left(public.clean_learning_resource_text(r.title,180)||' — Flashcards',255),
        'Pre-generated retrieval-practice cards grounded in this published lesson.',
        v_cards,'curriculum-prebuilt',true,null,now()
      )
      on conflict (lesson_id) where is_public=true and created_by is null and mode='curriculum-prebuilt'
      do update set
        course_id=excluded.course_id,
        topic_id=excluded.topic_id,
        subject_id=excluded.subject_id,
        title=excluded.title,
        description=excluded.description,
        cards=excluded.cards,
        updated_at=now();
      v_flash := v_flash + 1;

      -- Build eight deterministic MCQs from distinct flashcard prompts/answers.
      -- The answer strings come from the published lesson; distractors are other
      -- facts from that same lesson, so no external or fabricated fact is added.
      v_questions := '[]'::jsonb;
      for v_q in 0..7 loop
        v_front := v_cards->v_q->>'front';
        v_correct := left(v_cards->v_q->>'back',600);
        v_d1 := left(v_cards->((v_q+1)%v_card_count)->>'back',600);
        v_d2 := left(v_cards->((v_q+2)%v_card_count)->>'back',600);
        v_d3 := left(v_cards->((v_q+3)%v_card_count)->>'back',600);

        if lower(v_correct) in (lower(v_d1),lower(v_d2),lower(v_d3))
           or lower(v_d1) in (lower(v_d2),lower(v_d3))
           or lower(v_d2)=lower(v_d3) then
          raise exception 'Duplicate practice options remained after flashcard validation';
        end if;

        v_options := case (v_q%4)
          when 0 then jsonb_build_array(v_correct,v_d1,v_d2,v_d3)
          when 1 then jsonb_build_array(v_d1,v_correct,v_d2,v_d3)
          when 2 then jsonb_build_array(v_d1,v_d2,v_correct,v_d3)
          else jsonb_build_array(v_d1,v_d2,v_d3,v_correct)
        end;

        v_questions := v_questions || jsonb_build_array(jsonb_build_object(
          'questionText',left(v_front,520),
          'questionType','multiple-choice',
          'options',v_options,
          'correctAnswer',v_correct,
          'explanation','The correct option matches the explanation stored in this published lesson: "'||left(v_correct,520)||'"',
          'difficulty',case when v_q<3 then 'easy' when v_q<6 then 'medium' else 'hard' end,
          'misconceptionTested','Distinguishes this lesson concept from other facts taught in the same lesson.',
          'curriculumObjective',left(v_front,220),
          'provenanceBasis','published-lesson'
        ));
      end loop;

      if jsonb_array_length(v_questions) <> 8 then
        raise exception 'Practice set failed the eight-question quality gate';
      end if;

      v_fingerprint := encode(digest(
        left(btrim(coalesce(r.title,'')),2000)||E'\n---\n'||
        left(btrim(coalesce(r.written_content,'')),100000)||E'\n---\n'||
        coalesce(r.teaching_version,0)::text,
        'sha256'
      ),'hex');

      insert into public.lesson_practice_sets(
        lesson_id,content_fingerprint,questions,generation_method,source_version,updated_at
      ) values (
        r.id,v_fingerprint,v_questions,'grounded-fallback',3,now()
      )
      on conflict (lesson_id) do update
      set content_fingerprint=excluded.content_fingerprint,
          questions=excluded.questions,
          generation_method=excluded.generation_method,
          source_version=excluded.source_version,
          updated_at=now();
      v_practice := v_practice + 1;

      insert into public.learning_content_pipeline(
        lesson_id,flashcard_status,practice_status,verification_status,source_basis,
        flashcard_count,practice_question_count,last_error,updated_at
      ) values (
        r.id,'published','published','published','published-lesson',
        v_card_count,8,null,now()
      )
      on conflict (lesson_id) do update
      set flashcard_status='published',
          practice_status='published',
          verification_status='published',
          source_basis='published-lesson',
          flashcard_count=excluded.flashcard_count,
          practice_question_count=8,
          last_error=null,
          updated_at=now();

    exception when others then
      v_rejected := v_rejected + 1;
      insert into public.learning_content_pipeline(
        lesson_id,flashcard_status,practice_status,verification_status,source_basis,
        flashcard_count,practice_question_count,last_error,updated_at
      ) values (
        r.id,'rejected','rejected','rejected','published-lesson',
        coalesce(jsonb_array_length(v_cards),0),0,left(sqlerrm,1200),now()
      )
      on conflict (lesson_id) do update
      set flashcard_status='rejected',
          practice_status='rejected',
          verification_status='rejected',
          flashcard_count=excluded.flashcard_count,
          practice_question_count=0,
          last_error=excluded.last_error,
          updated_at=now();
    end;
  end loop;

  return query select v_processed,v_flash,v_practice,v_rejected;
end;
$function$;

revoke all on function public.prebuild_learning_resource_batch(integer) from public, anon, authenticated;
grant execute on function public.prebuild_learning_resource_batch(integer) to service_role;

create or replace view public.learning_content_coverage
with (security_invoker = true)
as
 SELECT l.id AS lesson_id,
    l.title AS lesson_title,
    c.class_id,
    cl.name AS class_name,
    c.subject_id,
    s.name AS subject_name,
    c.term_id,
    (EXISTS ( SELECT 1
           FROM lesson_resources lr
          WHERE lr.lesson_id = l.id AND lr.resource_type::text = 'visual-summary'::text)) AS has_visual,
    COALESCE(( SELECT max(jsonb_array_length(f.cards)) AS max
           FROM flashcards f
          WHERE f.lesson_id = l.id AND f.is_public = true AND f.created_by IS NULL AND f.mode::text = 'curriculum-prebuilt'::text), 0) AS flashcard_count,
    COALESCE(( SELECT max(jsonb_array_length(ps.questions)) AS max
           FROM lesson_practice_sets ps
          WHERE ps.lesson_id = l.id), 0) AS practice_question_count,
    COALESCE(p.flashcard_status, 'pending'::text) AS flashcard_status,
    COALESCE(p.practice_status, 'pending'::text) AS practice_status,
    p.last_error
   FROM lessons l
     JOIN courses c ON c.id = l.course_id
     LEFT JOIN classes cl ON cl.id = c.class_id
     LEFT JOIN subjects s ON s.id = c.subject_id
     LEFT JOIN learning_content_pipeline p ON p.lesson_id = l.id
  WHERE l.is_published = true;;

revoke all on table public.learning_content_coverage from public, anon, authenticated;
grant select on table public.learning_content_coverage to service_role;

-- Fill all lessons that pass the strict grounded-content quality gate.
do $populate$
declare
  v_processed integer;
begin
  loop
    select processed into v_processed
    from public.prebuild_learning_resource_batch(500);
    exit when coalesce(v_processed,0)=0;
  end loop;
end;
$populate$;
