import { CSSProperties, FormEvent, SVGProps, useEffect, useRef, useState } from 'react';
import {
  COUNTRIES,
  MOTTO,
  generateQuestions,
  getAdminMetrics,
  getAvailableSubjects,
  getCountryByCode,
  getLeaderboard,
  getLevelOptions,
  getPlanDetails,
  getPlanLabel,
  getStageLabel,
  getSubjectMeta,
  inferCountryCode,
  scoreQuiz,
  type LearnerGender,
  type LearnerProfile,
  type Plan,
  type Question,
  type QuestionArt,
  type QuizResult,
  type Stage,
} from './data';

type AttemptRecord = {
  subject: string;
  percent: number;
  date: string;
  mode: LearnerProfile['mode'];
};

type AuthMode = 'signin' | 'signup';
type ThemeMode = 'country' | 'sunny' | 'ocean' | 'night';
type Screen = 'auth' | 'student' | 'admin' | 'quiz';
type StudentView = 'home' | 'subject' | 'review';
type AdminView = 'overview' | 'countries' | 'staff' | 'learners' | 'followups' | 'reports';
type AssessmentKind = 'quiz' | 'exam';
type ThemeVars = {
  '--theme-primary': string;
  '--theme-secondary': string;
  '--theme-accent': string;
  '--theme-surface': string;
  '--theme-ink': string;
};

type QuizState = {
  activeSubject: string;
  kind: AssessmentKind;
  questions: Question[];
  answers: Record<string, string>;
  currentIndex: number;
  result: QuizResult | null;
};

type ReviewSnapshot = {
  subject: string;
  kind: AssessmentKind;
  questions: Question[];
  answers: Record<string, string>;
  result: QuizResult;
  date: string;
};

type RegisteredUser = LearnerProfile & {
  id: string;
  username: string;
  createdAt: string;
  lastLoginAt?: string;
};

type StoredState = {
  profile?: LearnerProfile;
  attempts?: AttemptRecord[];
  registeredUsers?: RegisteredUser[];
  authMode?: AuthMode;
  themeMode?: ThemeMode;
  screen?: Screen;
  quizState?: QuizState | null;
  studentView?: StudentView;
  adminView?: AdminView;
  selectedSubject?: string | null;
  reviewSnapshot?: ReviewSnapshot | null;
  staffMembers?: ReturnType<typeof getAdminMetrics>['staffMembers'];
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const STORAGE_KEY = 'review-buddy-state';
const INSTALL_DISMISS_KEY = 'review-buddy-install-dismissed';
const APP_VERSION = '1.5.2';
const APP_CREATED_ON = 'March 31, 2026';
const DEFAULT_ADMIN_USERNAME = 'Admin';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const GENERATED_AVATARS: Record<LearnerGender, string[]> = {
  boy: ['🧒', '👦', '🧑‍🎓'],
  girl: ['👧', '🧒🏻', '👩‍🎓'],
};

const COLOR_MAP: Record<string, string> = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Green: '#22c55e',
  Yellow: '#facc15',
};

const themePresets: Record<Exclude<ThemeMode, 'country'>, ThemeVars> = {
  sunny: {
    '--theme-primary': '#d97706',
    '--theme-secondary': '#facc15',
    '--theme-accent': '#ef4444',
    '--theme-surface': '#fff7ed',
    '--theme-ink': '#431407',
  },
  ocean: {
    '--theme-primary': '#0369a1',
    '--theme-secondary': '#38bdf8',
    '--theme-accent': '#0f766e',
    '--theme-surface': '#ecfeff',
    '--theme-ink': '#082f49',
  },
  night: {
    '--theme-primary': '#0f172a',
    '--theme-secondary': '#6366f1',
    '--theme-accent': '#38bdf8',
    '--theme-surface': '#111827',
    '--theme-ink': '#f8fafc',
  },
};

const benefitCards = [
  {
    title: 'Easy to begin',
    detail: 'Join in a moment and move straight into learning.',
  },
  {
    title: 'Practice feels fresh',
    detail: 'New question sets keep revision from feeling repeated.',
  },
  {
    title: 'Progress stays clear',
    detail: 'Scores and activity are simple for learners and families to follow.',
  },
];

const adminPrivileges = [
  'See who is learning right now',
  'Track scores, trial progress, and family follow-ups',
  'Spot the most active subjects and learner groups',
  'Keep one calm overview for schools and families',
];

function createInitialProfile(): LearnerProfile {
  const countryCode = inferCountryCode();
  const stage: Stage = 'primary';
  const subject = getAvailableSubjects(countryCode, stage, 'free')[0];

  return {
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    gender: 'boy',
    avatarMode: 'generated',
    avatarEmoji: GENERATED_AVATARS.boy[0],
    countryCode,
    plan: 'free',
    stage,
    level: getLevelOptions(stage)[0],
    mode: 'solo',
    subject,
  };
}

function createDefaultAdminUser(): RegisteredUser {
  const countryCode = 'US';

  return {
    id: 'default-admin',
    username: DEFAULT_ADMIN_USERNAME,
    fullName: 'Review Buddy Admin',
    email: 'admin@reviewbuddy.app',
    password: DEFAULT_ADMIN_PASSWORD,
    role: 'admin',
    gender: 'boy',
    avatarMode: 'generated',
    avatarEmoji: '🛡️',
    countryCode,
    plan: 'elite',
    stage: 'teen',
    level: 'Year 10',
    mode: 'solo',
    subject: 'Mathematics',
    createdAt: new Date('2026-03-31T00:00:00.000Z').toISOString(),
    lastLoginAt: undefined,
  };
}

function normalizeLearnerProfile(input?: Partial<LearnerProfile>): LearnerProfile {
  const base = input?.role === 'admin' ? createDefaultAdminUser() : createInitialProfile();
  const countryCode = input?.countryCode ?? base.countryCode;
  const stage = input?.stage ?? base.stage;
  const plan = input?.plan ?? base.plan;
  const subjectOptions = getAvailableSubjects(countryCode, stage, plan);
  const gender = input?.gender ?? base.gender ?? 'boy';

  return {
    ...base,
    ...input,
    countryCode,
    stage,
    plan,
    gender,
    avatarMode:
      input?.avatarMode === 'upload' && input.avatarImage
        ? 'upload'
        : input?.avatarMode ?? base.avatarMode,
    avatarEmoji: input?.avatarEmoji ?? base.avatarEmoji ?? getGeneratedAvatarOptions(gender)[0],
    avatarImage: input?.avatarImage,
    level:
      input?.level && getLevelOptions(stage).includes(input.level)
        ? input.level
        : getLevelOptions(stage)[0],
    subject:
      input?.subject && subjectOptions.includes(input.subject)
        ? input.subject
        : subjectOptions[0],
  };
}

function normalizeRegisteredUser(user: Partial<RegisteredUser>): RegisteredUser {
  const normalizedProfile = normalizeLearnerProfile(user);

  return {
    ...normalizedProfile,
    id: user.id ?? `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    username: user.username ?? createUsername(normalizedProfile.fullName, normalizedProfile.email),
    createdAt: user.createdAt ?? new Date().toISOString(),
    lastLoginAt: user.lastLoginAt,
  };
}

function ensureRegisteredUsers(users?: RegisteredUser[]) {
  const adminUser = createDefaultAdminUser();
  const safeUsers = (users ?? []).map((user) => normalizeRegisteredUser(user));
  const hasAdmin = safeUsers.some(
    (user) =>
      user.role === 'admin' &&
      (user.username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase() ||
        user.email.toLowerCase() === adminUser.email.toLowerCase()),
  );

  if (hasAdmin) {
    return safeUsers;
  }

  return [adminUser, ...safeUsers];
}

function getLearningMaterial(countryCode: string, subject: string, stage: Stage) {
  const country = getCountryByCode(countryCode);

  if (stage === 'kindergarten') {
    const kindergartenLibrary: Record<string, { title: string; points: string[] }> = {
      Colouring: {
        title: 'Colour and shape play',
        points: [
          `Use bright colours to help little learners notice objects they know in ${country.name}.`,
          'Say the colour name out loud while filling the picture.',
          'Ask the learner to point to the picture before colouring it.',
        ],
      },
      Alphabet: {
        title: 'Letter sounds and recognition',
        points: [
          `Start with common letter sounds used in early learning in ${country.name}.`,
          'Trace the letter in the air, then say the sound together.',
          'Match the letter to a simple word the child already knows.',
        ],
      },
      Numbers: {
        title: 'Counting with confidence',
        points: [
          'Count slowly together using fingers, toys, or classroom objects.',
          'Say the number name after tapping Hear it once.',
          'Link each number to a real set of objects before moving on.',
        ],
      },
      'Picture Puzzle': {
        title: 'Picture and object recognition',
        points: [
          'Name familiar animals, people, and places from daily life.',
          'Point, say the word, and ask the child to repeat it.',
          `Use local examples from ${country.name} to make picture learning feel familiar.`,
        ],
      },
    };

    return kindergartenLibrary[subject] ?? kindergartenLibrary['Picture Puzzle'];
  }

  const materialLibrary: Record<string, { title: string; points: string[] }> = {
    Mathematics: {
      title: `${country.curriculum} maths focus`,
      points: [
        `Practise the maths skills most often seen in ${country.curriculum} learning for ${country.name}.`,
        'Work step by step and check each answer before moving to the next question.',
        'Use quick mental practice first, then try a longer exam when ready.',
      ],
    },
    Biology: {
      title: `${country.name} science support`,
      points: [
        `Connect biology topics to ${country.curriculumFocus} so the learner sees familiar school language.`,
        'Review body systems, habitats, nutrition, and life processes with examples from class.',
        'Use the quiz for revision and the full exam for a stronger challenge.',
      ],
    },
    Chemistry: {
      title: 'Chemistry revision guide',
      points: [
        'Focus on formulas, states of matter, acids and bases, and simple reactions.',
        `Keep examples close to the science style common in ${country.name}.`,
        'Take a quiz first, then move to a longer exam when the basics feel clear.',
      ],
    },
    Physics: {
      title: 'Physics ideas made simpler',
      points: [
        'Review force, motion, electricity, energy, and light.',
        `Use the kind of problem language learners often meet in ${country.curriculum}.`,
        'Try learning notes first, then start a quiz with fresh questions.',
      ],
    },
    History: {
      title: 'History with local context',
      points: [
        `Connect timelines, sources, and national events to ${country.name} and ${country.continent}.`,
        'Look for cause and effect, not just dates and names.',
        'Use the review page after Elite quizzes to learn from every answer.',
      ],
    },
    'General Studies': {
      title: 'Country-aware general studies',
      points: [
        `This subject uses country facts like ${country.capital}, ${country.continent}, and ${country.curriculum}.`,
        'Focus on citizenship, community care, maps, leadership, and daily life knowledge.',
        'Use a quick quiz for practice or a full exam for a longer test run.',
      ],
    },
    'Communication Skills': {
      title: 'Reading, writing, and speaking support',
      points: [
        'Practise grammar, listening, summarising, and clear speaking.',
        `Keep revision close to the communication style learners meet in ${country.name}.`,
        'Review wrong answers after Elite practice to improve quickly.',
      ],
    },
  };

  return materialLibrary[subject] ?? materialLibrary['General Studies'];
}

function LogoMark() {
  return (
    <div className="logo-mark" aria-hidden="true">
      <span className="logo-bubble logo-bubble-main">R</span>
      <span className="logo-bubble logo-bubble-sub">B</span>
    </div>
  );
}

function ProfileMark({ profile }: { profile: LearnerProfile }) {
  if (profile.avatarMode === 'upload' && profile.avatarImage) {
    return (
      <div className="logo-mark profile-mark" aria-hidden="true">
        <img src={profile.avatarImage} alt="" className="profile-photo" />
      </div>
    );
  }

  return (
    <div className="logo-mark profile-mark" aria-hidden="true">
      <span className="logo-bubble logo-bubble-main profile-emoji">{profile.avatarEmoji || '🙂'}</span>
    </div>
  );
}

function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="m4.9 4.9 2.2 2.2" />
      <path d="m16.9 16.9 2.2 2.2" />
    </svg>
  );
}

function WaveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M2 14c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4" />
      <path d="M2 18c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4" />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M20 15.5A8.5 8.5 0 1 1 8.5 4a7 7 0 0 0 11.5 11.5Z" />
    </svg>
  );
}

function ColoringBoard({ art, fillColor }: { art?: QuestionArt; fillColor?: string }) {
  const fill = fillColor ?? '#ffffff';
  const stroke = '#1f2937';

  if (art === 'balloon') {
    return (
      <svg viewBox="0 0 140 140" className="art-svg" aria-hidden="true">
        <ellipse cx="70" cy="52" rx="34" ry="42" fill={fill} stroke={stroke} strokeWidth="4" />
        <path d="M70 94 62 106h16Z" fill={fill} stroke={stroke} strokeWidth="4" />
        <path d="M70 106v22" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        <path d="M70 128c-6 0-6 8-12 8" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (art === 'leaf') {
    return (
      <svg viewBox="0 0 140 140" className="art-svg" aria-hidden="true">
        <path
          d="M72 16c34 8 42 38 30 70-12 30-38 34-60 24C20 98 16 72 26 50 38 24 56 14 72 16Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
        />
        <path d="M40 94c18-10 34-28 46-54" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (art === 'fish') {
    return (
      <svg viewBox="0 0 140 140" className="art-svg" aria-hidden="true">
        <path
          d="M26 70c14-26 54-40 82-18 8 6 10 8 16 18-6 10-8 12-16 18-28 22-68 8-82-18Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
        />
        <circle cx="88" cy="62" r="4" fill={stroke} />
        <path d="M18 50 36 70 18 90" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (art === 'star') {
    return (
      <svg viewBox="0 0 140 140" className="art-svg" aria-hidden="true">
        <path
          d="m70 18 16 32 36 6-26 24 6 36-32-18-32 18 6-36-26-24 36-6Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 140 140" className="art-svg" aria-hidden="true">
      <circle cx="70" cy="76" r="34" fill={fill} stroke={stroke} strokeWidth="4" />
      <path d="M70 42c0-12 8-22 20-26" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      <path d="M90 18c4 4 6 8 8 14" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      <path d="M58 78c6 8 18 8 24 0" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      <path d="M58 66c2-4 6-6 10-6M82 66c-2-4-6-6-10-6" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function getCertificateGrade(percent: number) {
  if (percent >= 85) return 'A';
  if (percent >= 75) return 'B';
  if (percent >= 65) return 'C';
  return 'D';
}

function getCertificatePassLevel(percent: number) {
  if (percent >= 90) return 'Excellent pass';
  if (percent >= 75) return 'Merit pass';
  if (percent >= 60) return 'Pass';
  return 'Practice needed';
}

function createUsername(fullName: string, email: string) {
  const base = fullName.trim() || email.split('@')[0] || 'learner';

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'learner';
}

function getGeneratedAvatarOptions(gender: LearnerGender) {
  return GENERATED_AVATARS[gender];
}

function App() {
  const [profile, setProfile] = useState<LearnerProfile>(createInitialProfile);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => ensureRegisteredUsers());
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [themeMode, setThemeMode] = useState<ThemeMode>('country');
  const [screen, setScreen] = useState<Screen>('auth');
  const [studentView, setStudentView] = useState<StudentView>('home');
  const [adminView, setAdminView] = useState<AdminView>('overview');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [reviewSnapshot, setReviewSnapshot] = useState<ReviewSnapshot | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [signinIdentifier, setSigninIdentifier] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [adminFocusCode, setAdminFocusCode] = useState(() => createInitialProfile().countryCode);
  const [staffMembers, setStaffMembers] = useState(() => getAdminMetrics(createInitialProfile().countryCode).staffMembers);
  const [adminNotice, setAdminNotice] = useState('Choose a tool to manage staff, countries, or reports.');
  const [staffDraft, setStaffDraft] = useState({
    name: '',
    role: '',
    focus: '',
  });
  const speechKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setIsReady(true);
      return;
    }

    try {
      const saved = JSON.parse(raw) as StoredState;

      if (saved.profile) setProfile(normalizeLearnerProfile(saved.profile));
      if (saved.attempts) setAttempts(saved.attempts);
      if (saved.registeredUsers) setRegisteredUsers(ensureRegisteredUsers(saved.registeredUsers));
      if (saved.authMode) setAuthMode(saved.authMode);
      if (saved.themeMode) setThemeMode(saved.themeMode);
      if (saved.screen) setScreen(saved.screen);
      if (saved.studentView) setStudentView(saved.studentView);
      if (saved.adminView) setAdminView(saved.adminView);
      if (saved.selectedSubject) setSelectedSubject(saved.selectedSubject);
      if (saved.reviewSnapshot) setReviewSnapshot(saved.reviewSnapshot);
      if (saved.quizState) setQuizState(saved.quizState);
      if (saved.staffMembers) setStaffMembers(saved.staffMembers);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const dismissed = window.localStorage.getItem(INSTALL_DISMISS_KEY) === 'true';

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setInstallPromptEvent(installEvent);
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPromptEvent(null);
      setShowInstallPrompt(false);
      window.localStorage.removeItem(INSTALL_DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile,
        attempts,
        registeredUsers,
        authMode,
        themeMode,
        screen,
        studentView,
        adminView,
        selectedSubject,
        reviewSnapshot,
        quizState,
        staffMembers,
      } satisfies StoredState),
    );
  }, [adminView, attempts, authMode, isReady, profile, quizState, registeredUsers, reviewSnapshot, screen, selectedSubject, staffMembers, studentView, themeMode]);

  useEffect(() => {
    const levelOptions = getLevelOptions(profile.stage);
    const availableSubjects = getAvailableSubjects(profile.countryCode, profile.stage, profile.plan);

    setProfile((current) => {
      const nextLevel = levelOptions.includes(current.level) ? current.level : levelOptions[0];
      const nextSubject = availableSubjects.includes(current.subject)
        ? current.subject
        : availableSubjects[0];

      if (nextLevel === current.level && nextSubject === current.subject) {
        return current;
      }

      return {
        ...current,
        level: nextLevel,
        subject: nextSubject,
      };
    });
  }, [profile.countryCode, profile.plan, profile.stage]);

  useEffect(() => {
    if (screen === 'admin') {
      setAdminFocusCode(profile.countryCode);
    }
  }, [profile.countryCode, screen]);

  const country = getCountryByCode(profile.countryCode);
  const availableSubjects = getAvailableSubjects(profile.countryCode, profile.stage, profile.plan);
  const currentQuestion = quizState?.questions[quizState.currentIndex];
  const adminMetricsCode = screen === 'admin' ? adminFocusCode : profile.countryCode;
  const activeStudentSubject = selectedSubject ?? profile.subject;
  const leaderboard = getLeaderboard(
    quizState?.activeSubject ?? activeStudentSubject,
    profile,
    quizState?.result ?? undefined,
  );
  const metrics = getAdminMetrics(adminMetricsCode);
  const learnerRegistrations = registeredUsers.filter((entry) => entry.role === 'student');
  const registrationsByCountry = COUNTRIES.map((entry) => {
    const matchingUsers = learnerRegistrations.filter((user) => user.countryCode === entry.code);
    const sampleCountry = metrics.registeredCountries.find((countryEntry) => countryEntry.code === entry.code);

    return {
      code: entry.code,
      learners: matchingUsers.length,
      families: matchingUsers.length === 0 ? 0 : Math.max(1, Math.ceil(matchingUsers.length * 0.6)),
      staffLead: sampleCountry?.staffLead ?? 'Waiting for staff assignment',
    };
  }).filter((entry) => entry.learners > 0);
  const recentRegistrations = [...learnerRegistrations].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const registrationsGroupedByCountry = COUNTRIES.map((countryEntry) => ({
    country: countryEntry,
    learners: recentRegistrations.filter((entry) => entry.countryCode === countryEntry.code),
  })).filter((entry) => entry.learners.length > 0);
  const firstName = profile.fullName.trim().split(' ')[0] || 'Learner';
  const learningMaterial = getLearningMaterial(profile.countryCode, activeStudentSubject, profile.stage);
  const hasEliteReview = profile.plan === 'elite' && reviewSnapshot?.subject === activeStudentSubject;

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingKey(null);
    speechKeyRef.current = null;
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (screen !== 'admin') return;
    setStaffMembers(getAdminMetrics(adminFocusCode).staffMembers);
  }, [adminFocusCode, screen]);

  const countryTheme: ThemeVars = {
    '--theme-primary': country.palette.primary,
    '--theme-secondary': country.palette.secondary,
    '--theme-accent': country.palette.accent,
    '--theme-surface': country.palette.surface,
    '--theme-ink': country.palette.ink,
  };

  const themeStyle =
    themeMode === 'country'
      ? (countryTheme as CSSProperties)
      : (themePresets[themeMode] as CSSProperties);

  function playTone(kind: 'tap' | 'good' | 'next') {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const context = new AudioCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = kind === 'tap' ? 'triangle' : 'sine';
    oscillator.frequency.value = kind === 'tap' ? 360 : kind === 'good' ? 620 : 480;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (kind === 'tap' ? 0.09 : 0.18));
    oscillator.stop(context.currentTime + (kind === 'tap' ? 0.1 : 0.2));
  }

  function speakPrompt(text: string) {
    if (!('speechSynthesis' in window)) return;

    if (speechKeyRef.current === text || window.speechSynthesis.speaking) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    speechKeyRef.current = text;
    utterance.onend = () => {
      speechKeyRef.current = null;
      setSpeakingKey(null);
    };
    utterance.onerror = () => {
      speechKeyRef.current = null;
      setSpeakingKey(null);
    };
    setSpeakingKey(text);
    window.speechSynthesis.speak(utterance);
  }

  const themeButtons = [
    { id: 'country' as const, label: 'Country', Icon: GlobeIcon },
    { id: 'sunny' as const, label: 'Sunny', Icon: SunIcon },
    { id: 'ocean' as const, label: 'Ocean', Icon: WaveIcon },
    { id: 'night' as const, label: 'Dark', Icon: MoonIcon },
  ];

  function updateProfile<Key extends keyof LearnerProfile>(key: Key, value: LearnerProfile[Key]) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateGender(nextGender: LearnerGender) {
    setProfile((current) => ({
      ...current,
      gender: nextGender,
      avatarEmoji:
        current.avatarMode === 'generated' && !getGeneratedAvatarOptions(nextGender).includes(current.avatarEmoji)
          ? getGeneratedAvatarOptions(nextGender)[0]
          : current.avatarEmoji,
    }));
  }

  function chooseGeneratedAvatar(emoji: string) {
    setProfile((current) => ({
      ...current,
      avatarMode: 'generated',
      avatarEmoji: emoji,
      avatarImage: undefined,
    }));
  }

  function handleAvatarUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      setProfile((current) => ({
        ...current,
        avatarMode: 'upload',
        avatarImage: result,
      }));
    };
    reader.readAsDataURL(file);
  }

  function withDisplayName(next: LearnerProfile) {
    if (next.fullName.trim()) return next;

    const base =
      next.email.split('@')[0]
        .replace(/[._-]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'Learner';

    return {
      ...next,
      fullName: base,
    };
  }

  function createRegisteredUser(next: LearnerProfile): RegisteredUser {
    const enriched = withDisplayName({
      ...next,
      email: next.email.trim(),
      role: 'student',
    });

    return {
      ...enriched,
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      username: createUsername(enriched.fullName, enriched.email),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  }

  function enterWorkspace(nextProfile: LearnerProfile) {
    const normalized = normalizeLearnerProfile(nextProfile);
    setProfile(normalized);
    setQuizState(null);
    setSelectedSubject(normalized.subject);
    setStudentView('home');
    setAdminView('overview');
    setScreen(normalized.role === 'admin' ? 'admin' : 'student');
  }

  function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    setAuthNotice('');

    if (authMode === 'signup') {
      const email = profile.email.trim().toLowerCase();
      const alreadyExists = registeredUsers.some((user) => user.email.toLowerCase() === email);

      if (alreadyExists) {
        setAuthNotice('That email is already registered. Please sign in instead.');
        return;
      }

      const newUser = createRegisteredUser(profile);
      setRegisteredUsers((current) => ensureRegisteredUsers([...current, newUser]));
      setSigninIdentifier(newUser.email);
      setAdminNotice(`${newUser.fullName} was added to registered learners.`);
      enterWorkspace(newUser);
      return;
    }

    const identifier = signinIdentifier.trim().toLowerCase();
    const matchedUser = registeredUsers.find(
      (user) =>
        user.email.toLowerCase() === identifier ||
        user.username.toLowerCase() === identifier ||
        (user.role === 'admin' && identifier === DEFAULT_ADMIN_USERNAME.toLowerCase()),
    );

    if (!matchedUser || matchedUser.password !== profile.password) {
      setAuthNotice('We could not find that login. Check the details and try again.');
      return;
    }

    const nextUser = {
      ...matchedUser,
      lastLoginAt: new Date().toISOString(),
    };

    setRegisteredUsers((current) =>
      ensureRegisteredUsers(
        current.map((user) => (user.id === matchedUser.id ? nextUser : user)),
      ),
    );
    enterWorkspace(nextUser);
  }

  function logout() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingKey(null);
    setAuthMode('signin');
    setAuthNotice('');
    setSigninIdentifier('');
    setProfile((current) => ({
      ...createInitialProfile(),
      countryCode: current.countryCode,
    }));
    setScreen('auth');
    setStudentView('home');
    setAdminView('overview');
    setSelectedSubject(null);
    setReviewSnapshot(null);
    setQuizState(null);
  }

  async function handleInstallApp() {
    if (!installPromptEvent) return;

    setShowInstallPrompt(false);
    await installPromptEvent.prompt();
    const outcome = await installPromptEvent.userChoice;

    if (outcome.outcome === 'accepted') {
      window.localStorage.removeItem(INSTALL_DISMISS_KEY);
      setInstallPromptEvent(null);
      return;
    }

    window.localStorage.setItem(INSTALL_DISMISS_KEY, 'true');
  }

  function dismissInstallPrompt() {
    setShowInstallPrompt(false);
    window.localStorage.setItem(INSTALL_DISMISS_KEY, 'true');
  }

  function addStaffMember() {
    const focusCountry = getCountryByCode(adminFocusCode);
    if (!staffDraft.name.trim() || !staffDraft.role.trim() || !staffDraft.focus.trim()) {
      setAdminNotice('Add a staff name, role, and support focus before saving.');
      return;
    }

    setStaffMembers((current) => [
      ...current,
      {
        name: staffDraft.name.trim(),
        role: staffDraft.role.trim(),
        focus: `${staffDraft.focus.trim()} · ${focusCountry.name}`,
        status: 'Ready to assign',
      },
    ]);
    setStaffDraft({
      name: '',
      role: '',
      focus: '',
    });
    setAdminNotice(`A new staff profile was added for ${focusCountry.name}.`);
  }

  function removeStaffMember(name: string) {
    setStaffMembers((current) => current.filter((member) => member.name !== name));
    setAdminNotice(`${name} was removed from the staff list.`);
  }

  function addCountryFollowUp() {
    const focusCountry = getCountryByCode(adminFocusCode);
    setAdminNotice(`A new follow-up item was created for families in ${focusCountry.name}.`);
  }

  function exportCountryReport() {
    const focusCountry = getCountryByCode(adminFocusCode);
    setAdminNotice(`A country report is ready for ${focusCountry.name}.`);
  }

  function removeRegisteredLearner(userId: string) {
    const learner = registeredUsers.find((entry) => entry.id === userId);
    if (!learner || learner.role !== 'student') return;

    setRegisteredUsers((current) => current.filter((entry) => entry.id !== userId));
    setAdminNotice(`${learner.fullName} was removed from registered learners.`);
  }

  function openSubject(subject: string) {
    setSelectedSubject(subject);
    setStudentView('subject');
  }

  function startQuiz(subject: string, kind: AssessmentKind = 'quiz') {
    const nextProfile = { ...profile, subject };
    const questions = generateQuestions(nextProfile, { kind });
    setProfile(nextProfile);
    setQuizState({
      activeSubject: subject,
      kind,
      questions,
      answers: {},
      currentIndex: 0,
      result: null,
    });
    setScreen('quiz');
  }

  function chooseAnswer(choice: string) {
    if (!currentQuestion || !quizState) return;
    playTone('tap');

    setQuizState({
      ...quizState,
      answers: {
        ...quizState.answers,
        [currentQuestion.id]: choice,
      },
    });
  }

  function submitCurrentQuestion() {
    if (!quizState || !currentQuestion) return;

    const selected = quizState.answers[currentQuestion.id];
    if (!selected) return;

    const isCorrect = selected === currentQuestion.answer;
    playTone(isCorrect ? 'good' : 'next');
    const isLast = quizState.currentIndex === quizState.questions.length - 1;

    if (isLast) {
      const result = scoreQuiz(quizState.questions, quizState.answers);
      setQuizState({
        ...quizState,
        result,
      });
      setReviewSnapshot({
        subject: quizState.activeSubject,
        kind: quizState.kind,
        questions: quizState.questions,
        answers: quizState.answers,
        result,
        date: new Date().toLocaleDateString(),
      });
      setAttempts((current) => [
        {
          subject: quizState.activeSubject,
          percent: result.percent,
          date: new Date().toLocaleDateString(),
          mode: profile.mode,
        },
        ...current,
      ].slice(0, 6));
      return;
    }

    setIsSliding(true);
    window.setTimeout(() => {
      setQuizState((currentState) =>
        currentState
          ? {
              ...currentState,
              currentIndex: currentState.currentIndex + 1,
            }
          : currentState,
      );
      setIsSliding(false);
    }, 220);
  }

  function quitQuiz() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingKey(null);
    setScreen('student');
    setStudentView('subject');
    setSelectedSubject((current) => current ?? profile.subject);
    setQuizState(null);
    setIsSliding(false);
  }

  function openReviewPage() {
    const snapshot =
      reviewSnapshot ??
      (quizState?.result
        ? {
            subject: quizState.activeSubject,
            kind: quizState.kind,
            questions: quizState.questions,
            answers: quizState.answers,
            result: quizState.result,
            date: new Date().toLocaleDateString(),
          }
        : null);

    if (!snapshot) return;
    setReviewSnapshot(snapshot);
    setScreen('student');
    setStudentView('review');
    setSelectedSubject(snapshot.subject);
    setQuizState(null);
  }

  function downloadCertificate() {
    const certificateSource = quizState?.result
      ? {
          subject: quizState.activeSubject,
          result: quizState.result,
        }
      : reviewSnapshot
        ? {
            subject: reviewSnapshot.subject,
            result: reviewSnapshot.result,
          }
        : null;

    if (!certificateSource) return;

    const grade = getCertificateGrade(certificateSource.result.percent);
    const passLevel = getCertificatePassLevel(certificateSource.result.percent);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');

    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Review Buddy Certificate</title>
          <style>
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              background: #f8fbff;
              color: #0f172a;
            }
            .sheet {
              width: 900px;
              margin: 32px auto;
              padding: 40px;
              border: 10px solid #1d4ed8;
              border-radius: 32px;
              background: white;
              box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .mark {
              width: 72px;
              height: 72px;
              border-radius: 22px;
              background: linear-gradient(135deg, #1d4ed8, #06b6d4);
              color: white;
              font-size: 30px;
              font-weight: 700;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            h1 {
              margin: 16px 0 8px;
              font-size: 42px;
            }
            .eyebrow {
              text-transform: uppercase;
              letter-spacing: 0.18em;
              font-size: 12px;
              font-weight: 700;
              color: #1d4ed8;
            }
            .name {
              font-size: 38px;
              font-weight: 700;
              margin: 18px 0;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              margin: 24px 0;
            }
            .card {
              padding: 18px;
              border-radius: 20px;
              background: #eff6ff;
              border: 1px solid #bfdbfe;
            }
            .signature {
              font-family: "Brush Script MT", cursive;
              font-size: 34px;
              color: #0f766e;
              margin-top: 10px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              margin-top: 32px;
            }
          </style>
        </head>
        <body>
          <section class="sheet">
            <div class="brand">
              <div class="mark">RB</div>
              <div>
                <div class="eyebrow">Elite certificate</div>
                <h1>Review Buddy Achievement Certificate</h1>
              </div>
            </div>
            <p>This certificate is proudly presented to</p>
            <div class="name">${profile.fullName}</div>
            <p>
              for completing <strong>${certificateSource.subject}</strong> at <strong>${profile.level}</strong>
              with a score of <strong>${certificateSource.result.percent}%</strong>.
            </p>
            <div class="grid">
              <div class="card"><strong>Grade</strong><div>${grade}</div></div>
              <div class="card"><strong>Pass level</strong><div>${passLevel}</div></div>
              <div class="card"><strong>Country</strong><div>${country.name}</div></div>
              <div class="card"><strong>Date</strong><div>${new Date().toLocaleDateString()}</div></div>
            </div>
            <div class="footer">
              <div>
                <strong>Review Buddy Owner</strong>
                <div class="signature">Review Buddy Signature</div>
              </div>
              <div>
                <strong>Level:</strong> ${profile.level}<br />
                <strong>Subject:</strong> ${certificateSource.subject}
              </div>
            </div>
          </section>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  }

  const selectedAnswer = currentQuestion && quizState ? quizState.answers[currentQuestion.id] : '';
  const colorFill = selectedAnswer ? COLOR_MAP[selectedAnswer] : undefined;

  return (
    <div className="app-shell" data-theme={themeMode} style={themeStyle}>
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />

      {!isInstalled && showInstallPrompt && installPromptEvent && (
        <section className="install-sheet" role="dialog" aria-live="polite" aria-label="Install Review Buddy">
          <div>
            <p className="eyebrow">Install app</p>
            <h2>Add Review Buddy to this device</h2>
            <p>Open learning faster from your home screen with fewer browser steps.</p>
          </div>
          <div className="install-actions">
            <button type="button" className="ghost-button ghost-button-small" onClick={dismissInstallPrompt}>
              Not now
            </button>
            <button type="button" className="primary-button install-button" onClick={handleInstallApp}>
              Install now
            </button>
          </div>
        </section>
      )}

      <header className="topbar">
        <div className="brand-lockup">
          {screen === 'auth' ? <LogoMark /> : <ProfileMark profile={profile} />}
          <div>
            <p className="eyebrow">Review Buddy</p>
            <h1 className="brand-title">
              {screen === 'auth'
                ? 'Easy learning made simple.'
                : screen === 'quiz'
                  ? quizState?.activeSubject ?? profile.subject
                  : `Welcome, ${profile.fullName}`}
            </h1>
          </div>
        </div>

        <div className="theme-toolbar">
          {themeButtons.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`theme-button${themeMode === id ? ' theme-button-active' : ''}`}
              onClick={() => setThemeMode(id)}
              aria-label={label}
              title={label}
            >
              <Icon className="theme-icon" />
            </button>
          ))}
        </div>
      </header>

      {screen === 'auth' ? (
        <main className="auth-layout">
          <section className="hero-card">
            <p className="eyebrow">After-school support</p>
            <h2>Friendly learning for kids, teens, and the grown-ups helping them.</h2>
            <p className="hero-copy">
              Choose a country, pick the right learner level, and start with a clear learning
              space that feels simple on phones, tablets, and computers.
            </p>

            <div className="benefit-grid">
              {benefitCards.map((card) => (
                <article key={card.title} className="info-card">
                  <strong>{card.title}</strong>
                  <p>{card.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="auth-card">
            <div className="panel-heading">
              <p className="eyebrow">Welcome</p>
              <h2>{authMode === 'signin' ? 'Sign in to continue' : 'Create a new account'}</h2>
              <p>{authMode === 'signin' ? 'Pick up learning where you left off.' : 'Create a learning space that feels like your own.'}</p>
            </div>

            <div className="mode-toggle" role="tablist" aria-label="Account mode">
              <button
                type="button"
                className={`mode-toggle-button${authMode === 'signin' ? ' mode-toggle-button-active' : ''}`}
                onClick={() => {
                  setAuthMode('signin');
                  setAuthNotice('');
                  updateProfile('password', '');
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`mode-toggle-button${authMode === 'signup' ? ' mode-toggle-button-active' : ''}`}
                onClick={() => {
                  setAuthMode('signup');
                  setAuthNotice('');
                  setProfile((current) =>
                    normalizeLearnerProfile({
                      ...current,
                      role: 'student',
                      password: '',
                    }),
                  );
                }}
              >
                Register
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <label>
                  Full name
                  <input
                    value={profile.fullName}
                    onChange={(event) => updateProfile('fullName', event.target.value)}
                    placeholder="e.g. Amina Hassan"
                    required
                  />
                </label>
              )}

              <label>
                {authMode === 'signin' ? 'Email or username' : 'Email'}
                <input
                  type={authMode === 'signin' ? 'text' : 'email'}
                  value={authMode === 'signin' ? signinIdentifier : profile.email}
                  onChange={(event) =>
                    authMode === 'signin'
                      ? setSigninIdentifier(event.target.value)
                      : updateProfile('email', event.target.value)
                  }
                  placeholder={authMode === 'signin' ? 'Email or Admin' : 'name@example.com'}
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={profile.password}
                  onChange={(event) => updateProfile('password', event.target.value)}
                  placeholder={authMode === 'signin' ? 'Enter password' : 'Create password'}
                  required
                />
              </label>

              {authMode === 'signup' && (
                <div className="field-grid">
                  <label>
                    Boy or girl
                    <select
                      value={profile.gender}
                      onChange={(event) => updateGender(event.target.value as LearnerGender)}
                    >
                      <option value="boy">Boy</option>
                      <option value="girl">Girl</option>
                    </select>
                  </label>

                  <label>
                    Country
                    <select
                      value={profile.countryCode}
                      onChange={(event) => updateProfile('countryCode', event.target.value)}
                    >
                      {COUNTRIES.map((entry) => (
                        <option key={entry.code} value={entry.code}>
                          {entry.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Learner group
                    <select
                      value={profile.stage}
                      onChange={(event) => updateProfile('stage', event.target.value as Stage)}
                    >
                      <option value="kindergarten">Little learners</option>
                      <option value="primary">Growing learners</option>
                      <option value="teen">Teen learners</option>
                    </select>
                  </label>
                </div>
              )}

              {authMode === 'signup' && (
                <div className="field-grid">
                  <label>
                    Level
                    <select
                      value={profile.level}
                      onChange={(event) => updateProfile('level', event.target.value)}
                    >
                      {getLevelOptions(profile.stage).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Plan
                    <select
                      value={profile.plan}
                      onChange={(event) => updateProfile('plan', event.target.value as Plan)}
                    >
                      <option value="free">Free</option>
                      <option value="trial">Trial</option>
                      <option value="elite">Elite</option>
                    </select>
                  </label>
                </div>
              )}

              {authMode === 'signup' && (
                <div className="avatar-picker">
                  <div className="panel-heading">
                    <p className="eyebrow">Picture</p>
                    <h2>Choose a look</h2>
                    <p>Pick a ready-made icon or add a picture.</p>
                  </div>
                  <div className="avatar-row">
                    {getGeneratedAvatarOptions(profile.gender).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`avatar-choice${profile.avatarMode === 'generated' && profile.avatarEmoji === emoji ? ' avatar-choice-active' : ''}`}
                        onClick={() => chooseGeneratedAvatar(emoji)}
                        aria-label={`Choose ${emoji}`}
                      >
                        <span>{emoji}</span>
                      </button>
                    ))}
                    <label className="upload-avatar">
                      <span>Add picture</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleAvatarUpload(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <div className="avatar-preview-card">
                    <ProfileMark profile={profile} />
                    <div>
                      <strong>{profile.fullName.trim() || 'Your picture preview'}</strong>
                      <p>{profile.avatarMode === 'upload' ? 'Your uploaded picture is ready.' : 'Your chosen icon will appear around the app.'}</p>
                    </div>
                  </div>
                </div>
              )}

              {authNotice && <p className="auth-notice">{authNotice}</p>}

              <button className="primary-button" type="submit">
                {authMode === 'signin' ? 'Continue' : 'Create account'}
              </button>
            </form>
          </section>
        </main>
      ) : screen === 'student' ? (
        <main className="dashboard-layout">
          {studentView === 'home' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Learning home</p>
                    <h2>{firstName}, choose what to practise next</h2>
                    <p>{country.name} · {getStageLabel(profile.stage)} · {getPlanLabel(profile.plan)}</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={logout}>
                      Sign out
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Today&apos;s learning</p>
                    <h2>Pick a subject</h2>
                    <p>Each subject opens its own learning page with notes, a fresh quiz, and a full exam.</p>
                  </div>

                  <div className="page-chip-row">
                    <span className="page-chip page-chip-active">Subjects</span>
                    <span className="page-chip">Choose one to continue</span>
                  </div>

                  <div className="field-grid">
                    <label>
                      Learner group
                      <select
                        value={profile.stage}
                        onChange={(event) => updateProfile('stage', event.target.value as Stage)}
                      >
                        <option value="kindergarten">Little learners</option>
                        <option value="primary">Growing learners</option>
                        <option value="teen">Teen learners</option>
                      </select>
                    </label>

                    <label>
                      Level
                      <select
                        value={profile.level}
                        onChange={(event) => updateProfile('level', event.target.value)}
                      >
                        {getLevelOptions(profile.stage).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Plan
                      <select
                        value={profile.plan}
                        onChange={(event) => updateProfile('plan', event.target.value as Plan)}
                      >
                        <option value="free">Free</option>
                        <option value="trial">Elite Trial</option>
                        <option value="elite">Elite</option>
                      </select>
                    </label>

                    <label>
                      Mode
                      <select
                        value={profile.mode}
                        onChange={(event) => updateProfile('mode', event.target.value as LearnerProfile['mode'])}
                      >
                        <option value="solo">Solo</option>
                        <option value="group">Group</option>
                      </select>
                    </label>
                  </div>

                  <div className="plan-note">
                    <strong>{getPlanDetails(profile.plan).badge}</strong>
                    <p>{getPlanDetails(profile.plan).description}</p>
                  </div>

                  <div className="subject-grid">
                    {availableSubjects.map((subject) => {
                      const meta = getSubjectMeta(subject);

                      return (
                        <button
                          key={subject}
                          type="button"
                          className="subject-card"
                          onClick={() => openSubject(subject)}
                        >
                          <span className="subject-icon">{meta.icon}</span>
                          <strong>{meta.title}</strong>
                          <span>{meta.detail}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Top learners</p>
                    <h2>{activeStudentSubject}</h2>
                    <p>Strong scores from learners practising this subject.</p>
                  </div>
                  <div className="leaderboard-list">
                    {leaderboard.map((entry, index) => (
                      <article key={`${entry.name}-${index}`} className="leaderboard-row">
                        <div>
                          <strong>#{index + 1} {entry.name}</strong>
                          <span>{getCountryByCode(entry.countryCode).name} · {getPlanLabel(entry.plan)}</span>
                        </div>
                        <strong>{entry.score}%</strong>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">My progress</p>
                    <h2>Recent results</h2>
                    <p>Your latest quiz scores stay here for a quick check-in.</p>
                  </div>
                  <div className="history-list">
                    {attempts.length > 0 ? (
                      attempts.map((attempt) => (
                        <article key={`${attempt.subject}-${attempt.date}-${attempt.percent}`} className="history-row">
                          <div>
                            <strong>{attempt.subject}</strong>
                            <span>{attempt.mode === 'group' ? 'Group' : 'Solo'} · {attempt.date}</span>
                          </div>
                          <strong>{attempt.percent}%</strong>
                        </article>
                      ))
                    ) : (
                      <p className="empty-state">Your recent scores will show here after the first quiz.</p>
                    )}
                  </div>
                </section>
              </aside>
            </>
          ) : studentView === 'subject' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Subject page</p>
                    <h2>{activeStudentSubject}</h2>
                    <p>{country.name} · {profile.level} · {getPlanLabel(profile.plan)}</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => setStudentView('home')}>
                      Back to subjects
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Learning material</p>
                    <h2>{learningMaterial.title}</h2>
                    <p>This page follows the learner&apos;s selected country and curriculum direction.</p>
                  </div>
                  <div className="page-chip-row">
                    <span className="page-chip">Learning notes</span>
                    <span className="page-chip">Quick quiz</span>
                    <span className="page-chip">Full exam</span>
                    {profile.plan === 'elite' && <span className="page-chip">Review quiz</span>}
                  </div>
                  <div className="note-grid">
                    <article className="info-card">
                      <strong>{country.name}</strong>
                      <p>{country.curriculum} · {country.curriculumFocus}</p>
                    </article>
                    <article className="info-card">
                      <strong>{profile.level}</strong>
                      <p>{getStageLabel(profile.stage)} learning notes shaped for this level.</p>
                    </article>
                    <article className="info-card">
                      <strong>{activeStudentSubject}</strong>
                      <p>Use notes first, then move into a fresh quiz or a longer exam.</p>
                    </article>
                  </div>
                  <div className="history-list">
                    {learningMaterial.points.map((point) => (
                      <article key={point} className="history-row">
                        <div>
                          <strong>{activeStudentSubject}</strong>
                          <span>{point}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Choose an activity</p>
                    <h2>Learn, quiz, or sit a full exam</h2>
                    <p>Every click starts a new set so learners do not get the same easy flow every time.</p>
                  </div>
                  <div className="option-grid">
                    <button type="button" className="subject-card" onClick={() => openSubject(activeStudentSubject)}>
                      <span className="subject-icon">📘</span>
                      <strong>Learning notes</strong>
                      <span>Read the key points for this subject and country focus.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => startQuiz(activeStudentSubject, 'quiz')}>
                      <span className="subject-icon">📝</span>
                      <strong>Quick quiz</strong>
                      <span>Fresh practice questions with the regular quiz length.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => startQuiz(activeStudentSubject, 'exam')}>
                      <span className="subject-icon">🎓</span>
                      <strong>Full exam</strong>
                      <span>Longer question sets for a stronger test run.</span>
                    </button>
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Elite tools</p>
                    <h2>Review and certificate options</h2>
                    <p>These features open after Elite learners finish a quiz or exam.</p>
                  </div>
                  <div className="sample-buttons">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={openReviewPage}
                      disabled={!hasEliteReview}
                    >
                      Review quiz
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={downloadCertificate}
                      disabled={!hasEliteReview || !reviewSnapshot?.result.passed}
                    >
                      Generate certificate
                    </button>
                  </div>
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Top learners</p>
                    <h2>{activeStudentSubject}</h2>
                    <p>Leaderboard preview for this subject.</p>
                  </div>
                  <div className="leaderboard-list">
                    {leaderboard.map((entry, index) => (
                      <article key={`${entry.name}-${index}`} className="leaderboard-row">
                        <div>
                          <strong>#{index + 1} {entry.name}</strong>
                          <span>{getCountryByCode(entry.countryCode).name}</span>
                        </div>
                        <strong>{entry.score}%</strong>
                      </article>
                    ))}
                  </div>
                </section>
              </aside>
            </>
          ) : (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Review page</p>
                    <h2>{reviewSnapshot?.subject ?? activeStudentSubject}</h2>
                    <p>Elite learners can revisit each answer and compare it with the correct one.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => setStudentView('subject')}>
                      Back to subject
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Answer review</p>
                    <h2>Correct answers and learner choices</h2>
                    <p>{reviewSnapshot?.kind === 'exam' ? 'Full exam review' : 'Quiz review'} for {reviewSnapshot?.date}.</p>
                  </div>
                  <div className="page-chip-row">
                    <span className="page-chip page-chip-active">Review answers</span>
                    {reviewSnapshot?.result.passed && <span className="page-chip">Certificate ready</span>}
                  </div>
                  <div className="review-list">
                    {reviewSnapshot?.questions.map((question, index) => {
                      const learnerAnswer = reviewSnapshot.answers[question.id] ?? 'No answer';
                      const correct = learnerAnswer === question.answer;

                      return (
                        <article key={question.id} className={`answer-card${correct ? ' answer-card-good' : ' answer-card-bad'}`}>
                          <p className="small-label">Question {index + 1}</p>
                          <strong>{question.prompt}</strong>
                          <span>Your answer: {learnerAnswer}</span>
                          <span>Correct answer: {question.answer}</span>
                          <span>{question.explanation}</span>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Result summary</p>
                    <h2>{reviewSnapshot?.result.percent ?? 0}%</h2>
                    <p>{reviewSnapshot?.result.score ?? 0} correct out of {reviewSnapshot?.result.total ?? 0}.</p>
                  </div>
                  <div className="sample-buttons">
                    <button type="button" className="primary-button" onClick={() => startQuiz(activeStudentSubject, reviewSnapshot?.kind ?? 'quiz')}>
                      New {reviewSnapshot?.kind === 'exam' ? 'exam' : 'quiz'}
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={downloadCertificate}
                      disabled={profile.plan !== 'elite' || !reviewSnapshot?.result.passed}
                    >
                      Generate certificate
                    </button>
                  </div>
                </section>
              </aside>
            </>
          )}
        </main>
      ) : screen === 'quiz' && quizState && currentQuestion ? (
        <main className="quiz-page">
          <div className="quiz-shell">
            <div className="quiz-top">
              <div>
                <p className="eyebrow">Question {quizState.currentIndex + 1} of {quizState.questions.length}</p>
                <h2>{quizState.activeSubject}</h2>
              </div>
              <button type="button" className="ghost-button ghost-button-small" onClick={quitQuiz}>
                Back
              </button>
            </div>

            <article className={`quiz-full-card${isSliding ? ' quiz-full-card-out' : ''}`} key={currentQuestion.id}>
              <div className="question-meta">
                <span>{profile.level}</span>
                <span>{currentQuestion.skill}</span>
              </div>

              {currentQuestion.visual && (
                <div
                  className="visual-card visual-card-large"
                  style={{ ['--visual-accent' as const]: currentQuestion.visual.accent } as CSSProperties}
                >
                  {currentQuestion.interaction === 'coloring' ? (
                    <ColoringBoard art={currentQuestion.visual.art} fillColor={colorFill} />
                  ) : (
                    <div className="visual-emoji visual-emoji-large">{currentQuestion.visual.emoji}</div>
                  )}

                  <div className="visual-copy">
                    <strong>{currentQuestion.visual.label}</strong>
                    {currentQuestion.visual.soundText && (
                      <button
                        type="button"
                        className="speak-button"
                        disabled={speakingKey === currentQuestion.visual.soundText}
                        onClick={() => speakPrompt(currentQuestion.visual?.soundText ?? currentQuestion.prompt)}
                      >
                        {speakingKey === currentQuestion.visual.soundText ? 'Playing...' : 'Hear it'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <h3>{currentQuestion.prompt}</h3>
              {currentQuestion.helperText && <p className="question-helper">{currentQuestion.helperText}</p>}

              {currentQuestion.interaction === 'coloring' ? (
                <div className="palette-row">
                  {currentQuestion.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`palette-button${selectedAnswer === choice ? ' palette-button-active' : ''}`}
                      style={{ ['--swatch' as const]: COLOR_MAP[choice] ?? '#cbd5e1' } as CSSProperties}
                      onClick={() => chooseAnswer(choice)}
                    >
                      <span className="palette-swatch" />
                      <span>{choice}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="choice-grid">
                  {currentQuestion.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`choice-button${selectedAnswer === choice ? ' choice-button-selected' : ''}`}
                      onClick={() => chooseAnswer(choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}

              <div className="submit-block">
                <button
                  type="button"
                  className="primary-button"
                  onClick={submitCurrentQuestion}
                  disabled={!selectedAnswer}
                >
                  {quizState.currentIndex === quizState.questions.length - 1 ? 'Finish quiz' : 'Submit answer'}
                </button>
                <p>Verify the answer before submission.</p>
              </div>

              {quizState.result && (
                <div className="result-inline">
                  <h3>
                    {quizState.result.percent}% score ({quizState.result.score}/{quizState.result.total})
                  </h3>
                  <p>
                    {quizState.result.passed
                      ? 'Well done. You finished this practice with a strong score.'
                      : 'Good effort. Try another fresh set when you are ready.'}
                  </p>
                  <div className="result-actions">
                    <button type="button" className="primary-button" onClick={() => startQuiz(quizState.activeSubject, quizState.kind)}>
                      Retry quiz
                    </button>
                    <button type="button" className="ghost-button" onClick={quitQuiz}>
                      Back to subjects
                    </button>
                    {profile.plan === 'elite' && (
                      <button type="button" className="ghost-button" onClick={openReviewPage}>
                        Review quiz
                      </button>
                    )}
                    {profile.plan === 'elite' && quizState.result.passed && (
                      <button type="button" className="ghost-button" onClick={downloadCertificate}>
                        Generate certificate
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          </div>
        </main>
      ) : (
        <main className="dashboard-layout">
          {adminView === 'overview' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">School overview</p>
                    <h2>Today&apos;s learning picture</h2>
                    <p>{metrics.country.name} · {metrics.country.curriculum} · learner and staff overview</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={logout}>
                      Sign out
                    </button>
                  </div>
                </section>

                <section className="stats-grid">
                  <article className="info-card">
                    <strong>Registered learners</strong>
                    <p>{learnerRegistrations.length}</p>
                  </article>
                  <article className="info-card">
                    <strong>Countries with sign-ups</strong>
                    <p>{registrationsByCountry.length}</p>
                  </article>
                  <article className="info-card">
                    <strong>Learning right now</strong>
                    <p>{metrics.liveSessions}</p>
                  </article>
                  <article className="info-card">
                    <strong>Staff online</strong>
                    <p>{staffMembers.length}</p>
                  </article>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Admin pages</p>
                    <h2>Open a section</h2>
                    <p>Keep the overview short, then open deeper pages inside admin when needed.</p>
                  </div>
                  <div className="page-chip-row">
                    <span className="page-chip page-chip-active">Overview</span>
                    <span className="page-chip">Countries</span>
                    <span className="page-chip">Staff</span>
                    <span className="page-chip">Follow-ups</span>
                    <span className="page-chip">Reports</span>
                  </div>
                  <div className="option-grid">
                    <button type="button" className="subject-card" onClick={() => setAdminView('countries')}>
                      <span className="subject-icon">🌍</span>
                      <strong>Registered countries</strong>
                      <span>See all countries, learner totals, families, and country leads.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => setAdminView('staff')}>
                      <span className="subject-icon">👥</span>
                      <strong>Staff</strong>
                      <span>Open the staff page with extra details and management actions.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => setAdminView('learners')}>
                      <span className="subject-icon">🧾</span>
                      <strong>Registered learners</strong>
                      <span>See who signed up, their country, selected plan, and latest login.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => setAdminView('followups')}>
                      <span className="subject-icon">📌</span>
                      <strong>Follow-up queue</strong>
                      <span>Open learner and family follow-up items with country filtering.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => setAdminView('reports')}>
                      <span className="subject-icon">📊</span>
                      <strong>Reports</strong>
                      <span>View leaderboards, popular subjects, plan use, and current activity.</span>
                    </button>
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Quick view</p>
                    <h2>Admin tools at a glance</h2>
                    <p>Open a page to view more without keeping this dashboard too long.</p>
                  </div>
                  <ul className="simple-list">
                    {adminPrivileges.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </aside>
            </>
          ) : adminView === 'countries' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Admin page</p>
                    <h2>Registered countries</h2>
                    <p>Select a country to refresh the support queue and reports.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => setAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="page-chip-row">
                    <span className="page-chip">Overview</span>
                    <span className="page-chip page-chip-active">Countries</span>
                    <span className="page-chip">Registered learners</span>
                    <span className="page-chip">Follow-ups</span>
                  </div>
                  <div className="country-list">
                    {registrationsByCountry.length > 0 ? registrationsByCountry.map((entry) => {
                      const entryCountry = getCountryByCode(entry.code);

                      return (
                        <button
                          key={entry.code}
                          type="button"
                          className={`country-button${adminFocusCode === entry.code ? ' country-button-active' : ''}`}
                          onClick={() => setAdminFocusCode(entry.code)}
                        >
                          <strong>{entryCountry.name}</strong>
                          <span>{entry.learners} learners · {entry.families} families</span>
                          <span>Lead: {entry.staffLead}</span>
                        </button>
                      );
                    }) : (
                      <p className="empty-state">New sign-ups will add country totals here on this browser.</p>
                    )}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Country focus</p>
                    <h2>{metrics.country.name}</h2>
                    <p>{metrics.country.curriculum} · {metrics.country.curriculumFocus}</p>
                  </div>
                  <div className="history-list">
                    {metrics.supportQueue.map((item) => (
                      <article key={item.title} className="history-row">
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </aside>
            </>
          ) : adminView === 'staff' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Admin page</p>
                    <h2>Staff</h2>
                    <p>View staff roles, support focus, and add or remove staff records.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => setAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Manage staff</p>
                    <h2>Staff details and actions</h2>
                    <p>{adminNotice}</p>
                  </div>
                  <div className="page-chip-row">
                    <span className="page-chip">Overview</span>
                    <span className="page-chip page-chip-active">Staff</span>
                    <span className="page-chip">Registered learners</span>
                    <span className="page-chip">Reports</span>
                  </div>
                  <div className="field-grid">
                    <label>
                      Staff name
                      <input
                        value={staffDraft.name}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, name: event.target.value }))}
                        placeholder="e.g. Ms. Amina"
                      />
                    </label>
                    <label>
                      Role
                      <input
                        value={staffDraft.role}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, role: event.target.value }))}
                        placeholder="e.g. Family success lead"
                      />
                    </label>
                    <label className="field-span-2">
                      Support focus
                      <input
                        value={staffDraft.focus}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, focus: event.target.value }))}
                        placeholder="e.g. Parent support and learner follow-up"
                      />
                    </label>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button ghost-button-small" onClick={addStaffMember}>
                      Save staff member
                    </button>
                  </div>
                  <div className="history-list">
                    {staffMembers.map((member) => (
                      <article key={`${member.name}-${member.role}`} className="history-row">
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.role} · {member.focus}</span>
                        </div>
                        <div className="row-actions">
                          <strong>{member.status}</strong>
                          <button
                            type="button"
                            className="ghost-button ghost-button-small"
                            onClick={() => removeStaffMember(member.name)}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Staff links</p>
                    <h2>Who is managing the app</h2>
                  </div>
                  <div className="history-list">
                    {metrics.liveActivity.map((session) => (
                      <article key={`${session.learner}-${session.staff}`} className="history-row">
                        <div>
                          <strong>{session.staff}</strong>
                          <span>{session.learner} · {session.subject}</span>
                        </div>
                        <strong>{session.status}</strong>
                      </article>
                    ))}
                  </div>
                </section>
              </aside>
            </>
          ) : adminView === 'learners' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Admin page</p>
                    <h2>Registered learners</h2>
                    <p>Every learner account created on this browser appears here for admin review.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => setAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Learner records</p>
                    <h2>New accounts and plan choices</h2>
                    <p>Use this page to check who joined, what country they selected, and which plan they chose.</p>
                  </div>
                  <div className="page-chip-row">
                    <span className="page-chip">Overview</span>
                    <span className="page-chip">Countries</span>
                    <span className="page-chip page-chip-active">Registered learners</span>
                    <span className="page-chip">Staff</span>
                  </div>
                  <div className="country-groups">
                    {registrationsGroupedByCountry.length > 0 ? registrationsGroupedByCountry.map(({ country, learners }) => (
                      <section key={country.code} className="country-group-card">
                        <div className="panel-heading">
                          <p className="eyebrow">{country.name}</p>
                          <h2>{learners.length} learner{learners.length === 1 ? '' : 's'}</h2>
                          <p>{country.curriculum}</p>
                        </div>
                        <div className="history-list">
                          {learners.map((entry) => (
                            <article key={entry.id} className="history-row">
                              <div>
                                <strong>{entry.fullName}</strong>
                                <span>
                                  {getStageLabel(entry.stage)} · {getPlanLabel(entry.plan)} · {entry.gender === 'boy' ? 'Boy' : 'Girl'}
                                </span>
                                <span>
                                  {entry.email} · Joined {new Date(entry.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="row-actions">
                                <strong>{entry.lastLoginAt ? `Last login ${new Date(entry.lastLoginAt).toLocaleDateString()}` : 'New account'}</strong>
                                <button
                                  type="button"
                                  className="ghost-button ghost-button-small"
                                  onClick={() => removeRegisteredLearner(entry.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    )) : (
                      <p className="empty-state">Learner sign-ups will appear here after registration.</p>
                    )}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Registration summary</p>
                    <h2>{learnerRegistrations.length} learner accounts</h2>
                    <p>Countries and plan choices update as new learners register.</p>
                  </div>
                  <div className="history-list">
                    {(registrationsByCountry.length > 0 ? registrationsByCountry : metrics.registeredCountries.slice(0, 3)).map((entry) => (
                      <article key={entry.code} className="history-row">
                        <div>
                          <strong>{getCountryByCode(entry.code).name}</strong>
                          <span>{entry.learners} learner{entry.learners === 1 ? '' : 's'} · {entry.families} families</span>
                        </div>
                        <strong>{entry.staffLead}</strong>
                      </article>
                    ))}
                  </div>
                </section>
              </aside>
            </>
          ) : adminView === 'followups' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Admin page</p>
                    <h2>Follow-up queue</h2>
                    <p>Country-aware follow-up items for learners, families, and plan support.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => setAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Queue actions</p>
                    <h2>Follow-up items</h2>
                    <p>{adminNotice}</p>
                  </div>
                  <div className="page-chip-row">
                    <span className="page-chip">Overview</span>
                    <span className="page-chip">Countries</span>
                    <span className="page-chip page-chip-active">Follow-ups</span>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button ghost-button-small" onClick={addCountryFollowUp}>
                      Add follow-up
                    </button>
                    <button type="button" className="ghost-button ghost-button-small" onClick={exportCountryReport}>
                      Export report
                    </button>
                  </div>
                  <div className="history-list">
                    {metrics.supportQueue.map((item) => (
                      <article key={item.title} className="history-row">
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Country focus</p>
                    <h2>{metrics.country.name}</h2>
                    <p>Lead country queue and family notes.</p>
                  </div>
                  <div className="country-list">
                    {metrics.registeredCountries.map((entry) => (
                      <button
                        key={entry.code}
                        type="button"
                        className={`country-button${adminFocusCode === entry.code ? ' country-button-active' : ''}`}
                        onClick={() => setAdminFocusCode(entry.code)}
                      >
                        <strong>{getCountryByCode(entry.code).name}</strong>
                        <span>{entry.learners} learners · {entry.families} families</span>
                        <span>Lead: {entry.staffLead}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </aside>
            </>
          ) : (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Admin page</p>
                    <h2>Reports</h2>
                    <p>Leaderboards, subject activity, plan mix, and current learner snapshots.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => setAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Current learning</p>
                    <h2>Current learner activity</h2>
                  </div>
                  <div className="page-chip-row">
                    <span className="page-chip">Overview</span>
                    <span className="page-chip">Staff</span>
                    <span className="page-chip page-chip-active">Reports</span>
                  </div>
                  <div className="table-list">
                    {metrics.liveActivity.map((session) => (
                      <div key={`${session.learner}-${session.subject}`} className="table-row">
                        <strong>{session.learner}</strong>
                        <span>{session.subject}</span>
                        <span>{session.plan}</span>
                        <span>{session.status}</span>
                        <span>{session.support}</span>
                        <span>{session.staff}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Top performers</p>
                    <h2>Leaderboard preview</h2>
                  </div>
                  <div className="leaderboard-list">
                    {leaderboard.map((entry, index) => (
                      <article key={`${entry.name}-${index}`} className="leaderboard-row">
                        <div>
                          <strong>#{index + 1} {entry.name}</strong>
                          <span>{getCountryByCode(entry.countryCode).name}</span>
                        </div>
                        <strong>{entry.score}%</strong>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Popular subjects</p>
                    <h2>Where learners are spending time</h2>
                  </div>
                  <div className="history-list">
                    {metrics.subjectInsights.map((item) => (
                      <article key={item.subject} className="history-row">
                        <div>
                          <strong>{item.subject}</strong>
                          <span>{item.learners} learners · average {item.averageScore}%</span>
                        </div>
                        <strong>{item.trend}</strong>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Plan mix</p>
                    <h2>How families are using access plans</h2>
                  </div>
                  <div className="history-list">
                    {metrics.planMix.map((item) => (
                      <article key={item.label} className="history-row">
                        <div>
                          <strong>{item.label}</strong>
                          <span>{item.detail}</span>
                        </div>
                        <strong>{item.count}</strong>
                      </article>
                    ))}
                  </div>
                </section>
              </aside>
            </>
          )}
        </main>
      )}

      <footer className="site-footer">
        <div>
          <strong>Review Buddy</strong>
          <p>{MOTTO}</p>
        </div>
        <div className="footer-meta">
          <span>Version {APP_VERSION}</span>
          <span>Created: {APP_CREATED_ON}</span>
          <span>Creator: Review Buddy</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
