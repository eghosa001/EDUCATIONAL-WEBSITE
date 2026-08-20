import('@supabase/supabase-js').then(async ({ createClient }) => {
  const sb = createClient('https://xanrzsszrysianxhpprk.supabase.co', 'sb_secret_cUUTPK62ueOSheC5JzFVFQ_DkNpJOYO');

  const { data: courses } = await sb.from('courses').select('id,subject_id,class_id,term_id,title');
  console.log('Total courses:', courses?.length || 0);

  // Count and delete duplicates
  const kept = {};
  const toDelete = [];
  for (const c of courses || []) {
    const key = `${c.subject_id}|${c.class_id}|${c.term_id}`;
    if (kept[key]) { toDelete.push(c.id); }
    else { kept[key] = c.id; }
  }
  console.log('Duplicates to delete:', toDelete.length);

  if (toDelete.length > 0) {
    const { error } = await sb.from('courses').delete().in('id', toDelete);
    if (error) console.error('Delete error:', error.message);
    else console.log('Deleted', toDelete.length, 'duplicate courses');
  }

  // Check curated course lessons
  const curatedIds = [
    'eaef1d05-67d8-4710-816b-4d8f68fbf164',
    'de2e1389-10a9-4f1d-bffe-1cd105dbcac7',
    '02183441-e8e4-432d-a3d7-0e45954bade9',
    '2fb9adc5-c6ad-40e0-9f9a-464acd80aeb9',
    '91715dad-43d5-411e-b660-f27e891f67b1',
    'b58b82dd-9a0f-4bb4-8319-b20d3f36bf50'
  ];
  for (const cid of curatedIds) {
    const { data: ls } = await sb.from('lessons').select('id,title,topic_id').eq('course_id', cid);
    const topicsLinked = (ls || []).filter(l => l.topic_id).length;
    console.log(`  Course ${cid.substring(0, 8)}: ${(ls||[]).length} lessons, ${topicsLinked} with topic_id`);
  }

  // Update curriculum topics for curated courses that lack them
  // Map slug -> subject_code
  const slugToSubject = {
    'chemistry-waec-jamb': 'CHM',
    'waec-biology-prep': 'BIO',
    'english-grammar-comprehension': 'ENG',
    'government-civics-guide': 'GOV',
    'jamb-math-mastery': 'MATH',
    'physics-basics-advanced': 'PHY'
  };

  const { data: subjects } = await sb.from('subjects').select('id,code');
  const subjById = {};
  for (const s of subjects || []) subjById[s.code] = s.id;

  for (const cid of curatedIds) {
    const { data: crs } = await sb.from('courses').select('slug,subject_id').eq('id', cid).single();
    if (!crs) continue;
    const code = slugToSubject[crs.slug];
    if (!code) continue;
    const subjId = subjById[code];
    if (!subjId) continue;

    const { data: ls } = await sb.from('lessons').select('id').eq('course_id', cid).is('topic_id', null);
    const missing = ls || [];
    if (missing.length === 0) continue;

    // Get topics for this subject
    const { data: topics } = await sb.from('topics').select('id').eq('subject_id', subjId).order('order_index');
    const topicIds = (topics || []).map(t => t.id);
    if (topicIds.length === 0) continue;

    for (let i = 0; i < missing.length; i++) {
      await sb.from('lessons').update({ topic_id: topicIds[i % topicIds.length] }).eq('id', missing[i].id);
    }
    console.log(`  Linked ${missing.length} lessons in "${crs.slug}" to topics`);
  }

  // Final counts
  const tables = ['topics', 'lessons', 'questions', 'past_questions', 'flashcards', 'courses'];
  console.log('\n── FINAL STATE ──');
  for (const tbl of tables) {
    const { count } = await sb.from(tbl).select('*', { count: 'exact', head: true });
    console.log(`  ${tbl}: ${(count ?? 0).toLocaleString()}`);
  }
  console.log('\nDone!');
}).catch(e => console.error(e.message));
