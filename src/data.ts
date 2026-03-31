export type Role = 'student' | 'admin';
export type Plan = 'free' | 'trial' | 'elite';
export type Stage = 'kindergarten' | 'primary' | 'teen';
export type QuizMode = 'solo' | 'group';

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
  curriculum: string;
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

export type Question = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
  skill: string;
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

const PRIMARY_SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Creative Arts',
];

const TEEN_SUBJECTS = [
  'Mathematics',
  'English',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
  'ICT',
  'Business',
];

export const MOTTO = 'After-school learning, tests, quizzes, and exams for every age.';

export const COUNTRIES: CountryProfile[] = [
  {
    code: 'KE',
    name: 'Kenya',
    curriculum: 'CBC',
    description: 'Competency-focused learning paths from early years to junior and senior school.',
    palette: {
      primary: '#0f766e',
      secondary: '#facc15',
      accent: '#ef4444',
      surface: '#f0fdfa',
      ink: '#0f172a',
    },
    subjects: {
      kindergarten: ['Alphabet', 'Numbers', 'Colours', 'Shapes', 'Stories'],
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    curriculum: 'NECTA-aligned',
    description: 'Structured practice for foundational and secondary learning outcomes.',
    palette: {
      primary: '#0f766e',
      secondary: '#22c55e',
      accent: '#2563eb',
      surface: '#ecfeff',
      ink: '#082f49',
    },
    subjects: {
      kindergarten: ['Alphabet', 'Numbers', 'Colours', 'Shapes', 'Stories'],
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    curriculum: 'MOE / International blend',
    description: 'Bilingual-ready subject options with strong STEM and global studies coverage.',
    palette: {
      primary: '#111827',
      secondary: '#ef4444',
      accent: '#10b981',
      surface: '#f8fafc',
      ink: '#0f172a',
    },
    subjects: {
      kindergarten: ['Alphabet', 'Numbers', 'Colours', 'Shapes', 'Stories'],
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    curriculum: 'National Curriculum',
    description: 'Balanced literacy, numeracy, sciences, and humanities practice for all levels.',
    palette: {
      primary: '#1d4ed8',
      secondary: '#ef4444',
      accent: '#f59e0b',
      surface: '#eff6ff',
      ink: '#172554',
    },
    subjects: {
      kindergarten: ['Alphabet', 'Numbers', 'Colours', 'Shapes', 'Stories'],
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'US',
    name: 'United States',
    curriculum: 'Common Core-inspired',
    description: 'Flexible, standards-aware practice for classroom review and after-school revision.',
    palette: {
      primary: '#1d4ed8',
      secondary: '#dc2626',
      accent: '#06b6d4',
      surface: '#eff6ff',
      ink: '#111827',
    },
    subjects: {
      kindergarten: ['Alphabet', 'Numbers', 'Colours', 'Shapes', 'Stories'],
      primary: PRIMARY_SUBJECTS,
      teen: TEEN_SUBJECTS,
    },
  },
  {
    code: 'IN',
    name: 'India',
    curriculum: 'CBSE / State board blend',
    description: 'High-coverage revision for core academic subjects and exam readiness.',
    palette: {
      primary: '#ea580c',
      secondary: '#16a34a',
      accent: '#2563eb',
      surface: '#fff7ed',
      ink: '#431407',
    },
    subjects: {
      kindergarten: ['Alphabet', 'Numbers', 'Colours', 'Shapes', 'Stories'],
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
  English: [
    { name: 'Mia T.', countryCode: 'GB', score: 96, plan: 'elite' },
    { name: 'Kelvin J.', countryCode: 'TZ', score: 91, plan: 'free' },
    { name: 'Ritu S.', countryCode: 'IN', score: 90, plan: 'trial' },
  ],
  Science: [
    { name: 'Daisy W.', countryCode: 'GB', score: 94, plan: 'elite' },
    { name: 'Baraka N.', countryCode: 'TZ', score: 89, plan: 'trial' },
    { name: 'Jay M.', countryCode: 'US', score: 88, plan: 'free' },
  ],
};

export function getCountryByCode(code: string) {
  return COUNTRIES.find((country) => country.code === code) ?? COUNTRIES[0];
}

export function getLevelOptions(stage: Stage) {
  return LEVELS[stage];
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
    return allSubjects.slice(0, 3);
  }

  return allSubjects;
}

export function getQuestionCount(plan: Plan, stage: Stage) {
  if (plan === 'free') {
    return stage === 'kindergarten' ? 4 : 5;
  }

  if (plan === 'trial') {
    return stage === 'kindergarten' ? 6 : 7;
  }

  return stage === 'kindergarten' ? 8 : 10;
}

function pickOne<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function buildKindergartenQuestion(subject: string, level: string, index: number): Question {
  const alphabetLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const colourItems = [
    ['Banana', 'Yellow'],
    ['Grass', 'Green'],
    ['Sky', 'Blue'],
    ['Tomato', 'Red'],
  ];
  const shapeFacts = [
    ['Circle', '0'],
    ['Triangle', '3'],
    ['Square', '4'],
    ['Rectangle', '4'],
  ];
  const storyFacts = [
    ['A puppy likes to play.', 'puppy', 'play'],
    ['A bird can fly high.', 'bird', 'fly'],
    ['A fish swims in water.', 'fish', 'water'],
  ];

  if (subject === 'Alphabet') {
    const letter = alphabetLetters[(index + Math.floor(Math.random() * 3)) % alphabetLetters.length];
    const nextLetter = alphabetLetters[(alphabetLetters.indexOf(letter) + 1) % alphabetLetters.length];
    const choices = shuffle([nextLetter, 'Z', 'M', 'Q']);

    return {
      id: `kg-alpha-${index}`,
      prompt: `${level}: Which letter comes after ${letter}?`,
      choices,
      answer: nextLetter,
      explanation: `${nextLetter} comes after ${letter} in the alphabet.`,
      skill: 'Alphabet order',
    };
  }

  if (subject === 'Numbers') {
    const left = 1 + Math.floor(Math.random() * 5);
    const right = 1 + Math.floor(Math.random() * 4);
    const answer = String(left + right);
    const options = shuffle([
      answer,
      String(left + right + 1),
      String(Math.max(0, left + right - 1)),
      String(left + right + 2),
    ]);

    return {
      id: `kg-num-${index}`,
      prompt: `${level}: What is ${left} + ${right}?`,
      choices: options,
      answer,
      explanation: `${left} plus ${right} equals ${answer}.`,
      skill: 'Counting and addition',
    };
  }

  if (subject === 'Colours') {
    const [item, answer] = pickOne(colourItems);
    const choices = shuffle([answer, 'Purple', 'Black', 'White']);

    return {
      id: `kg-colour-${index}`,
      prompt: `${level}: What colour is a ${item.toLowerCase()}?`,
      choices,
      answer,
      explanation: `A ${item.toLowerCase()} is usually ${answer.toLowerCase()}.`,
      skill: 'Colour recognition',
    };
  }

  if (subject === 'Shapes') {
    const [shape, answer] = pickOne(shapeFacts);
    const choices = shuffle([answer, '1', '2', '5']);

    return {
      id: `kg-shape-${index}`,
      prompt: `${level}: How many sides does a ${shape.toLowerCase()} have?`,
      choices,
      answer,
      explanation: `A ${shape.toLowerCase()} has ${answer} sides.`,
      skill: 'Shape recognition',
    };
  }

  const [story, answer, clue] = pickOne(storyFacts);
  const choices = shuffle([answer, 'chair', 'cloud', 'book']);

  return {
    id: `kg-story-${index}`,
    prompt: `${level}: Read this sentence: "${story}" Who is doing something in the sentence?`,
    choices,
    answer,
    explanation: `"${answer}" is the key idea connected to "${clue}" in the sentence.`,
    skill: 'Early reading',
  };
}

function buildPrimaryQuestion(subject: string, country: CountryProfile, index: number): Question {
  if (subject === 'Mathematics') {
    const left = 10 + Math.floor(Math.random() * 20);
    const right = 2 + Math.floor(Math.random() * 9);
    const answer = String(left * right);
    const choices = shuffle([
      answer,
      String(left + right),
      String(left * right + right),
      String(left * right - right),
    ]);

    return {
      id: `primary-math-${index}`,
      prompt: `Solve: ${left} x ${right}`,
      choices,
      answer,
      explanation: `${left} groups of ${right} equals ${answer}.`,
      skill: 'Multiplication fluency',
    };
  }

  if (subject === 'English') {
    const prompts = [
      ['Choose the correct word: She ___ to school every day.', 'walks', ['walk', 'walked', 'walking']],
      ['Pick the correctly spelled word.', 'beautiful', ['beutiful', 'beautifull', 'beautyful']],
      ['Which word is a noun?', 'teacher', ['quickly', 'happy', 'bright']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `primary-english-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct choice for this sentence.`,
      skill: 'Grammar and vocabulary',
    };
  }

  if (subject === 'Science') {
    const prompts = [
      ['Which part of a plant makes food?', 'Leaf', ['Root', 'Stem', 'Flower']],
      ['What do humans need to breathe?', 'Oxygen', ['Sand', 'Milk', 'Clay']],
      ['Which state of matter takes the shape of its container?', 'Liquid', ['Solid', 'Rock', 'Metal']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `primary-science-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the science concept being tested here.`,
      skill: 'Core science facts',
    };
  }

  if (subject === 'Social Studies') {
    const prompts = [
      [`Which curriculum is highlighted for ${country.name} on Review Buddy?`, country.curriculum, ['STEM only', 'Sports only', 'Music only']],
      ['Why do communities have rules?', 'To keep people safe and organized', ['To stop learning', 'To make everyone identical', 'To remove teamwork']],
      ['Which tool helps us find places on Earth?', 'Map', ['Drum', 'Brush', 'Whistle']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `primary-social-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the best answer for this social studies question.`,
      skill: 'Community and geography',
    };
  }

  const prompts = [
    ['Which colour mix makes green?', 'Blue and yellow', ['Red and white', 'Black and blue', 'Purple and orange']],
    ['Which activity builds drawing skill?', 'Practising lines and shapes', ['Sleeping on the desk', 'Ignoring the page', 'Skipping observation']],
    ['Which beat is easiest to clap and repeat?', 'A steady rhythm', ['A silent rhythm', 'A broken ruler', 'A locked pencil']],
  ] as const;
  const [prompt, answer, distractors] = pickOne([...prompts]);

  return {
    id: `primary-arts-${index}`,
    prompt,
    choices: shuffle([answer, ...distractors]),
    answer,
    explanation: `${answer} is the strongest creative arts answer here.`,
    skill: 'Creative thinking',
  };
}

function buildTeenQuestion(subject: string, country: CountryProfile, index: number): Question {
  if (subject === 'Mathematics') {
    const x = 2 + Math.floor(Math.random() * 7);
    const answer = String(3 * x + 4);
    const prompt = `If y = 3x + 4 and x = ${x}, what is y?`;
    const choices = shuffle([answer, String(x + 4), String(3 * x), String(2 * x + 4)]);

    return {
      id: `teen-math-${index}`,
      prompt,
      choices,
      answer,
      explanation: `Substitute x with ${x}: 3(${x}) + 4 = ${answer}.`,
      skill: 'Algebra substitution',
    };
  }

  if (subject === 'English') {
    const prompts = [
      ['Choose the sentence with correct punctuation.', 'After class, we revised our notes.', ['After class we revised our notes', 'After class we revised our notes?', 'After class; we revised our notes,']],
      ['Which word best matches "analyse"?', 'Examine carefully', ['Forget quickly', 'Decorate brightly', 'Repeat loudly']],
      ['What is the main purpose of a thesis statement?', 'To present the central argument', ['To list page numbers', 'To thank the reader', 'To copy the title']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `teen-english-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct academic English response.`,
      skill: 'Writing and comprehension',
    };
  }

  if (subject === 'Biology') {
    const prompts = [
      ['Which organ pumps blood around the body?', 'Heart', ['Lung', 'Skin', 'Liver']],
      ['What is the basic unit of life?', 'Cell', ['Atom', 'Tissue', 'Planet']],
      ['Which process do plants use to make food?', 'Photosynthesis', ['Respiration only', 'Evaporation', 'Condensation']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `teen-bio-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct biology concept.`,
      skill: 'Biology foundations',
    };
  }

  if (subject === 'Chemistry') {
    const prompts = [
      ['What is the chemical symbol for water?', 'H2O', ['O2', 'CO2', 'NaCl']],
      ['A pH below 7 shows a substance is:', 'Acidic', ['Neutral', 'Basic only', 'Metallic']],
      ['What happens to particles when a solid melts?', 'They move more freely', ['They disappear', 'They stop moving', 'They become sound']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `teen-chem-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the best chemistry answer here.`,
      skill: 'Chemistry principles',
    };
  }

  if (subject === 'Physics') {
    const prompts = [
      ['Which force pulls objects toward Earth?', 'Gravity', ['Magnetism', 'Friction only', 'Sound']],
      ['What is the unit of electric current?', 'Ampere', ['Meter', 'Newton', 'Kelvin']],
      ['If speed increases over time, the object is:', 'Accelerating', ['Sleeping', 'Cooling', 'Condensing']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `teen-physics-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the correct physics term or unit.`,
      skill: 'Physics concepts',
    };
  }

  if (subject === 'History') {
    const prompts = [
      ['Why do historians compare multiple sources?', 'To check accuracy and bias', ['To remove dates', 'To shorten essays', 'To avoid evidence']],
      [`Which curriculum guide does Review Buddy highlight for ${country.name}?`, country.curriculum, ['No curriculum', 'Movie syllabus', 'Street map']],
      ['What does a timeline help students do?', 'Place events in order', ['Measure volume', 'Mix chemicals', 'Draw only circles']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `teen-history-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the strongest history response.`,
      skill: 'Historical thinking',
    };
  }

  if (subject === 'Geography') {
    const prompts = [
      ['Which tool shows physical and political features of places?', 'Map', ['Microscope', 'Telescope', 'Calculator']],
      ['What do we call lines running east to west on Earth?', 'Latitude', ['Longitude', 'Altitude', 'Magnitude']],
      ['Why do geographers study climate?', 'To understand long-term weather patterns', ['To count pencils', 'To replace maps', 'To grade music']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `teen-geo-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is the right geography concept.`,
      skill: 'Geography skills',
    };
  }

  if (subject === 'ICT') {
    const prompts = [
      ['Which device is used to point and click on a computer screen?', 'Mouse', ['Speaker', 'Fan', 'Projector']],
      ['What makes a password stronger?', 'Using a long unique combination', ['Using only 1234', 'Sharing it publicly', 'Keeping it very short']],
      ['What does a browser help you do?', 'Access websites', ['Wash data', 'Charge a keyboard', 'Print electricity']],
    ] as const;
    const [prompt, answer, distractors] = pickOne([...prompts]);

    return {
      id: `teen-ict-${index}`,
      prompt,
      choices: shuffle([answer, ...distractors]),
      answer,
      explanation: `${answer} is correct for digital literacy.`,
      skill: 'ICT readiness',
    };
  }

  const prompts = [
    ['What is profit?', 'Money left after costs are removed', ['All money received before costs', 'Only taxes paid', 'A type of timetable']],
    ['Why do businesses keep records?', 'To track performance and decisions', ['To hide products', 'To remove customers', 'To stop planning']],
    ['Which trait helps a team finish a project well?', 'Clear communication', ['Silence only', 'Ignoring deadlines', 'Random guessing']],
  ] as const;
  const [prompt, answer, distractors] = pickOne([...prompts]);

  return {
    id: `teen-business-${index}`,
    prompt,
    choices: shuffle([answer, ...distractors]),
    answer,
    explanation: `${answer} is the strongest business answer.`,
    skill: 'Business awareness',
  };
}

export function generateQuestions(profile: LearnerProfile) {
  const country = getCountryByCode(profile.countryCode);
  const total = getQuestionCount(profile.plan, profile.stage);
  const questions: Question[] = [];

  for (let index = 0; index < total; index += 1) {
    if (profile.stage === 'kindergarten') {
      questions.push(buildKindergartenQuestion(profile.subject, profile.level, index));
      continue;
    }

    if (profile.stage === 'primary') {
      questions.push(buildPrimaryQuestion(profile.subject, country, index));
      continue;
    }

    questions.push(buildTeenQuestion(profile.subject, country, index));
  }

  return questions;
}

export function scoreQuiz(questions: Question[], answers: Record<string, string>): QuizResult {
  const score = questions.reduce((total, question) => {
    return total + Number(answers[question.id] === question.answer);
  }, 0);
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
  if (plan === 'free') {
    return 'Free';
  }

  if (plan === 'trial') {
    return 'Elite Trial';
  }

  return 'Elite';
}

export function getPlanDetails(plan: Plan) {
  if (plan === 'free') {
    return {
      badge: 'Starter access',
      description: 'Limited questions, a few subject choices, scoring, and leaderboard visibility.',
    };
  }

  if (plan === 'trial') {
    return {
      badge: '5-day trial',
      description: 'Full Elite experience for five days before falling back to the free plan.',
    };
  }

  return {
    badge: 'Unlimited practice',
    description: 'Full subject library, richer reports, and complete review feedback.',
  };
}

export function getAdminMetrics(countryCode: string) {
  const country = getCountryByCode(countryCode);

  return {
    activeLearners: 1284,
    liveSessions: 312,
    averageScore: 81,
    trialUsers: 146,
    country,
  };
}
