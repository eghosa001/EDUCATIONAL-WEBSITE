/**
 * GENERATE SQL DUMP — Nigerian NERDC Curriculum Content
 *
 * Produces a single portable .sql file with INSERT statements for:
 *   - subjects, topics, courses, lessons, questions, flashcards
 *
 * This does NOT require a database connection. Import the output into any
 * PostgreSQL / Supabase instance.
 *
 * Usage:  cd backend && node scripts/generate-content-sql.js
 *         node scripts/generate-content-sql.js --classes=JSS1,SSS1
 *         node scripts/generate-content-sql.js --subjects=MATH,ENG
 *
 * Output: .sql file written to backend/scripts/output/curriculum_content.sql
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const classFilter = process.argv.find(a => a.startsWith('--classes='))?.split('=')[1]?.split(',') || null;
const subjectFilter = process.argv.find(a => a.startsWith('--subjects='))?.split('=')[1]?.split(',') || null;

// Load curriculum data
const jssSssPath = join(__dirname, '../../curriculum.json');
const primaryPath = join(__dirname, '../../generated/primary-nerdc/primary-topics.json');
let jssSss = {}, primary = {};
try { jssSss = JSON.parse(readFileSync(jssSssPath, 'utf8')); } catch { console.error('Missing curriculum.json'); }
try { primary = JSON.parse(readFileSync(primaryPath, 'utf8')); } catch { console.error('Missing primary-topics.json'); }
const CURRICULUM = { ...primary, ...jssSss };

const SUBJECT_ALIASES = {
  'ENGLISH STUDIES': 'ENGLISH LANGUAGE',
  'ISLAMIC RELIGIOUS STUDIES': 'ISLAMIC RELIGIOUS STUDIES',
  'SOCIAL AND CITIZENSHIP STUDIES': 'CITIZENSHIP AND HERITAGE STUDIES',
  'BASIC SCIENCE': 'BASIC SCIENCE AND TECHNOLOGY',
  'CULTURAL AND CREATIVE ARTS (CCA)': 'CULTURAL AND CREATIVE ARTS',
};
const SUBJECT_CODES = {
  'MATHEMATICS': 'MATH', 'ENGLISH LANGUAGE': 'ENG', 'BIOLOGY': 'BIO',
  'CHEMISTRY': 'CHEM', 'PHYSICS': 'PHY', 'ECONOMICS': 'ECO',
  'GOVERNMENT': 'GOV', 'GEOGRAPHY': 'GEO', 'AGRICULTURAL SCIENCE': 'AGS',
  'FURTHER MATHEMATICS': 'FMT', 'FINANCIAL ACCOUNTING': 'ACC',
  'COMMERCE': 'COM', 'LITERATURE IN ENGLISH': 'LIT',
  'CHRISTIAN RELIGIOUS STUDIES': 'CRS', 'ISLAMIC RELIGIOUS STUDIES': 'IRS',
  'CITIZENSHIP AND HERITAGE STUDIES': 'CIV', 'NIGERIAN HISTORY': 'HIS',
  'FRENCH': 'FRN', 'DIGITAL TECHNOLOGIES': 'DTE',
  'PHYSICAL AND HEALTH EDUCATION': 'PHE', 'CULTURAL AND CREATIVE ARTS': 'CCA',
  'BASIC SCIENCE AND TECHNOLOGY': 'BST', 'HOME ECONOMICS': 'HMEC',
  'FOOD AND NUTRITION': 'FDN', 'BUSINESS STUDIES': 'BUS',
  'INTERMEDIATE SCIENCE': 'ISC', 'FASHION DESIGN AND GARMENT MAKING': 'FASH',
  'BEAUTY AND COSMETOLOGY': 'BCOS', 'COMPUTER HARDWARE AND GSM REPAIRS': 'GSM',
  'HORTICULTURE AND CROP PRODUCTION': 'HORT', 'SOLAR PHOTOVOLTAIC INSTALLATION AND MAINTENANCE': 'SOLAR',
  'LIVESTOCK FARMING': 'LIV', 'FURTHER MATHEMATICS': 'FMT',
};
function normalizeSubject(name) { return SUBJECT_ALIASES[name.trim()] || name.trim(); }
function getSubjectCode(name) { return SUBJECT_CODES[normalizeSubject(name)] || name.replace(/[^A-Z0-9]/gi, '').substring(0, 15).toUpperCase(); }
function slugify(str) { return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 80); }

const CLASS_DB_MAP = {
  'PRIMARY 1':'P1','PRIMARY 2':'P2','PRIMARY 3':'P3','PRIMARY 4':'P4',
  'PRIMARY 5':'P5','PRIMARY 6':'P6','JSS1':'JSS1','JSS2':'JSS2','JSS3':'JSS3',
  'SSS1':'SSS1','SSS2':'SSS2','SSS3':'SSS3',
};
const CLASS_NAME_MAP = {
  'PRIMARY 1':'Primary 1','PRIMARY 2':'Primary 2','PRIMARY 3':'Primary 3',
  'PRIMARY 4':'Primary 4','PRIMARY 5':'Primary 5','PRIMARY 6':'Primary 6',
  'JSS1':'Junior Secondary 1','JSS2':'Junior Secondary 2','JSS3':'Junior Secondary 3',
  'SSS1':'Senior Secondary 1','SSS2':'Senior Secondary 2','SSS3':'Senior Secondary 3',
};

// Re-import content generators from the main seed script
// Extract just the generation functions without DB dependency
function generateLessonContent(subjectName, classCode, topicName, termKey) {
  const subj = normalizeSubject(subjectName);
  const subject = SUBJECT_NAME(subj);
  if (subj === 'MATHEMATICS' || subj === 'FURTHER MATHEMATICS') return genMath(topicName, classCode);
  if (subj === 'ENGLISH LANGUAGE') return genEnglish(topicName, classCode);
  if (['BIOLOGY','CHEMISTRY','PHYSICS','INTERMEDIATE SCIENCE'].includes(subj)) return genScience(topicName, classCode, subject);
  if (['ECONOMICS','GOVERNMENT','GEOGRAPHY','CITIZENSHIP AND HERITAGE STUDIES'].includes(subj)) return genSocial(topicName, classCode, subject);
  if (subj === 'NIGERIAN HISTORY') return genHistory(topicName, classCode);
  if (['CHRISTIAN RELIGIOUS STUDIES','ISLAMIC RELIGIOUS STUDIES'].includes(subj)) return genReligious(topicName, classCode);
  if (subj === 'PHYSICAL AND HEALTH EDUCATION') return genPHE(topicName, classCode);
  if (subj === 'FRENCH') return genFrench(topicName, classCode);
  if (subj === 'DIGITAL TECHNOLOGIES') return genTech(topicName, classCode);
  if (subj === 'LITERATURE IN ENGLISH') return genLiterature(topicName, classCode);
  if (subj === 'CULTURAL AND CREATIVE ARTS') return genArts(topicName, classCode);
  if (['AGRICULTURAL SCIENCE','BUSINESS STUDIES','FINANCIAL ACCOUNTING','COMMERCE','FASHION DESIGN AND GARMENT MAKING','BEAUTY AND COSMETOLOGY','COMPUTER HARDWARE AND GSM REPAIRS','HORTICULTURE AND CROP PRODUCTION','SOLAR PHOTOVOLTAIC INSTALLATION AND MAINTENANCE','LIVESTOCK FARMING','HOME ECONOMICS','FOOD AND NUTRITION'].includes(subj)) return genVocational(topicName, classCode, subject);
  return genGeneric(topicName, classCode, subject);
}
function SUBJECT_NAME(code) {
  const map = { MATH:'Mathematics', ENG:'English Language', BIO:'Biology', CHEM:'Chemistry', PHY:'Physics',
    ECO:'Economics', GOV:'Government', GEO:'Geography', AGS:'Agricultural Science', FMT:'Further Mathematics',
    ACC:'Financial Accounting', COM:'Commerce', LIT:'Literature in English', CRS:'Christian Religious Studies',
    IRS:'Islamic Religious Studies', CIV:'Citizenship and Heritage Studies', HIS:'Nigerian History', FRN:'French',
    DTE:'Digital Technologies', PHE:'Physical and Health Education', CCA:'Cultural and Creative Arts',
    BST:'Basic Science and Technology', ISC:'Integrated Science', HMEC:'Home Economics', FDN:'Food and Nutrition',
    BUS:'Business Studies', FASH:'Fashion Design and Garment Making', BCOS:'Beauty and Cosmetology',
    GSM:'Computer Hardware and GSM Repairs', HORT:'Horticulture and Crop Production', SOLAR:'Solar PV Installation and Maintenance',
    LIV:'Livestock Farming', CIV:'Citizenship and Heritage Studies' };
  return map[normalizeSubject(code)] || code;
}

// Content generator implementations (mirroring seed-content-detailed.js)
function genMath(topic, cls) {
  const content = `## ${topic}\n\nThis lesson covers **${topic}**, a fundamental concept in the Nigerian ${cls} Mathematics curriculum.\n\n### Key Concepts\n\nThe study of ${topic} involves understanding core principles and applying them to solve mathematical problems. This topic is introduced at junior secondary level and expanded at senior secondary level.\n\n### Step-by-Step Approach\n\n**Step 1:** Identify the given information.  \n**Step 2:** Determine the formula or rule for ${topic}.  \n**Step 3:** Substitute values and solve systematically.  \n**Step 4:** Verify the answer.\n\n### Worked Example\n\n**Problem:** Apply ${topic} to a practical calculation.\n\n**Solution:**\n1. Identify given data\n2. Apply the relevant formula\n3. Calculate step by step\n4. State the answer with units\n\n### Nigerian Context\n\nIn Nigeria, ${topic} is applied in engineering, architecture, commerce, and everyday calculations. Traders in markets like Oshodi and Mile 12 apply these concepts daily.\n\n### Common Mistakes\n- Not stating the formula before substitution\n- Arithmetic errors\n- Forgetting units\n- Not checking answer reasonableness\n\n### Summary\n\n${topic} is vital in Mathematics. Master definitions, practice examples, and attempt practice questions.`;
  return { content, objectives: [`Define and explain ${topic}`,`Identify formulae for ${topic}`,`Apply ${topic} to solve problems`,`Relate ${topic} to real-life Nigerian contexts`], keyPoints: [`Understand definition and scope of ${topic}`,`Master the relevant formulae`,`Practice step-by-step problem solving`,`Verify answers for accuracy`,`Apply to real-world Nigerian contexts`], estimatedMinutes: 35 };
}
function genEnglish(topic, cls) {
  const content = `## ${topic}\n\nThis lesson explores **${topic}** in the Nigerian ${cls} English Language curriculum. English Language is a core, compulsory subject from Primary 1 through SSS3.\n\n### Understanding ${topic}\n\nEnglish Language is the official language of Nigeria and the medium of instruction. The study of ${topic} helps students develop communication skills.\n\n### Key Points\n\n1. **Definition**: ${topic} is an important aspect of English studies.\n\n2. **Importance**: Mastering ${topic} is essential for:\n- Passing WAEC and NECO\n- Effective communication\n- Academic success\n- Professional growth\n\n### Examples\n\n**Example 1:** "The students in Lagos are preparing for their examinations."\n\n**Example 2:** "Although the examination was challenging, students from Government College Ibadan performed excellently."\n\n### Nigerian Context\n\nEnglish is used in:\n- Government offices and documents\n- Mass media (newspapers, radio, television)\n- Business across ethnic groups\n- Inter-state communication\n\n### Tips for Mastery\n- Read English newspapers (The Guardian, Daily Trust)\n- Practice essay writing\n- Listen to English news on NTA, Radio Nigeria\n- Engage in English conversations\n\n### Summary\n\n${topic} is fundamental to English Language. Regular practice in reading, writing, listening, and speaking ensures mastery.`;
  return { content, objectives: [`Understand the meaning and importance of ${topic}`,`Identify examples of ${topic} in everyday English`,`Apply ${topic} rules correctly in writing and speaking`,`Relate ${topic} to Nigerian English usage`], keyPoints: [`${topic} is essential for effective communication`,`Nigerian English has unique characteristics`,`Regular practice improves proficiency`,`Read widely to encounter ${topic} in context`], estimatedMinutes: 30 };
}
function genScience(topic, cls, subject) {
  const content = `## ${topic}\n\nThis lesson provides a comprehensive study of **${topic}** in ${subject}, per the Nigerian NERDC ${cls} curriculum.\n\n### Introduction\n\n${topic} is an important concept in ${subject}, helping students understand the natural world and its principles.\n\n### Core Concepts\n\n1. **Definition and Scope**: ${topic} refers to the study of fundamental principles explaining natural phenomena.\n\n2. **Key Principles**:\n- Observation and experimentation\n- Scientific method\n- Mathematical relationships\n\n### Detailed Explanation\n\n**Theoretical Framework:**\nThe theoretical basis of ${topic} provides a foundation for advanced concepts.\n\n**Practical Applications:**\n- Healthcare: understanding disease mechanisms\n- Agriculture: improving crop yields\n- Technology: developing inventions\n- Environment: addressing ecological challenges\n\n### Nigerian Context\n\n- Nigeria's diverse ecosystem provides excellent examples\n- Nigerian scientists contribute to ${subject}\n- Understanding ${topic} addresses Nigerian challenges\n\n### Examination Focus\n\nWAEC and JAMB test:\n- Definitions and key terms\n- Applications and examples\n- Diagrams and labeling\n- Calculations where applicable\n\n### Summary\n\n${topic} is a vital concept in ${subject}. Understanding its principles and Nigerian applications enables examination success.`;
  return { content, objectives: [`Define and explain key concepts of ${topic}`,`Describe the principles of ${topic}`,`Identify practical applications in Nigeria`,`Draw and label relevant diagrams`], keyPoints: [`${topic} is fundamental in ${subject}`,`Understanding theory is essential`,`Practical applications in Nigeria`,`Practice diagram labeling`,`WAEC/JAMB regularly examine this topic`], estimatedMinutes: 40 };
}
function genSocial(topic, cls, subject) {
  const content = `## ${topic}\n\nThis lesson examines **${topic}** in ${subject}, following the Nigerian NERDC ${cls} curriculum. ${subject} helps us understand how society functions and how individuals interact within it.\n\n### Introduction\n\n${topic} is a significant area of study, helping students understand the social, political, and economic forces shaping Nigeria.\n\n### Key Definitions\n\n- **${topic}**: A concept dealing with societal organization and governance\n- **Relevance**: Its importance in contemporary Nigeria\n- **Application**: How this knowledge applies to everyday life\n\n### Main Discussion\n\n**Historical Background:**\nPre-colonial Nigerian societies had systems related to ${topic}.\n\n**Key Principles:**\n1. Basic definition and scope\n2. How ${topic} functions in Nigerian society\n3. Challenges and opportunities\n\n### Nigerian Context\n\n**Federal Level:** Federal government implements policies.\n**State Level:** States like Lagos, Kano, Rivers have their own approaches.\n**Local Level:** Local Government Areas implement at grassroots.\n\n### Case Study\n\n- The 1999 Constitution addresses aspects of ${topic}\n- Various policies address ${topic}\n- Civil society engages with issues\n\n### Contemporary Issues\n\n- Role of technology\n- Youth engagement\n- Globalization impact\n\n### Summary\n\n${topic} is essential in ${subject}, equipping students to be informed citizens.`;
  return { content, objectives: [`Define and explain key concepts of ${topic}`,`Trace historical development in Nigeria`,`Analyze the role of ${topic} in Nigerian society`,`Discuss contemporary issues`], keyPoints: [`${topic} is central to ${subject}`,`Nigeria provides rich examples`,`Historical context is important`,`Contemporary issues make it relevant`,`WAEC and JAMB test this extensively`], estimatedMinutes: 35 };
}
function genHistory(topic, cls) {
  const content = `## ${topic}\n\nThis lesson explores **${topic}** in the Nigerian ${cls} History curriculum. Nigerian History helps us understand our past to better navigate the present and future.\n\n### Historical Background\n\n${topic} is significant in Nigerian History, helping us appreciate Nigeria's development from pre-colonial times to the present.\n\n### Pre-Colonial Era\n\nBefore European arrival, the area now called Nigeria had diverse kingdoms and empires with political systems, trade networks, and cultural practices related to ${topic}.\n\n### Colonial Period (1861-1960)\n\nThe British colonial administration introduced changes:\n- Administrative reforms\n- Educational developments\n- Economic transformations\n- Social changes\n\n### Post-Independence\n\n1. **First Republic (1960-1966)**: Early developments in ${topic}.\n2. **Civil War (1967-1970)**: Profound effects.\n3. **Military Era**: Various policies.\n4. **Democratic Era (1999-present)**: New perspectives.\n\n### Key Figures\n\n- Pre-colonial leaders\n- Independence leaders\n- Contemporary figures\n\n### Relevance Today\n\nUnderstanding ${topic} matters for:\n- National unity and identity\n- Learning from past mistakes\n- Appreciating diverse heritage\n- Building a better future\n\n### Summary\n\n${topic} is a crucial aspect of Nigerian History, giving students deeper understanding of Nigeria's journey.`;
  return { content, objectives: [`Explain the historical background of ${topic}`,`Identify key events and figures related to ${topic}`,`Analyze the impact of ${topic} on Nigerian society`,`Discuss relevance to contemporary Nigeria`], keyPoints: [`${topic} is significant in Nigerian History`,`Multiple periods are relevant`,`Key figures played important roles`,`Continues to influence modern Nigeria`,`Understanding history builds the future`], estimatedMinutes: 35 };
}
function genReligious(topic, cls, subject) {
  const content = `## ${topic}\n\nThis lesson covers **${topic}** in ${subject}, following the Nigerian NERDC ${cls} curriculum. Religious education is important for moral development.\n\n### Introduction\n\n${topic} is a key area of study. Nigeria is a religiously diverse country where both Christians and Muslims contribute to moral and spiritual development.\n\n### Key Teachings\n\n1. **Scriptural Foundation**: ${topic} is rooted in sacred texts.\n2. **Moral Lessons**: Important values applicable to daily life.\n3. **Practical Application**: Applying lessons to modern Nigerian society.\n\n### Moral Lessons\n\n- **Integrity**: Being honest and truthful\n- **Compassion**: Showing love and kindness\n- **Justice**: Standing for what is right\n- **Respect**: Honoring elders and authorities\n\n### Nigerian Context\n\n- Nigeria's religious diversity requires mutual understanding\n- Religious education promotes national unity\n- Moral lessons build a better society\n- Interfaith dialogue strengthens community\n\n### Contemporary Application\n\n- In families: strong family bonds\n- In schools: academic honesty\n- In communities: development\n- In the nation: unity and progress\n\n### Summary\n\n${topic} provides valuable lessons for moral and spiritual development, enabling students to become responsible citizens.`;
  return { content, objectives: [`Explain key teachings of ${topic}`,`Identify scriptural references`,`Discuss moral lessons from ${topic}`,`Apply teachings to modern Nigerian life`], keyPoints: [`${topic} is foundational in ${subject}`,`Scriptural references support teachings`,`Moral lessons apply to daily life`,`Nigeria's diversity makes religious education important`], estimatedMinutes: 30 };
}
function genPHE(topic, cls) {
  const content = `## ${topic}\n\nThis lesson covers **${topic}** in Physical and Health Education (PHE), essential for developing fit, healthy, well-rounded individuals.\n\n### Introduction\n\n${topic} is an important aspect of PHE, promoting physical fitness, healthy living, and wellness.\n\n### Key Concepts\n\n1. **Definition**: ${topic} encompasses activities and knowledge for physical well-being.\n2. **Components**: Various elements of ${topic}.\n3. **Benefits**: Contribution to health and fitness.\n\n### Physical Benefits\n- Improved cardiovascular health\n- Enhanced muscular strength\n- Better flexibility and coordination\n- Healthy body weight\n\n### Health Benefits\n- Reduced disease risk\n- Improved mental health\n- Better sleep\n- Increased energy\n\n### Safety Precautions\n- Warm up before activity\n- Use proper equipment\n- Stay hydrated\n- Stop if in pain\n- Consult a teacher when needed\n\n### Nigerian Context\n- School sports and athletics\n- Community festivals\n- National competitions\n- Recreation activities\n\n### Summary\n\n${topic} is vital for physical fitness and health. Regular participation contributes to overall well-being.`;
  return { content, objectives: [`Define key concepts of ${topic}`,`Describe physical and health benefits`,`Identify safety precautions`,`Participate in related activities`], keyPoints: [`${topic} is essential for physical fitness`,`Health benefits extend beyond activity`,`Safety must always be observed`,`Regular practice improves well-being`,`Nigeria has rich athletic traditions`], estimatedMinutes: 30 };
}
function genFrench(topic, cls) {
  const content = `## ${topic}\n\nThis lesson explores **${topic}** in French Language. French is an important foreign language in Nigeria, valuable for West African regional communication.\n\n### Introduction\n\n${topic} is a key topic in French Language. Learning French opens doors to communication across Francophone West Africa and the world.\n\n### Vocabulary and Key Terms\n\n- French terms and English equivalents\n- Proper pronunciation\n- Common expressions for daily conversation\n\n### Grammar Points\n\n1. **Sentence Structure**: Forming sentences with ${topic} vocabulary.\n2. **Verb Conjugation**: Relevant verb forms.\n3. **Agreement**: Adjective and noun agreement rules.\n\n### Practice Dialogues\n\n- Bonjour! Comment allez-vous?\n- Je vais bien, merci. Et vous?\n- Très bien, merci!\n\n### Nigerian Context\n\nFrench is useful because:\n- Nigeria borders Francophone countries (Benin, Niger, Chad, Cameroon)\n- ECOWAS communication often requires French\n- Many Nigerian businesses operate in Francophone countries\n\n### Summary\n\n${topic} is important in French learning. Regular practice in reading, writing, listening, and speaking leads to fluency.`;
  return { content, objectives: [`Learn key vocabulary related to ${topic}`,`Understand grammar rules for ${topic}`,`Practice speaking and writing about ${topic}`,`Relate French learning to Nigerian context`], keyPoints: [`Vocabulary acquisition is fundamental`,`Grammar rules must be applied`,`Practice all four language skills`,`French is valuable for West African communication`], estimatedMinutes: 30 };
}
function genTech(topic, cls) {
  const content = `## ${topic}\n\nThis lesson covers **${topic}** in Digital Technologies. Technology education equips students with essential digital skills for the modern world.\n\n### Introduction\n\n${topic} is a fundamental concept. In today's digital age, understanding technology is crucial for academic and career success.\n\n### Key Concepts\n\n1. **Theory**: Principles behind ${topic}.\n2. **Practical Skills**: Hands-on experience.\n3. **Application**: Solving real-world problems.\n\n### Components\n\n- Hardware elements\n- Software applications\n- Network and connectivity\n- Security considerations\n\n### Step-by-Step Guide\n\n**Step 1:** Understand the theoretical foundation.\n**Step 2:** Identify tools and equipment.\n**Step 3:** Follow proper procedures.\n**Step 4:** Test and verify results.\n\n### Nigerian Context\n\n- Tech industry growing in Lagos, Abuja\n- Startups solving local problems\n- Digital literacy essential for workforce\n- Government promotes technology adoption\n\n### Career Opportunities\n\n- Software development\n- Network administration\n- Cybersecurity\n- Digital marketing\n\n### Summary\n\n${topic} is a vital skill in today's digital world, preparing students for future opportunities.`;
  return { content, objectives: [`Explain key concepts of ${topic}`,`Identify components and tools`,`Apply practical skills related to ${topic}`,`Relate ${topic} to Nigerian tech development`,`Explore career opportunities`], keyPoints: [`${topic} is fundamental in Digital Technologies`,`Theory and practice both matter`,`Technology skills in high demand in Nigeria`,`Practice hands-on activities`,`Stay updated with developments`], estimatedMinutes: 30 };
}
function genLiterature(topic, cls) {
  const content = `## ${topic}\n\nThis lesson examines **${topic}** in Literature in English. Literature helps us understand human experiences, cultures, and societies.\n\n### Introduction\n\n${topic} is an important area of study, developing critical thinking, empathy, and appreciation for artistic expression.\n\n### Key Concepts\n\n1. **Literary Terms**: Terminology to discuss ${topic}.\n2. **Analysis Methods**: How to analyze ${topic} in texts.\n3. **Nigerian Literature**: How ${topic} appears in Nigerian works.\n\n### Literary Analysis\n\n- **Theme**: Central message about ${topic}\n- **Character**: How characters embody ${topic}\n- **Setting**: Time and place influencing ${topic}\n- **Style**: Author's technique\n\n### Nigerian Literary Context\n\n- Chinua Achebe's novels address themes related to ${topic}\n- Wole Soyinka's plays explore ${topic}\n- Chimamanda Adichie's fiction examines ${topic} in contemporary Nigeria\n\n### Recommended Texts\n\n- "Things Fall Apart" by Chinua Achebe\n- "Half of a Yellow Sun" by Chimamanda Adichie\n- "Death and the King's Horseman" by Wole Soyinka\n\n### Summary\n\n${topic} enriches our understanding of literature and human experience.`;
  return { content, objectives: [`Define key literary terms for ${topic}`,`Analyze how ${topic} is presented in texts`,`Discuss ${topic} in Nigerian literature`,`Compare authors' treatment of ${topic}`,`Write analytical essays`], keyPoints: [`Literary analysis requires close reading`,`Nigerian literature offers rich examples`,`Multiple elements contribute to understanding`,`Critical thinking is essential`,`Writing skills develop through analysis`], estimatedMinutes: 35 };
}
function genArts(topic, cls) {
  const content = `## ${topic}\n\nThis lesson explores **${topic}** in Cultural and Creative Arts. Arts education develops creativity, cultural awareness, and artistic skills.\n\n### Introduction\n\n${topic} is significant in Cultural and Creative Arts. Nigeria has a rich artistic heritage.\n\n### Key Concepts\n\n1. **Artistic Elements**: Basic elements used in ${topic}.\n2. **Techniques**: Methods for creating ${topic}.\n3. **Cultural Significance**: Role of ${topic} in Nigerian culture.\n\n### Artistic Elements\n\n- Line, shape, form\n- Color, texture\n- Pattern, rhythm\n- Space, composition\n\n### Nigerian Cultural Context\n\n- Yoruba artistic traditions\n- Igbo cultural expressions\n- Hausa/Fulani artistic heritage\n\n### Practical Activities\n\n- Observe and sketch objects\n- Practice techniques\n- Create original works\n- Visit galleries when possible\n\n### Summary\n\n${topic} connects us to Nigeria's cultural heritage while developing creativity.`;
  return { content, objectives: [`Identify key elements of ${topic}`,`Practice artistic techniques`,`Appreciate cultural significance`,`Create original works`,`Relate ${topic} to Nigerian heritage`], keyPoints: [`Arts education develops creativity`,`Nigeria has rich artistic heritage`,`Practice is essential`,`Cultural awareness enhances expression`,`Arts connect us to heritage`], estimatedMinutes: 30 };
}
function genVocational(topic, cls, subject) {
  const content = `## ${topic}\n\nThis lesson covers **${topic}** in ${subject}. Vocational education equips students with practical skills for employment and entrepreneurship.\n\n### Introduction\n\n${topic} is a key area in ${subject}, providing practical knowledge and skills for self-reliance and economic development.\n\n### Key Concepts\n\n1. **Theory**: Underlying principles.\n2. **Practice**: Hands-on skills.\n3. **Application**: Real-world uses.\n\n### Skills and Competencies\n\n- Technical knowledge\n- Practical application\n- Problem-solving\n- Professional attitudes and ethics\n\n### Entrepreneurial Opportunities\n\n- Starting a small business\n- Providing community services\n- Creating employment\n- Contributing to economic development\n\n### Nigerian Economic Context\n\n- Government promotes vocational education\n- High demand for skilled workers\n- Self-employment is viable\n- Growing economy needs professionals\n\n### Safety and Standards\n\n- Follow safety guidelines\n- Maintain quality standards\n- Use proper tools\n- Keep workspace organized\n\n### Summary\n\n${topic} provides valuable skills for personal development and economic empowerment.`;
  return { content, objectives: [`Explain key concepts of ${topic}`,`Demonstrate practical skills`,`Identify entrepreneurial opportunities`,`Apply safety standards`,`Relate ${topic} to Nigerian development`], keyPoints: [`${topic} combines theory and practice`,`Vocational skills lead to self-reliance`,`Safety standards must be followed`,`Entrepreneurship is a key outcome`,`Nigeria values skilled workers`], estimatedMinutes: 35 };
}
function genGeneric(topic, cls, subject) {
  const content = `## ${topic}\n\nThis lesson covers **${topic}** in ${subject}, part of the Nigerian NERDC ${cls} curriculum.\n\n### Introduction\n\n${topic} is an important area of study, helping students develop knowledge and skills relevant to academic and personal development.\n\n### Key Concepts\n\n1. **Definitions**: Key terms and meanings.\n2. **Principles**: Fundamental rules governing ${topic}.\n3. **Applications**: How ${topic} applies to real life.\n\n### Detailed Discussion\n\n${topic} encompasses several important aspects:\n- Theoretical framework\n- Practical applications\n- Historical development\n- Contemporary relevance\n\n### Nigerian Context\n\n${topic} is relevant to academic success, personal development, community contribution, and national development.\n\n### Study Tips\n\n- Attend classes regularly\n- Take detailed notes\n- Practice past questions\n- Discuss with classmates\n- Read widely\n\n### Summary\n\n${topic} is a vital part of the curriculum. Regular study ensures mastery.`;
  return { content, objectives: [`Define key concepts of ${topic}`,`Identify governing principles`,`Apply knowledge to practical situations`,`Relate ${topic} to Nigerian society`], keyPoints: [`${topic} is an important curriculum topic`,`Understanding definitions is foundational`,`Practical application enhances learning`,`Nigerian context makes learning relevant`,`Regular practice ensures mastery`], estimatedMinutes: 30 };
}

// Question generators
function generateQuestions(subjectName, topicName, classCode) {
  const subj = normalizeSubject(subjectName);
  return [
    {
      q: `Which of the following best describes "${topicName}"?`,
      opts: JSON.stringify([
        { id: 'A', text: `A key topic in the Nigerian curriculum covering important concepts in ${subj}` },
        { id: 'B', text: 'A topic unrelated to the academic curriculum' },
        { id: 'C', text: 'Only studied at university level' },
        { id: 'D', text: 'Not part of any Nigerian examination' },
      ]),
      answer: JSON.stringify('A'),
      explanation: `${topicName} is an important curriculum topic tested in Nigerian examinations including WAEC, NECO, and JAMB.`,
      difficulty: ['easy','medium','easy'][Math.floor(Math.random()*3)],
    },
    {
      q: `Studying ${topicName} helps students to:`,
      opts: JSON.stringify([
        { id: 'A', text: 'Build foundational knowledge for examinations and further study' },
        { id: 'B', text: 'Avoid learning other subjects' },
        { id: 'C', text: 'Only entertain themselves' },
        { id: 'D', text: 'Ignore the Nigerian curriculum' },
      ]),
      answer: JSON.stringify('A'),
      explanation: 'Each topic in the Nigerian curriculum builds essential knowledge contributing to academic success and personal development.',
      difficulty: 'easy',
    },
    {
      q: `Which examination in Nigeria tests knowledge of ${topicName}?`,
      opts: JSON.stringify([
        { id: 'A', text: 'WAEC (WASSCE), NECO, and JAMB' },
        { id: 'B', text: 'Only informal assessments' },
        { id: 'C', text: 'No examination tests this topic' },
        { id: 'D', text: 'Only foreign examinations' },
      ]),
      answer: JSON.stringify('A'),
      explanation: `${topicName} is part of the Nigerian national curriculum tested in major examinations like WAEC and NECO.`,
      difficulty: 'easy',
    },
  ];
}
function generateFlashcards(subjectName, topicName, classCode) {
  return JSON.stringify([
    { front: `Define: ${topicName}`, back: `${topicName} is a key topic in the Nigerian ${classCode} curriculum, covering fundamental concepts and principles.`, difficulty: 'easy' },
    { front: `Why is ${topicName} important?`, back: `${topicName} builds foundational knowledge for WAEC, NECO, and JAMB examinations and contributes to personal development.`, difficulty: 'medium' },
    { front: `Study tip for ${topicName}`, back: `Read textbooks, attend classes, practice past questions, discuss with peers, and apply ${topicName} to real-life situations.`, difficulty: 'medium' },
  ]);
}

// SQL escaping
function esc(str) {
  if (str == null) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}
function slugifySQL(str) { return slugify(str); }

// ─── Build SQL ────────────────────────────────────────────────────────
console.log('Generating SQL dump...');

let lines = [];
lines.push('-- ============================================================');
lines.push('-- THE GUIDE: Nigerian NERDC 2025 Curriculum Content Dump');
lines.push('-- Generated automatically. Import into PostgreSQL/Supabase.');
lines.push('-- ============================================================');
lines.push('');
lines.push('BEGIN;');
lines.push('');
lines.push('INSERT INTO education_systems (name, code, country, description) VALUES');
lines.push("('Nigerian National Curriculum', 'NG-NCC', 'Nigeria', 'Nigerian curriculum across primary, junior and senior secondary.')");
lines.push('ON CONFLICT (code) DO NOTHING;');
lines.push('');

// Levels and terms
const levels = [
  ['P1','Primary 1',5],['P2','Primary 2',6],['P3','Primary 3',7],['P4','Primary 4',8],
  ['P5','Primary 5',9],['P6','Primary 6',10],['JSS1','Junior Secondary 1',11],
  ['JSS2','Junior Secondary 2',12],['JSS3','Junior Secondary 3',13],
  ['SSS1','Senior Secondary 1',14],['SSS2','Senior Secondary 2',15],['SSS3','Senior Secondary 3',16],
];
lines.push('-- Education levels');
for (const [code, name, order] of levels) {
  lines.push(`INSERT INTO education_levels (education_system_id, name, code, description, order_index)
    VALUES ((SELECT id FROM education_systems WHERE code='NG-NCC'), ${esc(name)}, ${esc(code)}, ${esc(name + ' - Nigerian education')}, ${order})
    ON CONFLICT (education_system_id, code) DO NOTHING;`);
}
lines.push('');

// Terms
for (const [idx, [code, name]] of [['TERM-1','First Term'],['TERM-2','Second Term'],['TERM-3','Third Term']].entries()) {
  lines.push(`INSERT INTO terms (education_system_id, name, code, description, order_index)
    VALUES ((SELECT id FROM education_systems WHERE code='NG-NCC'), ${esc(name)}, ${esc(code)}, '', ${idx+1})
    ON CONFLICT (education_system_id, code) DO NOTHING;`);
}
lines.push('');
lines.push('');

const TERM_KEY_MAP = { first: 'TERM-1', second: 'TERM-2', third: 'TERM-3' };

let subjectOrder = 0;
const subjectCodes = new Set();
let topicCount = 0, lessonCount = 0, qCount = 0, fcCount = 0;

for (const [classCode, subjects] of Object.entries(CURRICULUM)) {
  const dbClassCode = CLASS_DB_MAP[classCode];
  if (!dbClassCode) continue;
  if (classFilter && !classFilter.includes(dbClassCode)) continue;
  const className = CLASS_NAME_MAP[classCode] || classCode;

  // Ensure class exists (program + class)
  lines.push(`-- Class: ${className}`);
  lines.push(`INSERT INTO programs (education_level_id, name, code, description, duration_years, order_index)
    VALUES ((SELECT id FROM education_levels WHERE code=${esc(dbClassCode)}), ${esc(className + ' Program')}, ${esc(dbClassCode + '-PGM')}, ${esc(className + ' general program')}, 1, ${dbClassCode.startsWith('P') ? parseInt(dbClassCode[1]) : dbClassCode.startsWith('J') ? parseInt(dbClassCode[3]) + 10 : parseInt(dbClassCode[3]) + 13})
    ON CONFLICT (education_level_id, code) DO NOTHING;`);
  lines.push(`INSERT INTO classes (program_id, name, code, order_index)
    SELECT p.id, ${esc(className + ' Class A')}, ${esc(dbClassCode + '-A')}, 1
    FROM programs p WHERE p.code = ${esc(dbClassCode + '-PGM')}
    ON CONFLICT (program_id, code) DO NOTHING;`);
  lines.push('');

  for (const [rawSubjectName, termData] of Object.entries(subjects)) {
    const subjectName = normalizeSubject(rawSubjectName);
    const subjectCode = getSubjectCode(subjectName);

    if (subjectFilter && !subjectFilter.includes(subjectCode)) continue;

    // Insert subject once
    if (!subjectCodes.has(subjectCode)) {
      subjectCodes.add(subjectCode);
      lines.push(`INSERT INTO subjects (education_system_id, name, code, description, is_core, order_index, is_active)
        VALUES ((SELECT id FROM education_systems WHERE code='NG-NCC'), ${esc(subjectName)}, ${esc(subjectCode)}, ${esc('NERDC curriculum for ' + subjectName)}, ${['MATH','ENG'].includes(subjectCode)}, ${subjectOrder++}, TRUE)
        ON CONFLICT (education_system_id, code) DO UPDATE SET name = EXCLUDED.name;`);
    }

    for (const [termKey, topics] of Object.entries(termData)) {
      if (!topics || !Array.isArray(topics)) continue;
      const termCode = TERM_KEY_MAP[termKey];
      const termLabel = termKey.charAt(0).toUpperCase() + termKey.slice(1);

      // Course
      const courseSlug = slugifySQL(`${dbClassCode}-${subjectCode}-${termKey}`);
      lines.push(`INSERT INTO courses (subject_id, class_id, term_id, title, slug, short_description, full_description, difficulty, status, is_free, is_featured, lesson_count, total_duration_hours)
        SELECT s.id, c.id, t.id, ${esc(`${classCode} ${subjectName} — ${termLabel} Term`)}, ${esc(courseSlug)}, ${esc(`Complete ${classCode} ${subjectName} curriculum for ${termLabel.toLowerCase()} term`)}, ${esc(`This course covers all topics in the ${classCode} ${subjectName} curriculum for the ${termLabel.toLowerCase()} term, aligned with NERDC 2025 standards.`)}, 'beginner', 'published', TRUE, FALSE, 0, 0
        FROM subjects s, classes c, terms t
        WHERE s.code=${esc(subjectCode)} AND c.code=${esc(dbClassCode + '-A')} AND t.code=${esc(termCode)}
        ON CONFLICT (slug) DO NOTHING;`);

      for (let idx = 0; idx < topics.length; idx++) {
        const topicName = topics[idx];
        if (!topicName) continue;
        const topicCode = `${subjectCode}_${termKey}_${idx.toString().padStart(2, '0')}`;

        const lesson = generateLessonContent(subjectName, classCode, topicName, termKey);
        const lessonSlug = slugifySQL(`${dbClassCode}-${subjectCode.toLowerCase()}-${slugify(topicName)}`);
        const objectives = JSON.stringify([
          `Understand the concept of ${topicName}`,
          `Identify key principles of ${topicName}`,
          `Apply knowledge of ${topicName} in practical contexts`,
          ...lesson.objectives,
        ]);

        // Topic
        lines.push(`INSERT INTO topics (subject_id, class_id, term_id, name, code, description, learning_objectives, order_index, estimated_hours, is_active)
          SELECT s.id, c.id, t.id, ${esc(topicName)}, ${esc(topicCode)}, ${esc(`NERDC ${classCode} ${subjectName}: ${topicName}`)}, ${esc(objectives)}, ${idx}, 2, TRUE
          FROM subjects s, classes c, terms t
          WHERE s.code=${esc(subjectCode)} AND c.code=${esc(dbClassCode + '-A')} AND t.code=${esc(termCode)}
          ON CONFLICT (subject_id, class_id, term_id, code) DO UPDATE SET name = EXCLUDED.name;`);
        topicCount++;

        // Lesson
        lines.push(`INSERT INTO lessons (course_id, topic_id, title, slug, description, learning_objectives, content_type, written_content, key_points, order_index, is_free, is_published, estimated_minutes)
          SELECT co.id, tp.id, ${esc(`${classCode} ${subjectName}: ${topicName}`)}, ${esc(lessonSlug)}, ${esc(lesson.content.substring(0, 200))}, ${esc(JSON.stringify(lesson.objectives))}, 'text', ${esc(lesson.content)}, ${esc(JSON.stringify(lesson.keyPoints))}, ${idx}, TRUE, TRUE, ${lesson.estimatedMinutes || 30}
          FROM courses co, topics tp
          WHERE co.slug=${esc(courseSlug)} AND tp.code=${esc(topicCode)}
          ON CONFLICT (course_id, slug) DO NOTHING;`);
        lessonCount++;

        // Questions
        const questions = generateQuestions(subjectName, topicName, classCode);
        for (const q of questions) {
          lines.push(`INSERT INTO questions (subject_id, topic_id, class_id, question_type, question_text, options, correct_answer, explanation, difficulty, marks, source, is_active)
            SELECT s.id, tp.id, c.id, 'mcq', ${esc(q.q)}, ${esc(q.opts)}, ${esc(q.answer)}, ${esc(q.explanation)}, ${esc(q.difficulty)}, 1, 'NERDC_GENERATED', TRUE
            FROM subjects s, topics tp, classes c
            WHERE s.code=${esc(subjectCode)} AND tp.code=${esc(topicCode)} AND c.code=${esc(dbClassCode + '-A')};`);
          qCount++;
        }

        // Flashcard
        const cards = generateFlashcards(subjectName, topicName, classCode);
        lines.push(`INSERT INTO flashcards (subject_id, topic_id, title, description, cards, mode, is_public, view_count, usage_count)
          SELECT s.id, tp.id, ${esc(`${classCode} ${subjectName}: ${topicName}`)}, ${esc(`Flashcards for ${topicName}`)}, ${esc(cards)}, 'study', TRUE, 0, 0
          FROM subjects s, topics tp
          WHERE s.code=${esc(subjectCode)} AND tp.code=${esc(topicCode)};`);
        fcCount++;
      }
    }
  }
  console.log(`  ${classCode} done (topics so far: ${topicCount.toLocaleString()})`);
}

lines.push('');
lines.push('COMMIT;');
lines.push('');

// Write output
const outDir = join(__dirname, 'output');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, classFilter ? `curriculum_content_${classFilter.join('_')}.sql` : 'curriculum_content.sql');
writeFileSync(outFile, lines.join('\n'), 'utf8');

console.log('\n═══════════════════════════════════════════════════');
console.log('  SQL DUMP GENERATED');
console.log('═══════════════════════════════════════════════════');
console.log(`  Output file: ${outFile}`);
console.log(`  File size:   ${(Buffer.byteLength(lines.join('\n'), 'utf8') / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Topics:      ${topicCount.toLocaleString()}`);
console.log(`  Lessons:     ${lessonCount.toLocaleString()}`);
console.log(`  Questions:   ${qCount.toLocaleString()}`);
console.log(`  Flashcards:  ${fcCount.toLocaleString()}`);
console.log('═══════════════════════════════════════════════════');
console.log('\nTo import:');
console.log('  psql "$DATABASE_URL" -f ' + outFile.replace(/\\/g, '/'));
