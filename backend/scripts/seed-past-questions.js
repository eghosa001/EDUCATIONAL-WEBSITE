/**
 * Seed past questions for WAEC, NECO, JAMB, NABTEB, Post-UTME.
 * Generates realistic questions mapped to the seeded curriculum.
 */
import { query, closePool } from '../src/common/database/index.js';

const EXAM_BOARDS = [
  { name: 'WAEC', years: [2018, 2019, 2020, 2021, 2022, 2023] },
  { name: 'NECO', years: [2019, 2020, 2021, 2022, 2023] },
  { name: 'JAMB', years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { name: 'NABTEB', years: [2019, 2020, 2021, 2022, 2023] },
  { name: 'POST-UTME', years: [2020, 2021, 2022, 2023] },
];

// Topic-to-question templates per subject
const QUESTION_TEMPLATES = {
  MATHEMATICS: [
    { text: 'Simplify: 2x + 3x - x = ?', options: [{id:'A',text:'4x'},{id:'B',text:'5x'},{id:'C',text:'3x'},{id:'D',text:'2x'}], answer: 'A', explanation: 'Combine like terms: 2x + 3x = 5x, then 5x - x = 4x.' },
    { text: 'If 3x = 15, find x.', options: [{id:'A',text:'3'},{id:'B',text:'5'},{id:'C',text:'45'},{id:'D',text:'12'}], answer: 'B', explanation: 'Divide both sides by 3: x = 15/3 = 5.' },
    { text: 'What is the value of 2³?', options: [{id:'A',text:'6'},{id:'B',text:'8'},{id:'C',text:'9'},{id:'D',text:'12'}], answer: 'B', explanation: '2³ = 2 × 2 × 2 = 8.' },
    { text: 'Convert 0.75 to a fraction in lowest terms.', options: [{id:'A',text:'3/4'},{id:'B',text:'7/5'},{id:'C',text:'75/10'},{id:'D',text:'1/4'}], answer: 'A', explanation: '0.75 = 75/100 = 3/4 when simplified.' },
    { text: 'Find the area of a triangle with base 10cm and height 6cm.', options: [{id:'A',text:'30cm²'},{id:'B',text:'60cm²'},{id:'C',text:'16cm²'},{id:'D',text:'36cm²'}], answer: 'A', explanation: 'Area = ½ × base × height = ½ × 10 × 6 = 30cm².' },
  ],
  ENGLISH_LANGUAGE: [
    { text: 'Choose the correct spelling:', options: [{id:'A',text:'Accomodate'},{id:'B',text:'Acommodate'},{id:'C',text:'Accommodate'},{id:'D',text:'Acomodate'}], answer: 'C', explanation: 'Accommodate has two c\'s and two m\'s.' },
    { text: 'The word "beautiful" is an example of a:', options: [{id:'A',text:'Noun'},{id:'B',text:'Verb'},{id:'C',text:'Adjective'},{id:'D',text:'Adverb'}], answer: 'C', explanation: 'Beautiful describes a noun, making it an adjective.' },
    { text: 'Identify the figure of speech: "The wind whispered through the trees."', options: [{id:'A',text:'Simile'},{id:'B',text:'Metaphor'},{id:'C',text:'Personification'},{id:'D',text:'Hyperbole'}], answer: 'C', explanation: 'Personification gives human qualities (whispered) to non-human things (wind).' },
    { text: 'Which sentence is grammatically correct?', options: [{id:'A',text:'He don\'t know nothing.'},{id:'B',text:'He doesn\'t know anything.'},{id:'C',text:'He don\'t knows anything.'},{id:'D',text:'He doesn\'t knows nothing.'}], answer: 'B', explanation: 'Double negatives are incorrect. "He doesn\'t know anything" is the proper form.' },
    { text: 'The plural of "child" is:', options: [{id:'A',text:'Childs'},{id:'B',text:'Children'},{id:'C',text:'Childes'},{id:'D',text:'Childern'}], answer: 'B', explanation: 'Child is an irregular noun; its plural is children.' },
  ],
  BIOLOGY: [
    { text: 'Which organelle is known as the powerhouse of the cell?', options: [{id:'A',text:'Ribosome'},{id:'B',text:'Mitochondria'},{id:'C',text:'Nucleus'},{id:'D',text:'Golgi body'}], answer: 'B', explanation: 'Mitochondria produce ATP through cellular respiration.' },
    { text: 'Photosynthesis occurs in the:', options: [{id:'A',text:'Mitochondria'},{id:'B',text:'Chloroplast'},{id:'C',text:'Ribosome'},{id:'D',text:'Nucleus'}], answer: 'B', explanation: 'Chloroplasts contain chlorophyll and are the site of photosynthesis.' },
    { text: 'The basic unit of life is the:', options: [{id:'A',text:'Tissue'},{id:'B',text:'Organ'},{id:'C',text:'Cell'},{id:'D',text:'Organism'}], answer: 'C', explanation: 'The cell is the fundamental structural and functional unit of all living organisms.' },
    { text: 'DNA stands for:', options: [{id:'A',text:'Deoxyribonucleic Acid'},{id:'B',text:'Dinitrogen Acid'},{id:'C',text:'Deoxyribose Nuclear Acid'},{id:'D',text:'Dynamic Nuclear Acid'}], answer: 'A', explanation: 'DNA = Deoxyribonucleic Acid, the molecule carrying genetic information.' },
    { text: 'Which blood group is the universal donor?', options: [{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'AB'},{id:'D',text:'O'}], answer: 'D', explanation: 'Type O blood lacks A and B antigens, making it safe for all recipients.' },
  ],
  CHEMISTRY: [
    { text: 'The atomic number of carbon is:', options: [{id:'A',text:'4'},{id:'B',text:'6'},{id:'C',text:'8'},{id:'D',text:'12'}], answer: 'B', explanation: 'Carbon has 6 protons, so its atomic number is 6.' },
    { text: 'NaCl is the chemical formula for:', options: [{id:'A',text:'Sodium oxide'},{id:'B',text:'Table salt'},{id:'C',text:'Sodium hydroxide'},{id:'D',text:'Calcium chloride'}], answer: 'B', explanation: 'NaCl is sodium chloride, commonly known as table salt.' },
    { text: 'Which gas is most abundant in the Earth\'s atmosphere?', options: [{id:'A',text:'Oxygen'},{id:'B',text:'Carbon dioxide'},{id:'C',text:'Nitrogen'},{id:'D',text:'Hydrogen'}], answer: 'C', explanation: 'Nitrogen makes up approximately 78% of Earth\'s atmosphere.' },
    { text: 'The pH of a neutral solution is:', options: [{id:'A',text:'0'},{id:'B',text:'7'},{id:'C',text:'14'},{id:'D',text:'1'}], answer: 'B', explanation: 'A pH of 7 is neutral (neither acidic nor basic).' },
    { text: 'Which element has the symbol Fe?', options: [{id:'A',text:'Fluorine'},{id:'B',text:'Iron'},{id:'C',text:'Francium'},{id:'D',text:'Fermium'}], answer: 'B', explanation: 'Fe comes from the Latin word "Ferrum" meaning iron.' },
  ],
  PHYSICS: [
    { text: 'The SI unit of force is the:', options: [{id:'A',text:'Joule'},{id:'B',text:'Watt'},{id:'C',text:'Newton'},{id:'D',text:'Pascal'}], answer: 'C', explanation: 'Force is measured in Newtons (N), named after Sir Isaac Newton.' },
    { text: 'Speed is calculated as:', options: [{id:'A',text:'Distance × Time'},{id:'B',text:'Distance / Time'},{id:'C',text:'Time / Distance'},{id:'D',text:'Mass × Acceleration'}], answer: 'B', explanation: 'Speed = Distance ÷ Time.' },
    { text: 'The speed of light is approximately:', options: [{id:'A',text:'3 × 10⁶ m/s'},{id:'B',text:'3 × 10⁸ m/s'},{id:'C',text:'3 × 10¹⁰ m/s'},{id:'D',text:'3 × 10³ m/s'}], answer: 'B', explanation: 'Light travels at approximately 3 × 10⁸ meters per second in vacuum.' },
    { text: 'Which type of energy does a moving car possess?', options: [{id:'A',text:'Potential energy'},{id:'B',text:'Kinetic energy'},{id:'C',text:'Nuclear energy'},{id:'D',text:'Chemical energy'}], answer: 'B', explanation: 'Kinetic energy is the energy of motion.' },
    { text: 'Ohm\'s Law states that V = ?', options: [{id:'A',text:'I/R'},{id:'B',text:'IR'},{id:'C',text:'I+R'},{id:'D',text:'I-R'}], answer: 'B', explanation: 'Ohm\'s Law: V = IR (Voltage = Current × Resistance).' },
  ],
  'AGRICULTURAL SCIENCE': [
    { text: 'The process of breaking down rocks to form soil is called:', options: [{id:'A',text:'Weathering'},{id:'B',text:'Erosion'},{id:'C',text:'Leaching'},{id:'D',text:'Deposition'}], answer: 'A', explanation: 'Weathering is the breakdown of rocks by physical, chemical, or biological means.' },
    { text: 'Which tool is used for cutting grasses and weeds?', options: [{id:'A',text:'Hoe'},{id:'B',text:'Cutlass'},{id:'C',text:'Rake'},{id:'D',text:'Spade'}], answer: 'B', explanation: 'A cutlass (machete) is commonly used to clear grasses and weeds in Nigerian agriculture.' },
    { text: 'The primary purpose of tillage is to:', options: [{id:'A',text:'Harvest crops'},{id:'B',text:'Prepare seedbed'},{id:'C',text:'Apply fertilizer'},{id:'D',text:'Control pests'}], answer: 'B', explanation: 'Tillage prepares the soil seedbed for planting crops.' },
    { text: 'Which of these is a root crop?', options: [{id:'A',text:'Cassava'},{id:'B',text:'Rice'},{id:'C',text:'Maize'},{id:'D',text:'Millet'}], answer: 'A', explanation: 'Cassava is a root crop widely grown in Nigeria.' },
    { text: 'The main soil component that provides nutrients is:', options: [{id:'A',text:'Sand'},{id:'B',text:'Silt'},{id:'C',text:'Humus'},{id:'D',text:'Clay'}], answer: 'C', explanation: 'Humus is decaying organic matter that enriches soil with nutrients.' },
  ],
};

const SUBJECT_MAP = {
  'MATHEMATICS': 'MATHEMATICS',
  'ENGLISH LANGUAGE': 'ENGLISH_LANGUAGE',
  'BIOLOGY': 'BIOLOGY',
  'CHEMISTRY': 'CHEMISTRY',
  'PHYSICS': 'PHYSICS',
  'AGRICULTURAL SCIENCE': 'AGRICULTURAL_SCIENCE',
  'ECONOMICS': 'ECONOMICS',
  'GOVERNMENT': 'GOVERNMENT',
  'LITERATURE IN ENGLISH': 'LITERATURE',
  'FRENCH': 'FRENCH',
  'CYBER SECURITY': 'CYBER_SECURITY',
};

async function main() {
  console.log('=== Past Questions Seeder ===\n');

  // Get subjects by exam type
  const subjectsResult = await query(`SELECT id, name FROM subjects WHERE name IN ('MATHEMATICS', 'ENGLISH LANGUAGE', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'AGRICULTURAL SCIENCE', 'ECONOMICS', 'GOVERNMENT', 'LITERATURE IN ENGLISH', 'FRENCH', 'CYBER SECURITY')`);

  const subjectMap = {};
  for (const s of subjectsResult.rows) {
    subjectMap[s.name.toUpperCase()] = s.id;
  }

  console.log(`Loaded ${Object.keys(subjectMap).length} subjects\n`);

  let totalQuestions = 0;
  let questionsCreated = 0;

  for (const board of EXAM_BOARDS) {
    console.log(`\n📝 ${board.name}:`);
    let boardCount = 0;

    for (const year of board.years) {
      // Pick 3-4 subjects per exam
      const subjectsForExam = Object.keys(subjectMap).filter((_, i) => i < 4);
      
      for (const subjName of subjectsForExam) {
        const subjectId = subjectMap[subjName];
        const templateKey = SUBJECT_MAP[subjName] || subjName.replace(/\s+/g, '_').toUpperCase();
        const templates = QUESTION_TEMPLATES[templateKey] || QUESTION_TEMPLATES['MATHEMATICS'];
        
        // Generate 5-10 questions per subject per year
        for (let i = 0; i < 8; i++) {
          const template = templates[i % templates.length];
          const questionText = i < templates.length 
            ? template.text 
            : `Sample ${board.name} ${year} question on ${subjName} (part ${i + 1}).`;
          
          await query(
            `INSERT INTO questions (
              subject_id, question_type, question_text, options, correct_answer,
              explanation, difficulty, marks, source, exam_name, exam_year, is_active
            ) VALUES ($1, 'mcq', $2, $3, $4, $5, $6, 1, 'PAST_QUESTION', $7, $8, TRUE)
            ON CONFLICT DO NOTHING`,
            [
              subjectId,
              questionText,
              JSON.stringify(template.options),
              JSON.stringify(template.answer),
              template.explanation || `Explanation for ${subjName} question from ${board.name} ${year}.`,
              ['easy', 'medium', 'hard'][i % 3],
              board.name,
              year,
            ]
          );
          boardCount++;
          questionsCreated++;
        }
      }
    }

    console.log(`   ${board.name}: ${boardCount} questions`);
    totalQuestions += boardCount;
  }

  console.log(`\n✅ Past questions seeding complete:`);
  console.log(`   Total questions created: ${questionsCreated}`);

  // Verify
  const verify = await query('SELECT exam_name, COUNT(*) as cnt FROM questions WHERE source = \'PAST_QUESTION\' GROUP BY exam_name ORDER BY cnt DESC');
  console.log('\nQuestions by exam board:');
  for (const row of verify.rows) {
    console.log(`   ${row.exam_name}: ${row.cnt}`);
  }

  await closePool();
}

main().catch(err => {
  console.error('❌ Seeding failed:', err);
  closePool().finally(() => process.exit(1));
});
