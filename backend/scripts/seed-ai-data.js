/**
 * Seed sample AI conversations, generated quizzes, and study plans.
 */
import { query, closePool } from '../src/common/database/index.js';

const SAMPLE_QUESTIONS = [
  {
    user: "Can you explain photosynthesis to me?",
    assistant: "Photosynthesis is the process by which green plants make their food using sunlight. Here's how it works:\n\n**The Basics:**\n- Plants take in carbon dioxide (CO₂) from the air through their leaves\n- They absorb water (H₂O) from the soil through their roots\n- Using sunlight energy captured by chlorophyll (the green pigment), they convert these into glucose (food) and oxygen\n\n**The Equation:**\n6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ (glucose) + 6O₂\n\n**Key Points for Nigerian Curriculum:**\n- Occurs in chloroplasts\n- Two stages: Light-dependent reactions and Calvin cycle (light-independent)\n- Essential for all life on Earth - produces oxygen and food\n\nWould you like me to explain any part in more detail?",
    topic: 'Photosynthesis',
    subject: 'BIOLOGY'
  },
  {
    user: "Help me understand quadratic equations",
    assistant: "Quadratic equations are equations of the form ax² + bx + c = 0.\n\n**The Quadratic Formula:**\nx = (-b ± √(b²-4ac)) / 2a\n\n**Example from WAEC:**\nSolve: 2x² + 5x - 3 = 0\n\nHere a=2, b=5, c=-3\n\nx = (-5 ± √(25+24)) / 4\nx = (-5 ± √49) / 4\nx = (-5 ± 7) / 4\n\nSo x = ½ or x = -3\n\n**Tips for Exams:**\n- Always check your answer by substituting back\n- Memorize the formula\n- Practice factorization as an alternative method\n\nShall I give you more practice problems?",
    topic: 'Quadratic Equations',
    subject: 'MATHEMATICS'
  },
  {
    user: "What is the difference between mitosis and meiosis?",
    assistant: "Great question! Both are types of cell division but serve different purposes:\n\n**Mitosis:**\n- Produces 2 identical daughter cells\n- Used for growth and repair\n- Occurs in somatic (body) cells\n- 46 chromosomes in each cell (in humans)\n- One division only\n\n**Meiosis:**\n- Produces 4 genetically different cells\n- Used for sexual reproduction (gametes)\n- Occurs in germ cells\n- 23 chromosomes in each cell (halved)\n- Two divisions (Meiosis I & II)\n\n**Nigerian Curriculum Focus:**\n- Mitosis: Found in WAEC/NECO practical questions\n- Meiosis: Important for understanding inheritance and genetics\n\nBoth processes are covered in SS2 Biology, Cell Biology topic.",
    topic: 'Cell Division',
    subject: 'BIOLOGY'
  }
];

async function seedConversations() {
  console.log('Seeding AI conversations...');
  
  const studentsRes = await query(`
    SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id 
    JOIN roles r ON r.id = ur.role_id WHERE r.name = 'student' LIMIT 3
  `);
  
  for (const student of studentsRes.rows) {
    for (let i = 0; i < 3; i++) {
      const sample = SAMPLE_QUESTIONS[i % SAMPLE_QUESTIONS.length];
      
      await query(`
        INSERT INTO ai_conversations (user_id, title, message_count, last_message_at)
        VALUES ($1, $2, 2, NOW() - INTERVAL '${i + 1} days')
        RETURNING id
      `, [student.id, `${sample.subject} - ${sample.topic}`]);
      
      const convRes = await query(`
        SELECT id FROM ai_conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
      `, [student.id]);
      
      const convId = convRes.rows[0].id;
      
      await query(`
        INSERT INTO ai_messages (conversation_id, role, content, tokens_used)
        VALUES ($1, 'user', $2, 50),
               ($1, 'assistant', $3, 200)
      `, [convId, sample.user, sample.assistant]);
    }
  }
  console.log('  ✓ Seeded conversations');
}

async function seedGeneratedQuizzes() {
  console.log('\nSeeding AI-generated quizzes...');
  
  const subjectsRes = await query(`
    SELECT id, name FROM subjects WHERE name IN ('MATHEMATICS', 'ENGLISH LANGUAGE', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS')
  `);
  
  for (const subject of subjectsRes.rows) {
    const quizData = {
      title: `AI Practice: ${subject.name}`,
      description: `AI-generated practice questions for ${subject.name}`,
      timeLimitMinutes: 20,
      passingScore: 50,
      maxAttempts: 3,
      shuffleQuestions: true,
      showExplanation: true,
      isActive: true
    };
    
    const quizRes = await query(`
      INSERT INTO quizzes (course_id, title, description, time_limit_minutes, passing_score, max_attempts, shuffle_questions, show_explanation, is_active)
      VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [quizData.title, quizData.description, quizData.timeLimitMinutes, quizData.passingScore, 
        quizData.maxAttempts, quizData.shuffleQuestions, quizData.showExplanation, quizData.isActive]);
    
    const quizId = quizRes.rows[0].id;
    
    // Add some existing questions to the quiz
    const questionsRes = await query(`
      SELECT q.id FROM questions q WHERE q.subject_id = $1 AND q.question_type = 'mcq' AND q.is_active = TRUE
      ORDER BY RANDOM() LIMIT 10
    `, [subject.id]);
    
    for (let i = 0; i < questionsRes.rows.length; i++) {
      await query(`
        INSERT INTO quiz_questions (quiz_id, question_id, order_index, marks)
        VALUES ($1, $2, $3, 1)
        ON CONFLICT DO NOTHING
      `, [quizId, questionsRes.rows[i].id, i + 1]);
    }
    
    console.log(`  ✓ ${subject.name}: ${questionsRes.rows.length} questions`);
  }
}

async function main() {
  console.log('=== AI Data Seeder ===\n');
  
  await seedConversations();
  await seedGeneratedQuizzes();
  
  // Verify
  const [convCount, msgCount, quizCount] = await Promise.all([
    query('SELECT COUNT(*)::int as cnt FROM ai_conversations'),
    query('SELECT COUNT(*)::int as cnt FROM ai_messages'),
    query("SELECT COUNT(*)::int as cnt FROM quizzes WHERE title LIKE '%AI%'"),
  ]);
  
  console.log('\n✅ AI seeding complete:');
  console.log(`   Conversations: ${convCount.rows[0].cnt}`);
  console.log(`   Messages: ${msgCount.rows[0].cnt}`);
  console.log(`   AI Quizzes: ${quizCount.rows[0].cnt}`);
  
  await closePool();
}

main().catch(err => {
  console.error('❌ AI seeding failed:', err);
  closePool().finally(() => process.exit(1));
});
