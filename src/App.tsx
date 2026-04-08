import { CSSProperties, FormEvent, SVGProps, useEffect, useRef, useState } from 'react';
import {
  COUNTRIES,
  MOTTO,
  generateQuestions,
  getAvailableSubjects,
  getCountryByCode,
  getLearningMaterial,
  getLearningVideo,
  getLeaderboard,
  getLevelOptions,
  getPlanDetails,
  getPlanLabel,
  getStageLabel,
  getSubjectMeta,
  inferCountryCode,
  scoreQuiz,
  type AdminAlert,
  type AdminSession,
  type AdminStaffMember,
  type LearnerGender,
  type LearnerProfile,
  type Plan,
  type Question,
  type QuestionArt,
  type QuizResult,
  type RegisteredUser,
  type Stage,
} from './data';
import { appRepository } from './lib/repository';

type AttemptRecord = {
  subject: string;
  percent: number;
  date: string;
  mode: LearnerProfile['mode'];
};

type AuthMode = 'signin' | 'signup';
type ThemeMode = 'country' | 'sunny' | 'ocean' | 'night';
type Screen = 'auth' | 'student' | 'admin' | 'staff' | 'quiz';
type StudentView = 'home' | 'subject' | 'notes' | 'video' | 'review' | 'feedback';
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

type FeedbackEntry = {
  id: string;
  userName: string;
  role: LearnerProfile['role'];
  countryCode: string;
  rating: number;
  choice: string;
  comment: string;
  createdAt: string;
};

type StoredState = {
  appVersion?: string;
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
  staffMembers?: AdminStaffMember[];
  adminActivityByCountry?: AdminActivityMap;
  followUpsByCountry?: AdminFollowUpMap;
  feedbackEntries?: FeedbackEntry[];
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type AdminActivityMap = Record<string, AdminSession[]>;
type AdminFollowUpMap = Record<string, AdminAlert[]>;
type GeneratedAvatarOption = {
  emoji: string;
  label: string;
};

const STORAGE_KEY = 'review-buddy-state';
const INSTALL_DISMISS_KEY = 'review-buddy-install-dismissed';
const APP_VERSION = '1.8.8';
const APP_CREATED_ON = 'March 31, 2026';
const DEFAULT_ADMIN_USERNAME = 'Admin';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_STAFF_USERNAME = 'Staff';
const DEFAULT_STAFF_PASSWORD = 'staff';
const GENERATED_AVATARS: Record<LearnerGender, GeneratedAvatarOption[]> = {
  boy: [
    { emoji: '👦🏻', label: 'Bright starter' },
    { emoji: '👦🏼', label: 'Sunny learner' },
    { emoji: '👦🏽', label: 'Reading champ' },
    { emoji: '👦🏾', label: 'Puzzle pro' },
    { emoji: '👦🏿', label: 'Math explorer' },
    { emoji: '🧒🏻', label: 'Little helper' },
    { emoji: '🧒🏼', label: 'Story buddy' },
    { emoji: '🧒🏽', label: 'Science star' },
    { emoji: '🧒🏾', label: 'Creative thinker' },
    { emoji: '🧒🏿', label: 'Quick learner' },
    { emoji: '👨🏻‍🎓', label: 'School hero' },
    { emoji: '👨🏾‍🎓', label: 'Top scholar' },
    { emoji: '👨🏿‍🚀', label: 'Dream builder' },
    { emoji: '🦸🏾‍♂️', label: 'Kindness captain' },
  ],
  girl: [
    { emoji: '👧🏻', label: 'Bright starter' },
    { emoji: '👧🏼', label: 'Sunny learner' },
    { emoji: '👧🏽', label: 'Reading champ' },
    { emoji: '👧🏾', label: 'Puzzle pro' },
    { emoji: '👧🏿', label: 'Math explorer' },
    { emoji: '🧒🏻', label: 'Little helper' },
    { emoji: '🧒🏼', label: 'Story buddy' },
    { emoji: '🧒🏽', label: 'Science star' },
    { emoji: '🧒🏾', label: 'Creative thinker' },
    { emoji: '🧒🏿', label: 'Quick learner' },
    { emoji: '👩🏻‍🎓', label: 'School hero' },
    { emoji: '👩🏾‍🎓', label: 'Top scholar' },
    { emoji: '👩🏿‍🚀', label: 'Dream builder' },
    { emoji: '🦸🏾‍♀️', label: 'Kindness captain' },
    { emoji: '🧕🏽', label: 'Calm leader' },
  ],
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
    detail: 'Join fast and start learning.',
  },
  {
    title: 'Practice feels fresh',
    detail: 'Fresh sets keep practice new.',
  },
  {
    title: 'Progress stays clear',
    detail: 'Scores stay easy to follow.',
  },
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
    avatarEmoji: GENERATED_AVATARS.boy[0].emoji,
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

function createDefaultStaffUser(): RegisteredUser {
  return {
    id: 'default-staff',
    username: DEFAULT_STAFF_USERNAME,
    fullName: 'Review Buddy Staff',
    email: 'staff@reviewbuddy.app',
    password: DEFAULT_STAFF_PASSWORD,
    role: 'staff',
    gender: 'girl',
    avatarMode: 'generated',
    avatarEmoji: '🧑🏽‍🏫',
    countryCode: 'TZ',
    plan: 'elite',
    stage: 'primary',
    level: 'Grade 4',
    mode: 'solo',
    subject: 'Communication Skills',
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
    avatarEmoji: input?.avatarEmoji ?? base.avatarEmoji ?? getGeneratedAvatarOptions(gender)[0].emoji,
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
  const staffUser = createDefaultStaffUser();
  const safeUsers = (users ?? []).map((user) => normalizeRegisteredUser(user));
  const hasAdmin = safeUsers.some(
    (user) =>
      user.role === 'admin' &&
      (user.username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase() ||
        user.email.toLowerCase() === adminUser.email.toLowerCase()),
  );
  const hasStaff = safeUsers.some(
    (user) =>
      user.role === 'staff' &&
      (user.username.toLowerCase() === DEFAULT_STAFF_USERNAME.toLowerCase() ||
        user.email.toLowerCase() === staffUser.email.toLowerCase()),
  );

  const seededUsers = [...safeUsers];
  if (!hasStaff) seededUsers.unshift(staffUser);
  if (!hasAdmin) seededUsers.unshift(adminUser);

  return seededUsers;
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

function getFlagEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const ADMIN_TABS: { view: AdminView; label: string; icon: string }[] = [
  { view: 'overview', label: 'Overview', icon: '🏠' },
  { view: 'countries', label: 'Countries', icon: '🌍' },
  { view: 'staff', label: 'Staff', icon: '👥' },
  { view: 'learners', label: 'Learners', icon: '🧒' },
  { view: 'followups', label: 'Follow-ups', icon: '📌' },
  { view: 'reports', label: 'Reports', icon: '📊' },
];

const FEEDBACK_CHOICES = [
  'Easy to use',
  'Looks good on my device',
  'Lessons are clear',
  'Quiz is helpful',
  'Needs better speed',
  'Needs simpler pages',
];

function AdminTabs({
  active,
  onChange,
}: {
  active: AdminView;
  onChange: (view: AdminView) => void;
}) {
  return (
    <div className="page-chip-row">
      {ADMIN_TABS.map((tab) => (
        <button
          key={tab.view}
          type="button"
          className={`page-chip page-chip-button${active === tab.view ? ' page-chip-active' : ''}`}
          onClick={() => onChange(tab.view)}
          aria-label={tab.label}
        >
          <span className="page-chip-icon" aria-hidden="true">{tab.icon}</span>
          <span className="page-chip-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function FeedbackStars({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="feedback-stars" role="radiogroup" aria-label="Feedback rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-button${rating >= star ? ' star-button-active' : ''}`}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          aria-pressed={rating === star}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function buildFeedbackSummary(entries: FeedbackEntry[]) {
  if (entries.length === 0) {
    return {
      average: 0,
      lowCount: 0,
      headline: 'No feedback yet',
      detail: 'Survey replies will appear here after learners share them.',
    };
  }

  const average = Math.round((entries.reduce((sum, entry) => sum + entry.rating, 0) / entries.length) * 10) / 10;
  const lowCount = entries.filter((entry) => entry.rating < 3).length;
  const choiceCounts = entries.reduce<Record<string, number>>((summary, entry) => {
    summary[entry.choice] = (summary[entry.choice] ?? 0) + 1;
    return summary;
  }, {});
  const topChoice = Object.entries(choiceCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'General feedback';

  return {
    average,
    lowCount,
    headline: topChoice,
    detail:
      lowCount > 0
        ? `${lowCount} reply${lowCount === 1 ? '' : 'ies'} need attention first.`
        : 'Most learners are sharing positive feedback.',
  };
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

function getDefaultGeneratedAvatar(gender: LearnerGender) {
  return getGeneratedAvatarOptions(gender)[0];
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return fallback;
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
  const [staffMembers, setStaffMembers] = useState<AdminStaffMember[]>([]);
  const [adminActivityByCountry, setAdminActivityByCountry] = useState<AdminActivityMap>({});
  const [followUpsByCountry, setFollowUpsByCountry] = useState<AdminFollowUpMap>({});
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [adminNotice, setAdminNotice] = useState('Choose a tool to manage staff, countries, or reports.');
  const [staffDraft, setStaffDraft] = useState({
    name: '',
    role: '',
    focus: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackChoice, setFeedbackChoice] = useState(FEEDBACK_CHOICES[0]);
  const [feedbackComment, setFeedbackComment] = useState('');
  const speechKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setIsReady(true);
      return;
    }

    try {
      const saved = JSON.parse(raw) as StoredState;

      if (saved.appVersion !== APP_VERSION) {
        window.localStorage.removeItem(STORAGE_KEY);
        setIsReady(true);
        return;
      }

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
      if (saved.adminActivityByCountry) setAdminActivityByCountry(saved.adminActivityByCountry);
      if (saved.followUpsByCountry) setFollowUpsByCountry(saved.followUpsByCountry);
      if (saved.feedbackEntries) setFeedbackEntries(saved.feedbackEntries);
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
    let cancelled = false;

    async function hydrateSharedData() {
      const [repoUsers, repoStaff] = await Promise.all([
        appRepository.listRegisteredUsers(),
        appRepository.listStaffMembers(),
      ]);

      if (cancelled) return;

      if (repoUsers.length > 0) {
        setRegisteredUsers(ensureRegisteredUsers(repoUsers));
      }

      if (repoStaff.length > 0) {
        setStaffMembers(repoStaff);
      }
    }

    void hydrateSharedData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    window.localStorage.setItem(
      STORAGE_KEY,
        JSON.stringify({
        appVersion: APP_VERSION,
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
        adminActivityByCountry,
        followUpsByCountry,
        feedbackEntries,
      } satisfies StoredState),
    );
  }, [
    adminActivityByCountry,
    adminView,
    attempts,
    authMode,
    followUpsByCountry,
    isReady,
    profile,
    quizState,
    registeredUsers,
    reviewSnapshot,
    screen,
    selectedSubject,
    staffMembers,
    studentView,
    themeMode,
    feedbackEntries,
  ]);

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
  const adminCountry = getCountryByCode(adminMetricsCode);
  const learnerRegistrations = registeredUsers.filter((entry) => entry.role === 'student');
  const staffRegistrations = registeredUsers.filter((entry) => entry.role === 'staff');
  const focusedLearners = learnerRegistrations.filter((entry) => entry.countryCode === adminMetricsCode);
  const liveWindowMs = 30 * 60 * 1000;
  const recentWindowMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const registrationsByCountry = COUNTRIES.map((entry) => {
    const matchingUsers = learnerRegistrations.filter((user) => user.countryCode === entry.code);
    const staffLead =
      staffMembers.find((member) => member.countryCode === entry.code || member.focus.includes(entry.name))?.name ??
      'Waiting for staff assignment';

    return {
      code: entry.code,
      learners: matchingUsers.length,
      families: matchingUsers.length === 0 ? 0 : Math.max(1, Math.ceil(matchingUsers.length * 0.6)),
      staffLead,
    };
  }).filter((entry) => entry.learners > 0);
  const recentRegistrations = [...learnerRegistrations].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const recentLearnerActivity = [...focusedLearners]
    .sort(
      (left, right) =>
        new Date(right.lastLoginAt ?? right.createdAt).getTime() -
        new Date(left.lastLoginAt ?? left.createdAt).getTime(),
    )
    .slice(0, 8);
  const registrationsGroupedByCountry = COUNTRIES.map((countryEntry) => ({
    country: countryEntry,
    learners: recentRegistrations.filter((entry) => entry.countryCode === countryEntry.code),
  })).filter((entry) => entry.learners.length > 0);
  const countryRegistrationCards = registrationsByCountry;
  const focusedStaffMembers = staffMembers.filter((member) => !member.countryCode || member.countryCode === adminMetricsCode);
  const feedbackSummary = buildFeedbackSummary(feedbackEntries);
  const recentFeedback = [...feedbackEntries]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5);
  const onlineStaffMembers = focusedStaffMembers.filter(
    (member) => !member.status.toLowerCase().includes('offline') && !member.status.toLowerCase().includes('away'),
  );
  const recentActiveLearners = focusedLearners.filter((entry) => {
    if (!entry.lastLoginAt) return false;
    return now - new Date(entry.lastLoginAt).getTime() <= liveWindowMs;
  });
  const realReportActivity = recentLearnerActivity.map((entry, index) => {
    const lastSeenAt = new Date(entry.lastLoginAt ?? entry.createdAt).getTime();
    const isLive = now - lastSeenAt <= liveWindowMs;
    const isRecent = now - lastSeenAt <= recentWindowMs;
    const staffLead =
      focusedStaffMembers[index % Math.max(focusedStaffMembers.length, 1)]?.name ??
      registrationsByCountry.find((countryEntry) => countryEntry.code === adminMetricsCode)?.staffLead ??
      'Waiting for staff assignment';

    return {
      learner: entry.fullName,
      subject: entry.subject,
      status: isLive ? 'Learning right now' : isRecent ? 'Recently active' : 'Ready to return',
      plan: getPlanLabel(entry.plan),
      support: isLive ? 'On track' : isRecent ? 'Ready for next quiz' : 'Send a follow-up reminder',
      staff: staffLead,
    };
  });
  const hasActivityOverride = Object.prototype.hasOwnProperty.call(adminActivityByCountry, adminMetricsCode);
  const reportActivity = hasActivityOverride
    ? (adminActivityByCountry[adminMetricsCode] ?? [])
    : realReportActivity;
  const quietLearners = focusedLearners.filter((entry) => {
    if (!entry.lastLoginAt) return true;
    return now - new Date(entry.lastLoginAt).getTime() > recentWindowMs;
  });
  const trialLearners = focusedLearners.filter((entry) => entry.plan === 'trial');
  const realFollowUps = [
    ...(trialLearners.length > 0
      ? [
          {
            title: 'Trial learners to follow up',
            detail: `${trialLearners.length} learner${trialLearners.length === 1 ? '' : 's'} in ${adminCountry.name} are using the trial plan and may need guidance.`,
          },
        ]
      : []),
    ...(quietLearners.length > 0
      ? [
          {
            title: 'Learners needing encouragement',
            detail: `${quietLearners.length} learner${quietLearners.length === 1 ? '' : 's'} have not been active recently in ${adminCountry.name}.`,
          },
        ]
      : []),
    ...(focusedLearners.length > 0
      ? [
          {
            title: 'Newest registrations',
            detail: `${focusedLearners.length} learner${focusedLearners.length === 1 ? '' : 's'} are now registered from ${adminCountry.name}.`,
          },
        ]
      : []),
  ];
  const hasFollowUpOverride = Object.prototype.hasOwnProperty.call(followUpsByCountry, adminMetricsCode);
  const followUpItems = hasFollowUpOverride
    ? (followUpsByCountry[adminMetricsCode] ?? [])
    : realFollowUps;
  const subjectInsights = Object.values(
    focusedLearners.reduce<Record<string, { subject: string; learners: number; recent: number }>>((summary, entry) => {
      const current = summary[entry.subject] ?? { subject: entry.subject, learners: 0, recent: 0 };
      current.learners += 1;
      if (entry.lastLoginAt && now - new Date(entry.lastLoginAt).getTime() <= recentWindowMs) {
        current.recent += 1;
      }
      summary[entry.subject] = current;
      return summary;
    }, {}),
  )
    .sort((left, right) => right.learners - left.learners)
    .slice(0, 3)
    .map((item) => ({
      subject: item.subject,
      learners: item.learners,
      averageScore: 0,
      trend:
        item.recent > 2 ? 'Active this week' : item.recent > 0 ? 'New recent activity' : 'Waiting for activity',
    }));
  const planMix = (['free', 'trial', 'elite'] as const).map((plan) => {
    const count = focusedLearners.filter((entry) => entry.plan === plan).length;
    return {
      label: `${getPlanLabel(plan)} learners`,
      count,
      detail:
        plan === 'free'
          ? 'Using the starter learning path'
          : plan === 'trial'
            ? 'Exploring more learning tools'
            : 'Using the full learning library',
    };
  });
  const firstName = profile.fullName.trim().split(' ')[0] || 'Learner';
  const learningMaterial = getLearningMaterial(
    profile.countryCode,
    activeStudentSubject,
    profile.stage,
    profile.level,
  );
  const learningVideo = getLearningVideo(
    profile.countryCode,
    activeStudentSubject,
    profile.stage,
    profile.level,
  );
  const generatedAvatarOptions = getGeneratedAvatarOptions(profile.gender);
  const chosenAvatarOption = generatedAvatarOptions.find((option) => option.emoji === profile.avatarEmoji);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingKey(null);
    speechKeyRef.current = null;
  }, [currentQuestion?.id]);

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
    const nextAvatar = getDefaultGeneratedAvatar(nextGender);
    setProfile((current) => ({
      ...current,
      gender: nextGender,
      avatarMode: 'generated',
      avatarEmoji: nextAvatar.emoji,
      avatarImage: undefined,
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
    setScreen(normalized.role === 'admin' ? 'admin' : normalized.role === 'staff' ? 'staff' : 'student');

    if (normalized.role === 'student') {
      void appRepository.syncLearnerProfile({
        email: normalized.email,
        countryCode: normalized.countryCode,
        plan: normalized.plan,
        stage: normalized.stage,
        level: normalized.level,
        mode: normalized.mode,
        subject: normalized.subject,
      });
    }
  }

  function openAdminView(view: AdminView) {
    setAdminView(view);
    setAdminNotice('');
  }

  async function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    setAuthNotice('');

    if (authMode === 'signup') {
      if (profile.password !== confirmPassword) {
        setAuthNotice('Passwords do not match yet.');
        return;
      }

      const email = profile.email.trim().toLowerCase();
      const alreadyExists = registeredUsers.some((user) => user.email.toLowerCase() === email);

      if (alreadyExists) {
        setAuthNotice('That email is already registered. Please sign in instead.');
        return;
      }

      const newUser = createRegisteredUser(profile);
      try {
        const savedUser = await appRepository.registerLearner(newUser);
        const allUsers = await appRepository.listRegisteredUsers();
        setRegisteredUsers(ensureRegisteredUsers(allUsers));
        setSigninIdentifier(savedUser.email);
        setAdminNotice(`${savedUser.fullName} joined registered learners.`);
        setConfirmPassword('');
        enterWorkspace(savedUser);
      } catch (error) {
        setAuthNotice(getErrorMessage(error, 'We could not create the account just now. Please try again.'));
      }
      return;
    }

    const identifier = signinIdentifier.trim().toLowerCase();
    const matchedUser = await appRepository.signIn(identifier, profile.password);

    if (!matchedUser) {
      setAuthNotice('We could not find that login. Check the details and try again.');
      return;
    }

    const allUsers = await appRepository.listRegisteredUsers();
    setRegisteredUsers(ensureRegisteredUsers(allUsers));
    enterWorkspace(matchedUser);
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
    setShowPassword(false);
    setConfirmPassword('');
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

  async function addStaffMember() {
    const focusCountry = getCountryByCode(adminFocusCode);
    if (!staffDraft.name.trim() || !staffDraft.role.trim() || !staffDraft.focus.trim()) {
      setAdminNotice('Add a staff name, role, and support focus before saving.');
      return;
    }

    try {
      const savedMember = await appRepository.addStaffMember({
        name: staffDraft.name.trim(),
        role: staffDraft.role.trim(),
        focus: `${staffDraft.focus.trim()} · ${focusCountry.name}`,
        status: 'Ready to assign',
        countryCode: adminFocusCode,
      });
      setStaffMembers((current) => [...current, savedMember]);
    } catch {
      setAdminNotice(`We could not save that staff profile for ${focusCountry.name} just now.`);
      return;
    }

    setStaffDraft({
      name: '',
      role: '',
      focus: '',
    });
    setAdminNotice(`A new staff profile was added for ${focusCountry.name}.`);
  }

  async function removeStaffMember(memberIdOrName: string) {
    const member = staffMembers.find((entry) => entry.id === memberIdOrName || entry.name === memberIdOrName);
    await appRepository.removeStaffMember(memberIdOrName);
    setStaffMembers((current) => current.filter((entry) => entry.id !== memberIdOrName && entry.name !== memberIdOrName));
    setAdminNotice(`${member?.name ?? memberIdOrName} was removed from the staff list.`);
  }

  function addCountryFollowUp() {
    const focusCountry = getCountryByCode(adminFocusCode);
    const nextItem = {
      title: `Family follow-up ${followUpItems.length + 1}`,
      detail: `Reach out to a new family in ${focusCountry.name} and guide them to a clear practise plan.`,
    };

    setFollowUpsByCountry((current) => ({
      ...current,
      [adminFocusCode]: [...followUpItems, nextItem],
    }));
    setAdminNotice(`A new follow-up item was created for families in ${focusCountry.name}.`);
  }

  function exportCountryReport() {
    const focusCountry = getCountryByCode(adminFocusCode);
    const reportLines = [
      'Review Buddy report',
      `Country: ${focusCountry.name}`,
      `Curriculum: ${focusCountry.curriculum}`,
      '',
      'Current learner activity',
      ...reportActivity.map(
        (item) =>
          `- ${item.learner}: ${item.subject} | ${item.plan} | ${item.status} | ${item.support} | ${item.staff}`,
      ),
      '',
      'Follow-up queue',
      ...followUpItems.map((item) => `- ${item.title}: ${item.detail}`),
    ];
    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `review-buddy-${focusCountry.code.toLowerCase()}-report.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    setAdminNotice(`A country report was downloaded for ${focusCountry.name}.`);
  }

  async function removeRegisteredLearner(userId: string) {
    const learner = registeredUsers.find((entry) => entry.id === userId);
    if (!learner || learner.role !== 'student') return;

    await appRepository.removeRegisteredLearner(userId);
    setRegisteredUsers((current) => current.filter((entry) => entry.id !== userId));
    setAdminNotice(`${learner.fullName} was removed from registered learners.`);
  }

  function removeCountryFollowUp(title: string) {
    setFollowUpsByCountry((current) => ({
      ...current,
      [adminFocusCode]: followUpItems.filter((item) => item.title !== title),
    }));
    setAdminNotice('That follow-up item was removed.');
  }

  function removeReportActivity(activityKey: string) {
    setAdminActivityByCountry((current) => ({
      ...current,
      [adminFocusCode]: reportActivity.filter(
        (item) => `${item.learner}-${item.subject}-${item.staff}` !== activityKey,
      ),
    }));
    setAdminNotice('That learner activity row was removed.');
  }

  function openSubject(subject: string) {
    setSelectedSubject(subject);
    setStudentView('subject');
  }

  function openLearningNotes(subject: string) {
    setSelectedSubject(subject);
    setStudentView('notes');
  }

  function openVideoLesson(subject: string) {
    setSelectedSubject(subject);
    setStudentView('video');
  }

  function openFeedbackPage() {
    setAuthNotice('');
    setStudentView('feedback');
  }

  function submitFeedback() {
    if (!feedbackRating) {
      setAuthNotice('Choose a star rating first.');
      return;
    }

    const nextEntry: FeedbackEntry = {
      id: `feedback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      userName: profile.fullName || firstName,
      role: profile.role,
      countryCode: profile.countryCode,
      rating: feedbackRating,
      choice: feedbackChoice,
      comment: feedbackComment.trim(),
      createdAt: new Date().toISOString(),
    };

    setFeedbackEntries((current) => [nextEntry, ...current].slice(0, 60));
    setFeedbackRating(0);
    setFeedbackChoice(FEEDBACK_CHOICES[0]);
    setFeedbackComment('');
    setAuthNotice('');
    setAdminNotice('New feedback was added for admin review.');
    setStudentView('home');
  }

  function startQuiz(subject: string, kind: AssessmentKind = 'quiz') {
    const nextProfile = { ...profile, subject };
    const questions = generateQuestions(nextProfile, { kind });
    setProfile(nextProfile);
    if (nextProfile.role === 'student') {
      void appRepository.syncLearnerProfile({
        email: nextProfile.email,
        countryCode: nextProfile.countryCode,
        plan: nextProfile.plan,
        stage: nextProfile.stage,
        level: nextProfile.level,
        mode: nextProfile.mode,
        subject: nextProfile.subject,
      });
    }
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

      <header className={`topbar topbar-${screen}`}>
        <div className="brand-lockup">
          {screen === 'auth' ? <LogoMark /> : <ProfileMark profile={profile} />}
          <div>
            <p className="eyebrow">Review Buddy</p>
            <h1 className={`brand-title${screen === 'auth' ? '' : ' brand-title-dashboard'}`}>
              {screen === 'auth'
                ? 'Easy learning made simple.'
                : screen === 'quiz'
                  ? quizState?.activeSubject ?? profile.subject
                  : screen === 'admin'
                    ? 'Admin'
                    : screen === 'staff'
                      ? 'Staff lounge'
                      : studentView === 'subject' && selectedSubject
                        ? selectedSubject
                        : `Welcome, ${firstName}`}
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
              Choose your level and start on any device.
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
              <p>{authMode === 'signin' ? 'Welcome back.' : 'Quick setup.'}</p>
            </div>

            <div className="mode-toggle" role="tablist" aria-label="Account mode">
              <button
                type="button"
                className={`mode-toggle-button${authMode === 'signin' ? ' mode-toggle-button-active' : ''}`}
                onClick={() => {
                  setAuthMode('signin');
                  setAuthNotice('');
                  setShowPassword(false);
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
                  setShowPassword(false);
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
                <div className="field-grid auth-field-grid">
                  <label className="field-span-2">
                    Full name
                    <input
                      value={profile.fullName}
                      onChange={(event) => updateProfile('fullName', event.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(event) => updateProfile('email', event.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </label>

                  <label>
                    Password
                    <div className="password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={profile.password}
                        onChange={(event) => updateProfile('password', event.target.value)}
                        placeholder="Create password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  <label>
                    Confirm password
                    <div className="password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repeat password"
                        required
                      />
                    </div>
                  </label>
                </div>
              )}

              {authMode === 'signin' && (
                <>
                  <label>
                    Email or username
                    <input
                      type="text"
                      value={signinIdentifier}
                      onChange={(event) => setSigninIdentifier(event.target.value)}
                      placeholder="Email, Admin, or Staff"
                      required
                    />
                  </label>

                  <label>
                    Password
                    <div className="password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={profile.password}
                        onChange={(event) => updateProfile('password', event.target.value)}
                        placeholder="Enter password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>
                </>
              )}

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
                          {getFlagEmoji(entry.code)} {entry.name}
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
                <div className="avatar-picker compact-avatar-picker">
                  <div className="panel-heading">
                    <p className="eyebrow">Avatar</p>
                    <h2>Choose a look</h2>
                    <p>Pick one icon or add a photo.</p>
                  </div>
                  <div className="field-grid compact-picker-grid">
                    <label>
                      Icon
                      <select
                        value={profile.avatarMode === 'generated' ? profile.avatarEmoji : generatedAvatarOptions[0].emoji}
                        onChange={(event) => chooseGeneratedAvatar(event.target.value)}
                      >
                        {generatedAvatarOptions.map((option) => (
                          <option key={`${profile.gender}-${option.emoji}-${option.label}`} value={option.emoji}>
                            {option.emoji} {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="upload-avatar upload-avatar-compact">
                      <span className="upload-avatar-icon" aria-hidden="true">📷</span>
                      <span>Add picture</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleAvatarUpload(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <div className="avatar-preview-card compact-avatar-preview">
                    <ProfileMark profile={profile} />
                    <div>
                      <strong>{profile.avatarMode === 'upload' ? 'Photo' : chosenAvatarOption?.label ?? 'Icon'}</strong>
                      <p>{getFlagEmoji(profile.countryCode)} {getCountryByCode(profile.countryCode).name}</p>
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
                    <p>{getFlagEmoji(country.code)} {country.name} · {getStageLabel(profile.stage)}</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="primary-button action-button-prominent" onClick={logout}>
                      Sign out
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Today&apos;s learning</p>
                    <h2>Pick a subject</h2>
                    <p>Notes, video, quiz, or exam.</p>
                  </div>

                  <div className="page-chip-row">
                    <span className="page-chip page-chip-active">📚 Subjects</span>
                    <span className="page-chip">{getFlagEmoji(country.code)} {country.name}</span>
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
                <section className="side-card accent-side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Quick feedback</p>
                    <h2>Tell us how it feels</h2>
                    <p>One short survey helps us make lessons and pages better.</p>
                  </div>
                  <button type="button" className="primary-button" onClick={openFeedbackPage}>
                    Open feedback
                  </button>
                </section>

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
                    <p>{getFlagEmoji(country.code)} {country.name} · {profile.level}</p>
                  </div>
                  <div className="banner-actions">
                    <button
                      type="button"
                      className="primary-button action-button-prominent"
                      onClick={() => setStudentView('home')}
                    >
                      Back to subjects
                    </button>
                    <button type="button" className="primary-button" onClick={logout}>
                      Sign out
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Choose an activity</p>
                    <h2>Learn, quiz, or sit a full exam</h2>
                    <p>Pick one and continue.</p>
                  </div>
                  <div className="option-grid">
                    <button type="button" className="subject-card" onClick={() => openLearningNotes(activeStudentSubject)}>
                      <span className="subject-icon">📘</span>
                      <strong>Learning notes</strong>
                      <span>{getFlagEmoji(country.code)} {country.name} · {profile.level}</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => openVideoLesson(activeStudentSubject)}>
                      <span className="subject-icon">🎬</span>
                      <strong>Video lesson</strong>
                      <span>{learningVideo.durationLabel}</span>
                    </button>
                    <button type="button" className="subject-card" onClick={openFeedbackPage}>
                      <span className="subject-icon">💡</span>
                      <strong>Feedback survey</strong>
                      <span>Quick rating and comment.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => startQuiz(activeStudentSubject, 'quiz')}>
                      <span className="subject-icon">📝</span>
                      <strong>Quick quiz</strong>
                      <span>Short fresh practice.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => startQuiz(activeStudentSubject, 'exam')}>
                      <span className="subject-icon">🎓</span>
                      <strong>Full exam</strong>
                      <span>Longer test run.</span>
                    </button>
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Video lesson</p>
                    <h2>{learningVideo.title}</h2>
                    <p>{learningVideo.durationLabel}</p>
                  </div>
                  <div className="video-scene-list">
                    {learningVideo.scenes.slice(0, 3).map((scene) => (
                      <article key={scene.title} className="video-scene-card">
                        <span className="subject-icon video-scene-icon">{scene.visual}</span>
                        <div>
                          <strong>{scene.title}</strong>
                          <p>{scene.narration}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                  <button type="button" className="primary-button" onClick={() => openVideoLesson(activeStudentSubject)}>
                    Open lesson
                  </button>
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
          ) : studentView === 'notes' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Learning notes</p>
                    <h2>{activeStudentSubject} reading book</h2>
                    <p>{getFlagEmoji(country.code)} {country.name} · {profile.level}</p>
                  </div>
                  <div className="banner-actions">
                    <button
                      type="button"
                      className="primary-button action-button-prominent"
                      onClick={() => setStudentView('subject')}
                    >
                      Back to subject page
                    </button>
                    <button type="button" className="primary-button" onClick={logout}>
                      Sign out
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="book-cover">
                    <div className="book-cover-mark">{learningMaterial.bookIcon}</div>
                    <div className="book-cover-copy">
                      <p className="eyebrow">Reading book</p>
                      <h2>{learningMaterial.title}</h2>
                      <p>{learningMaterial.subtitle}</p>
                      <span className="book-source">{learningMaterial.sourceLine}</span>
                    </div>
                  </div>
                  <div className="page-chip-row">
                    <button type="button" className="page-chip page-chip-button page-chip-active" onClick={() => openLearningNotes(activeStudentSubject)}>
                      Learning notes
                    </button>
                    <button type="button" className="page-chip page-chip-button" onClick={() => startQuiz(activeStudentSubject, 'quiz')}>
                      Quick quiz
                    </button>
                    <button type="button" className="page-chip page-chip-button" onClick={() => startQuiz(activeStudentSubject, 'exam')}>
                      Full exam
                    </button>
                    {profile.plan === 'elite' && reviewSnapshot?.subject === activeStudentSubject && (
                      <button type="button" className="page-chip page-chip-button" onClick={() => setStudentView('review')}>
                        Review quiz
                      </button>
                    )}
                  </div>
                  <article className="book-intro-card">
                    <strong>{learningMaterial.intro}</strong>
                    <p>{learningMaterial.activityHint}</p>
                  </article>
                  <div className="chapter-list">
                    {learningMaterial.chapters.map((chapter, index) => (
                      <article key={`${chapter.title}-${index}`} className="chapter-card">
                        <div className="chapter-badge">Chapter {index + 1}</div>
                        <strong>{chapter.title}</strong>
                        <p>{chapter.summary}</p>
                        <ul className="chapter-points">
                          {chapter.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Study flow</p>
                    <h2>Turn notes into practice</h2>
                    <p>Read the short book, then move into fresh questions built for the same subject.</p>
                  </div>
                  <div className="option-grid option-grid-single">
                    <button type="button" className="subject-card" onClick={() => startQuiz(activeStudentSubject, 'quiz')}>
                      <span className="subject-icon">📝</span>
                      <strong>Start quick quiz</strong>
                      <span>Use shorter revision questions after reading.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => startQuiz(activeStudentSubject, 'exam')}>
                      <span className="subject-icon">🎓</span>
                      <strong>Start full exam</strong>
                      <span>Take a longer exam when the chapter ideas feel clear.</span>
                    </button>
                  </div>
                </section>
              </aside>
            </>
          ) : studentView === 'video' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Video lesson</p>
                    <h2>{learningVideo.title}</h2>
                    <p>{getFlagEmoji(country.code)} {country.name} · {learningVideo.durationLabel}</p>
                  </div>
                  <div className="banner-actions">
                    <button
                      type="button"
                      className="primary-button action-button-prominent"
                      onClick={() => setStudentView('subject')}
                    >
                      Back to subject
                    </button>
                    <button type="button" className="primary-button" onClick={logout}>
                      Sign out
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="book-cover video-lesson-hero">
                    <div className="book-cover-mark">🎬</div>
                    <div className="book-cover-copy">
                      <p className="eyebrow">Lesson reel</p>
                      <h2>{learningVideo.subtitle}</h2>
                      <p>{learningVideo.intro}</p>
                    </div>
                  </div>
                  <div className="page-chip-row">
                    <button type="button" className="page-chip page-chip-button" onClick={() => openLearningNotes(activeStudentSubject)}>
                      Notes
                    </button>
                    <button type="button" className="page-chip page-chip-button page-chip-active" onClick={() => openVideoLesson(activeStudentSubject)}>
                      Video
                    </button>
                    <button type="button" className="page-chip page-chip-button" onClick={() => startQuiz(activeStudentSubject, 'quiz')}>
                      Quiz
                    </button>
                    <button type="button" className="page-chip page-chip-button" onClick={() => startQuiz(activeStudentSubject, 'exam')}>
                      Exam
                    </button>
                  </div>
                  <div className="video-scene-list video-scene-list-full">
                    {learningVideo.scenes.map((scene, index) => (
                      <article key={`${scene.title}-${index}`} className="video-scene-card video-scene-card-full">
                        <span className="subject-icon video-scene-icon">{scene.visual}</span>
                        <div>
                          <strong>{scene.title}</strong>
                          <p>{scene.subtitle}</p>
                          <p>{scene.narration}</p>
                          <ul className="simple-list">
                            {scene.bullets.map((bullet) => (
                              <li key={bullet}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Next step</p>
                    <h2>Keep learning</h2>
                    <p>Open notes again or move straight into fresh practice.</p>
                  </div>
                  <div className="option-grid option-grid-single">
                    <button type="button" className="subject-card" onClick={() => openLearningNotes(activeStudentSubject)}>
                      <span className="subject-icon">📘</span>
                      <strong>Open notes</strong>
                      <span>Read the book version.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => startQuiz(activeStudentSubject, 'quiz')}>
                      <span className="subject-icon">📝</span>
                      <strong>Start quiz</strong>
                      <span>Use a short fresh set.</span>
                    </button>
                  </div>
                </section>
              </aside>
            </>
          ) : studentView === 'review' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Review page</p>
                    <h2>{reviewSnapshot?.subject ?? activeStudentSubject}</h2>
                    <p>Elite learners can revisit each answer and compare it with the correct one.</p>
                  </div>
                  <div className="banner-actions">
                    <button
                      type="button"
                      className="primary-button action-button-prominent"
                      onClick={() => setStudentView('subject')}
                    >
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
          ) : (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Feedback survey</p>
                    <h2>Tell us how this learning page feels</h2>
                    <p>{getFlagEmoji(country.code)} {activeStudentSubject} · {profile.level}</p>
                  </div>
                  <div className="banner-actions">
                    <button
                      type="button"
                      className="primary-button action-button-prominent"
                      onClick={() => setStudentView('subject')}
                    >
                      Back to subject
                    </button>
                    <button type="button" className="primary-button" onClick={logout}>
                      Sign out
                    </button>
                  </div>
                </section>

                <section className="setup-panel feedback-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Quick survey</p>
                    <h2>Simple feedback</h2>
                    <p>Rate the experience, choose one main point, and leave an optional comment.</p>
                  </div>
                  <article className="feedback-card">
                    <div className="feedback-row">
                      <strong>How do you rate this page?</strong>
                      <FeedbackStars rating={feedbackRating} onChange={setFeedbackRating} />
                    </div>
                    <label>
                      Best match
                      <select value={feedbackChoice} onChange={(event) => setFeedbackChoice(event.target.value)}>
                        {FEEDBACK_CHOICES.map((choice) => (
                          <option key={choice} value={choice}>
                            {choice}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Comment
                      <textarea
                        rows={4}
                        value={feedbackComment}
                        onChange={(event) => setFeedbackComment(event.target.value)}
                        placeholder="Add one short note if you want."
                      />
                    </label>
                    {authNotice && <p className="auth-notice auth-notice-inline">{authNotice}</p>}
                    <div className="sample-buttons">
                      <button type="button" className="primary-button" onClick={submitFeedback}>
                        Send feedback
                      </button>
                      <button type="button" className="ghost-button" onClick={() => setStudentView('subject')}>
                        Not now
                      </button>
                    </div>
                  </article>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">What happens</p>
                    <h2>Your voice helps</h2>
                    <p>Low ratings rise first.</p>
                  </div>
                  <div className="mini-stat-list">
                    <article className="mini-stat-card">
                      <span>⭐</span>
                      <strong>{feedbackSummary.average || 0}</strong>
                    </article>
                    <article className="mini-stat-card">
                      <span>⚠️</span>
                      <strong>{feedbackSummary.lowCount}</strong>
                    </article>
                  </div>
                </section>
              </aside>
            </>
          )}
        </main>
      ) : screen === 'staff' ? (
        <main className="dashboard-layout">
          <section className="dashboard-main">
            <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">Staff lounge</p>
                    <h2>{firstName}, support today&apos;s learners</h2>
                    <p>{getFlagEmoji(country.code)} {country.name} · {profile.subject}</p>
                  </div>
              <div className="banner-actions">
                <button type="button" className="primary-button action-button-prominent" onClick={logout}>
                  Sign out
                </button>
              </div>
            </section>

            <section className="stats-grid">
              <article className="info-card">
                <strong>🧒 Learners</strong>
                <p>{focusedLearners.length}</p>
              </article>
              <article className="info-card">
                <strong>📚 Active</strong>
                <p>{recentActiveLearners.length}</p>
              </article>
              <article className="info-card">
                <strong>👥 Staff</strong>
                <p>{staffRegistrations.length || onlineStaffMembers.length}</p>
              </article>
              <article className="info-card">
                <strong>⚠️ Alerts</strong>
                <p>{feedbackSummary.lowCount}</p>
              </article>
            </section>

            <section className="setup-panel">
              <div className="panel-heading">
                <p className="eyebrow">Today</p>
                <h2>Assigned lounge</h2>
                <p>Keep an eye on recent learners, low ratings, and where support is needed next.</p>
              </div>
              <div className="history-list">
                {recentLearnerActivity.length > 0 ? recentLearnerActivity.slice(0, 5).map((entry) => (
                  <article key={entry.id} className="history-row">
                    <div>
                      <strong>{entry.fullName}</strong>
                      <span>
                        {getFlagEmoji(entry.countryCode)} {entry.subject} · {entry.level}
                      </span>
                    </div>
                    <strong>{entry.lastLoginAt ? 'Active' : 'New'}</strong>
                  </article>
                )) : (
                  <p className="empty-state">Learner activity will show here as people start practising.</p>
                )}
              </div>
            </section>
          </section>

          <aside className="dashboard-side">
            <section className="side-card accent-side-card">
              <div className="panel-heading">
                <p className="eyebrow">AI summary</p>
                <h2>{feedbackSummary.headline}</h2>
                <p>{feedbackSummary.detail}</p>
              </div>
              <div className="history-list">
                {recentFeedback.length > 0 ? recentFeedback.map((entry) => (
                  <article key={entry.id} className="history-row">
                    <div>
                      <strong>{'⭐'.repeat(entry.rating)}</strong>
                      <span>
                        {getFlagEmoji(entry.countryCode)} {entry.choice}
                      </span>
                      {entry.comment && <span>{entry.comment}</span>}
                    </div>
                  </article>
                )) : (
                  <p className="empty-state">Survey replies will show here after learners send feedback.</p>
                )}
              </div>
            </section>
          </aside>
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
                        {speakingKey === currentQuestion.visual.soundText ? 'Speaking...' : 'Hear it'}
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
                    <p>{getFlagEmoji(adminCountry.code)} {adminCountry.name} · {adminCountry.curriculum}</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="primary-button" onClick={logout}>
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
                    <p>{recentActiveLearners.length}</p>
                  </article>
                  <article className="info-card">
                    <strong>Staff online</strong>
                    <p>{onlineStaffMembers.length}</p>
                  </article>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Admin pages</p>
                    <h2>Open a page</h2>
                  </div>
                  <AdminTabs active={adminView} onChange={openAdminView} />
                  <div className="option-grid">
                    <button type="button" className="subject-card" onClick={() => openAdminView('countries')}>
                      <span className="subject-icon">🌍</span>
                      <strong>Countries</strong>
                    </button>
                    <button type="button" className="subject-card" onClick={() => openAdminView('staff')}>
                      <span className="subject-icon">👥</span>
                      <strong>Staff</strong>
                    </button>
                    <button type="button" className="subject-card" onClick={() => openAdminView('learners')}>
                      <span className="subject-icon">🧾</span>
                      <strong>Learners</strong>
                    </button>
                    <button type="button" className="subject-card" onClick={() => openAdminView('followups')}>
                      <span className="subject-icon">📌</span>
                      <strong>Follow-ups</strong>
                    </button>
                    <button type="button" className="subject-card" onClick={() => openAdminView('reports')}>
                      <span className="subject-icon">📊</span>
                      <strong>Reports</strong>
                    </button>
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Quick view</p>
                    <h2>At a glance</h2>
                  </div>
                  <div className="mini-stat-list">
                    <article className="mini-stat-card">
                      <span>🧒</span>
                      <strong>{learnerRegistrations.length}</strong>
                    </article>
                    <article className="mini-stat-card">
                      <span>🌍</span>
                      <strong>{registrationsByCountry.length}</strong>
                    </article>
                    <article className="mini-stat-card">
                      <span>📚</span>
                      <strong>{recentActiveLearners.length}</strong>
                    </article>
                    <article className="mini-stat-card">
                      <span>👥</span>
                      <strong>{onlineStaffMembers.length}</strong>
                    </article>
                  </div>
                </section>
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">AI summary</p>
                    <h2>{feedbackSummary.headline}</h2>
                    <p>What learners are saying.</p>
                  </div>
                  <div className="mini-stat-list">
                    <article className="mini-stat-card">
                      <span>⭐</span>
                      <strong>{feedbackSummary.average || 0}</strong>
                    </article>
                    <article className="mini-stat-card">
                      <span>⚠️</span>
                      <strong>{feedbackSummary.lowCount}</strong>
                    </article>
                  </div>
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
                    <p>Pick a flag.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => openAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <AdminTabs active={adminView} onChange={openAdminView} />
                  <div className="country-list">
                    {countryRegistrationCards.length > 0 ? countryRegistrationCards.map((entry) => {
                      const entryCountry = getCountryByCode(entry.code);

                      return (
                        <button
                          key={entry.code}
                          type="button"
                          className={`country-button${adminFocusCode === entry.code ? ' country-button-active' : ''}`}
                          onClick={() => setAdminFocusCode(entry.code)}
                        >
                          <div className="country-button-main">
                            <span className="flag-badge" aria-hidden="true">{getFlagEmoji(entry.code)}</span>
                            <strong>{entryCountry.name}</strong>
                          </div>
                          <div className="country-badges">
                            <span className="mini-badge">🧒 {entry.learners}</span>
                            <span className="mini-badge">🏠 {entry.families}</span>
                          </div>
                        </button>
                      );
                    }) : (
                      <p className="empty-state">Country totals will appear here as learners register.</p>
                    )}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Country focus</p>
                    <h2>{getFlagEmoji(adminCountry.code)} {adminCountry.name}</h2>
                    <p>{adminCountry.curriculum}</p>
                  </div>
                  <div className="history-list">
                    {followUpItems.map((item) => (
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
                    <p>Team.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => openAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Manage staff</p>
                    <h2>Staff</h2>
                    {adminNotice && <p>{adminNotice}</p>}
                  </div>
                  <AdminTabs active={adminView} onChange={openAdminView} />
                  <div className="field-grid">
                    <label>
                      Staff name
                      <input
                        value={staffDraft.name}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Name"
                      />
                    </label>
                    <label>
                      Role
                      <input
                        value={staffDraft.role}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, role: event.target.value }))}
                        placeholder="Role"
                      />
                    </label>
                    <label className="field-span-2">
                      Support focus
                      <input
                        value={staffDraft.focus}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, focus: event.target.value }))}
                        placeholder="Focus"
                      />
                    </label>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button ghost-button-small" onClick={addStaffMember}>
                      Add staff
                    </button>
                  </div>
                  <div className="history-list">
                    {staffMembers.length > 0 ? staffMembers.map((member) => (
                      <article key={`${member.name}-${member.role}`} className="history-row">
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.role}</span>
                        </div>
                        <div className="row-actions">
                          <strong>{member.status}</strong>
                          <button
                            type="button"
                            className="ghost-button ghost-button-small"
                            onClick={() => removeStaffMember(member.id ?? member.name)}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    )) : (
                      <p className="empty-state">Add staff records here to start building your live admin team.</p>
                    )}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Staff links</p>
                    <h2>Team</h2>
                  </div>
                  <div className="history-list">
                    {(focusedStaffMembers.length > 0 ? focusedStaffMembers : staffMembers).length > 0 ? (focusedStaffMembers.length > 0 ? focusedStaffMembers : staffMembers).map((member) => (
                      <article key={`${member.name}-${member.role}`} className="history-row">
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.role}</span>
                        </div>
                        <strong>{member.status}</strong>
                      </article>
                    )) : (
                      <p className="empty-state">Staff records will appear here after you add team members.</p>
                    )}
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
                    <p>Live sign-ups.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => openAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Learner records</p>
                    <h2>Learners</h2>
                  </div>
                  <AdminTabs active={adminView} onChange={openAdminView} />
                  <div className="country-groups">
                    {registrationsGroupedByCountry.length > 0 ? registrationsGroupedByCountry.map(({ country, learners }) => (
                      <section key={country.code} className="country-group-card">
                        <div className="panel-heading">
                          <p className="eyebrow">{getFlagEmoji(country.code)} {country.name}</p>
                          <h2>{learners.length} learner{learners.length === 1 ? '' : 's'}</h2>
                        </div>
                        <div className="history-list">
                          {learners.map((entry) => (
                            <article key={entry.id} className="history-row">
                              <div>
                                <strong>{entry.fullName}</strong>
                                <span>
                                  {getFlagEmoji(entry.countryCode)} {getPlanLabel(entry.plan)} · {getStageLabel(entry.stage)}
                                </span>
                              </div>
                              <div className="row-actions">
                                <strong>{entry.lastLoginAt ? new Date(entry.lastLoginAt).toLocaleDateString() : 'New'}</strong>
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
                  </div>
                  <div className="history-list">
                    {registrationsByCountry.length > 0 ? registrationsByCountry.map((entry) => (
                      <article key={entry.code} className="history-row">
                        <div>
                          <strong>{getFlagEmoji(entry.code)} {getCountryByCode(entry.code).name}</strong>
                          <span>{entry.learners} · {entry.families}</span>
                        </div>
                        <strong>👥</strong>
                      </article>
                    )) : (
                      <p className="empty-state">Country totals will appear after learners create accounts.</p>
                    )}
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
                    <p>Support list.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => openAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Queue actions</p>
                    <h2>Follow-ups</h2>
                    {adminNotice && <p>{adminNotice}</p>}
                  </div>
                  <AdminTabs active={adminView} onChange={openAdminView} />
                  <div className="banner-actions">
                    <button type="button" className="ghost-button ghost-button-small" onClick={addCountryFollowUp}>
                      Add follow-up
                    </button>
                    <button type="button" className="ghost-button ghost-button-small" onClick={exportCountryReport}>
                      Export report
                    </button>
                  </div>
                  <div className="history-list">
                    {followUpItems.length > 0 ? followUpItems.map((item) => (
                      <article key={item.title} className="history-row">
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                        </div>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="ghost-button ghost-button-small"
                            onClick={() => removeCountryFollowUp(item.title)}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    )) : (
                      <p className="empty-state">Follow-up items will appear here when real learner activity needs support.</p>
                    )}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Country focus</p>
                    <h2>{getFlagEmoji(adminCountry.code)} {adminCountry.name}</h2>
                  </div>
                  <div className="country-list">
                    {countryRegistrationCards.length > 0 ? countryRegistrationCards.map((entry) => (
                      <button
                        key={entry.code}
                        type="button"
                        className={`country-button${adminFocusCode === entry.code ? ' country-button-active' : ''}`}
                        onClick={() => setAdminFocusCode(entry.code)}
                      >
                        <div className="country-button-main">
                          <span className="flag-badge" aria-hidden="true">{getFlagEmoji(entry.code)}</span>
                          <strong>{getCountryByCode(entry.code).name}</strong>
                        </div>
                        <div className="country-badges">
                          <span className="mini-badge">🧒 {entry.learners}</span>
                          <span className="mini-badge">🏠 {entry.families}</span>
                        </div>
                      </button>
                    )) : (
                      <p className="empty-state">No registered countries yet. New learner sign-ups will appear here automatically.</p>
                    )}
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
                    <p>Live view.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => openAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Current learning</p>
                    <h2>Current learner activity</h2>
                    {adminNotice && <p>{adminNotice}</p>}
                  </div>
                  <AdminTabs active={adminView} onChange={openAdminView} />
                  <div className="stats-grid report-stats-grid">
                    <article className="info-card">
                      <strong>📚 Activity</strong>
                      <p>{reportActivity.length}</p>
                    </article>
                    <article className="info-card">
                      <strong>📌 Follow-ups</strong>
                      <p>{followUpItems.length}</p>
                    </article>
                    <article className="info-card">
                      <strong>🏆 Top subject</strong>
                      <p>{subjectInsights[0]?.subject ?? 'No activity yet'}</p>
                    </article>
                    <article className="info-card">
                      <strong>🌍 Country</strong>
                      <p>{getFlagEmoji(adminCountry.code)} {adminCountry.name}</p>
                    </article>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button ghost-button-small" onClick={exportCountryReport}>
                      Download report
                    </button>
                  </div>
                  <div className="history-list">
                    {reportActivity.length > 0 ? reportActivity.map((session) => (
                      <article key={`${session.learner}-${session.subject}-${session.staff}`} className="history-row">
                        <div>
                          <strong>{session.learner}</strong>
                          <span>{session.subject} · {session.plan} · {session.status}</span>
                          <span>{session.support}</span>
                        </div>
                        <div className="row-actions">
                          <strong>{session.staff}</strong>
                          <button
                            type="button"
                            className="ghost-button ghost-button-small"
                            onClick={() => removeReportActivity(`${session.learner}-${session.subject}-${session.staff}`)}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    )) : (
                    <p className="empty-state">Current learner activity will appear here as learners sign in and practise.</p>
                  )}
                </div>
              </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Top performers</p>
                    <h2>Leaderboard</h2>
                  </div>
                  <div className="leaderboard-list">
                    {leaderboard.map((entry, index) => (
                      <article key={`${entry.name}-${index}`} className="leaderboard-row">
                        <div>
                          <strong>#{index + 1} {entry.name}</strong>
                          <span>{getFlagEmoji(entry.countryCode)} {getCountryByCode(entry.countryCode).name}</span>
                        </div>
                        <strong>{entry.score}%</strong>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Popular subjects</p>
                    <h2>Subjects</h2>
                  </div>
                  <div className="history-list">
                    {subjectInsights.length > 0 ? subjectInsights.map((item) => (
                      <article key={item.subject} className="history-row">
                        <div>
                          <strong>{item.subject}</strong>
                          <span>
                            {item.learners} learner{item.learners === 1 ? '' : 's'}
                            {item.averageScore > 0 ? ` · average ${item.averageScore}%` : ''}
                          </span>
                        </div>
                        <strong>{item.trend}</strong>
                      </article>
                    )) : (
                      <p className="empty-state">Subject activity will appear here after learners begin using the app.</p>
                    )}
                  </div>
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">AI summary</p>
                    <h2>{feedbackSummary.headline}</h2>
                    <p>{feedbackSummary.detail}</p>
                  </div>
                  <div className="history-list">
                    {recentFeedback.length > 0 ? recentFeedback.map((entry) => (
                      <article key={entry.id} className="history-row">
                        <div>
                          <strong>{'⭐'.repeat(entry.rating)}</strong>
                          <span>
                            {getFlagEmoji(entry.countryCode)} {entry.choice}
                          </span>
                          {entry.comment && <span>{entry.comment}</span>}
                        </div>
                      </article>
                    )) : (
                      <p className="empty-state">Survey replies will show here after learners send feedback.</p>
                    )}
                  </div>
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Plan mix</p>
                    <h2>Plans</h2>
                  </div>
                  <div className="history-list">
                    {planMix.map((item) => (
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
