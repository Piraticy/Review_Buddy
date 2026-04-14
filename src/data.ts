export type Role = 'student' | 'admin' | 'staff';
export type Plan = 'free' | 'trial' | 'elite';
export type Stage = 'kindergarten' | 'primary' | 'teen';
export type QuizMode = 'solo' | 'group';
export type QuestionArt = 'apple' | 'balloon' | 'leaf' | 'fish' | 'star';
export type LearnerGender = 'boy' | 'girl';

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
  gender: LearnerGender;
  avatarMode: 'generated' | 'upload';
  avatarEmoji: string;
  avatarImage?: string;
  countryCode: string;
  plan: Plan;
  stage: Stage;
  level: string;
  mode: QuizMode;
  subject: string;
};

export type RegisteredUser = LearnerProfile & {
  id: string;
  username: string;
  createdAt: string;
  lastLoginAt?: string;
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
  staff: string;
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

export type AdminCountryRegistration = {
  code: string;
  learners: number;
  families: number;
  staffLead: string;
};

export type AdminStaffMember = {
  id?: string;
  name: string;
  role: string;
  focus: string;
  status: string;
  countryCode?: string;
};

export type StaffMaterialCategory = 'reading' | 'quiz' | 'exam';
export type StaffMaterialResourceType = 'text' | 'document' | 'video' | 'question-bank';

export type StaffQuestionItem = {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  answerIndex: number;
  explanation: string;
};

export type StaffMaterial = {
  id: string;
  title: string;
  summary: string;
  body: string;
  countryCode: string;
  stage: Stage;
  level: string;
  subject: string;
  category: StaffMaterialCategory;
  resourceType: StaffMaterialResourceType;
  attachmentName?: string;
  attachmentData?: string;
  videoUrl?: string;
  questionLimit?: number;
  questions?: StaffQuestionItem[];
  uploadedBy: string;
  createdAt: string;
  updatedAt?: string;
};

export type FeedbackQuestionKey = 'ease' | 'clarity' | 'look' | 'speed' | 'confidence';

export type FeedbackEntry = {
  id: string;
  userName: string;
  userKey: string;
  role: Role;
  countryCode: string;
  rating: number;
  choice: string;
  ratings: Record<FeedbackQuestionKey, number>;
  comment: string;
  createdAt: string;
};

export type SubjectMeta = {
  icon: string;
  title: string;
  detail: string;
};

export type LearningChapter = {
  title: string;
  summary: string;
  points: string[];
};

export type LearningMaterial = {
  title: string;
  subtitle: string;
  sourceLine: string;
  intro: string;
  chapters: LearningChapter[];
  activityHint: string;
  bookIcon: string;
};

export type LearningVideoScene = {
  title: string;
  subtitle: string;
  visual: string;
  narration: string;
  bullets: string[];
};

export type LearningVideo = {
  title: string;
  subtitle: string;
  intro: string;
  durationLabel: string;
  scenes: LearningVideoScene[];
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
    code: 'UG',
    name: 'Uganda',
    continent: 'Africa',
    capital: 'Kampala',
    curriculum: 'NCDC',
    curriculumFocus: 'literacy, numeracy, and learner-centred progression',
    description: 'Steady after-school support for early literacy, numeracy, and revision.',
    palette: {
      primary: '#1f2937',
      secondary: '#f59e0b',
      accent: '#ef4444',
      surface: '#fff7ed',
      ink: '#111827',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'RW',
    name: 'Rwanda',
    continent: 'Africa',
    capital: 'Kigali',
    curriculum: 'Competence-Based Curriculum',
    curriculumFocus: 'skills growth, clear communication, and practical application',
    description: 'A calm practice flow for learners building confidence across school subjects.',
    palette: {
      primary: '#0369a1',
      secondary: '#facc15',
      accent: '#16a34a',
      surface: '#eff6ff',
      ink: '#082f49',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'NG',
    name: 'Nigeria',
    continent: 'Africa',
    capital: 'Abuja',
    curriculum: 'NERDC-aligned',
    curriculumFocus: 'core subjects, national learning standards, and exam preparation',
    description: 'Broad practice support for schoolwork, revision, and stronger exam readiness.',
    palette: {
      primary: '#166534',
      secondary: '#22c55e',
      accent: '#0f172a',
      surface: '#f0fdf4',
      ink: '#14532d',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'GH',
    name: 'Ghana',
    continent: 'Africa',
    capital: 'Accra',
    curriculum: 'Standards-Based Curriculum',
    curriculumFocus: 'competency, communication, creativity, and national understanding',
    description: 'Friendly support for classroom learning, literacy, and practical revision.',
    palette: {
      primary: '#b91c1c',
      secondary: '#facc15',
      accent: '#15803d',
      surface: '#fefce8',
      ink: '#3f1d1d',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'ZA',
    name: 'South Africa',
    continent: 'Africa',
    capital: 'Pretoria',
    curriculum: 'CAPS',
    curriculumFocus: 'structured subject learning, assessment readiness, and real-world understanding',
    description: 'Clear practice paths for learners balancing daily schoolwork and revision.',
    palette: {
      primary: '#065f46',
      secondary: '#f59e0b',
      accent: '#111827',
      surface: '#ecfdf5',
      ink: '#064e3b',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'ZM',
    name: 'Zambia',
    continent: 'Africa',
    capital: 'Lusaka',
    curriculum: 'Competency-Based Curriculum',
    curriculumFocus: 'foundational mastery, assessment readiness, and classroom participation',
    description: 'Simple revision support for learners growing through daily practice and exams.',
    palette: {
      primary: '#166534',
      secondary: '#f59e0b',
      accent: '#dc2626',
      surface: '#f7fee7',
      ink: '#14532d',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'MW',
    name: 'Malawi',
    continent: 'Africa',
    capital: 'Lilongwe',
    curriculum: 'PCAR-inspired',
    curriculumFocus: 'reading, numeracy, and practical classroom progression',
    description: 'After-school study support shaped for gentle step-by-step growth.',
    palette: {
      primary: '#7c2d12',
      secondary: '#f97316',
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
  {
    code: 'ET',
    name: 'Ethiopia',
    continent: 'Africa',
    capital: 'Addis Ababa',
    curriculum: 'National Learning Competency Framework',
    curriculumFocus: 'subject understanding, progression, and national exam readiness',
    description: 'Focused practice for learners building stronger literacy, science, and revision habits.',
    palette: {
      primary: '#065f46',
      secondary: '#facc15',
      accent: '#2563eb',
      surface: '#fefce8',
      ink: '#14532d',
    },
    subjects: {
      kindergarten: KINDERGARTEN_SUBJECTS,
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'BW',
    name: 'Botswana',
    continent: 'Africa',
    capital: 'Gaborone',
    curriculum: 'National Curriculum Framework',
    curriculumFocus: 'communication, numeracy, and learner progression with clear assessment goals',
    description: 'Steady support for practice, revision, and learner confidence after school.',
    palette: {
      primary: '#0f172a',
      secondary: '#38bdf8',
      accent: '#475569',
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

export function getAvailableSubjects(countryCode: string, stage: Stage, _plan: Plan) {
  const country = getCountryByCode(countryCode);
  return country.subjects[stage];
}

export function getQuestionCount(plan: Plan, stage: Stage, kind: 'quiz' | 'exam' = 'quiz') {
  if (stage === 'kindergarten') {
    if (plan === 'free') return 4;
    if (plan === 'trial') return 5;
    return kind === 'exam' ? 8 : 6;
  }

  if (plan === 'free') return kind === 'exam' ? 20 : 15;
  if (plan === 'trial') return kind === 'exam' ? 24 : 18;
  return kind === 'exam' ? 30 : 22;
}

export function getSubjectMeta(subject: string) {
  return SUBJECT_META[subject] ?? { icon: '📚', title: subject, detail: 'Topic practice' };
}

type CurriculumNoteProfile = {
  sourceLine: string;
  communityLens: string;
  literacyLens: string;
  numeracyLens: string;
  scienceLens: string;
  heritageLens: string;
  citizenshipLens: string;
};

const COUNTRY_NOTE_PROFILES: Partial<Record<string, CurriculumNoteProfile>> = {
  KE: {
    sourceLine: 'Built around Kenya CBC learning areas and KICD curriculum designs.',
    communityLens: 'community roles, environmental activities, and learner responsibility',
    literacyLens: 'spoken language, reading fluency, and clear writing',
    numeracyLens: 'problem solving, patterns, and everyday numeracy',
    scienceLens: 'observation, living things, health, and practical investigation',
    heritageLens: 'Kenyan heritage, timelines, and local places',
    citizenshipLens: 'responsibility, collaboration, and care for shared spaces',
  },
  TZ: {
    sourceLine: 'Built around Tanzania Institute of Education syllabuses and NECTA-style progression.',
    communityLens: 'structured classroom routines, civic knowledge, and map use',
    literacyLens: 'reading, vocabulary growth, and careful sentence work',
    numeracyLens: 'step-by-step accuracy, arithmetic confidence, and practical number work',
    scienceLens: 'careful observation, health, environment, and basic experiments',
    heritageLens: 'Tanzanian identity, leadership, and national memory',
    citizenshipLens: 'discipline, public care, and safe daily habits',
  },
  UG: {
    sourceLine: 'Built around Uganda NCDC learner-centred curriculum guidance.',
    communityLens: 'local community understanding, participation, and daily problem solving',
    literacyLens: 'listening, speaking, reading, and guided composition',
    numeracyLens: 'number sense, reasoning, and practical class participation',
    scienceLens: 'living things, health, weather, and learner enquiry',
    heritageLens: 'Ugandan stories, chronology, and local history',
    citizenshipLens: 'values, cooperation, and respectful responsibility',
  },
  GH: {
    sourceLine: 'Built around Ghana NaCCA standards-based curriculum priorities.',
    communityLens: 'citizenship, creativity, environment, and national understanding',
    literacyLens: 'language use, reading comprehension, and expressive writing',
    numeracyLens: 'concept mastery, strategy, and communication in maths',
    scienceLens: 'investigation, curiosity, and science in everyday life',
    heritageLens: 'Ghanaian identity, culture, and historical understanding',
    citizenshipLens: 'core competencies, values, and community contribution',
  },
  NG: {
    sourceLine: 'Built around Nigeria NERDC basic education subject offerings.',
    communityLens: 'social and civic understanding, daily life skills, and national awareness',
    literacyLens: 'grammar, comprehension, and organised written work',
    numeracyLens: 'solid foundational maths with revision readiness',
    scienceLens: 'basic science ideas, observation, and health awareness',
    heritageLens: 'national history, civic memory, and evidence from the past',
    citizenshipLens: 'responsibility, social behaviour, and informed participation',
  },
  ZA: {
    sourceLine: 'Built around South Africa CAPS subject statements.',
    communityLens: 'social understanding, geography links, and real-world issues',
    literacyLens: 'reading across subjects, discussion, and purposeful writing',
    numeracyLens: 'structured maths practice and explanation of method',
    scienceLens: 'practical science understanding and clear scientific language',
    heritageLens: 'historical enquiry, timelines, and South African context',
    citizenshipLens: 'care, fairness, and thoughtful classroom participation',
  },
  GB: {
    sourceLine: 'Built around the National Curriculum for England.',
    communityLens: 'place knowledge, citizenship, and broad world understanding',
    literacyLens: 'reading widely, spoken language, grammar, and writing for purpose',
    numeracyLens: 'fluency, reasoning, and problem solving',
    scienceLens: 'working scientifically, knowledge, and explanation',
    heritageLens: 'chronology, evidence, and interpretation',
    citizenshipLens: 'respect, discussion, and responsible participation',
  },
  IN: {
    sourceLine: 'Built around NCERT textbook progression and national curriculum guidance.',
    communityLens: 'social life, environment, and connected everyday understanding',
    literacyLens: 'reading, grammar, writing, and careful expression',
    numeracyLens: 'concept mastery, strategy, and exam readiness',
    scienceLens: 'observation, scientific ideas, and application',
    heritageLens: 'civilisation, change, and evidence from the past',
    citizenshipLens: 'respect, responsibility, and awareness of society',
  },
};

function getCountryNoteProfile(country: CountryProfile): CurriculumNoteProfile {
  return (
    COUNTRY_NOTE_PROFILES[country.code] ?? {
      sourceLine: `Shaped around ${country.curriculum} learning expectations in ${country.name}.`,
      communityLens: `${country.curriculumFocus} in everyday school and community life`,
      literacyLens: `reading, writing, and communication within ${country.curriculum}`,
      numeracyLens: `number confidence and reasoning within ${country.curriculum}`,
      scienceLens: `observation and enquiry through ${country.curriculumFocus}`,
      heritageLens: `${country.name}'s history, identity, and community stories`,
      citizenshipLens: `good habits, safety, and responsible participation in ${country.name}`,
    }
  );
}

function getLevelNoteLine(stage: Stage, level: string) {
  if (stage === 'kindergarten') {
    return `${level} focuses on recognition, listening, speaking, and playful discovery.`;
  }

  if (stage === 'primary') {
    const isEarlyPrimary = ['Grade 1', 'Grade 2', 'Grade 3'].includes(level);
    return isEarlyPrimary
      ? `${level} builds strong basics before moving into bigger written tasks and formal revision.`
      : `${level} strengthens independence, revision habits, and longer answers before upper exams.`;
  }

  const isLowerTeen = ['Year 7', 'Year 8', 'Year 9'].includes(level);
  return isLowerTeen
    ? `${level} grows subject confidence, explanation skills, and steady revision.`
    : `${level} prepares learners for stronger exam-style questions, review, and deeper subject links.`;
}

function buildLearningChapters(
  subject: string,
  country: CountryProfile,
  stage: Stage,
  level: string,
  noteProfile: CurriculumNoteProfile,
): LearningChapter[] {
  const stageLabel =
    stage === 'kindergarten' ? 'Little learners' : stage === 'primary' ? 'Growing learners' : 'Teen learners';

  if (stage === 'kindergarten') {
    const kindergartenBooks: Record<string, LearningChapter[]> = {
      Colouring: [
        {
          title: 'Colours around us',
          summary: `Children notice colour through objects and scenes they already know in ${country.name}.`,
          points: [
            'Match bright colours to familiar objects before choosing a shade.',
            'Name the colour aloud so the learner hears and sees it together.',
            `Use local examples from ${country.capital} and daily life in ${country.name}.`,
          ],
        },
        {
          title: 'Shape, line, and control',
          summary: `${level} colouring works best when children slow down and notice edges, curves, and spaces.`,
          points: [
            'Start with large shapes before smaller details.',
            'Let the child point first, then colour with calm hand movement.',
            'Celebrate neat effort more than speed.',
          ],
        },
      ],
      Alphabet: [
        {
          title: 'Letter seeing and hearing',
          summary: `Early alphabet work links the look of the letter to the sound the learner hears.`,
          points: [
            'Show one letter clearly and say its sound only after the learner taps Hear it.',
            'Connect each letter to a familiar spoken word.',
            'Repeat with short, playful turns instead of long drills.',
          ],
        },
        {
          title: 'First reading habits',
          summary: `${level} learners build confidence by noticing letter shapes, left-to-right tracking, and repetition.`,
          points: [
            'Trace the letter in the air, on paper, or with a finger.',
            'Say the sound together after listening once.',
            'Mix review letters with one new letter to avoid overload.',
          ],
        },
      ],
      Numbers: [
        {
          title: 'Counting and number names',
          summary: `Number work begins with seeing the symbol, hearing its name, and matching it to real objects.`,
          points: [
            'Count with fingers, blocks, or classroom objects.',
            'Tap Hear it once, then say the number together.',
            'Keep the number linked to a real quantity.',
          ],
        },
        {
          title: 'Small number confidence',
          summary: `${level} learners do best when they meet the same number in sound, shape, and object form.`,
          points: [
            'Show a number, then ask the learner to find that many objects.',
            'Move slowly from single numbers to short comparisons.',
            'Use praise for correct recognition and calm retry for mistakes.',
          ],
        },
      ],
      'Picture Puzzle': [
        {
          title: 'Words for daily life',
          summary: `Picture learning becomes easier when the learner sees familiar animals, people, places, and tools.`,
          points: [
            `Use local life in ${country.name} to make pictures feel familiar.`,
            'Point, name the picture, then invite the learner to repeat it.',
            'Choose pictures that connect to school, home, and community life.',
          ],
        },
        {
          title: 'Observation before answer',
          summary: `${level} learners grow when they stop, look, and describe before picking an answer.`,
          points: [
            'Ask what they notice first.',
            'Keep two or three clear choices, not too many at once.',
            'Link the picture to spoken language after the choice is made.',
          ],
        },
      ],
    };

    return kindergartenBooks[subject] ?? kindergartenBooks['Picture Puzzle'];
  }

  const subjectBooks: Record<string, LearningChapter[]> = {
    Mathematics: [
      {
        title: 'Core maths ideas',
        summary: `${country.name} learners in ${level} build maths through ${noteProfile.numeracyLens}.`,
        points: [
          stage === 'primary'
            ? 'Secure number operations, place value, measurement, and simple data work.'
            : 'Revisit algebra, ratio, graph reading, geometry, and multi-step problem solving.',
          `Keep the method language close to ${country.curriculum} classroom wording.`,
          'Show working clearly before checking the final answer.',
        ],
      },
      {
        title: 'How this level grows',
        summary: getLevelNoteLine(stage, level),
        points: [
          stage === 'primary'
            ? 'Move from short calculations into explanations and word problems.'
            : 'Move from solving one idea at a time into linking several ideas in one question.',
          'Use worked examples, then try similar questions independently.',
          `Practise using examples from shopping, distance, time, and school data in ${country.name}.`,
        ],
      },
      {
        title: 'Before a quiz or exam',
        summary: `${stageLabel} do better when maths revision is calm, accurate, and repeated in short sets.`,
        points: [
          'Review a method, solve one example, then try a timed question.',
          'Check units, signs, and copied numbers before submitting.',
          'Use a quick quiz after notes, then move to a longer exam for stamina.',
        ],
      },
    ],
    Biology: [
      {
        title: 'Life science foundations',
        summary: `${country.name} science notes follow ${noteProfile.scienceLens}.`,
        points: [
          'Cover living things, cells, body systems, nutrition, habitats, and health.',
          'Use labelled diagrams and clear vocabulary before harder explanations.',
          `Connect examples to plants, animals, and environments familiar in ${country.name}.`,
        ],
      },
      {
        title: 'Level focus',
        summary: getLevelNoteLine(stage, level),
        points: [
          'Move from naming structures into explaining how systems work together.',
          'Compare processes such as respiration, transport, and reproduction.',
          'Keep revision close to school practical work and diagram questions.',
        ],
      },
      {
        title: 'After reading',
        summary: 'Biology revision works best when learners switch between reading, drawing, and short checks.',
        points: [
          'Read one process, sketch it, then answer a short question.',
          'Use the quiz to test terms and the exam to test explanation.',
          'Review wrong answers by matching them back to the chapter you read.',
        ],
      },
    ],
    Chemistry: [
      {
        title: 'Matter and change',
        summary: `Chemistry notes for ${country.name} stay close to ${country.curriculum} classroom language.`,
        points: [
          'Review particles, elements, mixtures, solutions, acids, bases, and reactions.',
          'Keep definitions short first, then add examples and equations.',
          'Use familiar lab words before moving into harder explanation questions.',
        ],
      },
      {
        title: 'Level focus',
        summary: getLevelNoteLine(stage, level),
        points: [
          'Build from observations into balanced scientific explanation.',
          'Notice the difference between physical change and chemical change.',
          'Use step-by-step reasoning when choosing formula or process answers.',
        ],
      },
      {
        title: 'Revision path',
        summary: 'Short chemistry review blocks help learners stay accurate.',
        points: [
          'Read one concept, practise one example, then test yourself.',
          'Use tables for acids/bases, states of matter, and common formulas.',
          'Take the quick quiz first, then the full exam when recall feels stronger.',
        ],
      },
    ],
    Physics: [
      {
        title: 'Forces, energy, and motion',
        summary: `${country.name} learners meet physics through ${noteProfile.scienceLens}.`,
        points: [
          'Focus on force, motion, energy, light, electricity, and waves.',
          'Link formulas to meaning before trying to memorise them.',
          'Keep diagrams and units visible while revising.',
        ],
      },
      {
        title: 'Level focus',
        summary: getLevelNoteLine(stage, level),
        points: [
          'Move from naming physical ideas to explaining patterns and outcomes.',
          'Read every unit and symbol carefully before answering.',
          'Use real-life examples such as transport, light, sound, and circuits.',
        ],
      },
      {
        title: 'Study and test bridge',
        summary: 'Physics improves when notes and questions are paired closely.',
        points: [
          'Read the rule, solve one worked example, then test yourself.',
          'Use the quiz for recall and the exam for longer thinking.',
          'Review mistakes by checking the formula, unit, or concept that was missed.',
        ],
      },
    ],
    History: [
      {
        title: 'Time, evidence, and memory',
        summary: `${country.name} history learning follows ${noteProfile.heritageLens}.`,
        points: [
          'Track chronology, cause and effect, sources, and significance.',
          `Connect local stories, ${country.capital}, and national events to the wider timeline.`,
          'Use evidence, not guessing, when comparing events from the past.',
        ],
      },
      {
        title: 'Level focus',
        summary: getLevelNoteLine(stage, level),
        points: [
          'Move from recalling facts into explaining why events mattered.',
          'Compare primary and secondary sources before writing answers.',
          'Keep key dates, people, and turning points in one revision timeline.',
        ],
      },
      {
        title: 'Reading before response',
        summary: 'History answers become stronger when learners read carefully before writing.',
        points: [
          'Underline names, dates, places, and cause/effect clues.',
          'Write short notes from each source before answering a question.',
          'Use quizzes for recall and exams for longer explanation practice.',
        ],
      },
    ],
    'General Studies': [
      {
        title: 'Community and country life',
        summary: `${country.name} general studies follows ${noteProfile.communityLens}.`,
        points: [
          `Review maps, places, helpers, leadership, and everyday life in ${country.name}.`,
          `Use local examples from ${country.capital}, the wider community, and ${country.continent}.`,
          'Connect classroom knowledge to home, health, safety, and public responsibility.',
        ],
      },
      {
        title: 'Citizenship and safe living',
        summary: `${country.curriculum} learners build ${noteProfile.citizenshipLens}.`,
        points: [
          'Read about clean water, transport, road safety, online behaviour, and public care.',
          'Notice how rules help people live and learn together well.',
          'Link choices in the notes to how a good citizen behaves daily.',
        ],
      },
      {
        title: 'Level focus and next step',
        summary: getLevelNoteLine(stage, level),
        points: [
          stage === 'primary'
            ? 'Focus on names, places, helpers, routines, maps, and community care.'
            : 'Focus on leadership, citizenship, digital behaviour, public services, and informed decision-making.',
          'Read the notes first so the quiz feels familiar, not random.',
          'Use the full exam when you can explain ideas, not only name them.',
        ],
      },
    ],
    'Communication Skills': [
      {
        title: 'Language for reading and writing',
        summary: `${country.name} communication work follows ${noteProfile.literacyLens}.`,
        points: [
          'Review reading fluency, vocabulary, grammar, and sentence building.',
          'Move between listening, speaking, reading, and writing in one study session.',
          'Keep examples close to the classroom style learners meet in school.',
        ],
      },
      {
        title: 'Level focus',
        summary: getLevelNoteLine(stage, level),
        points: [
          stage === 'primary'
            ? 'Practise capitals, punctuation, polite speaking, short reading, and simple summaries.'
            : 'Practise summaries, presentations, paragraph writing, grammar accuracy, and audience awareness.',
          'Read model answers aloud to notice structure and tone.',
          'Use keywords and linking words to organise thinking clearly.',
        ],
      },
      {
        title: 'Before quiz or exam',
        summary: 'Communication improves when learners read, speak, and write from the same notes.',
        points: [
          'Read a short note, say the main idea, then write one strong sentence.',
          'Use the quiz for quick checking and the exam for longer focus.',
          'Review mistakes by asking whether the issue was meaning, grammar, or structure.',
        ],
      },
    ],
  };

  return subjectBooks[subject] ?? subjectBooks['General Studies'];
}

export function getLearningMaterial(
  countryCode: string,
  subject: string,
  stage: Stage,
  level: string,
): LearningMaterial {
  const country = getCountryByCode(countryCode);
  const subjectMeta = getSubjectMeta(subject);
  const noteProfile = getCountryNoteProfile(country);
  const chapters = buildLearningChapters(subject, country, stage, level, noteProfile);

  return {
    title: `${subjectMeta.title} notes book`,
    subtitle: `${country.name} · ${level} · ${country.curriculum}`,
    sourceLine: noteProfile.sourceLine,
    intro:
      stage === 'kindergarten'
        ? `This reading book uses playful early-learning steps that fit ${country.name} and ${level}.`
        : `This reading book follows ${country.name}'s curriculum direction for ${subjectMeta.title} at ${level}.`,
    chapters,
    activityHint: `Read the chapters first, then open a fresh ${subjectMeta.title.toLowerCase()} quiz or full exam.`,
    bookIcon: subjectMeta.icon,
  };
}

export function getLearningVideo(
  countryCode: string,
  subject: string,
  stage: Stage,
  level: string,
): LearningVideo {
  const country = getCountryByCode(countryCode);
  const subjectMeta = getSubjectMeta(subject);
  const material = getLearningMaterial(countryCode, subject, stage, level);

  const introScene: LearningVideoScene = {
    title: `${subjectMeta.title} in ${country.name}`,
    subtitle: `${level} · ${country.curriculum}`,
    visual: subjectMeta.icon,
    narration:
      stage === 'kindergarten'
        ? `Welcome to ${subjectMeta.title}. This short lesson follows ${country.name} and keeps the ideas easy for ${level}.`
        : `Welcome to ${subjectMeta.title}. This short lesson follows ${country.name}, ${level}, and the ${country.curriculum} direction.`,
    bullets: [
      material.sourceLine,
      material.intro,
      `Focus: ${country.curriculumFocus}`,
    ],
  };

  const chapterScenes = material.chapters.map((chapter, index) => ({
    title: chapter.title,
    subtitle: `Scene ${index + 1}`,
    visual: subjectMeta.icon,
    narration: chapter.summary,
    bullets: chapter.points.slice(0, 3),
  }));

  const finalScene: LearningVideoScene = {
    title: 'Next step',
    subtitle: `${country.name} · ${subjectMeta.title}`,
    visual: '🎯',
    narration: `You have finished the quick lesson for ${subjectMeta.title}. Open a quiz or full exam when you are ready.`,
    bullets: [
      `Review ${level} ideas once more.`,
      `Try a fresh quiz for ${subjectMeta.title}.`,
      `Use the exam when you want a longer check.`,
    ],
  };

  return {
    title: `${subjectMeta.title} lesson video`,
    subtitle: `${country.name} · ${level}`,
    intro: `A short guided lesson reel shaped for ${country.name} and ${level}.`,
    durationLabel: `${chapterScenes.length + 2} scenes`,
    scenes: [introScene, ...chapterScenes, finalScene],
  };
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

function buildPromptDeck(
  tuples: PromptTuple[],
  total: number,
  nonce: string,
  prefix: string,
  explanationBuilder: (answer: string, prompt: string, skill: string) => string = (answer) =>
    `${answer} is the correct answer.`,
) {
  const working = shuffle(tuples);
  const rounds = Math.ceil(total / working.length);
  const expanded = Array.from({ length: rounds }, (_, round) =>
    shuffle(working).map((tuple) => ({ tuple, round })),
  )
    .flat()
    .slice(0, total);

  return expanded.map(({ tuple, round }, index) => {
    const [prompt, answer, distractors, skill] = tuple;
    const roundIntro =
      round === 0 ? '' : round === 1 ? 'Quick follow-up: ' : round === 2 ? 'Challenge check: ' : 'Final practice: ';

    return {
      id: `${nonce}-${prefix}-${index}`,
      prompt: `${roundIntro}${prompt}`,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: explanationBuilder(answer, prompt, skill),
      skill,
    };
  });
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
    'General Studies': buildPromptDeck([
      ['Which tool helps us find places on Earth?', 'Map', ['Bell', 'Brush', 'Desk'], 'Places'],
      [`Which curriculum is common in ${country.name}?`, country.curriculum, ['Sports list', 'Cinema guide', 'Dance list'], 'School systems'],
      [`${country.name} is in which continent?`, country.continent, ['Europe', 'South America', 'Australia'], 'Continent awareness'],
      [`What is the capital city of ${country.name}?`, country.capital, ['Kampala', 'Cairo', 'Lusaka'], 'Country knowledge'],
      ['Why do people need clean water?', 'To stay healthy', ['To break toys', 'To stop reading', 'To change colours'], 'Daily life'],
      ['Which place helps people learn every day?', 'School', ['Garage', 'Forest only', 'Boat'], 'Community'],
      ['Why do we plant trees?', 'To help the environment', ['To hide roads', 'To remove shade', 'To stop birds'], 'Care for nature'],
      ['Which object tells time?', 'Clock', ['Broom', 'Plate', 'Pillow'], 'Everyday objects'],
      ['Which helper keeps our classroom clean?', 'Dustbin', ['Ball', 'Kite', 'Radio'], 'Classroom care'],
      [`What do learners in ${country.capital} use to read directions or find new places?`, 'Map', ['Pillow', 'Drum', 'Whistle'], 'Navigation'],
      ['Why do we wash our hands before eating?', 'To stay healthy', ['To hide books', 'To skip class', 'To change shoes'], 'Healthy habits'],
      ['Which person helps patients in a clinic?', 'Nurse', ['Pilot', 'Tailor', 'Driver'], 'Community helpers'],
      ['What should we do when crossing the road?', 'Look carefully and stay safe', ['Run quickly without checking', 'Close our eyes', 'Drop our bag'], 'Road safety'],
      ['Why do we keep our water sources clean?', 'To protect people and animals', ['To make more dust', 'To stop plants growing', 'To hide the road'], 'Environment'],
      ['Which item helps us know today’s weather?', 'Weather report', ['Spoon', 'School bag', 'Chalk'], 'Weather awareness'],
    ] satisfies PromptTuple[], total, nonce, 'primary-general', (answer) => `${answer} is the best answer here.`),
    'Communication Skills': buildPromptDeck([
      ['Choose the correct greeting for the morning.', 'Good morning', ['Good night', 'Goodbye', 'Well done'], 'Speaking kindly'],
      [`In ${country.name}, learners often practise ${country.curriculumFocus}. Which habit helps communication the most?`, 'Listening first', ['Talking over others', 'Ignoring questions', 'Leaving the room'], 'Listening'],
      ['Which word is spelled correctly?', 'friend', ['freind', 'frend', 'friand'], 'Spelling'],
      ['Which sentence sounds polite?', 'Please may I join?', ['Move now', 'Give me that', 'I will not listen'], 'Polite speech'],
      ['Which word is a noun?', 'teacher', ['quickly', 'happy', 'bright'], 'Word types'],
      ['Which sentence is complete?', 'The class is reading.', ['The class', 'Reading quickly', 'On the desk'], 'Sentence building'],
      ['Which word is the opposite of loud?', 'Quiet', ['Heavy', 'Late', 'Sharp'], 'Vocabulary'],
      ['Choose the sentence with kind words.', 'Thank you for helping me.', ['Move away now.', 'I do not care.', 'Stop talking forever.'], 'Kind language'],
      ['Which sentence asks a question?', 'Can we read together?', ['We read together.', 'Please read together.', 'Reading together now.'], 'Question forms'],
      ['Which word names a person?', 'Farmer', ['Quickly', 'Blue', 'Slowly'], 'Naming words'],
      ['Which word should start with a capital letter?', 'Kenya', ['school', 'river', 'book'], 'Capital letters'],
      ['Which ending mark fits this sentence: We won the game', 'Full stop', ['Comma', 'Colon', 'Dash'], 'Punctuation'],
      ['A good speaker should:', 'Talk clearly', ['Whisper into a bag', 'Hide the message', 'Rush every word'], 'Clear speaking'],
    ] satisfies PromptTuple[], total, nonce, 'primary-comm', (answer) => `${answer} is correct.`),
    History: buildPromptDeck([
      ['What does a timeline help us do?', 'Put events in order', ['Measure rain', 'Draw triangles', 'Mix colours'], 'Timeline use'],
      [`A learner in ${country.capital} is studying ${country.curriculum}. Why do they learn local history?`, 'To understand their community and country', ['To skip lessons', 'To avoid reading', 'To forget the past'], 'Local history'],
      ['Why do we learn about heroes from the past?', 'To understand important events', ['To stop reading', 'To avoid books', 'To skip class'], 'Learning from history'],
      ['Which word means something that happened long ago?', 'Past', ['Future', 'Today only', 'Soon'], 'Time words'],
      ['Old buildings can teach us about:', 'How people lived before', ['Only sports', 'Just weather', 'Only traffic'], 'Local history'],
      ['A story from long ago is part of our:', 'History', ['Lunch', 'Homework only', 'Colouring'], 'History meaning'],
      ['A museum helps keep:', 'Important objects and stories', ['Broken pencils only', 'Rain clouds', 'Traffic lights'], 'Museums'],
      ['People who lived before us are part of our:', 'Past', ['Future', 'Lunch time', 'Play time only'], 'Time words'],
      ['Which place keeps old objects safe for learning?', 'Museum', ['Playground', 'Kitchen', 'Garage'], 'Museums'],
      ['A family story from grandparents helps us learn:', 'Our history', ['Only maths', 'Only colours', 'Only music'], 'Family stories'],
      ['Old maps and letters can teach us about:', 'Life long ago', ['Next week only', 'Toy colours', 'Running speed'], 'Sources'],
      ['Why do schools celebrate important national days?', 'To remember key events and people', ['To remove lessons forever', 'To stop reading', 'To forget the country'], 'National memory'],
      ['A monument is often built to:', 'Remember an important person or event', ['Store shoes only', 'Hide a classroom', 'Grow vegetables'], 'Monuments'],
      ['Which word matches something from long ago?', 'Ancient', ['Tomorrow', 'Freshly baked', 'Electric'], 'History words'],
    ] satisfies PromptTuple[], total, nonce, 'primary-history'),
  };

  return prompts[subject] ?? prompts.Mathematics;
}

function buildTeenSession(subject: string, country: CountryProfile, total: number, nonce: string) {
  const prompts: Record<string, Question[]> = {
    Biology: buildPromptDeck([
      [`In ${country.name}, science learners study living things through ${country.curriculumFocus}. What is the basic unit of life?`, 'Cell', ['Atom', 'Tissue', 'Planet'], 'Cells'],
      ['Which organ pumps blood around the body?', 'Heart', ['Liver', 'Skin', 'Lung'], 'Body systems'],
      ['Plants make food through:', 'Photosynthesis', ['Evaporation', 'Condensation', 'Fermentation'], 'Plant processes'],
      ['Which part of a plant absorbs water?', 'Roots', ['Leaf', 'Petal', 'Fruit'], 'Plant structure'],
      ['Which nutrient helps build muscles?', 'Protein', ['Water only', 'Air', 'Light'], 'Nutrition'],
      ['Which system helps us breathe?', 'Respiratory system', ['Solar system', 'Digestive system', 'Transport system'], 'Human systems'],
      ['A habitat is:', 'The natural home of an organism', ['A type of exam', 'A music sheet', 'A drawing tool'], 'Habitats'],
      ['Which blood cells help fight infection?', 'White blood cells', ['Red blood cells', 'Skin cells', 'Bone cells'], 'Immunity'],
      ['The process of cell division for growth is called:', 'Mitosis', ['Boiling', 'Reflection', 'Evaporation'], 'Cell division'],
      ['Which part of the eye controls how much light enters?', 'Iris', ['Retina', 'Cornea', 'Lens case'], 'Sense organs'],
      ['Which group of animals feeds only on plants?', 'Herbivores', ['Carnivores', 'Omnivores', 'Decomposers'], 'Feeding relationships'],
      ['Which vessel carries blood away from the heart?', 'Artery', ['Vein', 'Capillary only', 'Nerve'], 'Circulation'],
      ['Water moves through a plant stem by:', 'Xylem', ['Phloem only', 'Chlorophyll', 'Pollen'], 'Plant transport'],
      ['Which gas do humans breathe in for respiration?', 'Oxygen', ['Carbon dioxide', 'Helium', 'Steam'], 'Respiration'],
      ['A producer in a food chain is usually a:', 'Green plant', ['Lion', 'Fungus', 'Bird'], 'Food chains'],
    ] satisfies PromptTuple[], total, nonce, 'teen-biology'),
    Chemistry: buildPromptDeck([
      [`Students in ${country.capital} are revising chemistry. What is the chemical formula for water?`, 'H2O', ['CO2', 'NaCl', 'O2'], 'Formulas'],
      ['A substance with pH 2 is:', 'Acidic', ['Neutral', 'Basic', 'Metallic'], 'Acids and bases'],
      ['When a solid melts, its particles:', 'Move more freely', ['Disappear', 'Stop moving', 'Become louder'], 'States of matter'],
      ['Which gas do plants use in photosynthesis?', 'Carbon dioxide', ['Helium', 'Hydrogen', 'Nitrogen only'], 'Gases'],
      ['A pure substance made of one type of atom is an:', 'Element', ['Mixture', 'Solution', 'Device'], 'Elements'],
      ['Which piece of equipment measures liquid volume?', 'Measuring cylinder', ['Magnet', 'Balance beam', 'Thermometer only'], 'Lab equipment'],
      ['Boiling changes a liquid into a:', 'Gas', ['Rock', 'Solid only', 'Colour'], 'Heating'],
      ['Salt dissolved in water makes a:', 'Solution', ['Metal', 'Flame', 'Planet'], 'Solutions'],
      ['Rusting happens when iron reacts with:', 'Oxygen and water', ['Light and sound', 'Salt only', 'Plastic'], 'Corrosion'],
      ['The tiny particles that make up matter are called:', 'Atoms', ['Forests', 'Cells', 'Planets'], 'Atomic structure'],
      ['A base with pH 12 is:', 'Alkaline', ['Acidic', 'Neutral', 'Radioactive'], 'Acids and bases'],
      ['Which change forms a new substance?', 'Burning paper', ['Melting ice', 'Boiling water', 'Cutting cloth'], 'Chemical change'],
      ['The center of an atom is the:', 'Nucleus', ['Shell', 'Valve', 'Screen'], 'Atomic structure'],
      ['What name is given to substances that speed up reactions?', 'Catalysts', ['Metals', 'Buffers', 'Gases'], 'Rates of reaction'],
      ['When a gas cools and becomes a liquid, it is called:', 'Condensation', ['Combustion', 'Neutralisation', 'Filtration'], 'State changes'],
    ] satisfies PromptTuple[], total, nonce, 'teen-chemistry'),
    Physics: buildPromptDeck([
      [`A physics learner in ${country.name} asks: which force pulls objects toward Earth?`, 'Gravity', ['Magnetism', 'Friction', 'Heat'], 'Forces'],
      ['The unit of electric current is:', 'Ampere', ['Meter', 'Kelvin', 'Newton'], 'Units'],
      ['When speed changes over time, the object is:', 'Accelerating', ['Sleeping', 'Freezing', 'Condensing'], 'Motion'],
      ['Sound travels fastest through:', 'Solids', ['Vacuum', 'Clouds', 'Shadows'], 'Sound'],
      ['Energy stored in a stretched rubber band is:', 'Elastic potential energy', ['Nuclear energy', 'Wind energy', 'Thermal energy'], 'Energy'],
      ['A mirror that curves inward is:', 'Concave', ['Convex', 'Flat only', 'Transparent'], 'Light'],
      ['Voltage is measured in:', 'Volts', ['Watts', 'Newtons', 'Meters'], 'Electricity'],
      ['Friction usually acts to:', 'Slow motion down', ['Speed everything up', 'Change water to fire', 'Create clouds'], 'Forces'],
      ['The energy stored in food is:', 'Chemical energy', ['Sound energy', 'Light only', 'Kinetic energy only'], 'Energy stores'],
      ['The speed of an object is found by:', 'Distance divided by time', ['Time multiplied by mass', 'Force minus weight', 'Current times voltage'], 'Motion'],
      ['Which device is used to measure force?', 'Newton meter', ['Thermometer', 'Voltmeter', 'Beaker'], 'Measurements'],
      ['A circuit that has a gap will be:', 'Open', ['Closed', 'Magnetic', 'Balanced'], 'Electric circuits'],
      ['The image formed by a plane mirror is usually:', 'Virtual and upright', ['Real and inverted', 'Blue and blurred', 'Smaller and heavy'], 'Light'],
      ['The turning effect of a force is called:', 'Moment', ['Power', 'Current', 'Charge'], 'Mechanics'],
      ['Which wave can travel through a vacuum?', 'Light wave', ['Sound wave', 'Water ripple only', 'Seismic surface wave'], 'Waves'],
    ] satisfies PromptTuple[], total, nonce, 'teen-physics'),
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
    History: buildPromptDeck([
      ['Why do historians compare many sources?', 'To check accuracy and bias', ['To shorten essays', 'To remove facts', 'To avoid evidence'], 'Historical thinking'],
      [`A history class in ${country.name} is studying national and world events. Why is local history important?`, 'It connects learners to their country and community', ['It removes context', 'It replaces evidence', 'It stops comparison'], 'Country context'],
      ['A timeline is most useful for:', 'Placing events in order', ['Mixing chemicals', 'Measuring speed', 'Drawing circles'], 'Chronology'],
      [`Which curriculum does Review Buddy show for ${country.name}?`, country.curriculum, ['No curriculum', 'Film script', 'Holiday list'], 'School systems'],
      ['Primary sources are valuable because they come from:', 'The time being studied', ['A future date', 'Only fiction books', 'Advertisements'], 'Sources'],
      ['Archaeologists study:', 'Objects from the past', ['Only weather', 'Future transport', 'Just paintings'], 'Evidence'],
      ['An important reason to learn history is to:', 'Understand change over time', ['Stop asking questions', 'Avoid reading', 'Forget earlier events'], 'Change over time'],
      ['A speech made during an event is an example of:', 'A primary source', ['A myth only', 'A timetable', 'A machine'], 'Source types'],
      ['What can history teach us?', 'How people lived and made decisions', ['Only sport scores', 'Only colour names', 'Nothing useful'], 'Life lessons'],
      ['An archive is a place where people keep:', 'Historical records', ['Sports shoes', 'Lunch boxes', 'Bicycles'], 'Archives'],
      ['A reliable source usually gives:', 'Evidence and context', ['Rumours only', 'Only one opinion', 'No dates'], 'Evidence'],
      ['Why do nations remember important dates?', 'To honour key events and people', ['To erase the past', 'To avoid reading', 'To remove culture'], 'National memory'],
      ['An eyewitness account is useful because it comes from:', 'Someone who was there', ['A random future guess', 'A machine only', 'A song lyric'], 'Sources'],
      ['Historical cause and effect helps learners understand:', 'Why events happened and what followed', ['Only colours', 'Only weather', 'Only prices'], 'Cause and effect'],
      ['When two sources disagree, a historian should:', 'Compare the evidence carefully', ['Delete both', 'Pick the shortest one', 'Ignore the topic'], 'Comparing sources'],
    ] satisfies PromptTuple[], total, nonce, 'teen-history'),
    'General Studies': buildPromptDeck([
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
      ['A census helps a country understand its:', 'Population', ['Weather only', 'Music charts', 'Traffic lights'], 'Citizenship'],
      ['Which document is most useful for planning a journey?', 'Map', ['Whistle', 'Pencil case', 'Storybook'], 'Navigation'],
      ['Saving money regularly helps with:', 'Future plans', ['Breaking rules', 'Losing time', 'Avoiding study'], 'Financial habits'],
      ['A community leader should help people by:', 'Listening and guiding fairly', ['Ignoring everyone', 'Keeping all information secret', 'Removing schools'], 'Leadership'],
      ['Which action helps online safety?', 'Using strong passwords', ['Sharing private details publicly', 'Clicking every unknown link', 'Turning off all updates forever'], 'Digital safety'],
      ['Public transport can help a city by:', 'Moving many people efficiently', ['Stopping all travel', 'Removing markets', 'Closing roads'], 'Transport'],
    ] satisfies PromptTuple[], total, nonce, 'teen-general'),
    'Communication Skills': buildPromptDeck([
      [`Learners in ${country.name} often practise ${country.curriculumFocus}. What is the main purpose of a thesis statement?`, 'To present the main idea', ['To count pages', 'To repeat the title only', 'To avoid structure'], 'Writing'],
      ['Which sentence uses correct punctuation?', 'After class, we revised our notes.', ['After class we revised our notes', 'After class; we revised our notes,', 'After class we revised our notes?'], 'Punctuation'],
      ['Which word best matches "analyse"?', 'Examine carefully', ['Forget quickly', 'Decorate brightly', 'Repeat loudly'], 'Vocabulary'],
      ['A good listener usually:', 'Pays attention and asks clear questions', ['Interrupts all the time', 'Looks away always', 'Ignores the speaker'], 'Listening'],
      ['Which sentence is in the past tense?', 'We completed the task yesterday.', ['We complete the task tomorrow.', 'We are complete.', 'We will yesterday.'], 'Tense'],
      ['A summary should:', 'Keep the main points only', ['Add random ideas', 'Be longer than the text', 'Ignore the topic'], 'Summarising'],
      ['When presenting to others, it helps to:', 'Speak clearly and confidently', ['Hide the main point', 'Mumble quickly', 'Avoid eye contact always'], 'Presenting'],
      ['Which word connects two ideas in a sentence?', 'Conjunction', ['Noun', 'Number', 'Map'], 'Grammar'],
      ['A persuasive paragraph should include:', 'A clear point with support', ['Only a title', 'Random facts only', 'No audience in mind'], 'Persuasion'],
      ['Which of these is the best transition word for contrast?', 'However', ['Because', 'Firstly', 'Also'], 'Linking words'],
      ['Proofreading helps a writer to:', 'Find and correct mistakes', ['Hide the topic', 'Delete every paragraph', 'Avoid readers'], 'Editing'],
      ['Which sentence shows active listening?', 'I understand your point, and here is my question.', ['I was not listening at all.', 'That does not matter.', 'I will leave now.'], 'Listening'],
      ['An introduction should usually:', 'Prepare the reader for the main topic', ['Repeat the ending only', 'List random facts', 'Ignore the subject'], 'Structure'],
      ['When speaking to a group, a calm pace helps people:', 'Understand the message', ['Forget the topic', 'Stop listening at once', 'Avoid the room'], 'Public speaking'],
    ] satisfies PromptTuple[], total, nonce, 'teen-communication'),
  };

  return prompts[subject] ?? prompts.Mathematics;
}

export function generateQuestions(
  profile: LearnerProfile,
  options?: {
    kind?: 'quiz' | 'exam';
  },
) {
  const country = getCountryByCode(profile.countryCode);
  const kind = options?.kind ?? 'quiz';
  const total = getQuestionCount(profile.plan, profile.stage, kind);
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
      badge: 'Free access',
      description: 'Open to everyone during live testing, with shorter practice sets for daily learning.',
    };
  }

  if (plan === 'trial') {
    return {
      badge: 'Trial access',
      description: 'Also open during live testing, with longer quiz sets and a richer review flow.',
    };
  }

  return {
    badge: 'Elite access',
    description: 'Also open during live testing, with the full review page and certificate tools.',
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
      { learner: 'Asha M.', subject: 'Mathematics', status: 'Working now', plan: 'Elite', support: 'On track', staff: 'Mr. James' },
      { learner: 'Noah R.', subject: 'History', status: 'Finished', plan: 'Free', support: 'Review tomorrow', staff: 'Ms. Rehema' },
      { learner: 'Little Star', subject: 'Colouring', status: 'Practising', plan: 'Trial', support: 'Needs a parent check-in', staff: 'Teacher Ada' },
      { learner: 'Zuri T.', subject: 'Communication Skills', status: 'Reading', plan: 'Elite', support: 'Strong progress', staff: 'Mrs. Njeri' },
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
    registeredCountries: [
      { code: 'KE', learners: 344, families: 181, staffLead: 'Ms. Njeri' },
      { code: 'TZ', learners: 289, families: 153, staffLead: 'Mr. Baraka' },
      { code: 'US', learners: 254, families: 142, staffLead: 'Mrs. Lopez' },
      { code: 'AE', learners: 211, families: 119, staffLead: 'Ms. Noor' },
      { code: 'GB', learners: 118, families: 63, staffLead: 'Mr. Evans' },
      { code: 'IN', learners: 68, families: 34, staffLead: 'Mrs. Priya' },
    ] satisfies AdminCountryRegistration[],
    staffMembers: [
      { name: 'Mr. James', role: 'Head of learning', focus: 'Senior revision', status: 'Online' },
      { name: 'Ms. Rehema', role: 'Family success lead', focus: 'Follow-up queue', status: 'Online' },
      { name: 'Teacher Ada', role: 'Kindergarten guide', focus: 'Little learners', status: 'In session' },
      { name: 'Mrs. Njeri', role: 'Curriculum manager', focus: `${country.curriculum} review`, status: 'Reviewing reports' },
    ] satisfies AdminStaffMember[],
  };
}
