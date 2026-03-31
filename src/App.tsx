import { CSSProperties, FormEvent, useEffect, useState } from 'react';
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
  inferCountryCode,
  scoreQuiz,
  type LearnerProfile,
  type Plan,
  type Question,
  type QuizResult,
  type Stage,
} from './data';

type AttemptRecord = {
  subject: string;
  percent: number;
  date: string;
  mode: LearnerProfile['mode'];
};

const STORAGE_KEY = 'review-buddy-state';

const stageCopy: Record<Stage, { label: string; note: string }> = {
  kindergarten: {
    label: 'Kindergarten',
    note: 'Easy learning with letters, colours, numbers, shapes, and stories.',
  },
  primary: {
    label: 'Primary',
    note: 'Structured revision in core school subjects with guided support.',
  },
  teen: {
    label: 'Teens',
    note: 'Subject-based quizzes and exam practice with changing questions.',
  },
};

const featureCards = [
  {
    title: 'Country-aware onboarding',
    text: 'Learners pick their country so subjects and curriculum language can match their system.',
  },
  {
    title: 'Age-level adaptation',
    text: 'Review Buddy shifts from playful early learning to serious teen revision without changing devices.',
  },
  {
    title: 'Role-based access',
    text: 'Students practise and track progress while admins monitor activity, plans, and scoreboards.',
  },
];

const adminPrivileges = [
  'View live test, quiz, and exam activity',
  'Watch score trends by country and subject',
  'Monitor plan usage and trial conversion',
  'See leaderboards without editing learner answers',
];

const planOptions: Plan[] = ['free', 'trial', 'elite'];

const demoSessions = [
  { learner: 'Asha M.', subject: 'Mathematics', status: 'In progress', country: 'KE', plan: 'Elite' },
  { learner: 'Noah R.', subject: 'English', status: 'Submitted', country: 'GB', plan: 'Free' },
  { learner: 'Sara K.', subject: 'Biology', status: 'In review', country: 'AE', plan: 'Trial' },
];

function createInitialProfile(): LearnerProfile {
  const countryCode = inferCountryCode();
  const stage: Stage = 'teen';
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

function App() {
  const [profile, setProfile] = useState<LearnerProfile>(createInitialProfile);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setIsReady(true);
      return;
    }

    try {
      const saved = JSON.parse(raw) as { profile?: LearnerProfile; attempts?: AttemptRecord[] };

      if (saved.profile) {
        setProfile(saved.profile);
        setIsEntered(Boolean(saved.profile.fullName));
      }

      if (saved.attempts) {
        setAttempts(saved.attempts);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile,
        attempts,
      }),
    );
  }, [attempts, isReady, profile]);

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
  const levelOptions = getLevelOptions(profile.stage);
  const planDetails = getPlanDetails(profile.plan);
  const leaderboard = getLeaderboard(profile.subject, profile, result ?? undefined);
  const metrics = getAdminMetrics(profile.countryCode);

  const themeStyle = {
    ['--theme-primary' as const]: country.palette.primary,
    ['--theme-secondary' as const]: country.palette.secondary,
    ['--theme-accent' as const]: country.palette.accent,
    ['--theme-surface' as const]: country.palette.surface,
    ['--theme-ink' as const]: country.palette.ink,
  } as CSSProperties;

  function updateProfile<Key extends keyof LearnerProfile>(key: Key, value: LearnerProfile[Key]) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function enterWorkspace(event: FormEvent) {
    event.preventDefault();
    setIsEntered(true);

    if (profile.role === 'student') {
      startFreshQuiz();
    } else {
      setQuestions([]);
      setAnswers({});
      setResult(null);
    }
  }

  function startFreshQuiz() {
    const nextQuestions = generateQuestions(profile);
    setQuestions(nextQuestions);
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
  }

  function submitQuiz() {
    const nextResult = scoreQuiz(questions, answers);
    setResult(nextResult);
    setAttempts((current) => [
      {
        subject: profile.subject,
        percent: nextResult.percent,
        date: new Date().toLocaleDateString(),
        mode: profile.mode,
      },
      ...current,
    ].slice(0, 6));
  }

  const current = questions[currentQuestion];
  const hasAnsweredCurrent = current ? Boolean(answers[current.id]) : false;
  const canSubmit = questions.length > 0 && Object.keys(answers).length === questions.length;
  const showCorrections = result && (profile.plan !== 'free' || result.passed);

  return (
    <div className="app-shell" style={themeStyle}>
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      <header className="hero">
        <div className="hero-topline">
          <div className="brand-lockup">
            <LogoMark />
            <div>
              <p className="eyebrow">Review Buddy</p>
              <h1>After-school study support for kids and teens on any device.</h1>
            </div>
          </div>
          <div className="hero-badges">
            <span>{country.name}</span>
            <span>{country.curriculum}</span>
            <span>{getPlanLabel(profile.plan)}</span>
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-copy">
            <p className="hero-lead">
              {MOTTO} Students get age-aware quizzes, admins get live visibility, and the
              interface adapts by country, plan, and learner level.
            </p>

            <div className="hero-stat-grid">
              <article className="stat-card">
                <strong>5 days</strong>
                <span>Elite trial for every new learner</span>
              </article>
              <article className="stat-card">
                <strong>{profile.role === 'student' ? 'Student' : 'Admin'}</strong>
                <span>Current workspace role</span>
              </article>
              <article className="stat-card">
                <strong>{stageCopy[profile.stage].label}</strong>
                <span>{stageCopy[profile.stage].note}</span>
              </article>
            </div>
          </div>

          <aside className="preview-card">
            <p className="eyebrow">Why this works</p>
            <h2>Friendly for early learners, focused for teens, clear for admins.</h2>
            <div className="feature-stack">
              {featureCards.map((card) => (
                <article key={card.title} className="feature-card">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </header>

      <main className="main-grid">
        <section className="panel panel-form">
          <div className="panel-heading">
            <p className="eyebrow">Login UI</p>
            <h2>Enter Review Buddy</h2>
            <p>
              Pick a role, country, level, and access plan so the system can generate the
              right learning path.
            </p>
          </div>

          <form className="auth-form" onSubmit={enterWorkspace}>
            <label>
              Full name
              <input
                value={profile.fullName}
                onChange={(event) => updateProfile('fullName', event.target.value)}
                placeholder="e.g. Amina Hassan"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={profile.email}
                onChange={(event) => updateProfile('email', event.target.value)}
                placeholder="learner@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={profile.password}
                onChange={(event) => updateProfile('password', event.target.value)}
                placeholder="Create a secure password"
                required
              />
            </label>

            <div className="field-grid">
              <label>
                Role
                <select
                  value={profile.role}
                  onChange={(event) => updateProfile('role', event.target.value as LearnerProfile['role'])}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
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
            </div>

            <div className="field-grid">
              <label>
                Stage
                <select
                  value={profile.stage}
                  onChange={(event) => updateProfile('stage', event.target.value as Stage)}
                >
                  <option value="kindergarten">Kindergarten</option>
                  <option value="primary">Primary</option>
                  <option value="teen">Teens</option>
                </select>
              </label>

              <label>
                Level / Year
                <select
                  value={profile.level}
                  onChange={(event) => updateProfile('level', event.target.value)}
                >
                  {levelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-grid">
              <label>
                Plan
                <select
                  value={profile.plan}
                  onChange={(event) => updateProfile('plan', event.target.value as Plan)}
                >
                  {planOptions.map((plan) => (
                    <option key={plan} value={plan}>
                      {getPlanLabel(plan)}
                    </option>
                  ))}
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

            {profile.role === 'student' && (
              <label>
                Subject
                <select
                  value={profile.subject}
                  onChange={(event) => updateProfile('subject', event.target.value)}
                >
                  {availableSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="plan-note">
              <strong>{planDetails.badge}</strong>
              <p>{planDetails.description}</p>
            </div>

            <button className="primary-button" type="submit">
              {profile.role === 'student' ? 'Open Student Space' : 'Open Admin Control'}
            </button>
          </form>
        </section>

        <section className="panel panel-insight">
          <div className="panel-heading">
            <p className="eyebrow">Access overview</p>
            <h2>Capabilities by role and plan</h2>
            <p>Clear product rules make the experience simple for families and schools.</p>
          </div>

          <div className="tier-grid">
            <article className="tier-card">
              <span className="tier-chip">Free</span>
              <h3>Quick practice</h3>
              <p>Limited question count, fewer subject choices, scores, and leaderboard access.</p>
            </article>
            <article className="tier-card">
              <span className="tier-chip">Elite Trial</span>
              <h3>5-day unlock</h3>
              <p>Every new user can test premium feedback, deeper reports, and more subject access.</p>
            </article>
            <article className="tier-card">
              <span className="tier-chip">Elite</span>
              <h3>Full learning suite</h3>
              <p>More questions, more subjects, detailed feedback, and a richer learning history.</p>
            </article>
          </div>

          <div className="role-grid">
            <article className="role-card">
              <p className="eyebrow">Student</p>
              <h3>Practice, improve, compete</h3>
              <p>
                Country-aware onboarding, age-level recommendations, solo or group quizzes, and
                subject leaderboards.
              </p>
            </article>
            <article className="role-card">
              <p className="eyebrow">Admin</p>
              <h3>Monitor and manage</h3>
              <ul className="simple-list">
                {adminPrivileges.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </main>

      {isEntered && profile.role === 'student' && (
        <section className="workspace-grid">
          <section className="panel panel-workspace">
            <div className="panel-heading">
              <p className="eyebrow">Student dashboard</p>
              <h2>{profile.subject} practice space</h2>
              <p>
                {country.name} learner route for {profile.level}. Questions refresh every time a
                new quiz starts.
              </p>
            </div>

            <div className="summary-strip">
              <article className="summary-card">
                <span>Curriculum</span>
                <strong>{country.curriculum}</strong>
              </article>
              <article className="summary-card">
                <span>Quiz mode</span>
                <strong>{profile.mode === 'group' ? 'Group discussion' : 'Solo challenge'}</strong>
              </article>
              <article className="summary-card">
                <span>Questions</span>
                <strong>{questions.length}</strong>
              </article>
            </div>

            {profile.mode === 'group' && (
              <article className="group-callout">
                <h3>Group discussion mode</h3>
                <p>
                  Learners can debate answers together, then submit as a team. Prompts should be
                  read aloud before choosing a final answer.
                </p>
              </article>
            )}

            {current && (
              <article className="quiz-card">
                <div className="quiz-topline">
                  <span>
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  <span>{current.skill}</span>
                </div>
                <h3>{current.prompt}</h3>

                <div className="choice-grid">
                  {current.choices.map((choice) => {
                    const isSelected = answers[current.id] === choice;

                    return (
                      <button
                        key={choice}
                        type="button"
                        className={`choice-button${isSelected ? ' choice-button-selected' : ''}`}
                        onClick={() =>
                          setAnswers((currentAnswers) => ({
                            ...currentAnswers,
                            [current.id]: choice,
                          }))
                        }
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>

                <div className="quiz-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setCurrentQuestion((index) => Math.max(0, index - 1))}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </button>
                  {currentQuestion < questions.length - 1 ? (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setCurrentQuestion((index) => Math.min(questions.length - 1, index + 1))}
                      disabled={!hasAnsweredCurrent}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={submitQuiz}
                      disabled={!canSubmit}
                    >
                      Submit quiz
                    </button>
                  )}
                </div>
              </article>
            )}

            {result && (
              <article className="result-card">
                <div>
                  <p className="eyebrow">Result</p>
                  <h3>
                    {result.percent}% score ({result.score}/{result.total})
                  </h3>
                  <p>
                    {result.passed
                      ? 'Strong work. The learner passed this session.'
                      : 'The learner can retry with a fresh question set right away.'}
                  </p>
                </div>

                <div className="result-actions">
                  <button type="button" className="primary-button" onClick={startFreshQuiz}>
                    Generate new quiz
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setCurrentQuestion(0)}>
                    Review session
                  </button>
                </div>

                <div className="review-stack">
                  {showCorrections ? (
                    questions.map((question) => (
                      <article key={question.id} className="review-item">
                        <strong>{question.prompt}</strong>
                        <span>Your answer: {answers[question.id]}</span>
                        <span>Correct answer: {question.answer}</span>
                        <p>{question.explanation}</p>
                      </article>
                    ))
                  ) : (
                    <article className="review-item review-item-muted">
                      <strong>Free plan review rule</strong>
                      <p>
                        Scores stay visible, but correct answers stay hidden after a failed attempt
                        on the Free plan.
                      </p>
                    </article>
                  )}
                </div>
              </article>
            )}
          </section>

          <aside className="workspace-side">
            <section className="panel">
              <div className="panel-heading">
                <p className="eyebrow">Leaderboard</p>
                <h2>{profile.subject} top scores</h2>
              </div>

              <div className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <article key={`${entry.name}-${index}`} className="leaderboard-row">
                    <div>
                      <strong>
                        #{index + 1} {entry.name}
                      </strong>
                      <span>
                        {getCountryByCode(entry.countryCode).name} · {getPlanLabel(entry.plan)}
                      </span>
                    </div>
                    <strong>{entry.score}%</strong>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <p className="eyebrow">Recent history</p>
                <h2>Latest attempts</h2>
              </div>

              <div className="history-list">
                {attempts.length > 0 ? (
                  attempts.map((attempt) => (
                    <article key={`${attempt.subject}-${attempt.date}-${attempt.percent}`} className="history-row">
                      <div>
                        <strong>{attempt.subject}</strong>
                        <span>
                          {attempt.mode === 'group' ? 'Group' : 'Solo'} · {attempt.date}
                        </span>
                      </div>
                      <strong>{attempt.percent}%</strong>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">Your recent quiz scores will appear here.</p>
                )}
              </div>
            </section>
          </aside>
        </section>
      )}

      {isEntered && profile.role === 'admin' && (
        <section className="workspace-grid">
          <section className="panel panel-workspace">
            <div className="panel-heading">
              <p className="eyebrow">Admin control</p>
              <h2>Live learning overview</h2>
              <p>
                Admin tools are view-first. Monitor sessions, plans, and leaderboards without
                editing learner submissions.
              </p>
            </div>

            <div className="admin-metric-grid">
              <article className="summary-card">
                <span>Active learners</span>
                <strong>{metrics.activeLearners}</strong>
              </article>
              <article className="summary-card">
                <span>Live sessions</span>
                <strong>{metrics.liveSessions}</strong>
              </article>
              <article className="summary-card">
                <span>Average score</span>
                <strong>{metrics.averageScore}%</strong>
              </article>
              <article className="summary-card">
                <span>Trial users</span>
                <strong>{metrics.trialUsers}</strong>
              </article>
            </div>

            <div className="admin-panels">
              <article className="sub-panel">
                <h3>Live sessions</h3>
                <div className="table-list">
                  {demoSessions.map((session) => (
                    <div key={session.learner} className="table-row">
                      <span>{session.learner}</span>
                      <span>{session.subject}</span>
                      <span>{session.country}</span>
                      <span>{session.plan}</span>
                      <span>{session.status}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="sub-panel">
                <h3>Admin privileges</h3>
                <ul className="simple-list">
                  {adminPrivileges.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <aside className="workspace-side">
            <section className="panel">
              <div className="panel-heading">
                <p className="eyebrow">Country theme</p>
                <h2>{country.name} presentation</h2>
              </div>
              <p className="country-copy">{country.description}</p>
              <div className="theme-palette">
                {Object.values(country.palette).map((colour) => (
                  <span key={colour} style={{ background: colour }} />
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <p className="eyebrow">Leaderboard preview</p>
                <h2>Top performers</h2>
              </div>
              <div className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <article key={`${entry.name}-${index}`} className="leaderboard-row">
                    <div>
                      <strong>
                        #{index + 1} {entry.name}
                      </strong>
                      <span>{getCountryByCode(entry.countryCode).name}</span>
                    </div>
                    <strong>{entry.score}%</strong>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
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
