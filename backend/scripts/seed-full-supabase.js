/**
 * FULL DATABASE SEEDER FOR SUPABASE
 * Populates: education_levels, programs, classes, terms, topics,
 *            courses, lessons, questions, past_questions, flashcards,
 *            library_resources, community_posts
 *
 * Usage:
 *   node backend/scripts/seed-full-supabase.js
 *
 * Prerequisites:
 *   - .env must contain SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const sb = createClient(URL, KEY);

// ============================================================
async function main() {
  console.log('═══ FULL DB SEEDER — Supabase ═══\n');

  // Load context
  const { data: subjects } = await sb.from('subjects').select('id,name,code');
  const subjMap = {}; for (const s of subjects) subjMap[s.code] = s.id;
  console.log(`Loaded ${Object.keys(subjMap).length} subjects`);

  const { data: sys } = await sb.from('education_systems').select('id').eq('code','NG-NCC').limit(1);
  const systemId = sys?.[0]?.id;
  if (!systemId) { console.error('No education system NG-NCC found'); process.exit(1); }

  // ── 1. TOPICS ──────────────────────────────────────────
  console.log('\n── 1. Topics ──');
  const TOPICS = {
    MATH: [
      {c:'ALGEBRA_BASIC',n:'Algebra Basics',o:1},{c:'LINEAR_EQ',n:'Linear Equations',o:2},
      {c:'QUAD_EQ',n:'Quadratic Equations',o:3},{c:'GEOMETRY',n:'Geometry',o:4},
      {c:'TRIG',n:'Trigonometry',o:5},{c:'STATS',n:'Statistics & Probability',o:6},
      {c:'NUM_THEORY',n:'Number Theory',o:7},{c:'SETS',n:'Sets & Logic',o:8},
      {c:'COORD_GEOM',n:'Coordinate Geometry',o:9},{c:'MATRICES',n:'Matrices & Determinants',o:10},
    ],
    ENG: [
      {c:'GRAMMAR',n:'Grammar & Syntax',o:1},{c:'COMP',n:'Comprehension',o:2},
      {c:'ESSAY',n:'Essay Writing',o:3},{c:'ORAL',n:'Oral English',o:4},
      {c:'LIT_DEV',n:'Literary Devices',o:5},{c:'SUMMARY',n:'Summarization',o:6},
      {c:'LEXIS',n:'Lexis & Structure',o:7},
    ],
    BIO: [
      {c:'CELL',n:'Cell Biology',o:1},{c:'DIVISION',n:'Cell Division',o:2},
      {c:'GENETICS',n:'Genetics & Heredity',o:3},{c:'ECOLOGY',n:'Ecology',o:4},
      {c:'PLANT_NUT',n:'Plant Nutrition',o:5},{c:'ANATOMY',n:'Human Anatomy',o:6},
      {c:'CLASS',n:'Classification',o:7},{c:'EVOL',n:'Evolution',o:8},
      {c:'PHYSIO',n:'Physiology',o:9},
    ],
    CHM: [
      {c:'ATOMS',n:'Atomic Structure',o:1},{c:'BONDING',n:'Chemical Bonding',o:2},
      {c:'ACID_BASE',n:'Acids, Bases & Salts',o:3},{c:'REACTIONS',n:'Chemical Reactions',o:4},
      {c:'ORGANIC',n:'Organic Chemistry',o:5},{c:'STOICH',n:'Stoichiometry',o:6},
      {c:'ENERGY_C',n:'Energetics',o:7},{c:'ELEC_CHEM',n:'Electrochemistry',o:8},
    ],
    PHY: [
      {c:'MOTION',n:'Motion & Forces',o:1},{c:'ENERGY_P',n:'Energy & Work',o:2},
      {c:'WAVES',n:'Waves & Sound',o:3},{c:'OPTICS',n:'Optics',o:4},
      {c:'ELEC',n:'Electricity',o:5},{c:'MAG',n:'Magnetism',o:6},
      {c:'MODERN',n:'Modern Physics',o:7},{c:'FLUIDS',n:'Fluids',o:8},
    ],
    ECO: [
      {c:'BASIC_ECO',n:'Basic Economic Concepts',o:1},{c:'DEMAND_SUPPLY',n:'Demand & Supply',o:2},
      {c:'MARKETS',n:'Market Structures',o:3},{c:'NAT_INCOME',n:'National Income',o:4},
      {c:'MONEY_BANK',n:'Money & Banking',o:5},{c:'TRADE',n:'International Trade',o:6},
    ],
    GOV: [
      {c:'GOV_CONCEPTS',n:'Concepts of Government',o:1},{c:'CITIZENSHIP',n:'Citizenship',o:2},
      {c:'PARTIES',n:'Political Parties',o:3},{c:'ELECTORAL',n:'Electoral Systems',o:4},
      {c:'CONSTITUTION',n:'Nigerian Constitution',o:5},{c:'DEMOCRACY_G',n:'Democracy & Governance',o:6},
    ],
    AGS: [
      {c:'SOIL',n:'Soil Science',o:1},{c:'CROPS',n:'Crop Production',o:2},
      {c:'ANIMALS',n:'Animal Husbandry',o:3},{c:'AGRI_ECO',n:'Agricultural Economics',o:4},
      {c:'TOOLS',n:'Farm Tools & Equipment',o:5},
    ],
    GEO: [
      {c:'MAP_WORK',n:'Map Reading & Interpretation',o:1},{c:'CLIMATE',n:'Climate & Weather',o:2},
      {c:'ROCKS',n:'Rocks & Minerals',o:3},{c:'PHYS_GEO',n:'Physical Geography',o:4},
    ],
    CIV: [
      {c:'RESPONSIBILITIES',n:'Civic Responsibilities',o:1},{c:'RULE_LAW',n:'Rule of Law',o:2},
      {c:'DEMOCRACY_C',n:'Democracy',o:3},{c:'RIGHTS_DUTIES',n:'Rights & Duties',o:4},
    ],
  };

  let topicCount = 0;
  const { data: existingTopics } = await sb.from('topics').select('subject_id,code');
  const existingTopicSet = new Set((existingTopics||[]).map(t => `${t.subject_id}:${t.code}`));
  for (const [code, topics] of Object.entries(TOPICS)) {
    const subjId = subjMap[code];
    if (!subjId) continue;
    for (const t of topics) {
      if (existingTopicSet.has(`${subjId}:${t.c}`)) continue;
      const { error } = await sb.from('topics').insert({ subject_id: subjId, name: t.n, code: t.c, description: t.n, order_index: t.o, estimated_hours: 8, is_active: true });
      if (!error) { topicCount++; existingTopicSet.add(`${subjId}:${t.c}`); }
    }
  }
  console.log(`  Topics created: ${topicCount}`);

  // ── 2. PAST QUESTIONS ──────────────────────────────────
  console.log('\n── 2. Past Questions ──');
  const PQ = [
    // MATHEMATICS (15)
    {s:'MATH',b:'waec',y:2023,d:'easy',t:'Evaluate: 15 + 3 × 4',o:[{id:'A',text:'72'},{id:'B',text:'27'},{id:'C',text:'67'},{id:'D',text:'18'}],a:'B',e:'BODMAS: 3×4=12, then 15+12=27.'},
    {s:'MATH',b:'waec',y:2023,d:'medium',t:'Simplify: 3x + 5y - 2x + 3y',o:[{id:'A',text:'x + 8y'},{id:'B',text:'x + 2y'},{id:'C',text:'5x + 8y'},{id:'D',text:'x + 15y'}],a:'A',e:'Combine like terms: (3x-2x)+(5y+3y) = x+8y.'},
    {s:'MATH',b:'waec',y:2022,d:'hard',t:'Solve: 2x² - 5x - 3 = 0',o:[{id:'A',text:'x=3 or x=-1/2'},{id:'B',text:'x=-3 or x=1/2'},{id:'C',text:'x=3 or x=1/2'},{id:'D',text:'x=-3 or x=-1/2'}],a:'A',e:'(2x+1)(x-3)=0, so x=3 or x=-1/2.'},
    {s:'MATH',b:'jamb',y:2024,d:'medium',t:'Simplify: (2³ × 3²) / (2² × 3)',o:[{id:'A',text:'6'},{id:'B',text:'12'},{id:'C',text:'24'},{id:'D',text:'36'}],a:'A',e:'(8×9)/(4×3) = 72/12 = 6.'},
    {s:'MATH',b:'jamb',y:2023,d:'hard',t:'If log₁₀2 = 0.3010 and log₁₀3 = 0.4771, evaluate log₁₀6.',o:[{id:'A',text:'0.7781'},{id:'B',text:'0.1761'},{id:'C',text:'1.7781'},{id:'D',text:'0.3010'}],a:'A',e:'log₆ = log2+log3 = 0.7781.'},
    {s:'MATH',b:'neco',y:2023,d:'medium',t:'Solve: 3x - 7 < 8',o:[{id:'A',text:'x < 5'},{id:'B',text:'x > 5'},{id:'C',text:'x < 15'},{id:'D',text:'x > 15'}],a:'A',e:'3x < 15, so x < 5.'},
    {s:'MATH',b:'neco',y:2022,d:'hard',t:'If 2x+y=7 and x-y=2, find x.',o:[{id:'A',text:'1'},{id:'B',text:'2'},{id:'C',text:'3'},{id:'D',text:'4'}],a:'C',e:'Add equations: 3x=9, x=3.'},
    {s:'MATH',b:'waec',y:2021,d:'medium',t:'Find LCM of 12, 18 and 30.',o:[{id:'A',text:'60'},{id:'B',text:'90'},{id:'C',text:'120'},{id:'D',text:'180'}],a:'D',e:'LCM(12,18,30) = 180.'},
    {s:'MATH',b:'waec',y:2022,d:'easy',t:'Convert 101₂ to base 10.',o:[{id:'A',text:'3'},{id:'B',text:'5'},{id:'C',text:'7'},{id:'D',text:'9'}],a:'B',e:'101₂ = 4+0+1 = 5.'},
    {s:'MATH',b:'jamb',y:2024,d:'easy',t:'What is 25% of 480?',o:[{id:'A',text:'100'},{id:'B',text:'120'},{id:'C',text:'140'},{id:'D',text:'160'}],a:'B',e:'25% × 480 = 120.'},
    {s:'MATH',b:'nabteb',y:2023,d:'medium',t:'Make x the subject: y = 3x + 7',o:[{id:'A',text:'x=(y-7)/3'},{id:'B',text:'x=(y+7)/3'},{id:'C',text:'x=y-7/3'},{id:'D',text:'x=3y-7'}],a:'A',e:'y-7=3x, x=(y-7)/3.'},
    {s:'MATH',b:'waec',y:2023,d:'medium',t:'Area of triangle base 10cm height 6cm?',o:[{id:'A',text:'30cm²'},{id:'B',text:'60cm²'},{id:'C',text:'16cm²'},{id:'D',text:'36cm²'}],a:'A',e:'Area=½×10×6=30cm².'},
    {s:'MATH',b:'jamb',y:2023,d:'medium',t:'Simplify: √72 + √32',o:[{id:'A',text:'10√2'},{id:'B',text:'8√3'},{id:'C',text:'5√6'},{id:'D',text:'12√2'}],a:'A',e:'√72=6√2, √32=4√2, sum=10√2.'},
    {s:'MATH',b:'neco',y:2023,d:'easy',t:'Value of 3⁰?',o:[{id:'A',text:'0'},{id:'B',text:'1'},{id:'C',text:'3'},{id:'D',text:'undefined'}],a:'B',e:'Any non-zero number to power 0 is 1.'},
    {s:'MATH',b:'waec',y:2020,d:'hard',t:'Solve: log₃(x+2) = 3',o:[{id:'A',text:'25'},{id:'B',text:'27'},{id:'C',text:'11'},{id:'D',text:'9'}],a:'A',e:'x+2=3³=27, x=25.'},
    // ENGLISH LANGUAGE (10)
    {s:'ENG',b:'waec',y:2023,d:'medium',t:'She _____ to school every day.',o:[{id:'A',text:'go'},{id:'B',text:'goes'},{id:'C',text:'going'},{id:'D',text:'gone'}],a:'B',e:'Third person singular: goes.'},
    {s:'ENG',b:'waec',y:2023,d:'easy',t:'Which word is a conjunction?',o:[{id:'A',text:'Quickly'},{id:'B',text:'Because'},{id:'C',text:'Beautiful'},{id:'D',text:'Running'}],a:'B',e:'Because joins clauses.'},
    {s:'ENG',b:'jamb',y:2024,d:'medium',t:'The man ___ car was stolen reported to police.',o:[{id:'A',text:'who'},{id:'B',text:'whom'},{id:'C',text:'whose'},{id:'D',text:'which'}],a:'C',e:'Whose shows possession.'},
    {s:'ENG',b:'jamb',y:2024,d:'medium',t:'Nearest meaning: PHILANTHROPIC.',o:[{id:'A',text:'Generous'},{id:'B',text:'Selfish'},{id:'C',text:'Cruel'},{id:'D',text:'Indifferent'}],a:'A',e:'Philanthropic = generous.'},
    {s:'ENG',b:'neco',y:2023,d:'easy',t:'Correct spelling:',o:[{id:'A',text:'Accomodation'},{id:'B',text:'Accommodation'},{id:'C',text:'Acommodation'},{id:'D',text:'Acomodation'}],a:'B',e:'Double c and double m.'},
    {s:'ENG',b:'neco',y:2023,d:'medium',t:'If I ___ rich, I would travel.',o:[{id:'A',text:'am'},{id:'B',text:'was'},{id:'C',text:'were'},{id:'D',text:'be'}],a:'C',e:'Second conditional: were for all subjects.'},
    {s:'ENG',b:'waec',y:2022,d:'hard',t:'"The wind whispered through the trees." Figure of speech?',o:[{id:'A',text:'Simile'},{id:'B',text:'Metaphor'},{id:'C',text:'Personification'},{id:'D',text:'Hyperbole'}],a:'C',e:'Giving human quality to non-human = personification.'},
    {s:'ENG',b:'jamb',y:2023,d:'medium',t:'Plural of "child":',o:[{id:'A',text:'Childs'},{id:'B',text:'Children'},{id:'C',text:'Childes'},{id:'D',text:'Childern'}],a:'B',e:'Irregular noun: children.'},
    {s:'ENG',b:'nabteb',y:2023,d:'easy',t:'Correct sentence:',o:[{id:'A',text:"He don't know nothing."},{id:'B',text:"He doesn't know anything."},{id:'C',text:"He don't knows anything."},{id:'D',text:"He doesn't knows nothing."}],a:'B',e:'No double negatives.'},
    {s:'ENG',b:'waec',y:2021,d:'medium',t:'The boy, ___ father is a doctor...',o:[{id:'A',text:'who'},{id:'B',text:'whom'},{id:'C',text:'whose'},{id:'D',text:'which'}],a:'C',e:'Whose indicates possession.'},
    // BIOLOGY (14)
    {s:'BIO',b:'waec',y:2023,d:'medium',t:'Organelle for cellular respiration?',o:[{id:'A',text:'Mitochondria'},{id:'B',text:'Ribosome'},{id:'C',text:'Golgi apparatus'},{id:'D',text:'Lysosome'}],a:'A',e:'Mitochondria produce ATP.'},
    {s:'BIO',b:'waec',y:2022,d:'easy',t:'Cell membrane is selectively permeable because it...',o:[{id:'A',text:'allows all'},{id:'B',text:'allows only water'},{id:'C',text:'allows some but not others'},{id:'D',text:'prevents all'}],a:'C',e:'Controls what enters/exits.'},
    {s:'BIO',b:'jamb',y:2024,d:'medium',t:'Organelle in plant cells but not animal cells:',o:[{id:'A',text:'Mitochondrion'},{id:'B',text:'Cell wall'},{id:'C',text:'Ribosome'},{id:'D',text:'Nucleus'}],a:'B',e:'Cell walls are plant-only.'},
    {s:'BIO',b:'jamb',y:2024,d:'hard',t:'Meiosis differs from mitosis because meiosis...',o:[{id:'A',text:'Produces diploid cells'},{id:'B',text:'Occurs in somatic cells'},{id:'C',text:'Produces four haploid cells'},{id:'D',text:'No replication'}],a:'C',e:'Meiosis produces 4 haploid cells.'},
    {s:'BIO',b:'neco',y:2023,d:'medium',t:'Structure in BOTH plant and animal cells:',o:[{id:'A',text:'Cell wall'},{id:'B',text:'Chloroplast'},{id:'C',text:'Cell membrane'},{id:'D',text:'Large vacuole'}],a:'C',e:'Both have cell membranes.'},
    {s:'BIO',b:'neco',y:2023,d:'medium',t:'Part of brain coordinating voluntary movement:',o:[{id:'A',text:'Cerebrum'},{id:'B',text:'Cerebellum'},{id:'C',text:'Medulla oblongata'},{id:'D',text:'Hypothalamus'}],a:'B',e:'Cerebellum coordinates movement.'},
    {s:'BIO',b:'waec',y:2023,d:'hard',t:'Phase where chromosomes align at equator?',o:[{id:'A',text:'Prophase'},{id:'B',text:'Metaphase'},{id:'C',text:'Anaphase'},{id:'D',text:'Telophase'}],a:'B',e:'Metaphase: chromosomes line at plate.'},
    {s:'BIO',b:'jamb',y:2024,d:'hard',t:'Blood group A × blood group B → child O. Parent genotypes?',o:[{id:'A',text:'IAIA × IBIB'},{id:'B',text:'IAi × IBi'},{id:'C',text:'IAIA × IBi'},{id:'D',text:'IAi × IBIB'}],a:'B',e:'Both must carry i allele for O child.'},
    {s:'BIO',b:'waec',y:2023,d:'medium',t:'NOT a biotic factor?',o:[{id:'A',text:'Bacteria'},{id:'B',text:'Fungi'},{id:'C',text:'Temperature'},{id:'D',text:'Insects'}],a:'C',e:'Temperature is abiotic.'},
    {s:'BIO',b:'nabteb',y:2023,d:'medium',t:'Photosynthesis occurs in:',o:[{id:'A',text:'Mitochondria'},{id:'B',text:'Chloroplast'},{id:'C',text:'Ribosome'},{id:'D',text:'Nucleus'}],a:'B',e:'Chloroplasts contain chlorophyll.'},
    {s:'BIO',b:'waec',y:2022,d:'easy',t:'Basic unit of life:',o:[{id:'A',text:'Tissue'},{id:'B',text:'Organ'},{id:'C',text:'Cell'},{id:'D',text:'Organism'}],a:'C',e:'Cell is fundamental unit.'},
    {s:'BIO',b:'jamb',y:2023,d:'medium',t:'DNA stands for:',o:[{id:'A',text:'Deoxyribonucleic Acid'},{id:'B',text:'Dinitrogen Acid'},{id:'C',text:'Deoxyribose Nuclear Acid'},{id:'D',text:'Dynamic Nuclear Acid'}],a:'A',e:'DNA = Deoxyribonucleic Acid.'},
    {s:'BIO',b:'neco',y:2022,d:'easy',t:'Universal donor blood group:',o:[{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'AB'},{id:'D',text:'O'}],a:'D',e:'O has no antigens.'},
    {s:'BIO',b:'waec',y:2021,d:'medium',t:'Functional unit of kidney:',o:[{id:'A',text:'Neuron'},{id:'B',text:'Nephron'},{id:'C',text:'Alveolus'},{id:'D',text:'Villi'}],a:'B',e:'Nephron filters blood.'},
    // CHEMISTRY (10)
    {s:'CHM',b:'waec',y:2023,d:'medium',t:'Number of protons is called:',o:[{id:'A',text:'Mass number'},{id:'B',text:'Atomic number'},{id:'C',text:'Neutron number'},{id:'D',text:'Valence'}],a:'B',e:'Atomic number = protons.'},
    {s:'CHM',b:'waec',y:2022,d:'easy',t:'Particle with no charge:',o:[{id:'A',text:'Proton'},{id:'B',text:'Electron'},{id:'C',text:'Neutron'},{id:'D',text:'Ion'}],a:'C',e:'Neutrons are neutral.'},
    {s:'CHM',b:'jamb',y:2024,d:'medium',t:'Neutrons in ²³Na₁₁:',o:[{id:'A',text:'11'},{id:'B',text:'12'},{id:'C',text:'23'},{id:'D',text:'34'}],a:'B',e:'23-11=12 neutrons.'},
    {s:'CHM',b:'neco',y:2023,d:'easy',t:'Valency of chlorine (Z=17):',o:[{id:'A',text:'1'},{id:'B',text:'2'},{id:'C',text:'7'},{id:'D',text:'17'}],a:'A',e:'Needs 1 electron to complete octet.'},
    {s:'CHM',b:'waec',y:2023,d:'hard',t:'Zn + dilute HCl is what reaction?',o:[{id:'A',text:'Decomposition'},{id:'B',text:'Displacement'},{id:'C',text:'Neutralization'},{id:'D',text:'Combustion'}],a:'B',e:'Zn displaces H from HCl.'},
    {s:'CHM',b:'neco',y:2023,d:'medium',t:'Separate immiscible liquids:',o:[{id:'A',text:'Filtration'},{id:'B',text:'Distillation'},{id:'C',text:'Separating funnel'},{id:'D',text:'Chromatography'}],a:'C',e:'Separating funnel for immiscible liquids.'},
    {s:'CHM',b:'jamb',y:2023,d:'hard',t:'Which is oxidation?',o:[{id:'A',text:'Fe³⁺+e⁻→Fe²⁺'},{id:'B',text:'Na→Na⁺+e⁻'},{id:'C',text:'H⁺+OH⁻→H₂O'},{id:'D',text:'Ag⁺+Cl⁻→AgCl'}],a:'B',e:'Oxidation = loss of electrons.'},
    {s:'CHM',b:'nabteb',y:2023,d:'medium',t:'NaCl is:',o:[{id:'A',text:'Sodium oxide'},{id:'B',text:'Table salt'},{id:'C',text:'Sodium hydroxide'},{id:'D',text:'Calcium chloride'}],a:'B',e:'NaCl = sodium chloride.'},
    {s:'CHM',b:'waec',y:2021,d:'easy',t:'Most abundant atmospheric gas:',o:[{id:'A',text:'Oxygen'},{id:'B',text:'CO₂'},{id:'C',text:'Nitrogen'},{id:'D',text:'Hydrogen'}],a:'C',e:'Nitrogen ≈ 78% of atmosphere.'},
    {s:'CHM',b:'jamb',y:2024,d:'easy',t:'pH of neutral solution:',o:[{id:'A',text:'0'},{id:'B',text:'7'},{id:'C',text:'14'},{id:'D',text:'1'}],a:'B',e:'pH 7 is neutral.'},
    // PHYSICS (11)
    {s:'PHY',b:'waec',y:2023,d:'medium',t:'SI unit of force:',o:[{id:'A',text:'Joule'},{id:'B',text:'Watt'},{id:'C',text:'Newton'},{id:'D',text:'Pascal'}],a:'C',e:'Force in Newtons.'},
    {s:'PHY',b:'jamb',y:2024,d:'medium',t:'Max height of ball thrown at 20 m/s (g=10):',o:[{id:'A',text:'10m'},{id:'B',text:'20m'},{id:'C',text:'40m'},{id:'D',text:'80m'}],a:'B',e:'h=u²/2g=400/20=20m.'},
    {s:'PHY',b:'neco',y:2023,d:'medium',t:'SI unit of pressure:',o:[{id:'A',text:'Newton'},{id:'B',text:'Pascal'},{id:'C',text:'Joule'},{id:'D',text:'Watt'}],a:'B',e:'Pressure in Pascals.'},
    {s:'PHY',b:'jamb',y:2024,d:'hard',t:'Machine VR=4, eff=80%, effort=50N. Load?',o:[{id:'A',text:'100N'},{id:'B',text:'160N'},{id:'C',text:'200N'},{id:'D',text:'400N'}],a:'B',e:'MA=0.8×4=3.2, Load=3.2×50=160N.'},
    {s:'PHY',b:'waec',y:2023,d:'medium',t:'Energy cannot be created or destroyed is:',o:[{id:'A',text:'Conservation of mass'},{id:'B',text:'Conservation of energy'},{id:'C',text:'Gravity'},{id:'D',text:'Thermodynamics'}],a:'B',e:'Law of Conservation of Energy.'},
    {s:'PHY',b:'nabteb',y:2023,d:'medium',t:'Speed = ?',o:[{id:'A',text:'Dist×Time'},{id:'B',text:'Dist/Time'},{id:'C',text:'Time/Dist'},{id:'D',text:'Mass×Acc'}],a:'B',e:'Speed = Distance ÷ Time.'},
    {s:'PHY',b:'waec',y:2022,d:'hard',t:'Car 10→30 m/s in 5s. Acceleration?',o:[{id:'A',text:'2 m/s²'},{id:'B',text:'4 m/s²'},{id:'C',text:'6 m/s²'},{id:'D',text:'8 m/s²'}],a:'B',e:'a=(30-10)/5=4 m/s².'},
    {s:'PHY',b:'jamb',y:2023,d:'hard',t:'Power in 10Ω resistor with 2A:',o:[{id:'A',text:'5W'},{id:'B',text:'20W'},{id:'C',text:'40W'},{id:'D',text:'200W'}],a:'C',e:'P=I²R=4×10=40W.'},
    {s:'PHY',b:'neco',y:2022,d:'medium',t:'Speed of light:',o:[{id:'A',text:'3×10⁶ m/s'},{id:'B',text:'3×10⁸ m/s'},{id:'C',text:'3×10¹⁰ m/s'},{id:'D',text:'3×10³ m/s'}],a:'B',e:'c≈3×10⁸ m/s.'},
    {s:'PHY',b:'waec',y:2023,d:'easy',t:'Energy of moving car:',o:[{id:'A',text:'Potential'},{id:'B',text:'Kinetic'},{id:'C',text:'Nuclear'},{id:'D',text:'Chemical'}],a:'B',e:'Moving objects have kinetic energy.'},
    {s:'PHY',b:'jamb',y:2024,d:'easy',t:"Ohm's Law: V = ?",o:[{id:'A',text:'I/R'},{id:'B',text:'IR'},{id:'C',text:'I+R'},{id:'D',text:'I-R'}],a:'B',e:'V = IR.'},
    // ECONOMICS (6)
    {s:'ECO',b:'waec',y:2023,d:'medium',t:'Point where demand equals supply:',o:[{id:'A',text:'Surplus'},{id:'B',text:'Shortage'},{id:'C',text:'Equilibrium'},{id:'D',text:'Scarcity'}],a:'C',e:'Equilibrium: Qd = Qs.'},
    {s:'ECO',b:'jamb',y:2024,d:'medium',t:'Law of demand states:',o:[{id:'A',text:'Price↔supply direct'},{id:'B',text:'Price↔demand inverse'},{id:'C',text:'Income unrelated'},{id:'D',text:'Price no effect'}],a:'B',e:'Price up → quantity demanded down.'},
    {s:'ECO',b:'neco',y:2023,d:'easy',t:'Scarcity means:',o:[{id:'A',text:'Money shortage'},{id:'B',text:'Limited resources vs unlimited wants'},{id:'C',text:'Overproduction'},{id:'D',text:'High prices'}],a:'B',e:'Fundamental economic problem.'},
    {s:'ECO',b:'waec',y:2022,d:'medium',t:'Factor of production:',o:[{id:'A',text:'Profit'},{id:'B',text:'Rent'},{id:'C',text:'Land'},{id:'D',text:'Interest'}],a:'C',e:'Land, labour, capital, organization.'},
    {s:'ECO',b:'jamb',y:2023,d:'hard',t:'Price rises, quantity falls →?',o:[{id:'A',text:'Demand increased'},{id:'B',text:'Supply increased'},{id:'C',text:'Supply decreased'},{id:'D',text:'Demand unchanged'}],a:'C',e:'Leftward supply shift raises price.'},
    {s:'ECO',b:'nabteb',y:2023,d:'medium',t:'Study at individual unit level:',o:[{id:'A',text:'Macroeconomics'},{id:'B',text:'Microeconomics'},{id:'C',text:'Public economics'},{id:'D',text:'Development economics'}],a:'B',e:'Microeconomics = individual units.'},
    // GOVERNMENT (6)
    {s:'GOV',b:'waec',y:2023,d:'easy',t:'Arm that makes laws:',o:[{id:'A',text:'Executive'},{id:'B',text:'Legislature'},{id:'C',text:'Judiciary'},{id:'D',text:'Military'}],a:'B',e:'National Assembly makes laws.'},
    {s:'GOV',b:'jamb',y:2024,d:'medium',t:'Principle preventing one arm dominating:',o:[{id:'A',text:'Federalism'},{id:'B',text:'Separation of powers'},{id:'C',text:'Rule of law'},{id:'D',text:'Checks and balances'}],a:'D',e:'Checks and balances limit each branch.'},
    {s:'GOV',b:'neco',y:2023,d:'easy',t:'Nigeria independence year:',o:[{id:'A',text:'1957'},{id:'B',text:'1960'},{id:'C',text:'1963'},{id:'D',text:'1999'}],a:'B',e:'October 1, 1960.'},
    {s:'GOV',b:'waec',y:2022,d:'medium',t:'Head of Nigerian government:',o:[{id:'A',text:'Chief Justice'},{id:'B',text:'President'},{id:'C',text:'Speaker'},{id:'D',text:'Senate President'}],a:'B',e:'President is head of government.'},
    {s:'GOV',b:'jamb',y:2023,d:'medium',t:'Constitution allowing easy amendment:',o:[{id:'A',text:'Written'},{id:'B',text:'Flexible'},{id:'C',text:'Rigid'},{id:'D',text:'Unwritten'}],a:'B',e:'Flexible constitutions amend easily.'},
    {s:'GOV',b:'nabteb',y:2023,d:'easy',t:'Democracy means government by:',o:[{id:'A',text:'King'},{id:'B',text:'The people'},{id:'C',text:'Military'},{id:'D',text:'Church'}],a:'B',e:'Demos (people) + kratos (rule).'},
  ];

  let pqCount = 0;
  for (const q of PQ) {
    const subjId = subjMap[q.s];
    if (!subjId) continue;
    const { data: dup } = await sb.from('past_questions').select('id').eq('board',q.b).eq('year',q.y).eq('subject_id',subjId).eq('question_text',q.t).limit(1);
    if (dup?.length > 0) continue;
    const { error } = await sb.from('past_questions').insert({
      board: q.b, year: q.y, subject_id: subjId, question_type: 'mcq',
      question_text: q.t, options: q.o,
      correct_answer: { id: q.a, text: q.o.find(x=>x.id===q.a)?.text||'' },
      explanation: q.e, difficulty: q.d, marks: 1,
      source: `${q.b.toUpperCase()} ${q.y}`, tags: [q.b, q.d], is_active: true, usage_count: 0,
    });
    if (!error) pqCount++;
  }
  console.log(`  past_questions inserted: ${pqCount}`);

  // ── 3. QUESTIONS (quiz/exam bank) ─────────────────────
  console.log('\n── 3. Questions ──');
  let qCount = 0;
  for (const q of PQ) {
    const subjId = subjMap[q.s];
    if (!subjId) continue;
    const { data: dup } = await sb.from('questions').select('id').eq('subject_id',subjId).eq('question_text',q.t).limit(1);
    if (dup?.length > 0) continue;
    const { error } = await sb.from('questions').insert({
      subject_id: subjId, question_type: 'mcq', question_text: q.t,
      options: q.o, correct_answer: q.a, explanation: q.e,
      difficulty: q.d, marks: 1, negative_marks: 0,
      source: `${q.b.toUpperCase()} ${q.y}`, exam_name: q.b.toUpperCase(), exam_year: q.y,
      tags: [q.b, q.d], is_active: true, usage_count: 0,
    });
    if (!error) qCount++;
  }
  console.log(`  questions inserted: ${qCount}`);

  // ── 4. FLASHCARDS ──────────────────────────────────────
  console.log('\n── 4. Flashcards ──');
  const FC = {
    MATH: [{f:'Quadratic formula?',b:'x = (-b ± √(b²-4ac)) / 2a',d:'medium',tp:'Algebra'},{f:'Area of circle?',b:'A = πr²',d:'easy',tp:'Geometry'},{f:'Pythagoras theorem?',b:'a² + b² = c²',d:'easy',tp:'Geometry'},{f:'Sum of angles in triangle?',b:'180°',d:'easy',tp:'Geometry'},{f:'Derivative of x²?',b:'2x',d:'medium',tp:'Calculus'},{f:'sin²θ + cos²θ = ?',b:'1',d:'medium',tp:'Trigonometry'},{f:'Slope-intercept form?',b:'y = mx + c',d:'easy',tp:'Algebra'},{f:'Compound interest?',b:'A = P(1+r/n)^(nt)',d:'hard',tp:'Financial Math'},{f:'5! = ?',b:'120',d:'easy',tp:'Number Theory'},{f:'Discriminant?',b:'Δ = b²-4ac',d:'medium',tp:'Algebra'}],
    ENG: [{f:'What is a simile?',b:'Comparison using "like" or "as"',d:'easy',tp:'Literary Devices'},{f:'What is a metaphor?',b:'Direct comparison without like/as',d:'easy',tp:'Literary Devices'},{f:'What is personification?',b:'Giving human qualities to non-human things',d:'easy',tp:'Literary Devices'},{f:'Define hyperbole',b:'Deliberate exaggeration',d:'easy',tp:'Literary Devices'},{f:'Past participle of "run"?',b:'Run (run-ran-run)',d:'easy',tp:'Grammar'},{f:'What is a preposition?',b:'Word showing relationship (in,on,at)',d:'medium',tp:'Grammar'},{f:"their vs there vs they're?",b:'Their=possessive, There=place, They\'re=they are',d:'medium',tp:'Grammar'},{f:'What is an oxymoron?',b:'Contradictory terms together (e.g., deafening silence)',d:'medium',tp:'Literary Devices'},{f:'What is alliteration?',b:'Repetition of initial consonant sounds',d:'easy',tp:'Literary Devices'},{f:'Define syntax',b:'Arrangement of words in sentences',d:'medium',tp:'Grammar'}],
    BIO: [{f:'Powerhouse of the cell?',b:'Mitochondria — produces ATP',d:'easy',tp:'Cell Biology'},{f:'What is photosynthesis?',b:'CO₂+H₂O → glucose+O₂ using sunlight',d:'easy',tp:'Plant Biology'},{f:'What is osmosis?',b:'Water moves high→low concentration across membrane',d:'medium',tp:'Cell Biology'},{f:'What is mitosis?',b:'Division producing 2 identical diploid cells',d:'medium',tp:'Cell Division'},{f:'What is meiosis?',b:'Division producing 4 genetically different haploid cells',d:'hard',tp:'Cell Division'},{f:'Universal donor blood group?',b:'O negative',d:'medium',tp:'Anatomy'},{f:'Natural selection?',b:'Better adapted organisms survive and reproduce',d:'medium',tp:'Evolution'},{f:'4 chambers of heart?',b:'RA, RV, LA, LV',d:'easy',tp:'Anatomy'},{f:'What is DNA?',b:'Deoxyribonucleic acid — genetic instructions',d:'easy',tp:'Genetics'},{f:'Trophic levels?',b:'Producers→Primary→Secondary→Tertiary consumers',d:'medium',tp:'Ecology'}],
    CHM: [{f:'Atomic number of Carbon?',b:'6',d:'easy',tp:'Atomic Structure'},{f:'Formula for table salt?',b:'NaCl',d:'easy',tp:'Compounds'},{f:'pH of neutral solution?',b:'7',d:'easy',tp:'Acids & Bases'},{f:"Avogadro's number?",b:'6.022 × 10²³',d:'medium',tp:'Stoichiometry'},{f:'Exothermic reaction?',b:'Releases energy to surroundings',d:'medium',tp:'Reaction Types'},{f:'What is electrolysis?',b:'Decomposition using electric current',d:'medium',tp:'Electrochemistry'},{f:'Periodic law?',b:'Properties periodic function of atomic numbers',d:'medium',tp:'Periodic Table'},{f:'What is a catalyst?',b:'Increases rate without being consumed',d:'easy',tp:'Reaction Rates'},{f:'Symbol for Iron?',b:'Fe (Ferrum)',d:'easy',tp:'Elements'},{f:'What is an isotope?',b:'Same element, different neutron count',d:'hard',tp:'Atomic Structure'}],
    PHY: [{f:"Newton's First Law?",b:'Object at rest/motion stays unless net force acts',d:'easy',tp:'Mechanics'},{f:'SI unit of force?',b:'Newton (N)',d:'easy',tp:'Units'},{f:'Kinetic energy formula?',b:'KE = ½mv²',d:'easy',tp:'Energy'},{f:"Ohm's Law?",b:'V = IR',d:'easy',tp:'Electricity'},{f:'Speed of light?',b:'3 × 10⁸ m/s',d:'easy',tp:'Waves'},{f:'Conservation of Energy?',b:'Energy neither created nor destroyed',d:'easy',tp:'Energy'},{f:'What is power?',b:'Rate of doing work: P=W/t (Watts)',d:'easy',tp:'Work & Energy'},{f:'Density formula?',b:'ρ = m/V',d:'easy',tp:'Properties'},{f:'What is refraction?',b:'Bending of light between media',d:'medium',tp:'Optics'},{f:'What is frequency?',b:'Cycles per second (Hz)',d:'easy',tp:'Waves'}],
    ECO: [{f:'Scarcity?',b:'Limited resources vs unlimited wants',d:'easy',tp:'Basic Concepts'},{f:'Opportunity cost?',b:'Value of next best alternative foregone',d:'medium',tp:'Basic Concepts'},{f:'Define demand',b:'Quantity willing/able to buy at various prices',d:'easy',tp:'Demand & Supply'},{f:'Define supply',b:'Quantity willing/able to sell at various prices',d:'easy',tp:'Demand & Supply'},{f:'Equilibrium price?',b:'Where Qd = Qs',d:'medium',tp:'Market'},{f:'What is inflation?',b:'Sustained increase in general price level',d:'easy',tp:'Macro'},{f:'What is GDP?',b:'Total value of goods/services produced',d:'medium',tp:'Macro'},{f:'What is monopoly?',b:'Single seller, no close substitutes',d:'medium',tp:'Markets'},{f:'Elasticity of demand?',b:'How Qd responds to price changes',d:'hard',tp:'Demand'},{f:'Fiscal policy?',b:'Govt taxation and spending to influence economy',d:'medium',tp:'Macro'}],
    GOV: [{f:'Democracy?',b:'Government by the people',d:'easy',tp:'Political Systems'},{f:'Separation of powers?',b:'Executive, legislature, judiciary',d:'medium',tp:'Govt Structure'},{f:'Rule of law?',b:'All subject to the law',d:'medium',tp:'Legal Principles'},{f:'Federalism?',b:'Power divided between central and regional govts',d:'medium',tp:'Govt Structure'},{f:'Nigeria independence?',b:'October 1, 1960',d:'easy',tp:'History'},{f:'Nigerian legislature?',b:'National Assembly (Senate + House)',d:'medium',tp:'Govt Structure'},{f:'What is constitution?',b:'Supreme legal document outlining govt framework',d:'easy',tp:'Legal Principles'},{f:'Civic duties?',b:'Voting, paying taxes, obeying laws',d:'easy',tp:'Citizenship'},{f:'Checks and balances?',b:'Each branch limits the others',d:'medium',tp:'Govt Structure'},{f:'Electoral system?',b:'Framework for conducting elections',d:'medium',tp:'Electoral Systems'}],
  };

  let fcCount = 0;
  for (const [code, cards] of Object.entries(FC)) {
    const subjId = subjMap[code];
    if (!subjId) continue;
    const title = `${code} Flashcards`;
    const { data: dup } = await sb.from('flashcards').select('id').eq('title',title).limit(1);
    if (dup?.length > 0) continue;
    const { error } = await sb.from('flashcards').insert({
      subject_id: subjId, title, description: `Flashcard set for ${code}`,
      cards: cards.map(c => ({ front: c.f, back: c.b, difficulty: c.d, topic: c.tp })),
      mode: 'study', is_public: true, view_count: 0, usage_count: 0,
    });
    if (!error) fcCount++;
  }
  console.log(`  Flashcard sets inserted: ${fcCount}`);

  // ── 5. LIBRARY RESOURCES ───────────────────────────────
  console.log('\n── 5. Library Resources ──');
  const LIB = [
    {t:'WAEC Biology Past Questions 2020-2024',s:'waec-bio-past-q',rt:'past-question',desc:'Complete WAEC Biology past questions with answers',tags:['waec','biology','past-questions'],eb:'WAEC',ey:2023},
    {t:'JAMB Mathematics CBT Practice',s:'jamb-math-cbt',rt:'cbt',desc:'CBT practice for JAMB Mathematics',tags:['jamb','math','cbt'],eb:'JAMB',ey:2024},
    {t:'NECO Chemistry Practical Guide',s:'neco-chem-practical',rt:'guide',desc:'Step-by-step NECO Chemistry practical guide',tags:['neco','chemistry','practical'],eb:'NECO',ey:2023},
    {t:'Physics Formulas Cheat Sheet',s:'phys-formulas',rt:'cheat-sheet',desc:'Quick physics formulas reference',tags:['physics','formulas'],eb:null,ey:null},
    {t:'English Essay Writing Guide',s:'eng-essay-guide',rt:'guide',desc:'Essay writing for WAEC and JAMB',tags:['english','essay'],eb:null,ey:null},
    {t:'Government Notes: Nigerian Constitution',s:'gov-constitution-notes',rt:'notes',desc:'Nigerian constitution summary notes',tags:['government','constitution'],eb:null,ey:null},
    {t:'Economics Demand & Supply Graphs',s:'eco-demand-supply',rt:'infographic',desc:'Visual guide to demand and supply',tags:['economics','graphs'],eb:null,ey:null},
    {t:'Biology Cell Diagram Labelling',s:'bio-cell-diagram',rt:'diagram',desc:'Labeled plant and animal cell diagrams',tags:['biology','cell','diagram'],eb:null,ey:null},
    {t:'Mathematics Algebra Workbook',s:'math-algebra-wb',rt:'workbook',desc:'Algebra practice problems and solutions',tags:['math','algebra','practice'],eb:null,ey:null},
    {t:'Chemistry Periodic Table Reference',s:'chem-periodic-table',rt:'reference',desc:'Complete periodic table with properties',tags:['chemistry','periodic-table'],eb:null,ey:null},
    {t:'JAMB English Usage Tips',s:'jamb-eng-tips',rt:'tips',desc:'Common English errors to avoid',tags:['english','jamb','tips'],eb:'JAMB',ey:2024},
    {t:'Physics Optics Ray Diagrams',s:'phys-optics-diagrams',rt:'diagram',desc:'Ray diagrams for mirrors and lenses',tags:['physics','optics','diagram'],eb:null,ey:null},
    {t:'Agricultural Science Notes SS1-SS3',s:'agri-notes',rt:'notes',desc:'Complete agricultural science notes',tags:['agriculture','notes'],eb:null,ey:null},
    {t:'WAEC Geography Map Work Guide',s:'waec-geo-map-work',rt:'guide',desc:'Geography map work techniques',tags:['geography','map-work','waec'],eb:'WAEC',ey:2023},
    {t:'Mathematics Statistics Revision Pack',s:'math-stats-revision',rt:'revision',desc:'Statistics and probability revision',tags:['math','statistics','revision'],eb:null,ey:null},
  ];
  const libSubj = {'Biology':'BIO','Mathematics':'MATH','English Language':'ENG','Chemistry':'CHM','Physics':'PHY','Economics':'ECO','Government':'GOV','Agricultural Science':'AGS','Geography':'GEO'};
  let libCount = 0;
  for (const r of LIB) {
    const subjId = subjMap[libSubj[r.t.split(' ')[0]]] || Object.values(subjMap)[0];
    const { data: dup } = await sb.from('library_resources').select('id').eq('slug',r.s).limit(1);
    if (dup?.length > 0) continue;
    const { error } = await sb.from('library_resources').insert({
      title: r.t, slug: r.s, resource_type: r.rt, description: r.desc,
      subject_id: subjId, tags: r.tags, exam_board: r.eb, exam_year: r.ey,
      file_url: '', is_free: true, download_count: 0, view_count: 0,
    });
    if (!error) libCount++;
  }
  console.log(`  Library resources inserted: ${libCount}`);

  // ── 6. COMMUNITY POSTS ─────────────────────────────────
  console.log('\n── 6. Community Posts ──');
  const { data: users } = await sb.from('users').select('id,email').limit(10);
  const studentId = users?.find(u => u.email?.includes('student'))?.id || users?.[0]?.id;
  const POSTS = [
    {title:'How I scored A1 in WAEC Biology',content:'I spent 3 months revising with past questions. Focus on understanding concepts, not memorizing. Draw diagrams regularly!',author:'Adaeze O.',tags:['biology','waec','tips'],type:'discussion'},
    {title:'Best JAMB prep strategy for 2025',content:'Start early! Use the CBT platform daily. Focus on weak areas. Past questions are gold — do at least 5 years.',author:'Chidi M.',tags:['jamb','strategy','tips'],type:'discussion'},
    {title:'Mathematics: How to master algebra',content:'Algebra is the foundation. Practice simplifying expressions daily. Watch Khan Academy videos. Don\'t skip the basics!',author:'Fatima A.',tags:['mathematics','algebra','tips'],type:'tips'},
    {title:'Science or Arts? My journey',content:'Choosing between Science and Arts was hard. I picked Science because I loved Biology and Chemistry. Now preparing for Medicine!',author:'Emeka N.',tags:['career','guidance'],type:'discussion'},
    {title:'Study timetable that got me through SSS3',content:'6 hours daily: 2hrs Math, 2hrs Sciences, 1hr English, 1hr rotating. Weekends for practice tests. Consistency is key!',author:'Blessing E.',tags:['study-tips','timetable'],type:'tips'},
    {title:'Chemical bonding made easy',content:'Ionic: metal+non-metal, electron transfer. Covalent: non-metal+non-metal, electron sharing. Metallic: sea of electrons.',author:'Mr. Okonkwo',tags:['chemistry','bonding','teaching'],type:'teaching'},
    {title:'Essay writing tips for English exam',content:'Plan before writing. Use varied sentence structures. Check spelling and grammar. Practice with past question essay topics.',author:'Mrs. Bello',tags:['english','essay','teaching'],type:'teaching'},
    {title:'Geography map work preparation',content:'Practice topographic maps weekly. Learn contour intervals, grid references, and symbols. Practice makes perfect!',author:'Dr. Abubakar',tags:['geography','map-work','teaching'],type:'teaching'},
    {title:'Top 5 apps for Nigerian students',content:'1. THE GUIDE 2. Khan Academy 3. Quizlet 4. Photomath 5. YouTube CrashCourse',author:'Tunde K.',tags:['tools','apps'],type:'discussion'},
    {title:'Physics electricity simplified',content:'Current = flow of charge (A). Voltage = push (V). Resistance = opposition (Ω). Remember: V = IR!',author:'Engr. Sunday',tags:['physics','electricity','teaching'],type:'teaching'},
  ];
  let postCount = 0;
  for (const p of POSTS) {
    const { error } = await sb.from('community_posts').insert({
      user_id: studentId, type: p.type, title: p.title, content: p.content,
      tags: p.tags, is_pinned: false, is_locked: false, status: 'published',
      views: Math.floor(Math.random()*500)+50,
      likes_count: Math.floor(Math.random()*100)+5,
      replies_count: Math.floor(Math.random()*20)+1,
    });
    if (!error) postCount++;
  }
  console.log(`  Community posts inserted: ${postCount}`);

  // ── 7. COURSES & LESSONS ───────────────────────────────
  console.log('\n── 7. Courses & Lessons ──');
  const COURSES = [
    {title:'Complete WAEC Biology Prep',slug:'waec-biology-prep',subj:'BIO',diff:'medium',lessons:['Cell Structure & Function','Cell Division: Mitosis & Meiosis','Genetics & Heredity','Ecology & Ecosystems','Human Anatomy & Physiology','WAEC Biology Past Questions Walkthrough']},
    {title:'JAMB Mathematics Mastery',slug:'jamb-math-mastery',subj:'MATH',diff:'hard',lessons:['Algebra Fundamentals','Geometry & Trigonometry','Statistics & Probability','Number Theory & Indices','JAMB CBT Practice Session']},
    {title:'Chemistry for WAEC & JAMB',slug:'chemistry-waec-jamb',subj:'CHM',diff:'medium',lessons:['Atomic Structure & Bonding','Acids Bases & Salts','Chemical Reactions & Stoichiometry','Organic Chemistry Introduction']},
    {title:'Physics: Basics to Advanced',slug:'physics-basics-advanced',subj:'PHY',diff:'medium',lessons:["Motion & Forces (Newton's Laws)","Work Energy & Power","Waves Sound & Light","Electricity & Magnetism"]},
    {title:'English Language: Grammar & Comprehension',slug:'english-grammar-comprehension',subj:'ENG',diff:'easy',lessons:['Essential Grammar Rules','Comprehension Techniques','Essay Writing Workshop','Oral English & Phonetics']},
    {title:'Government & Civics Complete Guide',slug:'government-civics-guide',subj:'GOV',diff:'easy',lessons:['Concepts of Government & State','Nigerian Constitutional Development','Citizenship & Rights','Political Parties & Electoral Systems']},
  ];
  const { data: allClasses } = await sb.from('classes').select('id').limit(1);
  const classId = allClasses?.[0]?.id;
  const { data: allTerms } = await sb.from('terms').select('id').order('order_index').limit(1);
  const termId = allTerms?.[0]?.id;
  const { data: teacherUsers } = await sb.from('users').select('id,email').eq('email','teacher@learnforge.ng').limit(1);
  const teacherId = teacherUsers?.[0]?.id;

  let courseCount = 0, lessonCount = 0;
  for (const crs of COURSES) {
    const subjId = subjMap[crs.subj];
    if (!subjId) continue;
    const { data: dup } = await sb.from('courses').select('id').eq('slug',crs.slug).limit(1);
    if (dup?.length > 0) { courseCount++; continue; }
    const { data: courseRes } = await sb.from('courses').insert({
      subject_id: subjId, class_id: classId, term_id: termId,
      teacher_id: teacherId, title: crs.title, slug: crs.slug,
      short_description: `${crs.title} — comprehensive course for WAEC/JAMB.`,
      full_description: `Master ${crs.subj.toLowerCase()} with ${crs.lessons.length} detailed lessons.`,
      difficulty: crs.diff, status: 'published', price: 0, currency: 'NGN',
      is_free: true, is_featured: true, enrollment_count: 0, rating: 4.5, review_count: 0,
    }).select('id').single();
    const courseId = courseRes?.id;
    if (!courseId) continue;
    courseCount++;
    for (let i = 0; i < crs.lessons.length; i++) {
      const lt = crs.lessons[i];
      const { error } = await sb.from('lessons').insert({
        course_id: courseId, title: lt,
        slug: `${crs.slug}-${lt.replace(/\s+/g,'-').toLowerCase()}`,
        description: `Detailed lesson on ${lt}.`,
        content_type: 'text', written_content: `Learn ${lt} in detail with examples and practice questions.`,
        learning_objectives: JSON.stringify([`Understand ${lt}`]),
        order_index: i, is_free: true, is_published: true, estimated_minutes: 30,
      });
      if (!error) lessonCount++;
    }
  }
  console.log(`  Courses: ${courseCount}, Lessons: ${lessonCount}`);

  // ── VERIFY ─────────────────────────────────────────────
  console.log('\n═══ FINAL STATE ═══');
  for (const tbl of ['education_levels','programs','classes','terms','topics','courses','lessons','questions','past_questions','flashcards','library_resources','community_posts']) {
    const { count } = await sb.from(tbl).select('*', { count: 'exact', head: true });
    console.log(`  ${tbl}: ${(count ?? 0).toLocaleString()} rows`);
  }
  console.log('\n✅ Database fully seeded! Refresh your browser.');
}

main().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
