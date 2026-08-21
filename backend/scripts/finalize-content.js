import('@supabase/supabase-js').then(async ({ createClient }) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in the environment; never hard-code service-role credentials.'
    );
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: courses, error: coursesError } = await sb
    .from('courses')
    .select('id,subject_id,class_id,term_id,title');
  if (coursesError) throw coursesError;

  console.log('Total courses:', courses?.length || 0);

  // Report duplicate courses instead of deleting them automatically.
  // Destructive cleanup should be reviewed before production execution.
  const kept = {};
  const duplicates = [];
  for (const c of courses || []) {
    const key = `${c.subject_id}|${c.class_id}|${c.term_id}`;
    if (kept[key]) duplicates.push(c);
    else kept[key] = c.id;
  }
  console.log('Duplicate course candidates:', duplicates.length);
  for (const c of duplicates) {
    console.log(`  DUPLICATE: ${c.id} — ${c.title || '(untitled)'}`);
  }

  // Check curated course lessons. Do not guess topic relationships.
  const curatedIds = [
    'eaef1d05-67d8-4710-816b-4d8f68fbf164',
    'de2e1389-10a9-4f1d-bffe-1cd105dbcac7',
    '02183441-e8e4-432d-a3d7-0e45954bade9',
    '2fb9adc5-c6ad-40e0-9f9a-464acd80aeb9',
    '91715dad-43d5-411e-b660-f27e891f67b1',
    'b58b82dd-9a0f-4bb4-8319-b20d3f36bf50'
  ];

  for (const cid of curatedIds) {
    const { data: ls, error } = await sb
      .from('lessons')
      .select('id,title,topic_id')
      .eq('course_id', cid);
    if (error) {
      console.error(`  Could not inspect course ${cid}: ${error.message}`);
      continue;
    }
    const missingTopics = (ls || []).filter(l => !l.topic_id);
    console.log(
      `  Course ${cid.substring(0, 8)}: ${(ls || []).length} lessons, ` +
      `${missingTopics.length} missing explicit topic_id`
    );
  }

  console.log('\nNo automatic topic reassignment was performed.');
  console.log('Lessons without topic_id must be mapped from their source metadata/title and reviewed.');

  const tables = ['topics', 'lessons', 'questions', 'past_questions', 'flashcards', 'courses'];
  console.log('\n── FINAL STATE ──');
  for (const tbl of tables) {
    const { count, error } = await sb.from(tbl).select('*', { count: 'exact', head: true });
    if (error) console.log(`  ${tbl}: ERROR — ${error.message}`);
    else console.log(`  ${tbl}: ${(count ?? 0).toLocaleString()}`);
  }
  console.log('\nDone!');
}).catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
