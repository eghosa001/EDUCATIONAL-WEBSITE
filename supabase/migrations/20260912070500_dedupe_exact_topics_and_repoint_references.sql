begin;

create temporary table _duplicate_topics on commit drop as
with ranked as (
  select id,
         first_value(id) over (
           partition by subject_id,class_id,term_id,name,code,description,learning_objectives,order_index,estimated_hours,is_active
           order by created_at,id
         ) canonical_id,
         row_number() over (
           partition by subject_id,class_id,term_id,name,code,description,learning_objectives,order_index,estimated_hours,is_active
           order by created_at,id
         ) rn
  from public.topics
)
select id duplicate_id,canonical_id from ranked where rn>1;

update public.ai_conversations x set topic_id=d.canonical_id from _duplicate_topics d where x.topic_id=d.duplicate_id;
update public.community_posts x set topic_id=d.canonical_id from _duplicate_topics d where x.topic_id=d.duplicate_id;
update public.flashcards x set topic_id=d.canonical_id from _duplicate_topics d where x.topic_id=d.duplicate_id;
update public.lessons x set topic_id=d.canonical_id from _duplicate_topics d where x.topic_id=d.duplicate_id;
update public.library_resources x set topic_id=d.canonical_id from _duplicate_topics d where x.topic_id=d.duplicate_id;
update public.past_questions x set topic_id=d.canonical_id from _duplicate_topics d where x.topic_id=d.duplicate_id;
update public.questions x set topic_id=d.canonical_id from _duplicate_topics d where x.topic_id=d.duplicate_id;
update public.study_groups x set topic_id=d.canonical_id from _duplicate_topics d where x.topic_id=d.duplicate_id;
update public.subtopics x set topic_id=d.canonical_id from _duplicate_topics d where x.topic_id=d.duplicate_id;

delete from public.topics t using _duplicate_topics d where t.id=d.duplicate_id;
commit;
