import { query, closePool } from '../src/common/database/index.js';
import { USER_ROLES } from '../src/common/constants/index.js';
import bcrypt from 'bcryptjs';

const ROLE_DESCRIPTIONS = {
  [USER_ROLES.STUDENT]: 'Student learner',
  [USER_ROLES.PARENT]: 'Parent or guardian',
  [USER_ROLES.TEACHER]: 'Teacher / educator',
  [USER_ROLES.SCHOOL_ADMIN]: 'School administrator',
  [USER_ROLES.CONTENT_ADMIN]: 'Content administrator',
  [USER_ROLES.SUPER_ADMIN]: 'Platform super administrator',
};

const EDUCATION_SYSTEMS = [
  {
    name: 'Nigerian National Curriculum',
    code: 'NG-NCC',
    country: 'Nigeria',
    description: 'The Nigerian national education curriculum across basic and senior secondary education.',
    levels: [
      { name: 'Primary 1', code: 'P1', orderIndex: 1, minAge: 6, maxAge: 7 },
      { name: 'Primary 2', code: 'P2', orderIndex: 2, minAge: 7, maxAge: 8 },
      { name: 'Primary 3', code: 'P3', orderIndex: 3, minAge: 8, maxAge: 9 },
      { name: 'Primary 4', code: 'P4', orderIndex: 4, minAge: 9, maxAge: 10 },
      { name: 'Primary 5', code: 'P5', orderIndex: 5, minAge: 10, maxAge: 11 },
      { name: 'Primary 6', code: 'P6', orderIndex: 6, minAge: 11, maxAge: 12 },
      { name: 'Junior Secondary 1', code: 'JSS1', orderIndex: 7, minAge: 12, maxAge: 13 },
      { name: 'Junior Secondary 2', code: 'JSS2', orderIndex: 8, minAge: 13, maxAge: 14 },
      { name: 'Junior Secondary 3', code: 'JSS3', orderIndex: 9, minAge: 14, maxAge: 15 },
      { name: 'Senior Secondary 1', code: 'SSS1', orderIndex: 10, minAge: 15, maxAge: 16 },
      { name: 'Senior Secondary 2', code: 'SSS2', orderIndex: 11, minAge: 16, maxAge: 17 },
      { name: 'Senior Secondary 3', code: 'SSS3', orderIndex: 12, minAge: 17, maxAge: 18 },
    ],
    terms: [
      { name: 'First Term', code: 'TERM-1', orderIndex: 1 },
      { name: 'Second Term', code: 'TERM-2', orderIndex: 2 },
      { name: 'Third Term', code: 'TERM-3', orderIndex: 3 },
    ],
  },
];

const SUBJECTS = [
  { name: 'Biology', code: 'BIO', isCore: true },
  { name: 'Chemistry', code: 'CHEM', isCore: true },
  { name: 'Physics', code: 'PHY', isCore: true },
  { name: 'Mathematics', code: 'MATH', isCore: true },
  { name: 'English Language', code: 'ENG', isCore: true },
  { name: 'Agricultural Science', code: 'AGR', isCore: false },
  { name: 'Economics', code: 'ECO', isCore: false },
  { name: 'Government', code: 'GOV', isCore: false },
  { name: 'Geography', code: 'GEO', isCore: false },
  { name: 'Literature in English', code: 'LIT', isCore: false },
  { name: 'Yoruba', code: 'YOR', isCore: false },
  { name: 'Igbo', code: 'IGB', isCore: false },
  { name: 'Hausa', code: 'HAU', isCore: false },
  { name: 'Commercial Art', code: 'COM', isCore: false },
  { name: 'Financial Accounting', code: 'ACC', isCore: false },
  { name: 'Civic Education', code: 'CIV', isCore: false },
  { name: 'Computer Studies', code: 'CS', isCore: false },
];

const TOPICS_SS2_BIOLOGY = [
  { name: 'Cell Biology', code: 'CELL', description: 'Structure and function of cells' },
  { name: 'Cell Division', code: 'DIVISION', description: 'Mitosis and meiosis' },
  { name: 'Ecology', code: 'ECOLOGY', description: 'Ecosystems and energy flow' },
  { name: 'Genetics', code: 'GENETICS', description: 'Heredity and variation' },
  { name: 'Plant Nutrition', code: 'PLANT_NUT', description: 'Photosynthesis and transport' },
  { name: 'Human Anatomy', code: 'ANATOMY', description: 'Organ systems of the human body' },
  { name: 'Classification', code: 'CLASS', description: 'Taxonomy and classification' },
  { name: 'Evolution', code: 'EVOL', description: 'Origin and development of life' },
];

const WAEC_QUESTIONS = [
  { subject: 'Biology', topic: 'CELL', examName: 'WAEC', examYear: 2023, difficulty: 'medium', questionText: 'Which organelle is responsible for cellular respiration?', options: [{ id: 'A', text: 'Mitochondria' }, { id: 'B', text: 'Ribosome' }, { id: 'C', text: 'Golgi apparatus' }, { id: 'D', text: 'Lysosome' }], correctAnswer: 'A', explanation: 'Mitochondria are the powerhouse of the cell, responsible for ATP production through aerobic respiration.' },
  { subject: 'Biology', topic: 'CELL', examName: 'WAEC', examYear: 2022, difficulty: 'easy', questionText: 'The cell membrane is selectively permeable because it...', options: [{ id: 'A', text: 'allows all substances to pass' }, { id: 'B', text: 'allows only water to pass' }, { id: 'C', text: 'allows some substances to pass but not others' }, { id: 'D', text: 'prevents all substances from passing' }], correctAnswer: 'C', explanation: 'The cell membrane controls what enters and exits the cell, allowing some substances while blocking others.' },
  { subject: 'Biology', topic: 'DIVISION', examName: 'WAEC', examYear: 2023, difficulty: 'hard', questionText: 'During which phase of mitosis do chromosomes align at the equatorial plane?', options: [{ id: 'A', text: 'Prophase' }, { id: 'B', text: 'Metaphase' }, { id: 'C', text: 'Anaphase' }, { id: 'D', text: 'Telophase' }], correctAnswer: 'B', explanation: 'In metaphase, chromosomes line up along the metaphase plate (equator) of the cell.' },
  { subject: 'Biology', topic: 'ECOLOGY', examName: 'WAEC', examYear: 2023, difficulty: 'medium', questionText: 'Which of the following is NOT a biotic factor in an ecosystem?', options: [{ id: 'A', text: 'Bacteria' }, { id: 'B', text: 'Fungi' }, { id: 'C', text: 'Temperature' }, { id: 'D', text: 'Insects' }], correctAnswer: 'C', explanation: 'Temperature is an abiotic (non-living) factor. Bacteria, fungi, and insects are all living organisms (biotic factors).' },
  { subject: 'Biology', topic: 'ECOLOGY', examName: 'WAEC', examYear: 2022, difficulty: 'medium', questionText: 'The transfer of energy from one organism to another in a food chain begins with...', options: [{ id: 'A', text: 'Consumers' }, { id: 'B', text: 'Decomposers' }, { id: 'C', text: 'Producers' }, { id: 'D', text: 'Herbivores' }], correctAnswer: 'C', explanation: 'Producers (plants) capture solar energy through photosynthesis and form the base of all food chains.' },
  { subject: 'Biology', topic: 'GENETICS', examName: 'WAEC', examYear: 2023, difficulty: 'hard', questionText: 'In a cross between two heterozygous tall plants (Tt x Tt), what is the expected phenotypic ratio?', options: [{ id: 'A', text: '1:2:1' }, { id: 'B', text: '3:1' }, { id: 'C', text: '1:1' }, { id: 'D', text: '9:3:3:1' }], correctAnswer: 'B', explanation: 'A monohybrid cross between two heterozygotes produces a 3:1 phenotypic ratio (3 tall : 1 short).' },
  { subject: 'Biology', topic: 'GENETICS', examName: 'WAEC', examYear: 2021, difficulty: 'medium', questionText: 'Sickle cell anemia is caused by...', options: [{ id: 'A', text: 'A dominant gene' }, { id: 'B', text: 'A recessive gene' }, { id: 'C', text: 'A sex-linked gene' }, { id: 'D', text: 'Chromosomal abnormality' }], correctAnswer: 'B', explanation: 'Sickle cell anemia is an autosomal recessive disorder caused by a mutation in the hemoglobin gene.' },
  { subject: 'Biology', topic: 'ANATOMY', examName: 'WAEC', examYear: 2023, difficulty: 'medium', questionText: 'Which chamber of the heart has the thickest wall?', options: [{ id: 'A', text: 'Right atrium' }, { id: 'B', text: 'Left atrium' }, { id: 'C', text: 'Right ventricle' }, { id: 'D', text: 'Left ventricle' }], correctAnswer: 'D', explanation: 'The left ventricle has the thickest muscular wall because it pumps blood to the entire body.' },
  { subject: 'Biology', topic: 'ANATOMY', examName: 'WAEC', examYear: 2022, difficulty: 'easy', questionText: 'The functional unit of the kidney is called the...', options: [{ id: 'A', text: 'Neuron' }, { id: 'B', text: 'Nephron' }, { id: 'C', text: 'Alveolus' }, { id: 'D', text: 'Villi' }], correctAnswer: 'B', explanation: 'The nephron is the structural and functional unit of the kidney, responsible for filtering blood and producing urine.' },
  { subject: 'Biology', topic: 'PLANT_NUT', examName: 'WAEC', examYear: 2023, difficulty: 'medium', questionText: 'Which gas is released during photosynthesis?', options: [{ id: 'A', text: 'Carbon dioxide' }, { id: 'B', text: 'Nitrogen' }, { id: 'C', text: 'Oxygen' }, { id: 'D', text: 'Hydrogen' }], correctAnswer: 'C', explanation: 'During photosynthesis, plants use carbon dioxide and water to produce glucose and oxygen.' },
  { subject: 'Chemistry', topic: 'ATOMS', examName: 'WAEC', examYear: 2023, difficulty: 'medium', questionText: 'The number of protons in an atom is called its...', options: [{ id: 'A', text: 'Mass number' }, { id: 'B', text: 'Atomic number' }, { id: 'C', text: 'Neutron number' }, { id: 'D', text: 'Valence' }], correctAnswer: 'B', explanation: 'The atomic number equals the number of protons in an atom\'s nucleus and defines the element.' },
  { subject: 'Chemistry', topic: 'ATOMS', examName: 'WAEC', examYear: 2022, difficulty: 'easy', questionText: 'Which particle has no charge?', options: [{ id: 'A', text: 'Proton' }, { id: 'B', text: 'Electron' }, { id: 'C', text: 'Neutron' }, { id: 'D', text: 'Ion' }], correctAnswer: 'C', explanation: 'Neutrons are neutral particles found in the nucleus with no electrical charge.' },
  { subject: 'Chemistry', topic: 'REACTIONS', examName: 'WAEC', examYear: 2023, difficulty: 'hard', questionText: 'What type of reaction occurs when zinc reacts with dilute hydrochloric acid?', options: [{ id: 'A', text: 'Decomposition' }, { id: 'B', text: 'Displacement' }, { id: 'C', text: 'Neutralization' }, { id: 'D', text: 'Combustion' }], correctAnswer: 'B', explanation: 'Zinc displaces hydrogen from HCl: Zn + 2HCl -> ZnCl₂ + H₂. This is a single displacement reaction.' },
  { subject: 'Chemistry', topic: 'ACIDS', examName: 'WAEC', examYear: 2022, difficulty: 'medium', questionText: 'Which of the following is a strong acid?', options: [{ id: 'A', text: 'Ethanoic acid' }, { id: 'B', text: 'Citric acid' }, { id: 'C', text: 'Hydrochloric acid' }, { id: 'D', text: 'Carbonic acid' }], correctAnswer: 'C', explanation: 'Hydrochloric acid (HCl) is a strong acid that completely dissociates in aqueous solution.' },
  { subject: 'Physics', topic: 'MOTION', examName: 'WAEC', examYear: 2023, difficulty: 'medium', questionText: 'The SI unit of force is the...', options: [{ id: 'A', text: 'Joule' }, { id: 'B', text: 'Watt' }, { id: 'C', text: 'Newton' }, { id: 'D', text: 'Pascal' }], correctAnswer: 'C', explanation: 'Force is measured in Newtons (N). 1 N = 1 kg⋅m/s².' },
  { subject: 'Physics', topic: 'MOTION', examName: 'WAEC', examYear: 2022, difficulty: 'hard', questionText: 'A car accelerates uniformly from 10 m/s to 30 m/s in 5 seconds. What is the acceleration?', options: [{ id: 'A', text: '2 m/s²' }, { id: 'B', text: '4 m/s²' }, { id: 'C', text: '6 m/s²' }, { id: 'D', text: '8 m/s²' }], correctAnswer: 'B', explanation: 'Acceleration = (v-u)/t = (30-10)/5 = 4 m/s².' },
  { subject: 'Physics', topic: 'ENERGY', examName: 'WAEC', examYear: 2023, difficulty: 'medium', questionText: 'Energy cannot be created or destroyed is the law of...', options: [{ id: 'A', text: 'Conservation of mass' }, { id: 'B', text: 'Conservation of energy' }, { id: 'C', text: 'Gravity' }, { id: 'D', text: 'Thermodynamics' }], correctAnswer: 'B', explanation: 'The Law of Conservation of Energy states that energy can only be transformed from one form to another, not created or destroyed.' },
  { subject: 'Mathematics', topic: 'ALGEBRA', examName: 'WAEC', examYear: 2023, difficulty: 'medium', questionText: 'Simplify: 3x + 5y - 2x + 3y', options: [{ id: 'A', text: 'x + 8y' }, { id: 'B', text: 'x + 2y' }, { id: 'C', text: '5x + 8y' }, { id: 'D', text: 'x + 15y' }], correctAnswer: 'A', explanation: 'Combining like terms: (3x - 2x) + (5y + 3y) = x + 8y.' },
  { subject: 'Mathematics', topic: 'ALGEBRA', examName: 'WAEC', examYear: 2022, difficulty: 'hard', questionText: 'Solve for x: 2x² - 5x - 3 = 0', options: [{ id: 'A', text: 'x = 3 or x = -1/2' }, { id: 'B', text: 'x = -3 or x = 1/2' }, { id: 'C', text: 'x = 3 or x = 1/2' }, { id: 'D', text: 'x = -3 or x = -1/2' }], correctAnswer: 'A', explanation: 'Using the quadratic formula or factoring: (2x+1)(x-3)=0, so x=3 or x=-1/2.' },
  { subject: 'English Language', topic: 'GRAMMAR', examName: 'WAEC', examYear: 2023, difficulty: 'medium', questionText: 'Choose the correct option: She _____ to school every day.', options: [{ id: 'A', text: 'go' }, { id: 'B', text: 'goes' }, { id: 'C', text: 'going' }, { id: 'D', text: 'gone' }], correctAnswer: 'B', explanation: 'For third person singular (she/he/it) in present simple tense, we add -s to the verb: goes.' },
  { subject: 'English Language', topic: 'GRAMMAR', examName: 'WAEC', examYear: 2022, difficulty: 'easy', questionText: 'Which word is a conjunction?', options: [{ id: 'A', text: 'Quickly' }, { id: 'B', text: 'Because' }, { id: 'C', text: 'Beautiful' }, { id: 'D', text: 'Running' }], correctAnswer: 'B', explanation: '"Because" is a subordinating conjunction used to connect clauses.' },
];

const JAMB_QUESTIONS = [
  { subject: 'Biology', topic: 'CELL', examName: 'JAMB', examYear: 2024, difficulty: 'medium', questionText: 'The organelle found in plant cells but not in animal cells is the...', options: [{ id: 'A', text: 'Mitochondrion' }, { id: 'B', text: 'Cell wall' }, { id: 'C', text: 'Ribosome' }, { id: 'D', text: 'Nucleus' }], correctAnswer: 'B', explanation: 'Cell walls are unique to plant cells, providing structural support and protection. Animal cells lack cell walls.' },
  { subject: 'Biology', topic: 'DIVISION', examName: 'JAMB', examYear: 2024, difficulty: 'hard', questionText: 'Meiosis differs from mitosis in that meiosis...', options: [{ id: 'A', text: 'Produces diploid cells' }, { id: 'B', text: 'Occurs in somatic cells' }, { id: 'C', text: 'Produces four haploid cells' }, { id: 'D', text: 'Does not involve chromosome replication' }], correctAnswer: 'C', explanation: 'Meiosis produces four genetically different haploid daughter cells, essential for sexual reproduction.' },
  { subject: 'Biology', topic: 'GENETICS', examName: 'JAMB', examYear: 2024, difficulty: 'hard', questionText: 'A man with blood group A marries a woman with blood group B. Their first child has blood group O. What is the genotype of the parents?', options: [{ id: 'A', text: 'IAIA and IBIB' }, { id: 'B', text: 'IAi and IBi' }, { id: 'C', text: 'IAIA and IBi' }, { id: 'D', text: 'IAi and IBIB' }], correctAnswer: 'B', explanation: 'Both parents must carry the recessive i allele to produce an O-type child (ii): IAi × IBi can produce ii offspring.' },
  { subject: 'Biology', topic: 'ECOLOGY', examName: 'JAMB', examYear: 2023, difficulty: 'medium', questionText: 'The total amount of organic matter in an ecosystem at any given time is called...', options: [{ id: 'A', text: 'Biomass' }, { id: 'B', text: 'Productivity' }, { id: 'C', text: 'Energy flow' }, { id: 'D', text: 'Ecological pyramids' }], correctAnswer: 'A', explanation: 'Biomass is the total mass of living organic matter per unit area in an ecosystem at a given time.' },
  { subject: 'Chemistry', topic: 'ATOMS', examName: 'JAMB', examYear: 2024, difficulty: 'medium', questionText: 'The number of neutrons in ²³Na₁₁ is...', options: [{ id: 'A', text: '11' }, { id: 'B', text: '12' }, { id: 'C', text: '23' }, { id: 'D', text: '34' }], correctAnswer: 'B', explanation: 'Neutrons = Mass number - Atomic number = 23 - 11 = 12.' },
  { subject: 'Chemistry', topic: 'REACTIONS', examName: 'JAMB', examYear: 2023, difficulty: 'hard', questionText: 'Which of the following reactions is an example of oxidation?', options: [{ id: 'A', text: 'Fe³⁺ + e⁻ → Fe²⁺' }, { id: 'B', text: 'Na → Na⁺ + e⁻' }, { id: 'C', text: 'H⁺ + OH⁻ → H₂O' }, { id: 'D', text: 'Ag⁺ + Cl⁻ → AgCl' }], correctAnswer: 'B', explanation: 'Oxidation is the loss of electrons. Sodium loses an electron to become Na⁺.' },
  { subject: 'Physics', topic: 'MOTION', examName: 'JAMB', examYear: 2024, difficulty: 'medium', questionText: 'A ball is thrown vertically upwards with an initial velocity of 20 m/s. What is the maximum height reached? (g = 10 m/s²)', options: [{ id: 'A', text: '10 m' }, { id: 'B', text: '20 m' }, { id: 'C', text: '40 m' }, { id: 'D', text: '80 m' }], correctAnswer: 'B', explanation: 'At maximum height, v=0. Using v² = u² - 2gh: 0 = 400 - 20h, so h = 20m.' },
  { subject: 'Physics', topic: 'ENERGY', examName: 'JAMB', examYear: 2023, difficulty: 'hard', questionText: 'The power dissipated in a resistor of 10Ω carrying a current of 2A is...', options: [{ id: 'A', text: '5 W' }, { id: 'B', text: '20 W' }, { id: 'C', text: '40 W' }, { id: 'D', text: '200 W' }], correctAnswer: 'C', explanation: 'Power = I²R = (2)² × 10 = 4 × 10 = 40 W.' },
  { subject: 'Mathematics', topic: 'ALGEBRA', examName: 'JAMB', examYear: 2024, difficulty: 'medium', questionText: 'Simplify: (2³ × 3²) / (2² × 3)', options: [{ id: 'A', text: '6' }, { id: 'B', text: '12' }, { id: 'C', text: '24' }, { id: 'D', text: '36' }], correctAnswer: 'A', explanation: '(8 × 9) / (4 × 3) = 72 / 12 = 6. Or: 2¹ × 3¹ = 6.' },
  { subject: 'Mathematics', topic: 'ALGEBRA', examName: 'JAMB', examYear: 2023, difficulty: 'hard', questionText: 'If log₁₀2 = 0.3010 and log₁₀3 = 0.4771, evaluate log₁₀6.', options: [{ id: 'A', text: '0.7781' }, { id: 'B', text: '0.1761' }, { id: 'C', text: '1.7781' }, { id: 'D', text: '0.3010' }], correctAnswer: 'A', explanation: 'log₁₀6 = log₁₀(2×3) = log₁₀2 + log₁₀3 = 0.3010 + 0.4771 = 0.7781.' },
  { subject: 'English Language', topic: 'GRAMMAR', examName: 'JAMB', examYear: 2024, difficulty: 'medium', questionText: 'Choose the option that best completes the sentence: The man ___ car was stolen reported to the police.', options: [{ id: 'A', text: 'who' }, { id: 'B', text: 'whom' }, { id: 'C', text: 'whose' }, { id: 'D', text: 'which' }], correctAnswer: 'C', explanation: '"Whose" is the possessive relative pronoun used to show that the car belongs to the man.' },
  { subject: 'English Language', topic: 'GRAMMAR', examName: 'JAMB', examYear: 2023, difficulty: 'easy', questionText: 'Select the option nearest in meaning to the underlined word: The president made a PHILANTHROPIC gesture.', options: [{ id: 'A', text: 'Generous' }, { id: 'B', text: 'Selfish' }, { id: 'C', text: 'Cruel' }, { id: 'D', text: 'Indifferent' }], correctAnswer: 'A', explanation: 'Philanthropic means showing a desire to promote the welfare of others, especially by donating money. It is synonymous with generous.' },
];

const NECO_QUESTIONS = [
  { subject: 'Biology', topic: 'CELL', examName: 'NECO', examYear: 2023, difficulty: 'medium', questionText: 'Which of these structures is found in both plant and animal cells?', options: [{ id: 'A', text: 'Cell wall' }, { id: 'B', text: 'Chloroplast' }, { id: 'C', text: 'Cell membrane' }, { id: 'D', text: 'Large vacuole' }], correctAnswer: 'C', explanation: 'Both plant and animal cells have a cell membrane. Cell walls, chloroplasts, and large central vacuoles are unique to plant cells.' },
  { subject: 'Biology', topic: 'ANATOMY', examName: 'NECO', examYear: 2023, difficulty: 'medium', questionText: 'The part of the brain responsible for coordinating voluntary movements is the...', options: [{ id: 'A', text: 'Cerebrum' }, { id: 'B', text: 'Cerebellum' }, { id: 'C', text: 'Medulla oblongata' }, { id: 'D', text: 'Hypothalamus' }], correctAnswer: 'B', explanation: 'The cerebellum coordinates voluntary muscle movements, balance, and posture.' },
  { subject: 'Chemistry', topic: 'ATOMS', examName: 'NECO', examYear: 2023, difficulty: 'easy', questionText: 'The valency of chlorine (atomic number 17) is...', options: [{ id: 'A', text: '1' }, { id: 'B', text: '2' }, { id: 'C', text: '7' }, { id: 'D', text: '17' }], correctAnswer: 'A', explanation: 'Chlorine has 7 valence electrons and needs 1 more to complete its octet, so its valency is 1.' },
  { subject: 'Chemistry', topic: 'REACTIONS', examName: 'NECO', examYear: 2022, difficulty: 'medium', questionText: 'Which process is used to separate immiscible liquids?', options: [{ id: 'A', text: 'Filtration' }, { id: 'B', text: 'Distillation' }, { id: 'C', text: 'Separating funnel' }, { id: 'D', text: 'Chromatography' }], correctAnswer: 'C', explanation: 'A separating funnel is used to separate immiscible liquids of different densities, such as oil and water.' },
  { subject: 'Physics', topic: 'MOTION', examName: 'NECO', examYear: 2023, difficulty: 'medium', questionText: 'The S.I. unit of pressure is the...', options: [{ id: 'A', text: 'Newton' }, { id: 'B', text: 'Pascal' }, { id: 'C', text: 'Joule' }, { id: 'D', text: 'Watt' }], correctAnswer: 'B', explanation: 'Pressure is measured in Pascals (Pa), where 1 Pa = 1 N/m².' },
  { subject: 'Physics', topic: 'ENERGY', examName: 'NECO', examYear: 2022, difficulty: 'hard', questionText: 'A machine has a velocity ratio of 4 and an efficiency of 80%. If the effort applied is 50N, calculate the load.', options: [{ id: 'A', text: '100N' }, { id: 'B', text: '160N' }, { id: 'C', text: '200N' }, { id: 'D', text: '400N' }], correctAnswer: 'C', explanation: 'Efficiency = (MA/VR) × 100. MA = (Efficiency × VR)/100 = (80 × 4)/100 = 3.2. Load = MA × Effort = 3.2 × 50 = 160N. Wait: Let me recalculate. Efficiency = (Load/Effort) / VR × 100 → 0.8 = (Load/50)/4 → Load = 160N. Actually: MA = Load/Effort, Eff = MA/VR, so MA = 0.8 × 4 = 3.2, Load = 3.2 × 50 = 160N. Hmm, answer should be 160. Let me check: 80 = (MA/4)*100, MA=3.2, Load=3.2*50=160. Answer is B.'], correctAnswer: 'B', explanation: 'Efficiency = (Mechanical Advantage / Velocity Ratio) × 100. So 80 = (MA/4) × 100, MA = 3.2. Since MA = Load/Effort, Load = 3.2 × 50 = 160N.' },
  { subject: 'Mathematics', topic: 'ALGEBRA', examName: 'NECO', examYear: 2023, difficulty: 'medium', questionText: 'Solve the inequality: 3x - 7 < 8', options: [{ id: 'A', text: 'x < 5' }, { id: 'B', text: 'x > 5' }, { id: 'C', text: 'x < 15' }, { id: 'D', text: 'x > 15' }], correctAnswer: 'A', explanation: '3x - 7 < 8 → 3x < 15 → x < 5.' },
  { subject: 'Mathematics', topic: 'ALGEBRA', examName: 'NECO', examYear: 2022, difficulty: 'hard', questionText: 'If 2x + y = 7 and x - y = 2, find the value of x.', options: [{ id: 'A', text: '1' }, { id: 'B', text: '2' }, { id: 'C', text: '3' }, { id: 'D', text: '4' }], correctAnswer: 'C', explanation: 'Adding the equations: (2x+y)+(x-y) = 7+2 → 3x = 9 → x = 3.' },
  { subject: 'English Language', topic: 'GRAMMAR', examName: 'NECO', examYear: 2023, difficulty: 'easy', questionText: 'Choose the correct spelling:', options: [{ id: 'A', text: 'Accomodation' }, { id: 'B', text: 'Accommodation' }, { id: 'C', text: 'Acommodation' }, { id: 'D', text: 'Acomodation' }], correctAnswer: 'B', explanation: '"Accommodation" has double c and double m.' },
  { subject: 'English Language', topic: 'GRAMMAR', examName: 'NECO', examYear: 2022, difficulty: 'medium', questionText: 'Select the option that best completes the sentence: If I ___ rich, I would travel the world.', options: [{ id: 'A', text: 'am' }, { id: 'B', text: 'was' }, { id: 'C', text: 'were' }, { id: 'D', text: 'be' }], correctAnswer: 'C', explanation: 'In the second conditional (unreal/hypothetical situation), we use "were" for all subjects: If I were rich...' },
];

const LESSONS_SS2_BIOLOGY = [
  {
    title: 'Introduction to Cell Biology',
    slug: 'ss2-bio-cell-intro',
    description: 'Learn about the structure and function of cells, the basic unit of life.',
    contentType: 'video',
    estimatedMinutes: 45,
    learningObjectives: ['Define cell theory', 'Identify parts of a plant and animal cell', 'State the functions of cell organelles'],
    writtenContent: `Cells are the basic structural and functional units of all living organisms. The cell theory states that all living things are composed of cells, cells are the basic units of structure and function, and all cells come from pre-existing cells.

Key organelles and their functions:
- Nucleus: Controls cell activities and contains genetic material
- Mitochondria: Site of cellular respiration and ATP production
- Ribosomes: Site of protein synthesis
- Endoplasmic reticulum: Transport system within the cell
- Golgi apparatus: Packages and modifies proteins
- Cell membrane: Controls what enters and exits the cell
- Chloroplasts: Site of photosynthesis (plant cells only)
- Cell wall: Provides structural support (plant cells only)`,
    keyPoints: ['Cells are the basic unit of life', 'Plant cells have cell walls and chloroplasts; animal cells do not', 'Mitochondria are the powerhouse of the cell'],
  },
  {
    title: 'Cell Division - Mitosis',
    slug: 'ss2-bio-mitosis',
    description: 'Understand the process of mitosis and its importance in growth and repair.',
    contentType: 'text',
    estimatedMinutes: 35,
    learningObjectives: ['Describe the stages of mitosis', 'Explain the significance of mitosis', 'Differentiate mitosis from meiosis'],
    writtenContent: `Mitosis is the process of cell division that results in two identical daughter cells. It consists of four main stages:

1. PROPHASE: Chromosomes condense and become visible. The nuclear membrane breaks down. Spindle fibers begin to form.

2. METAPHASE: Chromosomes align at the equatorial plate (middle of the cell). Spindle fibers attach to centromeres.

3. ANAPHASE: Sister chromatids separate and move to opposite poles of the cell.

4. TELOPHASE: New nuclear membranes form around each set of chromosomes. Cytokinesis follows, dividing the cytoplasm.

Mitosis is important for growth, repair of worn-out tissues, and asexual reproduction in single-celled organisms.`,
    keyPoints: ['Mitosis produces two identical diploid cells', 'Four stages: Prophase, Metaphase, Anaphase, Telophase', 'Important for growth and tissue repair'],
  },
  {
    title: 'Genetics - Mendelian Inheritance',
    slug: 'ss2-bio-genetics-mendel',
    description: 'Explore the principles of inheritance discovered by Gregor Mendel.',
    contentType: 'text',
    estimatedMinutes: 40,
    learningObjectives: ['State Mendal laws of inheritance', 'Use Punnett squares to predict offspring', 'Distinguish between genotype and phenotype'],
    writtenContent: `Gregor Mendel, known as the father of genetics, discovered the fundamental laws of inheritance through his experiments with pea plants.

Key concepts:
- Gene: A unit of heredity that determines a characteristic
- Allele: Different forms of a gene
- Dominant allele: Expressed even in heterozygous condition (represented by capital letter)
- Recessive allele: Only expressed in homozygous condition (represented by lowercase letter)
- Genotype: The genetic makeup of an organism
- Phenotype: The physical appearance of an organism

Mendel's Laws:
1. Law of Segregation: Alleles separate during gamete formation
2. Law of Independent Assortment: Genes for different traits are inherited independently

Example: Cross between tall (TT) and dwarf (tt) pea plants → All F1 are tall (Tt). Self-pollination of F1 gives F2 with 3 tall : 1 dwarf ratio.`,
    keyPoints: ['Dominant alleles mask recessive alleles', 'Genotype is genetic makeup; phenotype is physical expression', 'Monohybrid cross gives 3:1 phenotypic ratio'],
  },
  {
    title: 'Ecology - Ecosystems and Energy Flow',
    slug: 'ss2-bio-ecology',
    description: 'Study ecosystems, food chains, food webs, and energy flow.',
    contentType: 'text',
    estimatedMinutes: 50,
    learningObjectives: ['Define ecosystem', 'Construct food chains and food webs', 'Explain energy flow in ecosystems'],
    writtenContent: `An ecosystem is a community of living organisms interacting with their non-living (abiotic) environment.

Components of an ecosystem:
- Biotic factors: Living organisms (producers, consumers, decomposers)
- Abiotic factors: Non-living components (light, temperature, water, soil)

Food Chain: A sequence of organisms where each is eaten by the next.
Example: Grass → Grasshopper → Frog → Snake → Hawk

Trophic levels:
1. Producers (autotrophs) - plants that make their own food
2. Primary consumers (herbivores) - eat producers
3. Secondary consumers (carnivores) - eat primary consumers
4. Tertiary consumers - eat secondary consumers

Energy flow is unidirectional and decreases at each trophic level (only about 10% energy is transferred).`,
    keyPoints: ['Energy flows in one direction through an ecosystem', 'Only 10% energy transfers between trophic levels', 'Food webs show complex feeding relationships'],
  },
];

const COURSES_SS2_BIOLOGY = [
  {
    title: 'SS2 Biology - First Term',
    slug: 'ss2-biology-first-term',
    shortDescription: 'Complete SS2 Biology course covering Cell Biology, Genetics, Ecology and more for Nigerian curriculum.',
    fullDescription: 'This comprehensive SS2 Biology course covers all topics required for the Nigerian senior secondary curriculum. Students will master Cell Biology, Cell Division, Genetics, Ecology, Plant Nutrition, and Human Anatomy through video lessons, practice questions, and mock examinations.',
    difficulty: 'medium',
    isFree: true,
    price: 0,
  },
];

const seedRoles = async () => {
  for (const [name, description] of Object.entries(ROLE_DESCRIPTIONS)) {
    await query(
      `INSERT INTO roles (name, description, permissions) VALUES ($1, $2, '{}'::jsonb) ON CONFLICT (name) DO NOTHING`,
      [name, description]
    );
  }
  console.log('Roles seeded:', Object.keys(ROLE_DESCRIPTIONS).length);
};

const seedEducation = async () => {
  for (const system of EDUCATION_SYSTEMS) {
    const sys = await query(
      `INSERT INTO education_systems (name, code, country, description) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [system.name, system.code, system.country, system.description]
    );
    const systemId = sys.rows[0].id;

    for (const level of system.levels) {
      const levelRes = await query(
        `INSERT INTO education_levels (education_system_id, name, code, description, order_index, min_age, max_age) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (education_system_id, code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [systemId, level.name, level.code, level.description, level.orderIndex, level.minAge, level.maxAge]
      );
      const levelId = levelRes.rows[0].id;

      const programRes = await query(
        `INSERT INTO programs (education_level_id, name, code, description, duration_years, order_index) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (education_level_id, code) DO UPDATE SET education_level_id = EXCLUDED.education_level_id RETURNING id`,
        [levelId, `${level.name} Program`, `${level.code}-PGM`, `${level.name} general program`, 1, level.orderIndex]
      );
      const programId = programRes.rows[0].id;

      for (const cls of ['A', 'B']) {
        await query(
          `INSERT INTO classes (program_id, name, code, order_index) VALUES ($1, $2, $3, $4) ON CONFLICT (program_id, code) DO UPDATE SET name = EXCLUDED.name`,
          [programId, `Class ${cls}`, `${level.code}-${cls}`, cls === 'A' ? 1 : 2]
        );
      }
    }

    for (const term of system.terms) {
      await query(
        `INSERT INTO terms (education_system_id, name, code, description, order_index) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (education_system_id, code) DO UPDATE SET name = EXCLUDED.name`,
        [systemId, term.name, term.code, term.description, term.orderIndex]
      );
    }
    console.log(`Education seeded: ${system.name}`);
  }
};

const seedSubjects = async () => {
  const systemRes = await query("SELECT id FROM education_systems WHERE code = 'NG-NCC'");
  if (!systemRes.rows.length) return;
  const systemId = systemRes.rows[0].id;

  for (const subj of SUBJECTS) {
    await query(
      `INSERT INTO subjects (education_system_id, name, code, description, is_core, order_index) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (education_system_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [systemId, subj.name, subj.code, `${subj.name} for Nigerian curriculum`, subj.isCore, SUBJECTS.indexOf(subj)]
    );
  }
  console.log(`Subjects seeded: ${SUBJECTS.length}`);
};

const seedTopics = async () => {
  const bioRes = await query("SELECT id FROM subjects WHERE code = 'BIO'");
  if (!bioRes.rows.length) return;
  const subjectId = bioRes.rows[0].id;

  const classRes = await query(`SELECT c.id FROM classes c JOIN programs p ON p.id = c.program_id JOIN education_levels el ON el.id = p.education_level_id WHERE el.code = 'SSS2' LIMIT 1`);
  const classId = classRes.rows[0]?.id;

  const termRes = await query("SELECT id FROM terms WHERE code = 'TERM-1'");
  const termId = termRes.rows[0]?.id;

  for (let i = 0; i < TOPICS_SS2_BIOLOGY.length; i++) {
    const t = TOPICS_SS2_BIOLOGY[i];
    await query(
      `INSERT INTO topics (subject_id, class_id, term_id, name, code, description, learning_objectives, order_index, estimated_hours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (subject_id, class_id, term_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [subjectId, classId, termId, t.name, t.code, t.description, JSON.stringify([]), i, 5]
    );
  }
  console.log(`Topics seeded: ${TOPICS_SS2_BIOLOGY.length} for SS2 Biology`);
};

const seedQuestions = async () => {
  const subjectMap = {};
  for (const s of SUBJECTS) {
    const r = await query("SELECT id FROM subjects WHERE code = $1", [s.code]);
    if (r.rows.length) subjectMap[s.code] = r.rows[0].id;
  }

  const allQuestions = [...WAEC_QUESTIONS, ...JAMB_QUESTIONS, ...NECO_QUESTIONS];
  let inserted = 0;

  for (const q of allQuestions) {
    const subjectId = subjectMap[q.subject];
    if (!subjectId) continue;

    const topicRes = await query("SELECT id FROM topics WHERE code = $1 AND subject_id = $2", [q.topic, subjectId]);
    const topicId = topicRes.rows[0]?.id;

    await query(
      `INSERT INTO questions (subject_id, topic_id, question_type, question_text, options, correct_answer, explanation, difficulty, marks, source, exam_name, exam_year, is_active, usage_count) VALUES ($1, $2, 'mcq', $3, $4, $5, $6, $7, 1, $8, $9, $10, TRUE, 0) ON CONFLICT DO NOTHING`,
      [subjectId, topicId || null, q.questionText, JSON.stringify(q.options), JSON.stringify(q.correctAnswer), q.explanation, q.difficulty, q.examName, q.examYear]
    );
    inserted++;
  }
  console.log(`Questions seeded: ${inserted} (${WAEC_QUESTIONS.length} WAEC, ${JAMB_QUESTIONS.length} JAMB, ${NECO_QUESTIONS.length} NECO)`);
};

const seedCoursesAndLessons = async () => {
  const bioRes = await query("SELECT id FROM subjects WHERE code = 'BIO'");
  const classRes = await query(`SELECT c.id FROM classes c JOIN programs p ON p.id = c.program_id JOIN education_levels el ON el.id = p.education_level_id WHERE el.code = 'SSS2' LIMIT 1`);
  const termRes = await query("SELECT id FROM terms WHERE code = 'TERM-1'");

  if (!bioRes.rows.length || !classRes.rows.length || !termRes.rows.length) {
    console.log('Skipping courses - missing subjects/classes/terms');
    return;
  }

  const subjectId = bioRes.rows[0].id;
  const classId = classRes.rows[0].id;
  const termId = termRes.rows[0].id;

  for (const course of COURSES_SS2_BIOLOGY) {
    const courseRes = await query(
      `INSERT INTO courses (subject_id, class_id, term_id, teacher_id, title, slug, short_description, full_description, difficulty, status, price, currency, is_free, is_featured) VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id`,
      [subjectId, classId, termId, course.title, course.slug, course.shortDescription, course.fullDescription, course.difficulty, 'published', course.price, course.currency, course.isFree, course.isFeatured]
    );
    const courseId = courseRes.rows[0].id;

    for (let i = 0; i < LESSONS_SS2_BIOLOGY.length; i++) {
      const lesson = LESSONS_SS2_BIOLOGY[i];
      await query(
        `INSERT INTO lessons (course_id, topic_id, title, slug, description, learning_objectives, content_type, written_content, key_points, order_index, is_free, is_published, estimated_minutes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (course_id, slug) DO NOTHING`,
        [courseId, null, lesson.title, lesson.slug, lesson.description, JSON.stringify(lesson.learningObjectives), lesson.contentType, lesson.writtenContent, JSON.stringify(lesson.keyPoints), i, lesson.isFree ?? false, true, lesson.estimatedMinutes]
      );
    }
    console.log(`Course seeded: ${course.title} (${LESSONS_SS2_BIOLOGY.length} lessons)`);
  }
};

const seedDemoUsers = async (config) => {
  if (!config) return;
  const passwordHash = await bcrypt.hash(config.password, 12);
  const { email, firstName, lastName, role } = config;
  const created = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, is_verified) VALUES ($1, $2, $3, $4, TRUE) ON CONFLICT (email) DO NOTHING RETURNING id`,
    [email, passwordHash, firstName, lastName]
  );
  if (created.rows.length > 0) {
    const roleRes = await query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleRes.rows.length > 0) {
      await query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [created.rows[0].id, roleRes.rows[0].id]);
    }
  }
  console.log(`Demo user seeded: ${email} (${role})`);
};

const run = async () => {
  await seedRoles();
  await seedEducation();
  await seedSubjects();
  await seedTopics();
  await seedQuestions();
  await seedCoursesAndLessons();
  await seedDemoUsers({
    email: 'admin@learnforge.ng',
    password: 'Admin@12345',
    firstName: 'Platform',
    lastName: 'Admin',
    role: USER_ROLES.SUPER_ADMIN,
  });
  await seedDemoUsers({
    email: 'teacher@learnforge.ng',
    password: 'Teacher@12345',
    firstName: 'Biology',
    lastName: 'Teacher',
    role: USER_ROLES.TEACHER,
  });
  await seedDemoUsers({
    email: 'student@learnforge.ng',
    password: 'Student@12345',
    firstName: 'Adaeze',
    lastName: 'Okonkwo',
    role: USER_ROLES.STUDENT,
  });
  await closePool();
  console.log('Seed complete.');
};

run().catch((error) => {
  console.error('Seed failed:', error);
  closePool();
  process.exit(1);
});