import { CSSProperties, FormEvent, SVGProps, useEffect, useState } from 'react';
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
type ThemeVars = {
  '--theme-primary': string;
  '--theme-secondary': string;
  '--theme-accent': string;
  '--theme-surface': string;
  '--theme-ink': string;
};

type QuizState = {
  activeSubject: string;
  questions: Question[];
  answers: Record<string, string>;
  currentIndex: number;
  result: QuizResult | null;
};

type StoredState = {
  profile?: LearnerProfile;
  attempts?: AttemptRecord[];
  authMode?: AuthMode;
  themeMode?: ThemeMode;
  screen?: Screen;
  quizState?: QuizState | null;
};

type SampleAccount = {
  id: string;
  label: string;
  short: string;
  profile: LearnerProfile;
};

const STORAGE_KEY = 'review-buddy-state';

const COLOR_MAP: Record<string, string> = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Green: '#22c55e',
  Yellow: '#facc15',
};

const sampleAccounts: SampleAccount[] = [
  {
    id: 'free',
    label: 'Free sample',
    short: 'Free',
    profile: {
      fullName: 'Daniel Free',
      email: 'free@reviewbuddy.app',
      password: 'demo123',
      role: 'student',
      countryCode: 'US',
      plan: 'free',
      stage: 'teen',
      level: 'Year 8',
      mode: 'solo',
      subject: 'Mathematics',
    },
  },
  {
    id: 'trial',
    label: 'Trial sample',
    short: 'Trial',
    profile: {
      fullName: 'Amina Trial',
      email: 'trial@reviewbuddy.app',
      password: 'demo123',
      role: 'student',
      countryCode: 'KE',
      plan: 'trial',
      stage: 'primary',
      level: 'Grade 4',
      mode: 'solo',
      subject: 'Mathematics',
    },
  },
  {
    id: 'elite',
    label: 'Elite sample',
    short: 'Elite',
    profile: {
      fullName: 'Noor Elite',
      email: 'elite@reviewbuddy.app',
      password: 'demo123',
      role: 'student',
      countryCode: 'AE',
      plan: 'elite',
      stage: 'teen',
      level: 'Year 10',
      mode: 'solo',
      subject: 'Biology',
    },
  },
  {
    id: 'kindergarten',
    label: 'Kindergarten sample',
    short: 'Kinder',
    profile: {
      fullName: 'Little Star',
      email: 'kinder@reviewbuddy.app',
      password: 'demo123',
      role: 'student',
      countryCode: 'TZ',
      plan: 'trial',
      stage: 'kindergarten',
      level: 'Middle Class',
      mode: 'solo',
      subject: 'Colouring',
    },
  },
  {
    id: 'admin',
    label: 'Admin sample',
    short: 'Admin',
    profile: {
      fullName: 'Grace Admin',
      email: 'admin@reviewbuddy.app',
      password: 'demo123',
      role: 'admin',
      countryCode: 'GB',
      plan: 'elite',
      stage: 'teen',
      level: 'Year 9',
      mode: 'solo',
      subject: 'Mathematics',
    },
  },
];

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
    title: 'Quick to start',
    detail: 'Short setup for parents, learners, and schools.',
  },
  {
    title: 'Fresh every time',
    detail: 'Question sets change often so practice feels new.',
  },
  {
    title: 'Clear progress',
    detail: 'Scores, attempts, and top performers stay easy to follow.',
  },
];

const adminPrivileges = [
  'Watch live learner activity',
  'Check score trends and plan usage',
  'See subject leaderboards',
  'Manage from one simple overview',
];

function createInitialProfile(): LearnerProfile {
  const countryCode = inferCountryCode();
  const stage: Stage = 'primary';
  const subject = getAvailableSubjects(countryCode, stage, 'trial')[0];

  return {
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    countryCode,
    plan: 'trial',
    stage,
    level: getLevelOptions(stage)[0],
    mode: 'solo',
    subject,
  };
}

function LogoMark() {
  return (
    <div className="logo-mark" aria-hidden="true">
      <span className="logo-bubble logo-bubble-main">R</span>
      <span className="logo-bubble logo-bubble-sub">B</span>
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

function App() {
  const [profile, setProfile] = useState<LearnerProfile>(createInitialProfile);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [themeMode, setThemeMode] = useState<ThemeMode>('country');
  const [screen, setScreen] = useState<Screen>('auth');
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setIsReady(true);
      return;
    }

    try {
      const saved = JSON.parse(raw) as StoredState;

      if (saved.profile) setProfile(saved.profile);
      if (saved.attempts) setAttempts(saved.attempts);
      if (saved.authMode) setAuthMode(saved.authMode);
      if (saved.themeMode) setThemeMode(saved.themeMode);
      if (saved.screen) setScreen(saved.screen);
      if (saved.quizState) setQuizState(saved.quizState);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile,
        attempts,
        authMode,
        themeMode,
        screen,
        quizState,
      } satisfies StoredState),
    );
  }, [attempts, authMode, isReady, profile, quizState, screen, themeMode]);

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

  const country = getCountryByCode(profile.countryCode);
  const availableSubjects = getAvailableSubjects(profile.countryCode, profile.stage, profile.plan);
  const currentQuestion = quizState?.questions[quizState.currentIndex];
  const leaderboard = getLeaderboard(
    quizState?.activeSubject ?? profile.subject,
    profile,
    quizState?.result ?? undefined,
  );
  const metrics = getAdminMetrics(profile.countryCode);

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

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (screen !== 'quiz' || !currentQuestion || profile.stage !== 'kindergarten') return;

    const spoken = currentQuestion.visual?.soundText ?? currentQuestion.prompt;
    const timer = window.setTimeout(() => {
      speakPrompt(spoken);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [currentQuestion?.id, profile.stage, screen]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function enterWorkspace(nextProfile: LearnerProfile) {
    setProfile(nextProfile);
    setQuizState(null);
    setScreen(nextProfile.role === 'admin' ? 'admin' : 'student');
  }

  function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    enterWorkspace(withDisplayName(profile));
  }

  function useSampleAccount(sample: SampleAccount) {
    setAuthMode('signin');
    enterWorkspace(sample.profile);
  }

  function logout() {
    setScreen('auth');
    setQuizState(null);
  }

  function startQuiz(subject: string) {
    const nextProfile = { ...profile, subject };
    const questions = generateQuestions(nextProfile);
    setProfile(nextProfile);
    setQuizState({
      activeSubject: subject,
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
    setScreen('student');
    setQuizState(null);
    setIsSliding(false);
  }

  const selectedAnswer = currentQuestion && quizState ? quizState.answers[currentQuestion.id] : '';
  const colorFill = selectedAnswer ? COLOR_MAP[selectedAnswer] : undefined;

  return (
    <div className="app-shell" style={themeStyle}>
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />

      <header className="topbar">
        <div className="brand-lockup">
          <LogoMark />
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
            <h2>Learning that feels welcoming for kids, teens, and families.</h2>
            <p className="hero-copy">
              Sign in or create an account, then move into a clean learning page with subject
              cards, full-screen question cards, scores, and simple progress tracking.
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
              <p className="eyebrow">Get started</p>
              <h2>{authMode === 'signin' ? 'Sign in to continue' : 'Create a new account'}</h2>
              <p>New student accounts begin with a 5-day Elite trial.</p>
            </div>

            <div className="mode-toggle" role="tablist" aria-label="Account mode">
              <button
                type="button"
                className={`mode-toggle-button${authMode === 'signin' ? ' mode-toggle-button-active' : ''}`}
                onClick={() => setAuthMode('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`mode-toggle-button${authMode === 'signup' ? ' mode-toggle-button-active' : ''}`}
                onClick={() => setAuthMode('signup')}
              >
                Register
              </button>
            </div>

            <div className="sample-strip">
              <p className="small-label">Try a sample account</p>
              <div className="sample-buttons">
                {sampleAccounts.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className="sample-button"
                    onClick={() => useSampleAccount(sample)}
                  >
                    {sample.short}
                  </button>
                ))}
              </div>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="role-pills">
                <button
                  type="button"
                  className={`role-pill${profile.role === 'student' ? ' role-pill-active' : ''}`}
                  onClick={() => updateProfile('role', 'student')}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`role-pill${profile.role === 'admin' ? ' role-pill-active' : ''}`}
                  onClick={() => updateProfile('role', 'admin')}
                >
                  Admin
                </button>
              </div>

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

                  {profile.role === 'student' && (
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
                  )}
                </div>
              )}

              <button className="primary-button" type="submit">
                {authMode === 'signin' ? 'Continue' : 'Create account'}
              </button>
            </form>
          </section>
        </main>
      ) : screen === 'student' ? (
        <main className="dashboard-layout">
          <section className="dashboard-main">
            <section className="welcome-banner">
              <div>
                <p className="eyebrow">Student page</p>
                <h2>{getStageLabel(profile.stage)}</h2>
                <p>{country.name} · {getPlanLabel(profile.plan)}</p>
              </div>
              <div className="banner-actions">
                <button type="button" className="ghost-button" onClick={logout}>
                  Sign out
                </button>
              </div>
            </section>

            <section className="setup-panel">
              <div className="panel-heading">
                <p className="eyebrow">Learning setup</p>
                <h2>Pick a subject card to begin</h2>
                <p>Each subject opens a full-screen question page and creates a fresh quiz set.</p>
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
                      onClick={() => startQuiz(subject)}
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
                <p className="eyebrow">Leaderboard</p>
                <h2>{profile.subject}</h2>
                <p>Top scores for this subject.</p>
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
                <p className="eyebrow">Recent scores</p>
                <h2>Latest results</h2>
                <p>Your quiz history appears here.</p>
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
                Quit
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
                        onClick={() => speakPrompt(currentQuestion.visual?.soundText ?? currentQuestion.prompt)}
                      >
                        Hear it
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
                      ? 'Well done. You completed this quiz successfully.'
                      : 'Good effort. Try another fresh quiz to improve your score.'}
                  </p>
                  <div className="result-actions">
                    <button type="button" className="primary-button" onClick={() => startQuiz(quizState.activeSubject)}>
                      Play again
                    </button>
                    <button type="button" className="ghost-button" onClick={quitQuiz}>
                      Back to subjects
                    </button>
                  </div>
                </div>
              )}
            </article>
          </div>
        </main>
      ) : (
        <main className="dashboard-layout">
          <section className="dashboard-main">
            <section className="welcome-banner">
              <div>
                <p className="eyebrow">Admin page</p>
                <h2>Learning overview</h2>
                <p>{metrics.country.name} · {metrics.country.curriculum}</p>
              </div>
              <div className="banner-actions">
                <button type="button" className="ghost-button" onClick={logout}>
                  Sign out
                </button>
              </div>
            </section>

            <section className="stats-grid">
              <article className="info-card">
                <strong>Active learners</strong>
                <p>{metrics.activeLearners}</p>
              </article>
              <article className="info-card">
                <strong>Live sessions</strong>
                <p>{metrics.liveSessions}</p>
              </article>
              <article className="info-card">
                <strong>Average score</strong>
                <p>{metrics.averageScore}%</p>
              </article>
              <article className="info-card">
                <strong>Trial users</strong>
                <p>{metrics.trialUsers}</p>
              </article>
            </section>

            <section className="admin-grid">
              <article className="side-card">
                <div className="panel-heading">
                  <p className="eyebrow">Live sessions</p>
                  <h2>Current learner activity</h2>
                </div>
                <div className="table-list">
                  {[
                    { learner: 'Asha M.', subject: 'Mathematics', status: 'In progress', plan: 'Elite' },
                    { learner: 'Noah R.', subject: 'History', status: 'Submitted', plan: 'Free' },
                    { learner: 'Little Star', subject: 'Colouring', status: 'Playing', plan: 'Trial' },
                  ].map((session) => (
                    <div key={`${session.learner}-${session.subject}`} className="table-row">
                      <strong>{session.learner}</strong>
                      <span>{session.subject}</span>
                      <span>{session.plan}</span>
                      <span>{session.status}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="side-card">
                <div className="panel-heading">
                  <p className="eyebrow">Admin access</p>
                  <h2>What admins can do</h2>
                </div>
                <ul className="simple-list">
                  {adminPrivileges.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
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
          </aside>
        </main>
      )}

      <footer className="site-footer">
        <div>
          <strong>Review Buddy</strong>
          <p>{MOTTO}</p>
        </div>
        <div className="footer-meta">
          <span>Version 1.0.0</span>
          <span>Creator: Review Buddy</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
