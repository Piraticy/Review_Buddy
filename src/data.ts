export type Role = 'student' | 'admin';
export type Plan = 'free' | 'trial' | 'elite';
export type Stage = 'kindergarten' | 'primary' | 'teen';
export type QuizMode = 'solo' | 'group';
export type QuestionArt = 'apple' | 'balloon' | 'leaf' | 'fish' | 'star';

export type ThemePalette = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  ink: string;
};

export type CountryProfile = {
  code: string;
  name: string;
  continent: string;
  capital: string;
  curriculum: string;
  curriculumFocus: string;
  description: string;
  palette: ThemePalette;
  subjects: Record<Stage, string[]>;
};

export type LearnerProfile = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  countryCode: string;
  plan: Plan;
  stage: Stage;
  level: string;
  mode: QuizMode;
  subject: string;
};

export type QuestionVisual = {
  emoji?: string;
  label: string;
  accent: string;
  soundText?: string;
  art?: QuestionArt;
};

export type Question = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
  skill: string;
  helperText?: string;
  visual?: QuestionVisual;
  interaction?: 'choices' | 'coloring';
};

export type QuizResult = {
  score: number;
  total: number;
  percent: number;
  passed: boolean;
};

export type LeaderboardEntry = {
  name: string;
  countryCode: string;
  score: number;
  plan: Plan;
};

export type AdminSession = {
  learner: string;
  subject: string;
  status: string;
  plan: string;
  support: string;
};

export type AdminAlert = {
  title: string;
  detail: string;
};

export type AdminSubjectInsight = {
  subject: string;
  learners: number;
  averageScore: number;
  trend: string;
};

export type AdminPlanMix = {
  label: string;
  count: number;
  detail: string;
};

export type SubjectMeta = {
  icon: string;
  title: string;
  detail: string;
};

type PromptTuple = [string, string, string[], string];

const KINDERGARTEN_SUBJECTS = ['Colouring', 'Alphabet', 'Numbers', 'Picture Puzzle'];
const PRIMARY_SUBJECTS = ['Mathematics', 'General Studies', 'Communication Skills', 'History'];
const TEEN_SUBJECTS = [
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'History',
  'General Studies',
  'Communication Skills',
];

export const MOTTO = 'Learn, practise, and grow after school.';

export const SUBJECT_META: Record<string, SubjectMeta> = {
  Colouring: {
    icon: '🎨',
    title: 'Colouring',
    detail: 'Paint a picture with the right colour.',
  },
  Alphabet: {
    icon: '🔤',
    title: 'Alphabet',
    detail: 'Letters with spoken prompts and easy recognition.',
  },
  Numbers: {
    icon: '🔢',
    title: 'Numbers',
    detail: 'Friendly number play with sound and counting.',
  },
  'Picture Puzzle': {
    icon: '🧩',
    title: 'Picture Puzzle',
    detail: 'Identify animals, people, and everyday objects.',
  },
  Biology: {
    icon: '🧬',
    title: 'Biology',
    detail: 'Living things, the body, and nature.',
  },
  Chemistry: {
    icon: '🧪',
    title: 'Chemistry',
    detail: 'Matter, reactions, and simple formulas.',
  },
  Physics: {
    icon: '⚡',
    title: 'Physics',
    detail: 'Forces, energy, and motion.',
  },
  Mathematics: {
    icon: '➗',
    title: 'Mathematics',
    detail: 'Numbers, patterns, and problem-solving.',
  },
  History: {
    icon: '📜',
    title: 'History',
    detail: 'People, events, and timelines from the past.',
  },
  'General Studies': {
    icon: '🌍',
    title: 'General Studies',
    detail: 'Everyday knowledge, places, and communities.',
  },
  'Communication Skills': {
    icon: '💬',
    title: 'Communication Skills',
    detail: 'Reading, writing, listening, and speaking.',
  },
};

export const COUNTRIES: CountryProfile[] = [
  {
    code: 'KE',
    name: 'Kenya',
    continent: 'Africa',
    capital: 'Nairobi',
    curriculum: 'CBC',
    curriculumFocus: 'competency-based learning and practical problem solving',
    description: 'Competency-based learning support for young and growing learners.',
    palette: {
      primary: '#0f766e',
      secondary: '#facc15',
      accent: '#ef4444',
      surface: '#f0fdfa',
      ink: '#0f172a',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    continent: 'Africa',
    capital: 'Dodoma',
    curriculum: 'NECTA-aligned',
    curriculumFocus: 'foundational literacy, numeracy, and structured assessment',
    description: 'Clear revision routes for school learning and after-school practice.',
    palette: {
      primary: '#0f766e',
      secondary: '#22c55e',
      accent: '#2563eb',
      surface: '#ecfeff',
      ink: '#082f49',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    continent: 'Asia',
    capital: 'Abu Dhabi',
    curriculum: 'MOE / International blend',
    curriculumFocus: 'global learning, bilingual readiness, and STEM pathways',
    description: 'Friendly learning flows with broad subject choice and simple practice paths.',
    palette: {
      primary: '#111827',
      secondary: '#ef4444',
      accent: '#10b981',
      surface: '#f8fafc',
      ink: '#0f172a',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    continent: 'Europe',
    capital: 'London',
    curriculum: 'National Curriculum',
    curriculumFocus: 'subject knowledge, reading fluency, and analytical thinking',
    description: 'Balanced practice for literacy, numeracy, sciences, and humanities.',
    palette: {
      primary: '#1d4ed8',
      secondary: '#ef4444',
      accent: '#f59e0b',
      surface: '#eff6ff',
      ink: '#172554',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'US',
    name: 'United States',
    continent: 'North America',
    capital: 'Washington, D.C.',
    curriculum: 'Common Core-inspired',
    curriculumFocus: 'standards-based literacy, numeracy, and critical thinking',
    description: 'Easy-to-start review for school support, homework help, and revision.',
    palette: {
      primary: '#1d4ed8',
      secondary: '#dc2626',
      accent: '#06b6d4',
      surface: '#eff6ff',
      ink: '#111827',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'IN',
    name: 'India',
    continent: 'Asia',
    capital: 'New Delhi',
    curriculum: 'CBSE / State board blend',
    curriculumFocus: 'concept mastery, exam readiness, and applied reasoning',
    description: 'Flexible subject practice for daily learning and exam revision.',
    palette: {
      primary: '#ea580c',
      secondary: '#16a34a',
      accent: '#2563eb',
      surface: '#fff7ed',
      ink: '#431407',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
];

const LEVELS: Record<Stage, string[]> = {
  kindergarten: ['Baby Class', 'Middle Class', 'Top Class'],
  primary: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  teen: ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'],
};

const BASE_LEADERBOARD: Record<string, LeaderboardEntry[]> = {
  Mathematics: [
    { name: 'Amina K.', countryCode: 'KE', score: 97, plan: 'elite' },
    { name: 'Ryan P.', countryCode: 'US', score: 95, plan: 'trial' },
    { name: 'Noor H.', countryCode: 'AE', score: 92, plan: 'elite' },
  ],
  Biology: [
    { name: 'Mia T.', countryCode: 'GB', score: 96, plan: 'elite' },
    { name: 'Ritu S.', countryCode: 'IN', score: 93, plan: 'trial' },
    { name: 'Baraka N.', countryCode: 'TZ', score: 91, plan: 'free' },
  ],
  History: [
    { name: 'Liam P.', countryCode: 'US', score: 93, plan: 'elite' },
    { name: 'Mercy A.', countryCode: 'KE', score: 90, plan: 'trial' },
    { name: 'Noel J.', countryCode: 'GB', score: 88, plan: 'free' },
  ],
  Colouring: [
    { name: 'Little Joy', countryCode: 'TZ', score: 100, plan: 'trial' },
    { name: 'Tobi K.', countryCode: 'KE', score: 100, plan: 'elite' },
    { name: 'Ari S.', countryCode: 'US', score: 100, plan: 'free' },
  ],
};

export function getCountryByCode(code: string) {
  return COUNTRIES.find((country) => country.code === code) ?? COUNTRIES[0];
}

export function getLevelOptions(stage: Stage) {
  return LEVELS[stage];
}

export function getStageLabel(stage: Stage) {
  if (stage === 'kindergarten') return 'Little learners';
  if (stage === 'primary') return 'Growing learners';
  return 'Teen learners';
}

export function inferCountryCode() {
  if (typeof navigator === 'undefined') {
    return COUNTRIES[0].code;
  }

  const locale = navigator.language;
  const parts = locale.split('-');
  const region = parts[1]?.toUpperCase();

  if (region && COUNTRIES.some((country) => country.code === region)) {
    return region;
  }

  return COUNTRIES[0].code;
}

export function getAvailableSubjects(countryCode: string, stage: Stage, plan: Plan) {
  const country = getCountryByCode(countryCode);
  const allSubjects = country.subjects[stage];

  if (plan === 'free') {
    return stage === 'kindergarten' ? allSubjects.slice(0, 2) : allSubjects.slice(0, 4);
  }

  if (plan === 'trial') {
    return stage === 'kindergarten' ? allSubjects.slice(0, 3) : allSubjects.slice(0, 6);
  }

  return allSubjects;
}

export function getQuestionCount(plan: Plan, stage: Stage) {
  if (plan === 'free') return stage === 'kindergarten' ? 4 : 5;
  if (plan === 'trial') return stage === 'kindergarten' ? 5 : 6;
  return stage === 'kindergarten' ? 6 : 8;
}

export function getSubjectMeta(subject: string) {
  return SUBJECT_META[subject] ?? { icon: '📚', title: subject, detail: 'Topic practice' };
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function takeUnique<T>(items: T[], count: number) {
  return shuffle(items).slice(0, count);
}

function uniqueChoices(answer: string, pool: string[], count = 4) {
  const distractors = takeUnique(
    pool.filter((item) => item !== answer),
    Math.max(0, count - 1),
  );

  return shuffle([answer, ...distractors]);
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildKindergartenSession(subject: string, level: string, total: number, nonce: string) {
  const colouringItems = [
    { art: 'apple' as const, label: 'apple', answer: 'Red', accent: '#fee2e2' },
    { art: 'balloon' as const, label: 'balloon', answer: 'Yellow', accent: '#fef3c7' },
    { art: 'leaf' as const, label: 'leaf', answer: 'Green', accent: '#dcfce7' },
    { art: 'fish' as const, label: 'fish', answer: 'Blue', accent: '#dbeafe' },
    { art: 'star' as const, label: 'star', answer: 'Yellow', accent: '#fef9c3' },
  ];
  const alphabetItems = [
    { emoji: 'A', label: 'Letter A', answer: 'A', soundText: 'Letter A. A says ah.', accent: '#ede9fe' },
    { emoji: 'B', label: 'Letter B', answer: 'B', soundText: 'Letter B. B says buh.', accent: '#fee2e2' },
    { emoji: 'C', label: 'Letter C', answer: 'C', soundText: 'Letter C. C says kuh.', accent: '#dbeafe' },
    { emoji: 'D', label: 'Letter D', answer: 'D', soundText: 'Letter D. D says duh.', accent: '#dcfce7' },
    { emoji: 'E', label: 'Letter E', answer: 'E', soundText: 'Letter E. E says eh.', accent: '#fef3c7' },
    { emoji: 'F', label: 'Letter F', answer: 'F', soundText: 'Letter F. F says fuh.', accent: '#fae8ff' },
  ];
  const numberItems = [
    { emoji: '1', label: 'Number 1', answer: '1', soundText: 'Number 1. One.', accent: '#fee2e2' },
    { emoji: '2', label: 'Number 2', answer: '2', soundText: 'Number 2. Two.', accent: '#fef3c7' },
    { emoji: '3', label: 'Number 3', answer: '3', soundText: 'Number 3. Three.', accent: '#dcfce7' },
    { emoji: '4', label: 'Number 4', answer: '4', soundText: 'Number 4. Four.', accent: '#dbeafe' },
    { emoji: '5', label: 'Number 5', answer: '5', soundText: 'Number 5. Five.', accent: '#ede9fe' },
    { emoji: '6', label: 'Number 6', answer: '6', soundText: 'Number 6. Six.', accent: '#fae8ff' },
  ];
  const pictureItems = [
    { emoji: '🦁', label: 'lion', answer: 'Lion', accent: '#fee2e2' },
    { emoji: '🐘', label: 'elephant', answer: 'Elephant', accent: '#dbeafe' },
    { emoji: '👩‍🏫', label: 'teacher', answer: 'Teacher', accent: '#fef3c7' },
    { emoji: '🚌', label: 'bus', answer: 'Bus', accent: '#dcfce7' },
    { emoji: '🍌', label: 'banana', answer: 'Banana', accent: '#fef9c3' },
    { emoji: '⚽', label: 'ball', answer: 'Ball', accent: '#ede9fe' },
  ];

  if (subject === 'Colouring') {
    return takeUnique(colouringItems, total).map((item, index) => ({
      id: `${nonce}-kg-colour-${index}`,
      prompt: `${level}: Colour the ${item.label}.`,
      choices: ['Red', 'Blue', 'Green', 'Yellow'],
      answer: item.answer,
      explanation: `${item.answer} matches the ${item.label} very well.`,
      skill: 'Colouring play',
      helperText: 'Pick a colour below and watch the picture fill in.',
      interaction: 'coloring' as const,
      visual: {
        label: item.label,
        accent: item.accent,
        art: item.art,
      },
    }));
  }

  if (subject === 'Alphabet') {
    return takeUnique(alphabetItems, total).map((item, index) => ({
      id: `${nonce}-kg-alpha-${index}`,
      prompt: `${level}: Which letter do you see?`,
      choices: uniqueChoices(item.answer, alphabetItems.map((entry) => entry.answer)),
      answer: item.answer,
      explanation: `That is the letter ${item.answer}.`,
      skill: 'Letter recognition',
      helperText: 'Tap Hear it to listen to the letter sound.',
      visual: {
        emoji: item.emoji,
        label: item.label,
        accent: item.accent,
        soundText: item.soundText,
      },
    }));
  }

  if (subject === 'Numbers') {
    return takeUnique(numberItems, total).map((item, index) => ({
      id: `${nonce}-kg-number-${index}`,
      prompt: `${level}: Which number do you see?`,
      choices: uniqueChoices(item.answer, numberItems.map((entry) => entry.answer)),
      answer: item.answer,
      explanation: `That is the number ${item.answer}.`,
      skill: 'Number recognition',
      helperText: 'Tap Hear it to listen to the number being spoken.',
      visual: {
        emoji: item.emoji,
        label: item.label,
        accent: item.accent,
        soundText: item.soundText,
      },
    }));
  }

  return takeUnique(pictureItems, total).map((item, index) => ({
    id: `${nonce}-kg-picture-${index}`,
    prompt: `${level}: Who or what is this picture?`,
    choices: uniqueChoices(item.answer, pictureItems.map((entry) => entry.answer)),
    answer: item.answer,
    explanation: `This picture shows a ${item.answer.toLowerCase()}.`,
    skill: 'Picture recognition',
    helperText: 'Look carefully at the picture before you answer.',
    visual: {
      emoji: item.emoji,
      label: item.label,
      accent: item.accent,
      soundText: `This is a ${item.answer.toLowerCase()}.`,
    },
  }));
}

function buildPrimarySession(subject: string, country: CountryProfile, total: number, nonce: string) {
  const prompts: Record<string, Question[]> = {
    Mathematics: Array.from({ length: total }, (_, index) => {
      const left = randomInt(12, 48);
      const right = randomInt(2, 9);
      const answer = String(left + right);

      return {
        id: `${nonce}-primary-math-${index}`,
        prompt:
          index % 2 === 0
            ? `A class in ${country.capital} is counting ${left} books and ${right} more are added. How many books are there now?`
            : `What is ${left} + ${right}?`,
        choices: uniqueChoices(answer, [
          answer,
          String(left + right + 2),
          String(left + right - 1),
          String(left + right + 4),
          String(left + right - 3),
        ]),
        answer,
        explanation: `${left} plus ${right} equals ${answer}.`,
        skill: 'Addition fluency',
      };
    }),
    'General Studies': ([
      ['Which tool helps us find places on Earth?', 'Map', ['Bell', 'Brush', 'Desk'], 'Places'],
      [`Which curriculum is common in ${country.name}?`, country.curriculum, ['Sports list', 'Cinema guide', 'Dance list'], 'School systems'],
      [`${country.name} is in which continent?`, country.continent, ['Europe', 'South America', 'Australia'], 'Continent awareness'],
      [`What is the capital city of ${country.name}?`, country.capital, ['Kampala', 'Cairo', 'Lusaka'], 'Country knowledge'],
      ['Why do people need clean water?', 'To stay healthy', ['To break toys', 'To stop reading', 'To change colours'], 'Daily life'],
      ['Which place helps people learn every day?', 'School', ['Garage', 'Forest only', 'Boat'], 'Community'],
      ['Why do we plant trees?', 'To help the environment', ['To hide roads', 'To remove shade', 'To stop birds'], 'Care for nature'],
      ['Which object tells time?', 'Clock', ['Broom', 'Plate', 'Pillow'], 'Everyday objects'],
    ] satisfies PromptTuple[]).slice(0, total).map(([prompt, answer, distractors, skill], index) => ({
      id: `${nonce}-primary-general-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the best answer here.`,
      skill,
    })),
    'Communication Skills': ([
      ['Choose the correct greeting for the morning.', 'Good morning', ['Good night', 'Goodbye', 'Well done'], 'Speaking kindly'],
      [`In ${country.name}, learners often practise ${country.curriculumFocus}. Which habit helps communication the most?`, 'Listening first', ['Talking over others', 'Ignoring questions', 'Leaving the room'], 'Listening'],
      ['Which word is spelled correctly?', 'friend', ['freind', 'frend', 'friand'], 'Spelling'],
      ['Which sentence sounds polite?', 'Please may I join?', ['Move now', 'Give me that', 'I will not listen'], 'Polite speech'],
      ['Which word is a noun?', 'teacher', ['quickly', 'happy', 'bright'], 'Word types'],
      ['Which sentence is complete?', 'The class is reading.', ['The class', 'Reading quickly', 'On the desk'], 'Sentence building'],
    ] satisfies PromptTuple[]).slice(0, total).map(([prompt, answer, distractors, skill], index) => ({
      id: `${nonce}-primary-comm-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is correct.`,
      skill,
    })),
    History: ([
      ['What does a timeline help us do?', 'Put events in order', ['Measure rain', 'Draw triangles', 'Mix colours'], 'Timeline use'],
      [`A learner in ${country.capital} is studying ${country.curriculum}. Why do they learn local history?`, 'To understand their community and country', ['To skip lessons', 'To avoid reading', 'To forget the past'], 'Local history'],
      ['Why do we learn about heroes from the past?', 'To understand important events', ['To stop reading', 'To avoid books', 'To skip class'], 'Learning from history'],
      ['Which word means something that happened long ago?', 'Past', ['Future', 'Today only', 'Soon'], 'Time words'],
      ['Old buildings can teach us about:', 'How people lived before', ['Only sports', 'Just weather', 'Only traffic'], 'Local history'],
      ['A story from long ago is part of our:', 'History', ['Lunch', 'Homework only', 'Colouring'], 'History meaning'],
      ['A museum helps keep:', 'Important objects and stories', ['Broken pencils only', 'Rain clouds', 'Traffic lights'], 'Museums'],
    ] satisfies PromptTuple[]).slice(0, total).map(([prompt, answer, distractors, skill], index) => ({
      id: `${nonce}-primary-history-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct answer.`,
      skill,
    })),
  };

  return prompts[subject] ?? prompts.Mathematics;
}

function buildTeenSession(subject: string, country: CountryProfile, total: number, nonce: string) {
  const prompts: Record<string, Question[]> = {
    Biology: ([
      [`In ${country.name}, science learners study living things through ${country.curriculumFocus}. What is the basic unit of life?`, 'Cell', ['Atom', 'Tissue', 'Planet'], 'Cells'],
      ['Which organ pumps blood around the body?', 'Heart', ['Liver', 'Skin', 'Lung'], 'Body systems'],
      ['Plants make food through:', 'Photosynthesis', ['Evaporation', 'Condensation', 'Fermentation'], 'Plant processes'],
      ['Which part of a plant absorbs water?', 'Roots', ['Leaf', 'Petal', 'Fruit'], 'Plant structure'],
      ['Which nutrient helps build muscles?', 'Protein', ['Water only', 'Air', 'Light'], 'Nutrition'],
      ['Which system helps us breathe?', 'Respiratory system', ['Solar system', 'Digestive system', 'Transport system'], 'Human systems'],
      ['A habitat is:', 'The natural home of an organism', ['A type of exam', 'A music sheet', 'A drawing tool'], 'Habitats'],
      ['Which blood cells help fight infection?', 'White blood cells', ['Red blood cells', 'Skin cells', 'Bone cells'], 'Immunity'],
    ] satisfies PromptTuple[]).slice(0, total).map(([prompt, answer, distractors, skill], index) => ({
      id: `${nonce}-teen-biology-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct answer.`,
      skill,
    })),
    Chemistry: ([
      [`Students in ${country.capital} are revising chemistry. What is the chemical formula for water?`, 'H2O', ['CO2', 'NaCl', 'O2'], 'Formulas'],
      ['A substance with pH 2 is:', 'Acidic', ['Neutral', 'Basic', 'Metallic'], 'Acids and bases'],
      ['When a solid melts, its particles:', 'Move more freely', ['Disappear', 'Stop moving', 'Become louder'], 'States of matter'],
      ['Which gas do plants use in photosynthesis?', 'Carbon dioxide', ['Helium', 'Hydrogen', 'Nitrogen only'], 'Gases'],
      ['A pure substance made of one type of atom is an:', 'Element', ['Mixture', 'Solution', 'Device'], 'Elements'],
      ['Which piece of equipment measures liquid volume?', 'Measuring cylinder', ['Magnet', 'Balance beam', 'Thermometer only'], 'Lab equipment'],
      ['Boiling changes a liquid into a:', 'Gas', ['Rock', 'Solid only', 'Colour'], 'Heating'],
      ['Salt dissolved in water makes a:', 'Solution', ['Metal', 'Flame', 'Planet'], 'Solutions'],
    ] satisfies PromptTuple[]).slice(0, total).map(([prompt, answer, distractors, skill], index) => ({
      id: `${nonce}-teen-chemistry-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct answer.`,
      skill,
    })),
    Physics: ([
      [`A physics learner in ${country.name} asks: which force pulls objects toward Earth?`, 'Gravity', ['Magnetism', 'Friction', 'Heat'], 'Forces'],
      ['The unit of electric current is:', 'Ampere', ['Meter', 'Kelvin', 'Newton'], 'Units'],
      ['When speed changes over time, the object is:', 'Accelerating', ['Sleeping', 'Freezing', 'Condensing'], 'Motion'],
      ['Sound travels fastest through:', 'Solids', ['Vacuum', 'Clouds', 'Shadows'], 'Sound'],
      ['Energy stored in a stretched rubber band is:', 'Elastic potential energy', ['Nuclear energy', 'Wind energy', 'Thermal energy'], 'Energy'],
      ['A mirror that curves inward is:', 'Concave', ['Convex', 'Flat only', 'Transparent'], 'Light'],
      ['Voltage is measured in:', 'Volts', ['Watts', 'Newtons', 'Meters'], 'Electricity'],
      ['Friction usually acts to:', 'Slow motion down', ['Speed everything up', 'Change water to fire', 'Create clouds'], 'Forces'],
    ] satisfies PromptTuple[]).slice(0, total).map(([prompt, answer, distractors, skill], index) => ({
      id: `${nonce}-teen-physics-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct answer.`,
      skill,
    })),
    Mathematics: Array.from({ length: total }, (_, index) => {
      const x = randomInt(2, 8);
      const answer = String(3 * x + 4);
      return {
        id: `${nonce}-teen-math-${index}`,
        prompt:
          index % 2 === 0
            ? `A learner in ${country.capital} is revising algebra. If y = 3x + 4 and x = ${x}, what is y?`
            : `If y = 3x + 4 and x = ${x}, what is y?`,
        choices: uniqueChoices(answer, [
          answer,
          String(x + 4),
          String(3 * x),
          String(2 * x + 4),
          String(3 * x + 2),
        ]),
        answer,
        explanation: `Substitute x with ${x}: 3(${x}) + 4 = ${answer}.`,
        skill: 'Algebra',
      };
    }),
    History: ([
      ['Why do historians compare many sources?', 'To check accuracy and bias', ['To shorten essays', 'To remove facts', 'To avoid evidence'], 'Historical thinking'],
      [`A history class in ${country.name} is studying national and world events. Why is local history important?`, 'It connects learners to their country and community', ['It removes context', 'It replaces evidence', 'It stops comparison'], 'Country context'],
      ['A timeline is most useful for:', 'Placing events in order', ['Mixing chemicals', 'Measuring speed', 'Drawing circles'], 'Chronology'],
      [`Which curriculum does Review Buddy show for ${country.name}?`, country.curriculum, ['No curriculum', 'Film script', 'Holiday list'], 'School systems'],
      ['Primary sources are valuable because they come from:', 'The time being studied', ['A future date', 'Only fiction books', 'Advertisements'], 'Sources'],
      ['Archaeologists study:', 'Objects from the past', ['Only weather', 'Future transport', 'Just paintings'], 'Evidence'],
      ['An important reason to learn history is to:', 'Understand change over time', ['Stop asking questions', 'Avoid reading', 'Forget earlier events'], 'Change over time'],
      ['A speech made during an event is an example of:', 'A primary source', ['A myth only', 'A timetable', 'A machine'], 'Source types'],
      ['What can history teach us?', 'How people lived and made decisions', ['Only sport scores', 'Only colour names', 'Nothing useful'], 'Life lessons'],
    ] satisfies PromptTuple[]).slice(0, total).map(([prompt, answer, distractors, skill], index) => ({
      id: `${nonce}-teen-history-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct answer.`,
      skill,
    })),
    'General Studies': ([
      ['Which action helps a community stay healthy?', 'Keeping water clean', ['Throwing litter anywhere', 'Ignoring waste', 'Breaking taps'], 'Community care'],
      [`${country.name} is in which continent?`, country.continent, ['Europe', 'South America', 'Australia'], 'Continents'],
      [`What is the capital city of ${country.name}?`, country.capital, ['Kampala', 'Cairo', 'Lusaka'], 'Country capitals'],
      ['A map is used to:', 'Show places and direction', ['Measure temperature', 'Write music', 'Mix paint'], 'Maps'],
      ['Why do countries have rules and leaders?', 'To help people live together well', ['To remove schools', 'To stop teamwork', 'To hide roads'], 'Citizenship'],
      ['Which source gives current information quickly?', 'News report', ['Old stone only', 'Empty notebook', 'Broken ruler'], 'Information sources'],
      ['Recycling helps because it:', 'Reduces waste', ['Stops learning', 'Creates smoke only', 'Uses more rubbish'], 'Environment'],
      ['A budget helps you:', 'Plan money use', ['Draw only maps', 'Grow plants', 'Measure light'], 'Money skills'],
      ['Which place helps people borrow books?', 'Library', ['Stadium', 'Garage', 'Factory'], 'Public services'],
      ['Good digital behaviour includes:', 'Respecting privacy online', ['Sharing every password', 'Posting hurtful messages', 'Ignoring safety'], 'Digital citizenship'],
    ] satisfies PromptTuple[]).slice(0, total).map(([prompt, answer, distractors, skill], index) => ({
      id: `${nonce}-teen-general-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct answer.`,
      skill,
    })),
    'Communication Skills': ([
      [`Learners in ${country.name} often practise ${country.curriculumFocus}. What is the main purpose of a thesis statement?`, 'To present the main idea', ['To count pages', 'To repeat the title only', 'To avoid structure'], 'Writing'],
      ['Which sentence uses correct punctuation?', 'After class, we revised our notes.', ['After class we revised our notes', 'After class; we revised our notes,', 'After class we revised our notes?'], 'Punctuation'],
      ['Which word best matches "analyse"?', 'Examine carefully', ['Forget quickly', 'Decorate brightly', 'Repeat loudly'], 'Vocabulary'],
      ['A good listener usually:', 'Pays attention and asks clear questions', ['Interrupts all the time', 'Looks away always', 'Ignores the speaker'], 'Listening'],
      ['Which sentence is in the past tense?', 'We completed the task yesterday.', ['We complete the task tomorrow.', 'We are complete.', 'We will yesterday.'], 'Tense'],
      ['A summary should:', 'Keep the main points only', ['Add random ideas', 'Be longer than the text', 'Ignore the topic'], 'Summarising'],
      ['When presenting to others, it helps to:', 'Speak clearly and confidently', ['Hide the main point', 'Mumble quickly', 'Avoid eye contact always'], 'Presenting'],
      ['Which word connects two ideas in a sentence?', 'Conjunction', ['Noun', 'Number', 'Map'], 'Grammar'],
    ] satisfies PromptTuple[]).slice(0, total).map(([prompt, answer, distractors, skill], index) => ({
      id: `${nonce}-teen-communication-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct answer.`,
      skill,
    })),
  };

  return prompts[subject] ?? prompts.Mathematics;
}

export function generateQuestions(profile: LearnerProfile) {
  const country = getCountryByCode(profile.countryCode);
  const total = getQuestionCount(profile.plan, profile.stage);
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  if (profile.stage === 'kindergarten') {
    return buildKindergartenSession(profile.subject, profile.level, total, nonce);
  }

  if (profile.stage === 'primary') {
    return buildPrimarySession(profile.subject, country, total, nonce);
  }

  return buildTeenSession(profile.subject, country, total, nonce);
}

export function scoreQuiz(questions: Question[], answers: Record<string, string>): QuizResult {
  const score = questions.reduce((total, question) => total + Number(answers[question.id] === question.answer), 0);
  const percent = Math.round((score / questions.length) * 100);

  return {
    score,
    total: questions.length,
    percent,
    passed: percent >= 60,
  };
}

export function getLeaderboard(subject: string, profile?: LearnerProfile, result?: QuizResult) {
  const existing = BASE_LEADERBOARD[subject] ?? BASE_LEADERBOARD.Mathematics;
  const leaderboard = [...existing];

  if (profile && result) {
    leaderboard.push({
      name: profile.fullName || 'New Learner',
      countryCode: profile.countryCode,
      score: result.percent,
      plan: profile.plan,
    });
  }

  return leaderboard.sort((left, right) => right.score - left.score).slice(0, 5);
}

export function getPlanLabel(plan: Plan) {
  if (plan === 'free') return 'Free';
  if (plan === 'trial') return 'Elite Trial';
  return 'Elite';
}

export function getPlanDetails(plan: Plan) {
  if (plan === 'free') {
    return {
      badge: 'Starter plan',
      description: 'A few subjects, fewer questions, and score tracking for daily practice.',
    };
  }

  if (plan === 'trial') {
    return {
      badge: '5-day Elite trial',
      description: 'A full preview of the richer Elite learning experience for five days.',
    };
  }

  return {
    badge: 'Elite access',
    description: 'Full subject access, more questions, and deeper review support.',
  };
}

export function getAdminMetrics(countryCode: string) {
  const country = getCountryByCode(countryCode);

  return {
    activeLearners: 1284,
    liveSessions: 312,
    averageScore: 81,
    trialUsers: 146,
    familiesWaiting: 23,
    weeklyGrowth: 14,
    country,
    liveActivity: [
      { learner: 'Asha M.', subject: 'Mathematics', status: 'Working now', plan: 'Elite', support: 'On track' },
      { learner: 'Noah R.', subject: 'History', status: 'Finished', plan: 'Free', support: 'Review tomorrow' },
      { learner: 'Little Star', subject: 'Colouring', status: 'Playing', plan: 'Trial', support: 'Needs a parent check-in' },
      { learner: 'Zuri T.', subject: 'Communication Skills', status: 'Reading', plan: 'Elite', support: 'Strong progress' },
    ] satisfies AdminSession[],
    supportQueue: [
      {
        title: 'Trial families to follow up',
        detail: `23 families in ${country.name} are close to the end of their 5-day trial.`,
      },
      {
        title: 'Learners needing encouragement',
        detail: '12 learners scored below 50% twice this week and may need simpler revision.',
      },
      {
        title: 'Most requested help topic',
        detail: `${country.curriculum} learners are asking for extra help in Mathematics and Communication Skills.`,
      },
    ] satisfies AdminAlert[],
    subjectInsights: [
      { subject: 'Mathematics', learners: 428, averageScore: 84, trend: 'Up this week' },
      { subject: 'Communication Skills', learners: 316, averageScore: 79, trend: 'Steady' },
      { subject: 'Biology', learners: 204, averageScore: 82, trend: 'More teen activity' },
    ] satisfies AdminSubjectInsight[],
    planMix: [
      { label: 'Free learners', count: 612, detail: 'Daily practice with starter access' },
      { label: 'Trial learners', count: 146, detail: 'Exploring the full experience' },
      { label: 'Elite learners', count: 526, detail: 'Using the full learning library' },
    ] satisfies AdminPlanMix[],
  };
}
