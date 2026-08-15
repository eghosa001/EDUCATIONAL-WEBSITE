/**
 * AI Lesson Generator — generates rich content for priority topics.
 * Usage: node scripts/seed-ai.js [--priority] [--all]
 *   --priority : Generate for core subjects only (fast, ~100 topics)
 *   --all      : Generate for ALL topics (slow, ~5000 topics)
 */
import { query, closePool } from '../src/common/database/index.js';
import { config } from '../src/common/config/index.js';

const AI_MODEL = config.ai.defaultModel || 'agnes-2.5-flash';
const BATCH_SIZE = 5;

const PRIORITY_SUBJECTS = new Set([
  'MATHEMATICS',
  'ENGLISH LANGUAGE',
  'BASIC SCIENCE & TECHNOLOGY',
  'CHRISTIAN RELIGIOUS STUDIES',
  'ISLAMIC RELIGIOUS STUDIES',
  'AGRICULTURAL SCIENCE',
  'HOME ECONOMICS',
  'FRENCH',
]);

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 60);
}

const systemPrompt = `You are an expert Nigerian curriculum content creator aligned with NERDC standards.
Your task is to create high-quality lesson content for Nigerian students from primary to senior secondary school.
Use Nigerian context, examples, and locales (₦, Nigerian place names, local scenarios).
Return ONLY valid JSON matching this schema — no markdown, no explanation:`;

const jsonSchema = `{
  "description": "2-3 sentence overview",
  "learning_objectives": ["objective 1", "objective 2", "objective 3"],
  "key_points": ["point 1", "point 2", "point 3", "point 4"],
  "written_content": "200-400 word explanation with Nigerian context examples",
  "practice_questions": [
    {"question": "...", "options": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}], "answer": "A", "explanation": "..."}
  ]
}`;

async function generateLesson(topicId, subjectName, topicName, classCode) {
  const prompt = `Create a complete lesson for:

Subject: ${subjectName}
Level: ${classCode}
Topic: ${topicName}

Format as JSON:${jsonSchema}`;

  if (!config.ai.bynara.apiKey) {
    console.log(`  ⏭  No AI API key — skipping ${classCode}/${subjectName}/${topicName}`);
    return null;
  }

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: config.ai.bynara.apiKey,
      baseURL: config.ai.bynara.baseURL,
    });

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content || '';
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { parsed = null; }

    return parsed;
  } catch (err) {
    console.error(`  ✗ AI error for ${topicName}: ${err.message?.slice(0, 60)}`);
    return null;
  }
}

async function updateLesson(topicId, parsed, subjectId) {
  if (!parsed) return false;

  // Get existing lesson for this topic
  const lessonRes = await query(
    `SELECT id FROM lessons WHERE topic_id = $1 LIMIT 1`,
    [topicId]
  );

  if (!lessonRes.rows[0]) return false;
  const lessonId = lessonRes.rows[0].id;

  // Update lesson with AI content
  await query(
    `UPDATE lessons SET
      description = COALESCE($2, description),
      learning_objectives = COALESCE($3, learning_objectives),
      written_content = COALESCE($4, written_content),
      key_points = COALESCE($5, key_points),
      estimated_minutes = COALESCE($6, estimated_minutes)
    WHERE id = $1`,
    [
      lessonId,
      parsed.description,
      JSON.stringify(parsed.learning_objectives || []),
      parsed.written_content,
      JSON.stringify(parsed.key_points || []),
      Math.max(15, Math.min(45, Math.ceil((parsed.written_content?.length || 300) / 200))),
    ]
  );

  // Insert practice questions
  if (parsed.practice_questions && Array.isArray(parsed.practice_questions)) {
    for (const q of parsed.practice_questions.slice(0, 3)) {
      await query(
        `INSERT INTO questions (subject_id, topic_id, question_type, question_text, options, correct_answer, explanation, difficulty, marks, source, is_active)
         VALUES ($1, $2, 'mcq', $3, $4, $5, $6, $7, 1, 'AI_GENERATED', TRUE)
         ON CONFLICT DO NOTHING`,
        [
          subjectId, topicId,
          q.question || `${topicName} - practice question`,
          JSON.stringify(q.options || [
            { id: 'A', text: 'Option A' },
            { id: 'B', text: 'Option B' },
            { id: 'C', text: 'Option C' },
            { id: 'D', text: 'Option D' },
          ]),
          JSON.stringify(q.answer || 'A'),
          q.explanation || 'Explanation.',
          ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        ]
      );
    }
  }

  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const priorityOnly = args.includes('--priority');
  const all = args.includes('--all');

  if (!priorityOnly && !all) {
    console.log('Usage:');
    console.log('  node scripts/seed-ai.js --priority   # Generate for core subjects only');
    console.log('  node scripts/seed-ai.js --all         # Generate for ALL topics');
    console.log('');
    console.log('Default (no flag): same as --priority');
    process.exit(0);
  }

  console.log(`=== AI Lesson Generator (${priorityOnly ? 'PRIORITY' : 'ALL'} mode) ===\n`);

  if (!config.ai.bynara.apiKey) {
    console.error('❌ BYNARA_API_KEY not found in environment. Cannot generate AI content.');
    process.exit(1);
  }

  // Get topics with their subject and class info
  const topicsQuery = `
    SELECT t.id AS topic_id, t.name AS topic_name, t.order_index,
           s.id AS subject_id, s.name AS subject_name,
           el.code AS class_code
    FROM topics t
    JOIN subjects s ON s.id = t.subject_id
    JOIN classes c ON c.id = t.class_id
    JOIN programs p ON p.id = c.program_id
    JOIN education_levels el ON el.id = p.education_level_id
    WHERE t.name IS NOT NULL
    ORDER BY el.order_index, s.name, t.order_index
  `;

  const topicsRes = await query(topicsQuery);
  console.log(`Found ${topicsRes.rows.length} topics\n`);

  // Filter based on mode
  let topics = topicsRes.rows;
  if (priorityOnly) {
    topics = topics.filter(t => PRIORITY_SUBJECTS.has(t.subject_name.toUpperCase()));
    console.log(`Filtered to ${topics.length} priority topics\n`);
  }

  let generated = 0;
  let skipped = 0;
  const total = topics.length;

  for (let i = 0; i < total; i++) {
    const { topic_id, topic_name, subject_name, class_code } = topics[i];

    process.stdout.write(`[${i + 1}/${total}] ${class_code} ${subject_name}: ${topic_name}... `);

    const parsed = await generateLesson(topic_id, subject_name, topic_name, class_code);
    if (parsed) {
      const updated = await updateLesson(topic_id, parsed, topics[i].subject_id);
      if (updated) {
        generated++;
        console.log('✓');
      } else {
        skipped++;
        console.log('⊘ (no lesson found)');
      }
    } else {
      skipped++;
      console.log('✗');
    }

    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`   (batch ${Math.floor((i + 1) / BATCH_SIZE)} complete, ${generated} generated so far)`);
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log(`\n✅ AI generation complete:`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`   Total:     ${total}`);

  // Update question count
  const qRes = await query('SELECT COUNT(*)::int FROM questions');
  console.log(`   Questions in DB: ${qRes.rows[0].count}`);

  await closePool();
}

main().catch(err => {
  console.error('❌ AI generation failed:', err);
  closePool().finally(() => process.exit(1));
});
