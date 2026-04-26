import { CSSProperties, ClipboardEvent, FormEvent, SVGProps, startTransition, useEffect, useRef, useState } from 'react';
import {
  type Announcement,
  COUNTRIES,
  MOTTO,
  generateQuestions,
  getAvailableSubjects,
  getCountryByCode,
  getLearningMaterial,
  getLearningVideo,
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
  type FeedbackEntry,
  type FeedbackQuestionKey,
  type LearnerGender,
  type LearnerProfile,
  type Plan,
  type Question,
  type QuestionArt,
  type QuizResult,
  type RegisteredUser,
  type SupportRequest,
  type StaffMaterial,
  type StaffMaterialCategory,
  type StaffMaterialResourceType,
  type Stage,
} from './data';
import { appRepository } from './lib/repository';
import { supabase } from './lib/supabase';

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
type StaffView = 'lounge' | 'feedback';
type AssessmentKind = 'quiz' | 'exam';
type ThemeVars = {
  '--theme-primary': string;
  '--theme-secondary': string;
  '--theme-accent': string;
  '--theme-surface': string;
  '--theme-ink': string;
};

type AuthSceneBlob = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width: string;
  height: string;
  background: string;
  blur?: number;
  opacity?: number;
};

type AuthSceneSticker = {
  icon: string;
  tone: 'sun' | 'sky' | 'mint' | 'coral' | 'violet';
  size: number;
  rotate: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

type AuthScene = {
  id: string;
  blobs: AuthSceneBlob[];
  stickers: AuthSceneSticker[];
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

type StaffQuestionDraft = {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  answerIndex: number;
  explanation: string;
};

type StaffAccountDraft = {
  name: string;
  role: string;
  focus: string;
  qualifications: string;
  eligibility: string;
  countryCode: string;
};

type SupportRequestDraft = {
  title: string;
  detail: string;
  category: SupportRequest['category'];
};

type AnnouncementDraft = {
  title: string;
  message: string;
  audience: Announcement['audience'];
};

type FeedbackSummarySnapshot = {
  average: number;
  lowCount: number;
  headline: string;
  detail: string;
  questionAverages: Array<{
    key: FeedbackQuestionKey;
    label: string;
    average: number;
  }>;
};

type StaffMaterialDraft = {
  editingId?: string;
  title: string;
  summary: string;
  body: string;
  countryCode: string;
  stage: Stage;
  level: string;
  subject: string;
  category: StaffMaterialCategory;
  resourceType: StaffMaterialResourceType;
  attachmentName: string;
  attachmentData: string;
  videoUrl: string;
  questionLimit: number;
  questions: StaffQuestionDraft[];
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
  staffView?: StaffView;
  selectedSubject?: string | null;
  reviewSnapshot?: ReviewSnapshot | null;
  staffMembers?: AdminStaffMember[];
  staffMaterials?: StaffMaterial[];
  adminActivityByCountry?: AdminActivityMap;
  followUpsByCountry?: AdminFollowUpMap;
  feedbackEntries?: FeedbackEntry[];
  submittedFeedbackKeys?: string[];
  supportRequests?: SupportRequest[];
  announcements?: Announcement[];
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

type MaterialViewerPayload = {
  material: StaffMaterial;
  audienceLabel: string;
};

type EmbeddedVideoConfig = {
  kind: 'native' | 'iframe';
  src: string;
  helperLabel: string;
};

type MaterialDocumentPreview =
  | { kind: 'pdf'; src: string }
  | { kind: 'image'; src: string }
  | { kind: 'text'; content: string }
  | { kind: 'embed'; src: string; extension?: string }
  | { kind: 'download'; extension?: string };

const STORAGE_KEY = 'review-buddy-state-clean';
const LEGACY_STORAGE_KEYS = ['review-buddy-state'];
const INSTALL_DISMISS_KEY = 'review-buddy-install-dismissed';
const APP_VERSION = '1.11.1';
const APP_DISPLAY_VERSION = 'Updated often';
const APP_CREATED_ON = 'March 26';
const BIRTHDAY_MIN_DATE = new Date(1990, 0, 1);
const BIRTHDAY_WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const BIRTHDAY_MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DEFAULT_ADMIN_USERNAME = 'Admin';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_STAFF_USERNAME = 'Staff';
const TERMS_UPDATED_ON = 'April 21, 2026';
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
    icon: '⚡',
    title: 'Fast start',
    detail: 'Join quickly',
  },
  {
    icon: '🧠',
    title: 'Fresh practice',
    detail: 'New sets',
  },
  {
    icon: '📈',
    title: 'Clear progress',
    detail: 'Easy scores',
  },
];

const AUTH_SCENES: AuthScene[] = [
  {
    id: 'playbook',
    blobs: [
      {
        top: '-10%',
        left: '-12%',
        width: '460px',
        height: '460px',
        background: 'radial-gradient(circle, rgba(251, 146, 60, 0.24) 0%, rgba(251, 146, 60, 0) 72%)',
        blur: 12,
        opacity: 0.9,
      },
      {
        top: '8%',
        right: '-8%',
        width: '390px',
        height: '390px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0) 70%)',
        blur: 14,
        opacity: 0.85,
      },
      {
        bottom: '-16%',
        left: '12%',
        width: '340px',
        height: '340px',
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.18) 0%, rgba(34, 197, 94, 0) 72%)',
        blur: 18,
        opacity: 0.78,
      },
      {
        bottom: '4%',
        right: '16%',
        width: '240px',
        height: '240px',
        background: 'radial-gradient(circle, rgba(244, 114, 182, 0.16) 0%, rgba(244, 114, 182, 0) 74%)',
        blur: 18,
        opacity: 0.68,
      },
    ],
    stickers: [
      { icon: '📚', tone: 'sun', size: 78, rotate: -8, top: '16%', left: '5%' },
      { icon: '✏️', tone: 'sky', size: 68, rotate: 8, top: '18%', right: '10%' },
      { icon: '🎒', tone: 'coral', size: 74, rotate: -6, bottom: '18%', left: '9%' },
      { icon: '🧩', tone: 'mint', size: 68, rotate: 10, bottom: '16%', right: '11%' },
    ],
  },
  {
    id: 'discovery',
    blobs: [
      {
        top: '-12%',
        right: '10%',
        width: '420px',
        height: '420px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(168, 85, 247, 0) 72%)',
        blur: 16,
        opacity: 0.78,
      },
      {
        top: '12%',
        left: '-8%',
        width: '340px',
        height: '340px',
        background: 'radial-gradient(circle, rgba(251, 113, 133, 0.16) 0%, rgba(251, 113, 133, 0) 68%)',
        blur: 18,
        opacity: 0.82,
      },
      {
        bottom: '-10%',
        right: '18%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0) 72%)',
        blur: 18,
        opacity: 0.7,
      },
    ],
    stickers: [
      { icon: '🔬', tone: 'sky', size: 72, rotate: -10, top: '18%', left: '6%' },
      { icon: '🧪', tone: 'mint', size: 68, rotate: 9, top: '18%', right: '11%' },
      { icon: '🌍', tone: 'sun', size: 76, rotate: -4, bottom: '18%', left: '10%' },
      { icon: '🎓', tone: 'violet', size: 70, rotate: 8, bottom: '16%', right: '10%' },
    ],
  },
  {
    id: 'creative',
    blobs: [
      {
        top: '-6%',
        left: '14%',
        width: '360px',
        height: '360px',
        background: 'radial-gradient(circle, rgba(96, 165, 250, 0.18) 0%, rgba(96, 165, 250, 0) 70%)',
        blur: 14,
        opacity: 0.82,
      },
      {
        top: '20%',
        right: '-5%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(250, 204, 21, 0.14) 0%, rgba(250, 204, 21, 0) 70%)',
        blur: 14,
        opacity: 0.85,
      },
      {
        bottom: '-12%',
        left: '-4%',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(244, 114, 182, 0.14) 0%, rgba(244, 114, 182, 0) 70%)',
        blur: 18,
        opacity: 0.75,
      },
    ],
    stickers: [
      { icon: '🎨', tone: 'coral', size: 76, rotate: -10, top: '18%', left: '7%' },
      { icon: '📐', tone: 'sun', size: 68, rotate: 7, top: '20%', right: '9%' },
      { icon: '💡', tone: 'mint', size: 68, rotate: -8, bottom: '18%', left: '9%' },
      { icon: '🚌', tone: 'sky', size: 70, rotate: 6, bottom: '15%', right: '10%' },
    ],
  },
  {
    id: 'campus',
    blobs: [
      {
        top: '-10%',
        left: '8%',
        width: '420px',
        height: '420px',
        background: 'radial-gradient(circle, rgba(45, 212, 191, 0.18) 0%, rgba(45, 212, 191, 0) 72%)',
        blur: 18,
        opacity: 0.85,
      },
      {
        top: '8%',
        right: '-10%',
        width: '430px',
        height: '430px',
        background: 'radial-gradient(circle, rgba(96, 165, 250, 0.18) 0%, rgba(96, 165, 250, 0) 72%)',
        blur: 18,
        opacity: 0.82,
      },
      {
        bottom: '-14%',
        left: '-2%',
        width: '360px',
        height: '360px',
        background: 'radial-gradient(circle, rgba(250, 204, 21, 0.14) 0%, rgba(250, 204, 21, 0) 72%)',
        blur: 18,
        opacity: 0.72,
      },
    ],
    stickers: [
      { icon: '🏫', tone: 'sky', size: 78, rotate: -7, top: '16%', left: '6%' },
      { icon: '🧠', tone: 'violet', size: 64, rotate: 9, top: '18%', right: '11%' },
      { icon: '📖', tone: 'sun', size: 68, rotate: -8, bottom: '18%', left: '10%' },
      { icon: '🧮', tone: 'mint', size: 70, rotate: 7, bottom: '15%', right: '10%' },
    ],
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
    birthDay: undefined,
    birthMonth: undefined,
    birthYear: undefined,
    streakCount: 0,
    lastActiveOn: undefined,
    tutorialSeen: false,
  };
}

function createInitialMaterialDraft(countryCode = inferCountryCode()): StaffMaterialDraft {
  const stage: Stage = 'primary';
  return {
    editingId: undefined,
    title: '',
    summary: '',
    body: '',
    countryCode,
    stage,
    level: getLevelOptions(stage)[0],
    subject: getAvailableSubjects(countryCode, stage, 'free')[0],
    category: 'reading',
    resourceType: 'text',
    attachmentName: '',
    attachmentData: '',
    videoUrl: '',
    questionLimit: 5,
    questions: [],
  };
}

function createQuestionDraft(): StaffQuestionDraft {
  return {
    id: `question-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    prompt: '',
    choices: ['', '', '', ''],
    answerIndex: 0,
    explanation: '',
  };
}

function normalizePrompt(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getAttachmentMimeType(dataUrl?: string) {
  const match = dataUrl?.match(/^data:([^;,]+)[;,]/i);
  return match?.[1]?.toLowerCase();
}

function getAttachmentExtension(fileName?: string) {
  const match = fileName?.toLowerCase().match(/\.([a-z0-9]+)$/i);
  return match?.[1];
}

function decodeDataUrlText(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) {
    return '';
  }

  const header = dataUrl.slice(0, commaIndex);
  const body = dataUrl.slice(commaIndex + 1);

  try {
    if (header.includes(';base64')) {
      const binary = atob(body);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }

    return decodeURIComponent(body);
  } catch {
    return '';
  }
}

function getDocumentPreview(material: StaffMaterial): MaterialDocumentPreview {
  const attachmentData = material.attachmentData;
  const mimeType = getAttachmentMimeType(attachmentData);
  const extension = getAttachmentExtension(material.attachmentName);

  if (!attachmentData) {
    return { kind: 'download', extension };
  }

  if (mimeType === 'application/pdf') {
    return { kind: 'pdf', src: attachmentData };
  }

  if (mimeType?.startsWith('image/')) {
    return { kind: 'image', src: attachmentData };
  }

  if (
    mimeType?.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/javascript'
  ) {
    const content = decodeDataUrlText(attachmentData);
    if (content.trim()) {
      return { kind: 'text', content };
    }
  }

  return { kind: 'embed', src: attachmentData, extension };
}

function getEmbeddedVideoConfig(videoUrl?: string): EmbeddedVideoConfig | null {
  const trimmedUrl = videoUrl?.trim();
  if (!trimmedUrl) {
    return null;
  }

  if (trimmedUrl.startsWith('data:video/')) {
    return {
      kind: 'native',
      src: trimmedUrl,
      helperLabel: 'Uploaded video',
    };
  }

  if (/\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(trimmedUrl)) {
    return {
      kind: 'native',
      src: trimmedUrl,
      helperLabel: 'Direct lesson video',
    };
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      if (videoId) {
        return {
          kind: 'iframe',
          src: `https://www.youtube.com/embed/${videoId}?rel=0`,
          helperLabel: 'YouTube lesson',
        };
      }
    }

    if (host.includes('youtube.com')) {
      const videoId =
        parsedUrl.searchParams.get('v') ||
        parsedUrl.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      if (videoId) {
        return {
          kind: 'iframe',
          src: `https://www.youtube.com/embed/${videoId}?rel=0`,
          helperLabel: 'YouTube lesson',
        };
      }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const videoId = parsedUrl.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      if (videoId) {
        return {
          kind: 'iframe',
          src: `https://player.vimeo.com/video/${videoId}`,
          helperLabel: 'Vimeo lesson',
        };
      }
    }

    if (host === 'drive.google.com') {
      const fileId = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
      if (fileId) {
        return {
          kind: 'iframe',
          src: `https://drive.google.com/file/d/${fileId}/preview`,
          helperLabel: 'Drive lesson',
        };
      }
    }

    return {
      kind: 'iframe',
      src: trimmedUrl,
      helperLabel: 'Embedded lesson',
    };
  } catch {
    return null;
  }
}

function shouldShowInlineMaterialText(material: StaffMaterial) {
  return material.resourceType === 'text' && material.body.trim();
}

function shuffleList<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
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
    tutorialSeen: true,
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
    qualifications: user.qualifications,
    eligibility: user.eligibility,
    supportFocus: user.supportFocus,
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

  const seededUsers = [...safeUsers];
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

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M7.5 3.5v4" />
      <path d="M16.5 3.5v4" />
      <path d="M3.5 9.5h17" />
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
  { view: 'reports', label: 'Progress', icon: '📊' },
];

const FEEDBACK_CHOICES = [
  'Easy to use',
  'Clear lessons',
  'Looks good',
  'Fast enough',
  'Helps me learn',
];

const FEEDBACK_SUMMARY_QUESTIONS: { key: FeedbackQuestionKey; label: string }[] = [
  { key: 'ease', label: 'How easy was this page?' },
  { key: 'clarity', label: 'How clear were the lessons?' },
  { key: 'look', label: 'How does the page look?' },
  { key: 'speed', label: 'How fast did it feel?' },
  { key: 'confidence', label: 'How well did it support the goal?' },
];

const LEARNER_FEEDBACK_QUESTIONS: { key: FeedbackQuestionKey; label: string }[] = [
  ...FEEDBACK_SUMMARY_QUESTIONS.slice(0, 4),
  { key: 'confidence', label: 'How much did it help you learn?' },
];

const STAFF_FEEDBACK_QUESTIONS: { key: FeedbackQuestionKey; label: string }[] = [
  ...FEEDBACK_SUMMARY_QUESTIONS.slice(0, 4),
  { key: 'confidence', label: 'How much did it help you support learners?' },
];

const STAFF_ROLE_OPTIONS = [
  'Learning mentor',
  'Subject specialist',
  'Reading coach',
  'Exam coach',
  'Family support guide',
];

const STAFF_ELIGIBILITY_OPTIONS = [
  'Verified teacher',
  'Teaching assistant',
  'School mentor',
  'Curriculum partner',
  'Community tutor',
];

const STAFF_QUALIFICATION_OPTIONS = [
  'B.Ed educator',
  'Primary classroom lead',
  'STEM specialist',
  'Language and literacy coach',
  'Exam preparation coach',
];

const STAFF_SUPPORT_FOCUS_OPTIONS = [
  'Foundations support',
  'Reading confidence',
  'Math mastery',
  'Science investigations',
  'Exam readiness',
  'Family onboarding',
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

function buildFeedbackSummary(entries: FeedbackEntry[]): FeedbackSummarySnapshot {
  if (entries.length === 0) {
    return {
      average: 0,
      lowCount: 0,
      headline: 'No feedback yet',
      detail: 'Replies will appear here after learners start sharing them.',
      questionAverages: FEEDBACK_SUMMARY_QUESTIONS.map((question) => ({
        key: question.key,
        label: question.label,
        average: 0,
      })),
    };
  }

  const average = Math.round((entries.reduce((sum, entry) => sum + entry.rating, 0) / entries.length) * 10) / 10;
  const lowCount = entries.filter((entry) => entry.rating < 3).length;
  const questionAverages = FEEDBACK_SUMMARY_QUESTIONS.map((question) => ({
    key: question.key,
    label: question.label,
    average:
      Math.round(
        (entries.reduce((sum, entry) => sum + (entry.ratings?.[question.key] ?? entry.rating), 0) / entries.length) * 10,
      ) / 10,
  })).sort((left, right) => left.average - right.average);

  const weakestQuestion = questionAverages[0]?.label ?? 'General feedback';

  return {
    average,
    lowCount,
    headline: weakestQuestion,
    detail:
      lowCount > 0
        ? `${lowCount} reply${lowCount === 1 ? '' : 'ies'} need attention first.`
        : 'Most learners are sharing positive feedback.',
    questionAverages,
  };
}

function createInitialStaffAccountDraft(countryCode = inferCountryCode()): StaffAccountDraft {
  return {
    name: '',
    role: STAFF_ROLE_OPTIONS[0],
    focus: STAFF_SUPPORT_FOCUS_OPTIONS[0],
    qualifications: STAFF_QUALIFICATION_OPTIONS[0],
    eligibility: STAFF_ELIGIBILITY_OPTIONS[0],
    countryCode,
  };
}

function createInitialSupportRequestDraft(): SupportRequestDraft {
  return {
    title: '',
    detail: '',
    category: 'topic',
  };
}

function createInitialAnnouncementDraft(): AnnouncementDraft {
  return {
    title: '',
    message: '',
    audience: 'all',
  };
}

function defaultAnnouncements(): Announcement[] {
  return [];
}

function createAnnouncementKey(entry: Pick<Announcement, 'title' | 'message' | 'audience'>) {
  return [entry.audience, entry.title.trim().toLowerCase(), entry.message.trim().toLowerCase()].join('::');
}

function buildAnnouncementFeed(entries: Announcement[]) {
  const seen = new Set<string>();

  return [...entries]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .filter((entry) => {
      const key = createAnnouncementKey(entry);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getAnnouncementAudienceLabel(audience: Announcement['audience']) {
  if (audience === 'learners') return 'Learners';
  if (audience === 'staff') return 'Staff';
  return 'Everyone';
}

function formatBirthDateInput(profile: Pick<LearnerProfile, 'birthDay' | 'birthMonth' | 'birthYear'>) {
  if (!profile.birthDay || !profile.birthMonth || !profile.birthYear) {
    return '';
  }

  return [
    String(profile.birthYear).padStart(4, '0'),
    String(profile.birthMonth).padStart(2, '0'),
    String(profile.birthDay).padStart(2, '0'),
  ].join('-');
}

function getBirthDate(profile: Pick<LearnerProfile, 'birthDay' | 'birthMonth' | 'birthYear'>) {
  if (!profile.birthDay || !profile.birthMonth || !profile.birthYear) {
    return null;
  }

  return new Date(profile.birthYear, profile.birthMonth - 1, profile.birthDay);
}

function formatBirthdayLabel(profile: Pick<LearnerProfile, 'birthDay' | 'birthMonth' | 'birthYear'>) {
  const birthDate = getBirthDate(profile);
  if (!birthDate) return 'Choose birthday';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(birthDate);
}

function normalizeCalendarDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameCalendarDay(left: Date | null, right: Date | null) {
  if (!left || !right) return false;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function buildBirthdayCalendar(viewDate: Date, selectedDate: Date | null) {
  const monthStart = getMonthStart(viewDate);
  const minDate = normalizeCalendarDay(BIRTHDAY_MIN_DATE);
  const maxDate = normalizeCalendarDay(new Date());
  const totalDays = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const firstWeekdayOffset = (monthStart.getDay() + 6) % 7;

  return {
    firstWeekdayOffset,
    days: Array.from({ length: totalDays }, (_, index) => {
      const date = normalizeCalendarDay(
        new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1),
      );

      return {
        key: date.toISOString(),
        date,
        label: date.getDate(),
        isDisabled: date < minDate || date > maxDate,
        isSelected: isSameCalendarDay(date, selectedDate),
        isToday: isSameCalendarDay(date, maxDate),
      };
    }),
  };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().slice(0, 10);
}

function buildStreakNotice(lastActiveOn: string | undefined, todayKey: string, yesterdayKey: string, nextStreak: number) {
  if (lastActiveOn === todayKey) return '';
  if (!lastActiveOn) return 'Your learning streak starts today.';
  if (lastActiveOn === yesterdayKey) return `You are on a ${nextStreak}-day learning streak.`;
  return 'Your learning streak starts again today.';
}

function generateEasyPassword(name: string) {
  const base = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.replace(/[^a-zA-Z]/g, '').slice(0, 4))
    .filter(Boolean)
    .join('');

  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base || 'Buddy'}${suffix}!`;
}

function reviewMaterialSafety(material: StaffMaterial) {
  const combined = `${material.title} ${material.summary} ${material.body}`.toLowerCase();
  const riskyWords = ['violence', 'weapon', 'adult', 'gambling', 'hate'];
  const found = riskyWords.find((word) => combined.includes(word));

  if (found) {
    return `This needs a closer check because it mentions "${found}" and may not suit children yet.`;
  }

  if (material.resourceType === 'video') {
    return 'This looks suitable so far. Please check that the video is right for the learner age group.';
  }

  if (material.resourceType === 'question-bank' && (material.questions?.length ?? 0) < 3) {
    return 'Safe tone so far, but add a few more questions before publishing to learners.';
  }

  return 'This looks child-friendly and ready after one final check.';
}

function getMaterialStatusLabel(status?: StaffMaterial['approvalStatus']) {
  if (status === 'approved') return 'Approved';
  if (status === 'denied') return 'Needs changes';
  return 'Pending review';
}

function getMaterialStatusBadge(status?: StaffMaterial['approvalStatus']) {
  if (status === 'approved') return '✅ Approved';
  if (status === 'denied') return '🛠️ Changes needed';
  return '🕒 Pending';
}

function getSupportCategoryLabel(category: SupportRequest['category']) {
  if (category === 'topic') return 'Topic help';
  if (category === 'mentor') return 'Learning support';
  if (category === 'technical') return 'Sign-in or device help';
  if (category === 'material') return 'Learning material';
  if (category === 'approval') return 'Waiting for review';
  if (category === 'wellbeing') return 'Wellbeing';
  return 'General help';
}

function normalizeSupportRequestEntry(request: SupportRequest): SupportRequest {
  return {
    ...request,
    status: request.status === 'resolved' ? 'done' : request.status,
  };
}

function isClosedSupportRequest(request: SupportRequest) {
  return request.status === 'done' || request.status === 'resolved';
}

function getSupportRequestStatusLabel(request: SupportRequest) {
  if (isClosedSupportRequest(request)) return 'Done';
  if (request.status === 'assigned') return 'Assigned';
  if (request.status === 'in-review') return 'School team';
  return 'New';
}

function getSupportRequestOwnerLabel(request: SupportRequest) {
  if (isClosedSupportRequest(request) && request.completedBy) {
    return `Done by ${request.completedBy}`;
  }
  if (request.assignedToRole === 'staff' && request.assignedToName) {
    return `Assigned to ${request.assignedToName}`;
  }
  if (request.assignedToRole === 'admin') {
    return 'Handled by the school team';
  }
  return 'Waiting for the school team';
}

function getRoleLabel(role: LearnerProfile['role']) {
  if (role === 'admin') return 'School team';
  if (role === 'staff') return 'Staff';
  return 'Learner';
}

function getProgressSnapshot(attempts: AttemptRecord[]) {
  if (attempts.length === 0) {
    return {
      average: 0,
      passRate: 0,
      level: 'Just starting',
      detail: 'Complete a quiz or exam to unlock your first progress review.',
    };
  }

  const average = Math.round(attempts.reduce((sum, attempt) => sum + attempt.percent, 0) / attempts.length);
  const passed = attempts.filter((attempt) => attempt.percent >= 60).length;
  const passRate = Math.round((passed / attempts.length) * 100);
  const level =
    average >= 85 ? 'Excellent progress' : average >= 70 ? 'Strong progress' : average >= 55 ? 'Building steadily' : 'Needs support';
  const detail =
    average >= 85
      ? 'You are ready for harder practice and challenge exams.'
      : average >= 70
        ? 'Keep going. Your scores show growing confidence.'
        : average >= 55
          ? 'A few more guided lessons will help lift your average.'
          : 'Ask for a mentor or topic support so the next lessons feel easier.';

  return { average, passRate, level, detail };
}

function isBirthdayToday(user: RegisteredUser) {
  if (!user.birthDay || !user.birthMonth) return false;
  const today = new Date();
  return today.getDate() === user.birthDay && today.getMonth() + 1 === user.birthMonth;
}

function tutorialStepsFor(role: LearnerProfile['role']) {
  if (role === 'admin') {
    return [
      'Open Staff to create staff accounts and share simple first passwords.',
      'Use Follow-ups to review uploads, requests, and anything that needs attention.',
      'Use Progress to see feedback and daily activity.',
    ];
  }

  if (role === 'staff') {
    return [
      'Send learning materials for review before they reach learners.',
      'Use Recent uploads to edit or remove your own work.',
      'Open Share thoughts when you want to leave your own feedback.',
    ];
  }

  return [
    'Pick a subject from Learning home and open notes, video, quiz, or exam.',
    'Use Ask for help when you want another topic, extra support, or sign-in help.',
    'Watch your streak and progress cards to see how you are improving.',
  ];
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

function createEmptyFeedbackRatings(): Record<FeedbackQuestionKey, number> {
  return {
    ease: 0,
    clarity: 0,
    look: 0,
    speed: 0,
    confidence: 0,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return fallback;
}

function blockPasswordTransfer(event: ClipboardEvent<HTMLInputElement>) {
  event.preventDefault();
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
  const [staffView, setStaffView] = useState<StaffView>('lounge');
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
  const [staffMaterials, setStaffMaterials] = useState<StaffMaterial[]>([]);
  const [adminActivityByCountry, setAdminActivityByCountry] = useState<AdminActivityMap>({});
  const [followUpsByCountry, setFollowUpsByCountry] = useState<AdminFollowUpMap>({});
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [submittedFeedbackKeys, setSubmittedFeedbackKeys] = useState<string[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(defaultAnnouncements);
  const [adminNotice, setAdminNotice] = useState('Choose a page to manage people, countries, or progress.');
  const [staffDraft, setStaffDraft] = useState<StaffAccountDraft>(() => createInitialStaffAccountDraft());
  const [staffMaterialDraft, setStaffMaterialDraft] = useState<StaffMaterialDraft>(() =>
    createInitialMaterialDraft(createInitialProfile().countryCode),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [feedbackRatings, setFeedbackRatings] = useState<Record<FeedbackQuestionKey, number>>(createEmptyFeedbackRatings);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [supportRequestDraft, setSupportRequestDraft] = useState<SupportRequestDraft>(createInitialSupportRequestDraft);
  const [requestAssignmentSelections, setRequestAssignmentSelections] = useState<Record<string, string>>({});
  const [announcementDraft, setAnnouncementDraft] = useState<AnnouncementDraft>(createInitialAnnouncementDraft);
  const [learnerSearch, setLearnerSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVersionPrompt, setShowVersionPrompt] = useState(false);
  const [streakNotice, setStreakNotice] = useState('');
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [activeMaterialViewer, setActiveMaterialViewer] = useState<MaterialViewerPayload | null>(null);
  const [generatedStaffAccount, setGeneratedStaffAccount] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [authScene] = useState(() => AUTH_SCENES[Math.floor(Math.random() * AUTH_SCENES.length)]);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [birthdayCalendarDate, setBirthdayCalendarDate] = useState(() => getMonthStart(new Date()));
  const [hasChosenSignupCountry, setHasChosenSignupCountry] = useState(false);
  const speechKeyRef = useRef<string | null>(null);
  const birthdayPickerRef = useRef<HTMLDivElement | null>(null);
  const sharedRefreshPromiseRef = useRef<Promise<void> | null>(null);
  const detectedCountryCodeRef = useRef(inferCountryCode());

  useEffect(() => {
    if (!supabase) return;

    const recoveryFromHash =
      window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');

    if (recoveryFromHash) {
      setAuthMode('signin');
      setIsRecoveryMode(true);
      setAuthNotice('Set a new password to finish resetting your account.');
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('signin');
        setIsRecoveryMode(true);
        setAuthNotice('Set a new password to finish resetting your account.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authMode !== 'signup' || hasChosenSignupCountry) {
      return;
    }

    const detectedCountryCode = detectedCountryCodeRef.current;
    setProfile((current) => {
      if (current.countryCode === detectedCountryCode) {
        return current;
      }

      return normalizeLearnerProfile({
        ...current,
        countryCode: detectedCountryCode,
      });
    });
  }, [authMode, hasChosenSignupCountry]);

  useEffect(() => {
    if (authMode !== 'signup') {
      setShowBirthdayPicker(false);
    }
  }, [authMode]);

  useEffect(() => {
    if (!showBirthdayPicker) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!birthdayPickerRef.current?.contains(event.target as Node)) {
        setShowBirthdayPicker(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowBirthdayPicker(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showBirthdayPicker]);

  useEffect(() => {
    LEGACY_STORAGE_KEYS.forEach((key) => {
      if (key !== STORAGE_KEY) {
        window.localStorage.removeItem(key);
      }
    });

    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setIsReady(true);
      return;
    }

    try {
      const saved = JSON.parse(raw) as StoredState;

      if (saved.appVersion !== APP_VERSION) {
        setShowVersionPrompt(Boolean(saved.appVersion));
      }

      if (saved.profile) setProfile(normalizeLearnerProfile(saved.profile));
      if (saved.attempts) setAttempts(saved.attempts);
      if (saved.registeredUsers) setRegisteredUsers(ensureRegisteredUsers(saved.registeredUsers));
      if (saved.authMode) setAuthMode(saved.authMode);
      if (saved.themeMode) setThemeMode(saved.themeMode);
      if (saved.screen) setScreen(saved.screen);
      if (saved.studentView) setStudentView(saved.studentView);
      if (saved.adminView) setAdminView(saved.adminView);
      if (saved.staffView) setStaffView(saved.staffView);
      if (saved.selectedSubject) setSelectedSubject(saved.selectedSubject);
      if (saved.reviewSnapshot) setReviewSnapshot(saved.reviewSnapshot);
      if (saved.quizState) setQuizState(saved.quizState);
      if (saved.staffMembers) setStaffMembers(saved.staffMembers);
      if (saved.staffMaterials) setStaffMaterials(saved.staffMaterials);
      if (saved.adminActivityByCountry) setAdminActivityByCountry(saved.adminActivityByCountry);
      if (saved.followUpsByCountry) setFollowUpsByCountry(saved.followUpsByCountry);
      if (saved.feedbackEntries) setFeedbackEntries(saved.feedbackEntries);
      if (saved.submittedFeedbackKeys) setSubmittedFeedbackKeys(saved.submittedFeedbackKeys);
      if (saved.supportRequests) setSupportRequests(saved.supportRequests.map(normalizeSupportRequestEntry));
      if (saved.announcements) setAnnouncements(saved.announcements);
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
    void refreshSharedState();
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
        staffView,
        selectedSubject,
        reviewSnapshot,
        quizState,
        staffMembers,
        staffMaterials,
        adminActivityByCountry,
        followUpsByCountry,
        feedbackEntries,
        submittedFeedbackKeys,
        supportRequests,
        announcements,
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
    announcements,
    supportRequests,
    staffMembers,
    staffMaterials,
    staffView,
    studentView,
    submittedFeedbackKeys,
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

  useEffect(() => {
    setStaffMaterialDraft((current) => {
      const levelOptions = getLevelOptions(current.stage);
      const nextLevel = levelOptions.includes(current.level) ? current.level : levelOptions[0];
      const subjectOptions = getAvailableSubjects(current.countryCode, current.stage, 'elite');
      const nextSubject = subjectOptions.includes(current.subject) ? current.subject : subjectOptions[0];

      if (nextLevel === current.level && nextSubject === current.subject) {
        return current;
      }

      return {
        ...current,
        level: nextLevel,
        subject: nextSubject,
      };
    });
  }, [staffMaterialDraft.countryCode, staffMaterialDraft.stage]);

  const country = getCountryByCode(profile.countryCode);
  const availableSubjects = getAvailableSubjects(profile.countryCode, profile.stage, profile.plan);
  const currentQuestion = quizState?.questions[quizState.currentIndex];
  const adminMetricsCode = screen === 'admin' ? adminFocusCode : profile.countryCode;
  const activeStudentSubject = selectedSubject ?? profile.subject;
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
  const recentLearnerActivity = [...focusedLearners]
    .sort(
      (left, right) =>
        new Date(right.lastLoginAt ?? right.createdAt).getTime() -
        new Date(left.lastLoginAt ?? left.createdAt).getTime(),
    )
    .slice(0, 8);
  const countryRegistrationCards = registrationsByCountry;
  const focusedStaffMembers = staffMembers.filter((member) => !member.countryCode || member.countryCode === adminMetricsCode);
  const focusedStaffAccounts = staffRegistrations.filter((entry) => entry.countryCode === adminMetricsCode);
  const feedbackSummary = buildFeedbackSummary(feedbackEntries);
  const learnerFeedbackEntries = feedbackEntries.filter((entry) => entry.role === 'student');
  const learnerFeedbackSummary = buildFeedbackSummary(learnerFeedbackEntries);
  const recentFeedback = [...feedbackEntries]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5);
  const supportRequestsForAdmin = [...supportRequests].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const announcementFeed = buildAnnouncementFeed(announcements);
  const focusCountryRequests = supportRequestsForAdmin.filter((request) => request.countryCode === adminMetricsCode);
  const focusCountryOpenRequestCount = focusCountryRequests.filter(
    (request) => !isClosedSupportRequest(normalizeSupportRequestEntry(request)),
  ).length;
  const activeFeedbackQuestions = profile.role === 'staff' ? STAFF_FEEDBACK_QUESTIONS : LEARNER_FEEDBACK_QUESTIONS;
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
  const pendingMaterials = [...staffMaterials]
    .filter((material) => (material.approvalStatus ?? 'approved') === 'pending')
    .sort(
      (left, right) =>
        new Date(right.updatedAt ?? right.createdAt).getTime() -
        new Date(left.updatedAt ?? left.createdAt).getTime(),
    );
  const quietLearners = focusedLearners.filter((entry) => {
    if (!entry.lastLoginAt) return true;
    return now - new Date(entry.lastLoginAt).getTime() > recentWindowMs;
  });
  const trialLearners = focusedLearners.filter((entry) => entry.plan === 'trial');
  const realFollowUps = [
    ...(pendingMaterials.length > 0
      ? [
          {
            title: 'Staff uploads waiting for approval',
            detail: `${pendingMaterials.length} material${pendingMaterials.length === 1 ? '' : 's'} need a school team review before publishing to learners.`,
          },
        ]
      : []),
    ...(focusCountryOpenRequestCount > 0
      ? [
          {
            title: 'Learner and staff requests',
            detail: `${focusCountryOpenRequestCount} support request${focusCountryOpenRequestCount === 1 ? '' : 's'} need attention in ${adminCountry.name}.`,
          },
        ]
      : []),
    ...(trialLearners.length > 0
      ? [
          {
            title: 'More practice learners to follow up',
            detail: `${trialLearners.length} learner${trialLearners.length === 1 ? '' : 's'} in ${adminCountry.name} are using the more practice plan and may need guidance.`,
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
  const matchingStaffMaterials = staffMaterials.filter(
    (material) =>
      (material.approvalStatus ?? 'approved') === 'approved' &&
      material.countryCode === profile.countryCode &&
      material.stage === profile.stage &&
      material.level === profile.level &&
      material.subject === activeStudentSubject,
  );
  const myStaffMaterials = [...staffMaterials]
    .filter((material) => (material.uploadedByEmail ?? '').toLowerCase() === profile.email.toLowerCase())
    .sort(
      (left, right) =>
        new Date(right.updatedAt ?? right.createdAt).getTime() -
        new Date(left.updatedAt ?? left.createdAt).getTime(),
    );
  const readingMaterials = matchingStaffMaterials.filter((material) => material.category === 'reading');
  const quizMaterials = matchingStaffMaterials.filter((material) => material.category === 'quiz');
  const examMaterials = matchingStaffMaterials.filter((material) => material.category === 'exam');
  const featuredVideoMaterial = readingMaterials.find((material) => material.resourceType === 'video' && material.videoUrl);
  const duplicateQuestionPrompts = staffMaterialDraft.resourceType === 'question-bank' ? findDuplicateQuestionPrompts() : [];
  const feedbackUserKey = `${profile.role}:${(profile.email || profile.fullName || firstName).trim().toLowerCase()}`;
  const hasSubmittedFeedback =
    submittedFeedbackKeys.includes(feedbackUserKey) ||
    feedbackEntries.some((entry) => entry.userKey === feedbackUserKey);
  const progressSnapshot = getProgressSnapshot(attempts);
  const selectedBirthday = getBirthDate(profile);
  const birthdayCalendar = buildBirthdayCalendar(birthdayCalendarDate, selectedBirthday);
  const birthdayYearOptions = Array.from(
    { length: new Date().getFullYear() - BIRTHDAY_MIN_DATE.getFullYear() + 1 },
    (_, index) => new Date().getFullYear() - index,
  );
  const maxBirthdayMonth = getMonthStart(new Date());
  const filteredLearners = learnerRegistrations.filter((entry) => {
    const query = learnerSearch.trim().toLowerCase();
    if (!query) return true;
    return [entry.fullName, entry.email, entry.level, entry.subject, getCountryByCode(entry.countryCode).name]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });
  const filteredStaff = staffRegistrations.filter((entry) => {
    const query = staffSearch.trim().toLowerCase();
    if (!query) return true;
    return [
      entry.fullName,
      entry.email,
      entry.qualifications ?? '',
      entry.eligibility ?? '',
      entry.supportFocus ?? '',
      getCountryByCode(entry.countryCode).name,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });
  const visibleAnnouncements = announcementFeed.filter(
    (announcement) =>
      announcement.audience === 'all' ||
      (profile.role === 'student' && announcement.audience === 'learners') ||
      (profile.role === 'staff' && announcement.audience === 'staff'),
  );
  const visibleAnnouncementPreview = visibleAnnouncements.slice(0, 2);
  const hiddenVisibleAnnouncementCount = Math.max(0, visibleAnnouncements.length - visibleAnnouncementPreview.length);
  const adminAnnouncementPreview = announcementFeed.slice(0, 2);
  const hiddenAdminAnnouncementCount = Math.max(0, announcementFeed.length - adminAnnouncementPreview.length);
  const learnerSummaryQuestions = learnerFeedbackSummary.questionAverages.slice(0, 4);
  const learnerQuestionBreakdown = learnerFeedbackSummary.questionAverages;
  const mySupportRequests = supportRequestsForAdmin
    .filter((request) => request.createdBy.toLowerCase() === (profile.email || profile.fullName).toLowerCase())
    .map(normalizeSupportRequestEntry);
  const birthdayLearners = learnerRegistrations.filter((entry) => isBirthdayToday(entry));
  const openSupportRequests = supportRequestsForAdmin
    .map(normalizeSupportRequestEntry)
    .filter((request) => !isClosedSupportRequest(request));
  const focusCountryOpenRequests = openSupportRequests.filter((request) => request.countryCode === adminMetricsCode);
  const assignedSupportRequests = openSupportRequests.filter(
    (request) => (request.assignedToEmail ?? '').toLowerCase() === profile.email.toLowerCase(),
  );
  const activeViewerMaterial = activeMaterialViewer?.material ?? null;
  const activeViewerDocumentPreview =
    activeViewerMaterial?.resourceType === 'document'
      ? getDocumentPreview(activeViewerMaterial)
      : null;
  const activeViewerVideoConfig =
    activeViewerMaterial?.resourceType === 'video'
      ? getEmbeddedVideoConfig(activeViewerMaterial.videoUrl)
      : null;
  const learnerCommentEntries = learnerFeedbackEntries.filter((entry) => entry.comment.trim());
  const reviewPriorityCards = [
    {
      label: 'Needs attention first',
      value: learnerFeedbackSummary.headline,
      detail: learnerFeedbackSummary.detail,
    },
    {
      label: 'Waiting for review',
      value: `${pendingMaterials.length} upload${pendingMaterials.length === 1 ? '' : 's'}`,
      detail:
        pendingMaterials.length > 0
          ? 'Open the follow-up list to approve or return staff work.'
          : 'No staff uploads are waiting for a school team check.',
    },
    {
      label: 'Open support requests',
      value: `${openSupportRequests.length} request${openSupportRequests.length === 1 ? '' : 's'}`,
      detail:
        openSupportRequests[0]
          ? `${openSupportRequests[0].title} is the newest item waiting for help.`
          : 'Learner and staff requests will show here when they come in.',
    },
    {
      label: 'Latest learner note',
      value: learnerCommentEntries[0]?.choice ?? 'No comment yet',
      detail: learnerCommentEntries[0]?.comment || 'Written learner notes will appear here after the next feedback reply.',
    },
  ];

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingKey(null);
    speechKeyRef.current = null;
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!streakNotice) return undefined;

    const timeoutId = window.setTimeout(() => {
      setStreakNotice('');
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [streakNotice]);

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
    if (key === 'countryCode' && authMode === 'signup') {
      setHasChosenSignupCountry(true);
    }

    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleBirthDateChange(value: string) {
    if (!value) {
      setProfile((current) => ({
        ...current,
        birthDay: undefined,
        birthMonth: undefined,
        birthYear: undefined,
      }));
      return;
    }

    const [year, month, day] = value.split('-').map((entry) => Number(entry));
    if (!year || !month || !day) {
      return;
    }

    setProfile((current) => ({
      ...current,
      birthDay: day,
      birthMonth: month,
      birthYear: year,
    }));
  }

  function openBirthdayPicker() {
    const focusDate = getBirthDate(profile) ?? new Date();
    setBirthdayCalendarDate(getMonthStart(focusDate));
    setShowBirthdayPicker(true);
  }

  function updateBirthdayCalendarYear(year: number) {
    setBirthdayCalendarDate((current) => {
      const next = new Date(year, current.getMonth(), 1);
      const maxMonth = getMonthStart(new Date());
      if (next.getTime() > maxMonth.getTime()) {
        return maxMonth;
      }
      if (next.getTime() < getMonthStart(BIRTHDAY_MIN_DATE).getTime()) {
        return getMonthStart(BIRTHDAY_MIN_DATE);
      }
      return next;
    });
  }

  function updateBirthdayCalendarMonth(monthIndex: number) {
    setBirthdayCalendarDate((current) => {
      const next = new Date(current.getFullYear(), monthIndex, 1);
      const maxMonth = getMonthStart(new Date());
      if (next.getTime() > maxMonth.getTime()) {
        return maxMonth;
      }
      if (next.getTime() < getMonthStart(BIRTHDAY_MIN_DATE).getTime()) {
        return getMonthStart(BIRTHDAY_MIN_DATE);
      }
      return next;
    });
  }

  function selectBirthday(date: Date) {
    handleBirthDateChange(
      formatBirthDateInput({
        birthDay: date.getDate(),
        birthMonth: date.getMonth() + 1,
        birthYear: date.getFullYear(),
      }),
    );
    setShowBirthdayPicker(false);
  }

  function clearBirthday() {
    handleBirthDateChange('');
    setShowBirthdayPicker(false);
  }

  function applySharedState(
    repoUsers: RegisteredUser[],
    repoStaff: AdminStaffMember[],
    repoMaterials: StaffMaterial[],
    repoFeedback: FeedbackEntry[],
    repoSupportRequests: SupportRequest[],
    repoAnnouncements: Announcement[],
  ) {
    startTransition(() => {
      setRegisteredUsers(ensureRegisteredUsers(repoUsers));
      setStaffMembers(repoStaff);
      setStaffMaterials(repoMaterials);
      setFeedbackEntries(repoFeedback);
      setSupportRequests(repoSupportRequests.map(normalizeSupportRequestEntry));
      setAnnouncements(repoAnnouncements);
    });
  }

  async function refreshSharedState() {
    if (sharedRefreshPromiseRef.current) {
      return sharedRefreshPromiseRef.current;
    }

    const refreshTask = (async () => {
      const [repoUsers, repoStaff, repoMaterials, repoFeedback, repoSupportRequests, repoAnnouncements] = await Promise.all([
        appRepository.listRegisteredUsers(),
        appRepository.listStaffMembers(),
        appRepository.listStaffMaterials(),
        appRepository.listFeedbackEntries(),
        appRepository.listSupportRequests(),
        appRepository.listAnnouncements(),
      ]);

      applySharedState(
        repoUsers,
        repoStaff,
        repoMaterials,
        repoFeedback,
        repoSupportRequests,
        repoAnnouncements,
      );
    })();

    sharedRefreshPromiseRef.current = refreshTask;

    try {
      await refreshTask;
    } finally {
      sharedRefreshPromiseRef.current = null;
    }
  }

  function getLearnerRecordLabel(entry: RegisteredUser) {
    if (!entry.lastLoginAt) {
      return 'New learner';
    }

    const elapsed = Date.now() - new Date(entry.lastLoginAt).getTime();
    if (elapsed < 24 * 60 * 60 * 1000) {
      return 'Active today';
    }
    if (elapsed < 7 * 24 * 60 * 60 * 1000) {
      return 'Recently active';
    }
    return 'Needs follow-up';
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
      birthDay: enriched.birthDay,
      birthMonth: enriched.birthMonth,
      birthYear: enriched.birthYear,
      streakCount: enriched.streakCount ?? 0,
      lastActiveOn: enriched.lastActiveOn,
      tutorialSeen: enriched.tutorialSeen ?? false,
    };
  }

  function enterWorkspace(nextProfile: LearnerProfile) {
    const normalized = normalizeLearnerProfile(nextProfile);
    const todayKey = getTodayKey();
    const yesterdayKey = getYesterdayKey();
    let nextStreak = normalized.streakCount ?? 0;

    if (normalized.role === 'student') {
      if (normalized.lastActiveOn === todayKey) {
        nextStreak = normalized.streakCount ?? 1;
      } else if (normalized.lastActiveOn === yesterdayKey) {
        nextStreak = (normalized.streakCount ?? 0) + 1;
      } else {
        nextStreak = 1;
      }
    }

    const sessionProfile = {
      ...normalized,
      streakCount: normalized.role === 'student' ? nextStreak : normalized.streakCount,
      lastActiveOn: normalized.role === 'student' ? todayKey : normalized.lastActiveOn,
      tutorialSeen: normalized.tutorialSeen ?? false,
    };

    setProfile(sessionProfile);
    setQuizState(null);
    setSelectedSubject(sessionProfile.subject);
    setStudentView('home');
    setAdminView('overview');
    setStaffView('lounge');
    setScreen(sessionProfile.role === 'admin' ? 'admin' : sessionProfile.role === 'staff' ? 'staff' : 'student');
    setShowTutorial(!(sessionProfile.tutorialSeen ?? false));
    setStreakNotice(
      sessionProfile.role === 'student'
        ? buildStreakNotice(normalized.lastActiveOn, todayKey, yesterdayKey, sessionProfile.streakCount ?? 1)
        : '',
    );

    setRegisteredUsers((current) =>
      current.map((entry) =>
        entry.email.toLowerCase() === sessionProfile.email.toLowerCase()
          ? {
              ...entry,
              ...sessionProfile,
              lastLoginAt: new Date().toISOString(),
              streakCount: sessionProfile.streakCount,
              lastActiveOn: sessionProfile.lastActiveOn,
              tutorialSeen: sessionProfile.tutorialSeen,
            }
          : entry,
      ),
    );

    if (sessionProfile.email) {
      void appRepository.syncLearnerProfile({
        email: sessionProfile.email,
        countryCode: sessionProfile.countryCode,
        plan: sessionProfile.plan,
        stage: sessionProfile.stage,
        level: sessionProfile.level,
        mode: sessionProfile.mode,
        subject: sessionProfile.subject,
        birthDay: sessionProfile.birthDay,
        birthMonth: sessionProfile.birthMonth,
        birthYear: sessionProfile.birthYear,
        streakCount: sessionProfile.streakCount,
        lastActiveOn: sessionProfile.lastActiveOn,
        tutorialSeen: sessionProfile.tutorialSeen,
      });
    }
  }

  function openAdminView(view: AdminView) {
    setAdminNotice('');
    startTransition(() => {
      setAdminView(view);
    });
  }

  async function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    if (isAuthBusy) return;
    setAuthNotice('');
    setIsAuthBusy(true);

    try {
      if (isRecoveryMode) {
        if (recoveryPassword !== recoveryConfirmPassword) {
          setAuthNotice('New passwords do not match yet.');
          return;
        }

        try {
          await appRepository.completePasswordReset(recoveryPassword);
          setRecoveryPassword('');
          setRecoveryConfirmPassword('');
          setIsRecoveryMode(false);
          setShowPassword(false);
          window.history.replaceState({}, document.title, window.location.pathname);
          setAuthNotice('Password updated. Sign in with your new password.');
        } catch (error) {
          setAuthNotice(getErrorMessage(error, 'We could not save the new password just now.'));
        }
        return;
      }

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
          setSigninIdentifier(savedUser.email);
          setAdminNotice(`${savedUser.fullName} is now on the learner list.`);
          setConfirmPassword('');
          enterWorkspace(savedUser);
          void refreshSharedState().catch(() => undefined);
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

      enterWorkspace(matchedUser);
      void refreshSharedState().catch(() => undefined);
    } catch (error) {
      setAuthNotice(getErrorMessage(error, 'We could not continue right now. Please try again.'));
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function handleForgotPassword() {
    setAuthNotice('Password reset is not open yet. If your account was created by the school team, use the first password they shared with you.');
  }

  function logout() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingKey(null);
    setAuthMode('signin');
    setAuthNotice('');
    setSigninIdentifier('');
    setHasChosenSignupCountry(false);
    setProfile(createInitialProfile());
    setScreen('auth');
    setStudentView('home');
    setAdminView('overview');
    setStaffView('lounge');
    setSelectedSubject(null);
    setReviewSnapshot(null);
    setQuizState(null);
    setShowPassword(false);
    setConfirmPassword('');
    setRecoveryPassword('');
    setRecoveryConfirmPassword('');
    setIsRecoveryMode(false);
    setShowBirthdayPicker(false);
    setShowTutorial(false);
    setStreakNotice('');
    setActiveMaterialViewer(null);
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
    const focusCountry = getCountryByCode(staffDraft.countryCode);
    if (
      !staffDraft.name.trim() ||
      !staffDraft.role.trim() ||
      !staffDraft.focus.trim() ||
      !staffDraft.qualifications.trim() ||
      !staffDraft.eligibility.trim()
    ) {
      setAdminNotice('Add a name, role, support area, qualifications, and status before saving.');
      return;
    }

    const fullName = staffDraft.name.trim();
    const email = `${createUsername(fullName, `${fullName}@reviewbuddy.app`)}@reviewbuddy.app`;
    const password = generateEasyPassword(fullName);
    const registeredStaffUser = normalizeRegisteredUser({
      fullName,
      email,
      password,
      role: 'staff',
      username: createUsername(fullName, email),
      countryCode: staffDraft.countryCode,
      plan: 'elite',
      stage: 'primary',
      level: 'Grade 4',
      mode: 'solo',
      subject: 'Mathematics',
      createdAt: new Date().toISOString(),
      qualifications: staffDraft.qualifications.trim(),
      eligibility: staffDraft.eligibility.trim(),
      supportFocus: `${staffDraft.focus.trim()} · ${focusCountry.name}`,
      tutorialSeen: false,
    });

    try {
      const savedMember = await appRepository.addStaffMember({
        name: fullName,
        role: staffDraft.role.trim(),
        focus: `${staffDraft.focus.trim()} · ${focusCountry.name}`,
        status: 'Ready to assign',
        countryCode: staffDraft.countryCode,
        email,
        username: registeredStaffUser.username,
        password,
        qualifications: staffDraft.qualifications.trim(),
        eligibility: staffDraft.eligibility.trim(),
        createdAt: registeredStaffUser.createdAt,
      });
      setStaffMembers((current) => [savedMember, ...current.filter((entry) => entry.email !== email)]);
      setRegisteredUsers((current) =>
        ensureRegisteredUsers([registeredStaffUser, ...current.filter((entry) => entry.email !== email)]),
      );

      try {
        const refreshedUsers = await appRepository.listRegisteredUsers();
        setRegisteredUsers(
          ensureRegisteredUsers([
            registeredStaffUser,
            ...refreshedUsers.filter((entry) => entry.email !== email),
          ]),
        );
      } catch {
        // Keep the newly created local staff login available even if refresh fails.
      }
    } catch {
      setAdminNotice(`We could not save that staff profile for ${focusCountry.name} just now.`);
      return;
    }

    setGeneratedStaffAccount({ name: fullName, email, password });
    setStaffDraft(createInitialStaffAccountDraft(staffDraft.countryCode));
    setAdminNotice(`A new staff account was created for ${focusCountry.name}. Share the first password with ${fullName}.`);
  }

  function updateStaffMaterialDraft<Key extends keyof StaffMaterialDraft>(key: Key, value: StaffMaterialDraft[Key]) {
    setStaffMaterialDraft((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === 'stage' || key === 'countryCode') {
        const nextStage = key === 'stage' ? (value as Stage) : next.stage;
        const nextCountryCode = key === 'countryCode' ? (value as string) : next.countryCode;
        const levelOptions = getLevelOptions(nextStage);
        const subjectOptions = getAvailableSubjects(nextCountryCode, nextStage, 'elite');

        next.level = levelOptions.includes(next.level) ? next.level : levelOptions[0];
        next.subject = subjectOptions.includes(next.subject) ? next.subject : subjectOptions[0];
      }

      if (key === 'category') {
        const nextCategory = value as StaffMaterialCategory;
        if (nextCategory === 'reading') {
          next.resourceType = next.resourceType === 'question-bank' ? 'text' : next.resourceType;
        } else {
          next.resourceType = 'question-bank';
          next.questionLimit = Math.max(next.questionLimit || 5, 1);
          next.questions = next.questions.length > 0 ? next.questions : [createQuestionDraft()];
        }
      }

      if (key === 'resourceType') {
        const nextType = value as StaffMaterialResourceType;
        if (nextType === 'question-bank') {
          next.questions = next.questions.length > 0 ? next.questions : [createQuestionDraft()];
          next.videoUrl = '';
          next.attachmentName = '';
          next.attachmentData = '';
        } else if (nextType === 'video') {
          next.attachmentName = '';
          next.attachmentData = '';
        } else if (nextType === 'document') {
          next.videoUrl = '';
        } else {
          next.videoUrl = '';
          next.attachmentName = '';
          next.attachmentData = '';
        }
      }

      return next;
    });
  }

  function updateQuestionDraft(
    questionId: string,
    key: keyof StaffQuestionDraft,
    value: StaffQuestionDraft[keyof StaffQuestionDraft],
  ) {
    setStaffMaterialDraft((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId ? { ...question, [key]: value } : question,
      ),
    }));
  }

  function updateQuestionChoice(questionId: string, choiceIndex: number, value: string) {
    setStaffMaterialDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.id !== questionId) return question;
        const nextChoices = [...question.choices] as [string, string, string, string];
        nextChoices[choiceIndex] = value;
        return {
          ...question,
          choices: nextChoices,
        };
      }),
    }));
  }

  function addQuestionDraft() {
    setStaffMaterialDraft((current) => ({
      ...current,
      questions: [...current.questions, createQuestionDraft()],
    }));
  }

  function removeQuestionDraft(questionId: string) {
    setStaffMaterialDraft((current) => ({
      ...current,
      questions: current.questions.length > 1
        ? current.questions.filter((question) => question.id !== questionId)
        : current.questions,
    }));
  }

  function beginEditStaffMaterial(material: StaffMaterial) {
    setStaffMaterialDraft({
      editingId: material.id,
      title: material.title,
      summary: material.summary,
      body: material.body,
      countryCode: material.countryCode,
      stage: material.stage,
      level: material.level,
      subject: material.subject,
      category: material.category,
      resourceType: material.resourceType ?? (material.category === 'reading' ? 'text' : 'question-bank'),
      attachmentName: material.attachmentName ?? '',
      attachmentData: material.attachmentData ?? '',
      videoUrl: material.videoUrl ?? '',
      questionLimit: material.questionLimit ?? Math.max(material.questions?.length ?? 0, 5),
      questions:
        material.questions?.map((question) => ({
          ...question,
          choices: [...question.choices] as [string, string, string, string],
        })) ?? [],
    });
    setAdminNotice(`Editing ${material.title}. Update the class, country, or content, then save again.`);
  }

  function handleStaffAttachment(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      setStaffMaterialDraft((current) => ({
        ...current,
        attachmentName: file.name,
        attachmentData: result,
        resourceType: 'document',
      }));
    };
    reader.readAsDataURL(file);
  }

  function findDuplicateQuestionPrompts() {
    const draftPrompts = staffMaterialDraft.questions.map((question) => normalizePrompt(question.prompt)).filter(Boolean);
    const repeatedDraftPrompt = draftPrompts.find(
      (prompt, index) => draftPrompts.indexOf(prompt) !== index,
    );
    const scopedExistingQuestions = staffMaterials
      .filter(
        (material) =>
          material.id !== staffMaterialDraft.editingId &&
          material.countryCode === staffMaterialDraft.countryCode &&
          material.stage === staffMaterialDraft.stage &&
          material.level === staffMaterialDraft.level &&
          material.subject === staffMaterialDraft.subject &&
          material.category === staffMaterialDraft.category,
      )
      .flatMap((material) => material.questions ?? [])
      .map((question) => normalizePrompt(question.prompt));

    return [
      ...(repeatedDraftPrompt ? [repeatedDraftPrompt] : []),
      ...staffMaterialDraft.questions
        .map((question) => normalizePrompt(question.prompt))
        .filter((prompt) => prompt && scopedExistingQuestions.includes(prompt)),
    ];
  }

  async function addStaffMaterial() {
    if (!staffMaterialDraft.title.trim() || !staffMaterialDraft.summary.trim()) {
      setAdminNotice('Add a title and a short summary before saving this item.');
      return;
    }

    if (staffMaterialDraft.resourceType === 'text' && !staffMaterialDraft.body.trim()) {
      setAdminNotice('Add the reading text before assigning this material.');
      return;
    }

    if (staffMaterialDraft.resourceType === 'document' && !staffMaterialDraft.attachmentData) {
      setAdminNotice('Upload a document file first so learners can open it.');
      return;
    }

    if (staffMaterialDraft.resourceType === 'video' && !staffMaterialDraft.videoUrl.trim()) {
      setAdminNotice('Paste a video link before saving this lesson.');
      return;
    }

    if (staffMaterialDraft.resourceType === 'question-bank') {
      const duplicatePrompts = findDuplicateQuestionPrompts();
      if (duplicatePrompts.length > 0) {
        setAdminNotice('One or more questions already exist for that class, subject, and country. Update the prompt before saving.');
        return;
      }

      const invalidQuestion = staffMaterialDraft.questions.find(
        (question) =>
          !question.prompt.trim() ||
          question.choices.some((choice) => !choice.trim()) ||
          question.answerIndex < 0 ||
          question.answerIndex > 3,
      );
      if (invalidQuestion) {
        setAdminNotice('Complete every question, all four choices, and the correct answer before saving.');
        return;
      }
    }

    const materialPayload: StaffMaterial = {
      id:
        staffMaterialDraft.editingId ??
        `material-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      title: staffMaterialDraft.title.trim(),
      summary: staffMaterialDraft.summary.trim(),
      body:
        staffMaterialDraft.resourceType === 'question-bank'
          ? 'Staff-authored question bank'
          : staffMaterialDraft.body.trim(),
      countryCode: staffMaterialDraft.countryCode,
      stage: staffMaterialDraft.stage,
      level: staffMaterialDraft.level,
      subject: staffMaterialDraft.subject,
      category: staffMaterialDraft.category,
      resourceType: staffMaterialDraft.resourceType,
      attachmentName: staffMaterialDraft.attachmentName || undefined,
      attachmentData: staffMaterialDraft.attachmentData || undefined,
      videoUrl: staffMaterialDraft.videoUrl.trim() || undefined,
      questionLimit:
        staffMaterialDraft.resourceType === 'question-bank'
          ? Math.max(1, staffMaterialDraft.questionLimit)
          : undefined,
      questions:
        staffMaterialDraft.resourceType === 'question-bank'
          ? staffMaterialDraft.questions.map((question) => ({
              id: question.id,
              prompt: question.prompt.trim(),
              choices: question.choices.map((choice) => choice.trim()) as [string, string, string, string],
              answerIndex: question.answerIndex,
              explanation: question.explanation.trim(),
            }))
          : [],
      uploadedBy: profile.fullName.trim() || DEFAULT_STAFF_USERNAME,
      uploadedByEmail: profile.email,
      createdAt:
        staffMaterials.find((material) => material.id === staffMaterialDraft.editingId)?.createdAt ??
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvalStatus: profile.role === 'admin' ? 'approved' : 'pending',
      aiReviewSummary: reviewMaterialSafety({
        id: staffMaterialDraft.editingId ?? 'draft',
        title: staffMaterialDraft.title.trim(),
        summary: staffMaterialDraft.summary.trim(),
        body:
          staffMaterialDraft.resourceType === 'question-bank'
            ? 'Staff-authored question bank'
            : staffMaterialDraft.body.trim(),
        countryCode: staffMaterialDraft.countryCode,
        stage: staffMaterialDraft.stage,
        level: staffMaterialDraft.level,
        subject: staffMaterialDraft.subject,
        category: staffMaterialDraft.category,
        resourceType: staffMaterialDraft.resourceType,
        questions:
          staffMaterialDraft.resourceType === 'question-bank'
            ? staffMaterialDraft.questions.map((question) => ({
                id: question.id,
                prompt: question.prompt.trim(),
                choices: question.choices.map((choice) => choice.trim()) as [string, string, string, string],
                answerIndex: question.answerIndex,
                explanation: question.explanation.trim(),
              }))
            : [],
        uploadedBy: profile.fullName.trim() || DEFAULT_STAFF_USERNAME,
        createdAt: new Date().toISOString(),
      }),
      adminReviewNote: profile.role === 'admin' ? 'Published by the school team.' : 'Waiting for school team review.',
      reviewedAt: profile.role === 'admin' ? new Date().toISOString() : undefined,
      reviewedBy: profile.role === 'admin' ? profile.fullName : undefined,
    };

    const savedMaterial = staffMaterialDraft.editingId
      ? await appRepository.updateStaffMaterial(materialPayload)
      : await appRepository.addStaffMaterial(materialPayload);

    setStaffMaterials((current) =>
      [savedMaterial, ...current.filter((entry) => entry.id !== savedMaterial.id)].sort(
        (left, right) =>
          new Date(right.updatedAt ?? right.createdAt).getTime() -
          new Date(left.updatedAt ?? left.createdAt).getTime(),
      ),
    );
    setStaffMaterialDraft(createInitialMaterialDraft(profile.countryCode));
    setAdminNotice(
      profile.role === 'admin'
        ? `${savedMaterial.title} was published for ${getFlagEmoji(savedMaterial.countryCode)} ${getCountryByCode(savedMaterial.countryCode).name}, ${savedMaterial.level}, ${savedMaterial.subject}.`
        : `${savedMaterial.title} was sent to the school team for review before learners can see it.`,
    );
  }

  async function removeStaffMaterial(materialId: string) {
    const material = staffMaterials.find((entry) => entry.id === materialId);
    await appRepository.removeStaffMaterial(materialId);
    setStaffMaterials((current) => current.filter((entry) => entry.id !== materialId));
    setAdminNotice(`${material?.title ?? 'That material'} was removed from staff materials.`);
  }

  async function removeStaffMember(memberIdOrName: string) {
    const member =
      staffMembers.find((entry) => entry.id === memberIdOrName || entry.name === memberIdOrName) ??
      staffRegistrations.find((entry) => entry.id === memberIdOrName || entry.fullName === memberIdOrName);
    const removedName =
      member && 'name' in member ? member.name : (member as RegisteredUser | undefined)?.fullName ?? memberIdOrName;
    await appRepository.removeStaffMember(memberIdOrName);
    setStaffMembers((current) => current.filter((entry) => entry.id !== memberIdOrName && entry.name !== memberIdOrName));
    setRegisteredUsers((current) => current.filter((entry) => entry.id !== memberIdOrName && entry.fullName !== memberIdOrName));
    setAdminNotice(`${removedName} was removed from the staff list.`);
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

  async function submitSupportRequest() {
    if (!supportRequestDraft.title.trim() || !supportRequestDraft.detail.trim()) {
      setAdminNotice('Add a request title and details first.');
      return;
    }

    const nextRequest: SupportRequest = {
      id: `request-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      createdBy: profile.email || profile.fullName,
      createdByRole: profile.role,
      countryCode: profile.countryCode,
      title: supportRequestDraft.title.trim(),
      detail: supportRequestDraft.detail.trim(),
      category: supportRequestDraft.category,
      status: 'new',
    };

    try {
      const savedRequest = await appRepository.addSupportRequest(nextRequest);
      setSupportRequests((current) => [savedRequest, ...current.filter((entry) => entry.id !== savedRequest.id)]);
      setSupportRequestDraft(createInitialSupportRequestDraft());
      setAdminNotice('Your request was sent to the school team.');
    } catch (error) {
      setAdminNotice(getErrorMessage(error, 'We could not send that request just now.'));
    }
  }

  function getAssignableStaffForRequest(request: SupportRequest) {
    const matchingCountry = focusedStaffAccounts.filter((entry) => entry.email && entry.countryCode === request.countryCode);
    return matchingCountry.length > 0
      ? matchingCountry
      : staffRegistrations.filter((entry) => entry.email);
  }

  async function saveSupportRequest(nextRequest: SupportRequest, successMessage: string) {
    try {
      await appRepository.updateSupportRequest(nextRequest);
      setSupportRequests((current) =>
        current.map((request) => (request.id === nextRequest.id ? normalizeSupportRequestEntry(nextRequest) : request)),
      );
      setAdminNotice(successMessage);
    } catch (error) {
      setAdminNotice(getErrorMessage(error, 'We could not update that request just now.'));
    }
  }

  async function assignSupportRequestToAdmin(request: SupportRequest) {
    const nextRequest: SupportRequest = {
      ...request,
      status: 'in-review',
      assignedToRole: 'admin',
      assignedToName: profile.fullName,
      assignedToEmail: profile.email || undefined,
      completedAt: undefined,
      completedBy: undefined,
    };

    await saveSupportRequest(nextRequest, 'That request now stays with the school team for follow-up.');
  }

  async function assignSupportRequestToStaff(request: SupportRequest) {
    const selectedEmail =
      requestAssignmentSelections[request.id] ||
      request.assignedToEmail ||
      getAssignableStaffForRequest(request)[0]?.email ||
      '';

    const assignee = getAssignableStaffForRequest(request).find(
      (entry) => (entry.email ?? '').toLowerCase() === selectedEmail.toLowerCase(),
    );

    if (!assignee?.email) {
      setAdminNotice('Choose a staff member first.');
      return;
    }

    const nextRequest: SupportRequest = {
      ...request,
      status: 'assigned',
      assignedToRole: 'staff',
      assignedToName: assignee.fullName,
      assignedToEmail: assignee.email,
      completedAt: undefined,
      completedBy: undefined,
    };

    await saveSupportRequest(nextRequest, `${assignee.fullName} was assigned to follow up on that request.`);
  }

  async function markSupportRequestDone(request: SupportRequest) {
    const nextRequest: SupportRequest = {
      ...request,
      status: 'done',
      completedAt: new Date().toISOString(),
      completedBy: profile.fullName,
    };

    await saveSupportRequest(nextRequest, 'That request was marked as done and moved to request history.');
  }

  async function addAnnouncement() {
    if (!announcementDraft.title.trim() || !announcementDraft.message.trim()) {
      setAdminNotice('Add an announcement title and message first.');
      return;
    }

    const draftKey = createAnnouncementKey({
      title: announcementDraft.title,
      message: announcementDraft.message,
      audience: announcementDraft.audience,
    });

    if (announcementFeed.some((entry) => createAnnouncementKey(entry) === draftKey)) {
      setAdminNotice('That update is already on the board. Edit it before posting again.');
      return;
    }

    const nextAnnouncement: Announcement = {
      id: `announcement-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title: announcementDraft.title.trim(),
      message: announcementDraft.message.trim(),
      audience: announcementDraft.audience,
      createdAt: new Date().toISOString(),
    };

    try {
      const savedAnnouncement = await appRepository.addAnnouncement(nextAnnouncement);
      setAnnouncements((current) => [savedAnnouncement, ...current.filter((entry) => entry.id !== savedAnnouncement.id)]);
      setAnnouncementDraft(createInitialAnnouncementDraft());
      setAdminNotice('Announcement posted to the board.');
    } catch (error) {
      setAdminNotice(getErrorMessage(error, 'We could not post that announcement just now.'));
    }
  }

  async function reviewPendingMaterial(materialId: string, status: Extract<StaffMaterial['approvalStatus'], 'approved' | 'denied'>) {
    const targetMaterial = staffMaterials.find((material) => material.id === materialId);
    if (!targetMaterial) return;

    try {
      const reviewedMaterial = await appRepository.updateStaffMaterial({
        ...targetMaterial,
        approvalStatus: status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: profile.fullName,
        adminReviewNote:
          status === 'approved'
            ? 'Approved for learners after a school team review.'
            : 'Please revise this upload and resubmit after edits.',
      });

      setStaffMaterials((current) =>
        current.map((material) => (material.id === materialId ? reviewedMaterial : material)),
      );
      setAdminNotice(status === 'approved' ? 'Material approved and published.' : 'Material returned to staff for changes.');
    } catch (error) {
      setAdminNotice(getErrorMessage(error, 'We could not review that material just now.'));
    }
  }

  function closeTutorial() {
    setShowTutorial(false);
    const nextProfile = { ...profile, tutorialSeen: true };
    setProfile(nextProfile);
    if (profile.email) {
      setRegisteredUsers((current) =>
        current.map((entry) =>
          entry.email.toLowerCase() === profile.email.toLowerCase()
            ? { ...entry, tutorialSeen: true }
            : entry,
        ),
      );
      void appRepository.syncLearnerProfile({
        email: profile.email,
        countryCode: nextProfile.countryCode,
        plan: nextProfile.plan,
        stage: nextProfile.stage,
        level: nextProfile.level,
        mode: nextProfile.mode,
        subject: nextProfile.subject,
        birthDay: nextProfile.birthDay,
        birthMonth: nextProfile.birthMonth,
        birthYear: nextProfile.birthYear,
        streakCount: nextProfile.streakCount,
        lastActiveOn: nextProfile.lastActiveOn,
        tutorialSeen: true,
      });
    }
  }

  function dismissVersionPrompt() {
    setShowVersionPrompt(false);
  }

  function exportCountryReport() {
    const focusCountry = getCountryByCode(adminFocusCode);
    const reportLines = [
      'Review Buddy summary',
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
    link.download = `review-buddy-${focusCountry.code.toLowerCase()}-summary.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    setAdminNotice(`A country summary was downloaded for ${focusCountry.name}.`);
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

  function openSubject(subject: string) {
    setSelectedSubject(subject);
    startTransition(() => {
      setStudentView('subject');
    });
  }

  function openMaterialViewer(material: StaffMaterial, audienceLabel: string) {
    setActiveMaterialViewer({
      material,
      audienceLabel,
    });
  }

  function closeMaterialViewer() {
    setActiveMaterialViewer(null);
  }

  function openLearningNotes(subject: string) {
    setSelectedSubject(subject);
    startTransition(() => {
      setStudentView('notes');
    });
  }

  function openVideoLesson(subject: string) {
    setSelectedSubject(subject);
    startTransition(() => {
      setStudentView('video');
    });
  }

  function openFeedbackPage() {
    setAuthNotice('');
    if (hasSubmittedFeedback) {
      setAuthNotice('You already shared feedback. Thank you.');
      return;
    }
    if (profile.role === 'staff') {
      startTransition(() => {
        setStaffView('feedback');
      });
      return;
    }
    startTransition(() => {
      setStudentView('feedback');
    });
  }

  async function submitFeedback() {
    if (hasSubmittedFeedback) {
      setAuthNotice('You already shared feedback. Thank you.');
      return;
    }

    const ratingsList = activeFeedbackQuestions.map((question) => feedbackRatings[question.key]);

    if (ratingsList.some((rating) => !rating)) {
      setAuthNotice('Rate each question with stars first.');
      return;
    }

    const averageRating = Math.round((ratingsList.reduce((sum, rating) => sum + rating, 0) / ratingsList.length) * 10) / 10;
    const lowestQuestion = activeFeedbackQuestions
      .map((question) => ({ ...question, rating: feedbackRatings[question.key] }))
      .sort((left, right) => left.rating - right.rating)[0];

    const nextEntry: FeedbackEntry = {
      id: `feedback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      userName: profile.fullName || firstName,
      userKey: feedbackUserKey,
      role: profile.role,
      countryCode: profile.countryCode,
      rating: averageRating,
      choice: lowestQuestion?.label ?? FEEDBACK_CHOICES[0],
      ratings: feedbackRatings,
      comment: feedbackComment.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const savedEntry = await appRepository.addFeedbackEntry(nextEntry);
      setFeedbackEntries((current) =>
        [savedEntry, ...current.filter((entry) => entry.id !== savedEntry.id)].slice(0, 60),
      );
    } catch (error) {
      setAuthNotice(getErrorMessage(error, 'We could not save your feedback just now.'));
      return;
    }

    setSubmittedFeedbackKeys((current) => [...new Set([...current, feedbackUserKey])]);
    setFeedbackRatings(createEmptyFeedbackRatings());
    setFeedbackComment('');
    setAuthNotice('');
    setAdminNotice('New feedback was saved for the school team.');
    if (profile.role === 'staff') {
      setStaffView('lounge');
      return;
    }
    setStudentView('home');
  }

  async function deleteFeedback(feedbackId: string) {
    try {
      await appRepository.deleteFeedbackEntry(feedbackId);
      setFeedbackEntries((current) => current.filter((entry) => entry.id !== feedbackId));
      setAdminNotice('That feedback entry was removed.');
    } catch (error) {
      setAdminNotice(getErrorMessage(error, 'We could not remove that feedback just now.'));
    }
  }

  function startQuiz(subject: string, kind: AssessmentKind = 'quiz') {
    const nextProfile = { ...profile, subject };
    const generatedQuestions = generateQuestions(nextProfile, { kind });
    const authoredQuestions = shuffleList(
      matchingStaffMaterials
        .filter((material) => material.category === kind && material.questions && material.questions.length > 0)
        .flatMap((material) =>
          (material.questions ?? [])
            .slice(0, material.questionLimit ?? material.questions?.length ?? 0)
            .map<Question>((question) => ({
              id: `${material.id}-${question.id}`,
              prompt: question.prompt,
              choices: [...question.choices],
              answer: question.choices[question.answerIndex],
              explanation: question.explanation || `Assigned by ${material.uploadedBy}`,
              skill: `${material.subject} · Staff pick`,
              helperText: `${getFlagEmoji(material.countryCode)} ${material.level}`,
            })),
        ),
    );
    const combinedQuestions = [...authoredQuestions, ...generatedQuestions].filter(
      (question, index, list) =>
        list.findIndex((entry) => normalizePrompt(entry.prompt) === normalizePrompt(question.prompt)) === index,
    );
    const questions = combinedQuestions.slice(0, generatedQuestions.length);
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
        birthDay: nextProfile.birthDay,
        birthMonth: nextProfile.birthMonth,
        birthYear: nextProfile.birthYear,
        streakCount: nextProfile.streakCount,
        lastActiveOn: nextProfile.lastActiveOn,
        tutorialSeen: nextProfile.tutorialSeen,
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
                <div class="eyebrow">Achievement certificate</div>
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
    <div
      className={`app-shell${screen === 'auth' ? ' app-shell-auth' : ''}`}
      data-theme={themeMode}
      data-auth-scene={screen === 'auth' ? authScene.id : undefined}
      style={themeStyle}
    >
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      {screen === 'auth' && (
        <div className={`auth-scene-layer auth-scene-${authScene.id}`} aria-hidden="true">
          {authScene.blobs.map((blob, index) => (
            <span
              key={`${authScene.id}-blob-${index}`}
              className="auth-scene-blob"
              style={{
                top: blob.top,
                left: blob.left,
                right: blob.right,
                bottom: blob.bottom,
                width: blob.width,
                height: blob.height,
                background: blob.background,
                filter: `blur(${blob.blur ?? 12}px)`,
                opacity: blob.opacity ?? 0.8,
              }}
            />
          ))}
          {authScene.stickers.map((sticker, index) => (
            <span
              key={`${authScene.id}-sticker-${index}`}
              className={`auth-scene-sticker auth-scene-sticker-${sticker.tone}`}
              style={{
                top: sticker.top,
                left: sticker.left,
                right: sticker.right,
                bottom: sticker.bottom,
                width: `${sticker.size}px`,
                height: `${sticker.size}px`,
                transform: `rotate(${sticker.rotate}deg)`,
              }}
            >
              <span className="auth-scene-sticker-icon">{sticker.icon}</span>
            </span>
          ))}
        </div>
      )}

      {!isInstalled && showInstallPrompt && installPromptEvent && (
        <section className="install-sheet" role="dialog" aria-live="polite" aria-label="Install Review Buddy">
          <div>
            <p className="eyebrow">Install app</p>
            <h2>Add Review Buddy to this device</h2>
            <p>Open learning faster from your home screen with fewer steps.</p>
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
                    ? 'School team'
                    : screen === 'staff'
                      ? 'Staff room'
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
        <main className="auth-layout auth-layout-single">
          <section className="auth-card auth-card-wide auth-shell-card">
            <div className="auth-shell-grid">
              <div className="auth-copy-stack">
                <div className="panel-heading auth-copy-heading">
                  <p className="eyebrow">Welcome</p>
                  <h2>
                    {isRecoveryMode
                      ? 'Reset your password'
                      : authMode === 'signin'
                        ? 'Sign in to continue'
                        : 'Create a new account'}
                  </h2>
                  <p>
                    {isRecoveryMode
                      ? 'Choose a fresh password and get back in.'
                      : authMode === 'signin'
                        ? 'Use your email or the sign-in name shared with you.'
                        : 'Create your learning space in a few quick steps.'}
                  </p>
                </div>

                <div className="benefit-grid benefit-grid-compact auth-benefit-strip auth-benefit-column">
                  {benefitCards.map((card) => (
                    <article key={card.title} className="info-card">
                      <span className="info-card-icon" aria-hidden="true">{card.icon}</span>
                      <div className="info-card-copy">
                        <strong>{card.title}</strong>
                        <p>{card.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="auth-support-card">
                  <span className="auth-support-mark" aria-hidden="true">📚</span>
                  <div>
                    <strong>Ready on every device</strong>
                    <p>Clear steps, country-matched learning, and a calmer start for children and teens.</p>
                  </div>
                </div>
              </div>

              <div className="auth-form-panel">
                {!isRecoveryMode && (
                  <div className="mode-toggle mode-toggle-prominent" role="tablist" aria-label="Account mode">
                    <button
                      type="button"
                      className={`mode-toggle-button${authMode === 'signin' ? ' mode-toggle-button-active' : ''}`}
                      onClick={() => {
                        setAuthMode('signin');
                        setAuthNotice('');
                        setShowPassword(false);
                        setIsRecoveryMode(false);
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
                        setIsRecoveryMode(false);
                        setProfile((current) =>
                          normalizeLearnerProfile({
                            ...current,
                            role: 'student',
                            password: '',
                          }),
                        );
                        if (!profile.fullName.trim() && !profile.email.trim()) {
                          setHasChosenSignupCountry(false);
                        }
                      }}
                    >
                      Register
                    </button>
                  </div>
                )}

                <form className="auth-form" onSubmit={handleAuthSubmit}>
              {isRecoveryMode && (
                <div className="auth-section-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Secure reset</p>
                    <h2>Choose a new password</h2>
                    <p>Use a password you can remember easily.</p>
                  </div>
                  <div className="field-grid auth-field-grid">
                    <label>
                      New password
                      <div className="password-field">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={recoveryPassword}
                          onChange={(event) => setRecoveryPassword(event.target.value)}
                          onCopy={blockPasswordTransfer}
                          onCut={blockPasswordTransfer}
                          onPaste={blockPasswordTransfer}
                          placeholder="Create new password"
                          autoComplete="new-password"
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
                          value={recoveryConfirmPassword}
                          onChange={(event) => setRecoveryConfirmPassword(event.target.value)}
                          onCopy={blockPasswordTransfer}
                          onCut={blockPasswordTransfer}
                          onPaste={blockPasswordTransfer}
                          placeholder="Repeat new password"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {authMode === 'signup' && (
                <div className="auth-section-card">
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
                        onCopy={blockPasswordTransfer}
                        onCut={blockPasswordTransfer}
                        onPaste={blockPasswordTransfer}
                        placeholder="Create password"
                        autoComplete="new-password"
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
                        onCopy={blockPasswordTransfer}
                        onCut={blockPasswordTransfer}
                        onPaste={blockPasswordTransfer}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </label>

                  <label>
                    Gender
                    <select
                      value={profile.gender}
                      onChange={(event) => updateGender(event.target.value as LearnerGender)}
                    >
                      <option value="boy">Boy</option>
                      <option value="girl">Girl</option>
                    </select>
                  </label>
                  <label className="field-span-2">
                    Birthday
                    <div
                      className={`birthday-picker${showBirthdayPicker ? ' birthday-picker-open' : ''}`}
                      ref={birthdayPickerRef}
                    >
                      <button
                        type="button"
                        className="birthday-picker-trigger"
                        data-birthday-picker-trigger="true"
                        onClick={() => {
                          if (showBirthdayPicker) {
                            setShowBirthdayPicker(false);
                            return;
                          }

                          openBirthdayPicker();
                        }}
                        aria-haspopup="dialog"
                        aria-expanded={showBirthdayPicker}
                      >
                        <span className={`birthday-picker-value${selectedBirthday ? '' : ' birthday-picker-placeholder'}`}>
                          {formatBirthdayLabel(profile)}
                        </span>
                        <CalendarIcon className="birthday-picker-icon" aria-hidden="true" />
                      </button>
                      {showBirthdayPicker && (
                        <div className="birthday-calendar" role="dialog" aria-label="Choose birthday">
                          <div className="birthday-calendar-controls">
                            <label className="birthday-calendar-field">
                              <span>Year</span>
                              <select
                                value={birthdayCalendarDate.getFullYear()}
                                onChange={(event) => updateBirthdayCalendarYear(Number(event.target.value))}
                              >
                                {birthdayYearOptions.map((year) => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </label>
                            <label className="birthday-calendar-field">
                              <span>Month</span>
                              <select
                                value={birthdayCalendarDate.getMonth()}
                                onChange={(event) => updateBirthdayCalendarMonth(Number(event.target.value))}
                              >
                                {BIRTHDAY_MONTH_LABELS.map((month, index) => (
                                  <option
                                    key={month}
                                    value={index}
                                    disabled={
                                      new Date(birthdayCalendarDate.getFullYear(), index, 1).getTime() >
                                      maxBirthdayMonth.getTime()
                                    }
                                  >
                                    {month}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="birthday-calendar-weekdays" aria-hidden="true">
                            {BIRTHDAY_WEEKDAY_LABELS.map((label) => (
                              <span key={label}>{label}</span>
                            ))}
                          </div>
                          <div className="birthday-calendar-grid">
                            {Array.from({ length: birthdayCalendar.firstWeekdayOffset }).map((_, index) => (
                              <span key={`empty-${index}`} className="birthday-calendar-blank" aria-hidden="true" />
                            ))}
                            {birthdayCalendar.days.map((day) => (
                              <button
                                key={day.key}
                                type="button"
                                className={[
                                  'birthday-calendar-day',
                                  day.isSelected ? ' birthday-calendar-day-selected' : '',
                                  day.isToday ? ' birthday-calendar-day-today' : '',
                                ].join('')}
                                data-birthday-day={formatBirthDateInput({
                                  birthDay: day.date.getDate(),
                                  birthMonth: day.date.getMonth() + 1,
                                  birthYear: day.date.getFullYear(),
                                })}
                                disabled={day.isDisabled}
                                onClick={() => selectBirthday(day.date)}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                          <div className="birthday-calendar-footer">
                            <button
                              type="button"
                              className="ghost-button birthday-calendar-clear"
                              onClick={clearBirthday}
                              disabled={!selectedBirthday}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                  </div>
                </div>
              )}

              {authMode === 'signin' && !isRecoveryMode && (
                <>
                  <label>
                    Email or sign-in name
                    <input
                      type="text"
                      value={signinIdentifier}
                      onChange={(event) => setSigninIdentifier(event.target.value)}
                      placeholder="Email or shared sign-in name"
                      required
                    />
                  </label>

                  <label>
                    <span className="field-label-row">
                      <span>Password</span>
                      <button type="button" className="auth-inline-link" onClick={handleForgotPassword}>
                        Need help signing in?
                      </button>
                    </span>
                    <div className="password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={profile.password}
                        onChange={(event) => updateProfile('password', event.target.value)}
                        onCopy={blockPasswordTransfer}
                        onCut={blockPasswordTransfer}
                        onPaste={blockPasswordTransfer}
                        placeholder="Enter password"
                        autoComplete="current-password"
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
                        <option value="free">Starter</option>
                        <option value="trial">More practice</option>
                        <option value="elite">Full access</option>
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

              <button className="primary-button" type="submit" disabled={isAuthBusy}>
                {isAuthBusy
                  ? isRecoveryMode
                    ? 'Saving...'
                    : authMode === 'signin'
                      ? 'Opening your space...'
                      : 'Creating your account...'
                  : isRecoveryMode
                    ? 'Save new password'
                    : authMode === 'signin'
                      ? 'Continue'
                      : 'Create account'}
              </button>
                </form>
              </div>
            </div>
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

                {(streakNotice || isBirthdayToday(normalizeRegisteredUser({ ...profile, username: profile.email || 'learner' }))) && (
                  <section className="setup-panel compact-panel">
                    <div className="history-list">
                      {streakNotice ? (
                        <article className="history-row">
                          <div>
                            <strong>🔥 Learning streak</strong>
                            <span>{streakNotice}</span>
                          </div>
                        </article>
                      ) : null}
                      {profile.birthDay && profile.birthMonth && isBirthdayToday(normalizeRegisteredUser({ ...profile, username: profile.email || 'learner' })) ? (
                        <article className="history-row">
                          <div>
                            <strong>🎉 Happy birthday</strong>
                            <span>Enjoy your special day and celebrate with a gentle practice round.</span>
                          </div>
                        </article>
                      ) : null}
                    </div>
                  </section>
                )}

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
                        <option value="free">Starter</option>
                        <option value="trial">More practice</option>
                        <option value="elite">Full access</option>
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
                {!hasSubmittedFeedback ? (
                  <section className="side-card accent-side-card">
                    <div className="panel-heading">
                      <p className="eyebrow">Quick feedback</p>
                      <h2>Tell us what you think</h2>
                      <p>One short check-in helps us make lessons and pages better.</p>
                    </div>
                    <button type="button" className="primary-button" onClick={openFeedbackPage}>
                      Share thoughts
                    </button>
                  </section>
                ) : null}

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Announcement board</p>
                    <h2>Latest updates</h2>
                    <p>Breaks, new changes, and quick messages from the school team.</p>
                  </div>
                  <div className="announcement-preview-list">
                    {visibleAnnouncementPreview.length > 0 ? visibleAnnouncementPreview.map((announcement) => (
                      <article key={announcement.id} className="announcement-preview-card">
                        <div className="announcement-preview-meta">
                          <span className="mini-badge">{getAnnouncementAudienceLabel(announcement.audience)}</span>
                          <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                        </div>
                        <strong>{announcement.title}</strong>
                        <p>{announcement.message}</p>
                      </article>
                    )) : (
                      <p className="empty-state">Announcements will appear here when the school team posts them.</p>
                    )}
                  </div>
                  {hiddenVisibleAnnouncementCount > 0 ? (
                    <p className="announcement-overflow-note">
                      {hiddenVisibleAnnouncementCount} older update{hiddenVisibleAnnouncementCount === 1 ? '' : 's'} stay on the board.
                    </p>
                  ) : null}
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">My progress</p>
                    <h2>{progressSnapshot.level}</h2>
                    <p>{progressSnapshot.detail}</p>
                  </div>
                  <div className="mini-stat-list">
                    <article className="mini-stat-card">
                      <span>📈</span>
                      <strong>{progressSnapshot.average}%</strong>
                    </article>
                    <article className="mini-stat-card">
                      <span>✅</span>
                      <strong>{progressSnapshot.passRate}%</strong>
                    </article>
                    <article className="mini-stat-card">
                      <span>🧩</span>
                      <strong>{attempts.length}</strong>
                    </article>
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
                  <div className="field-grid">
                    <label className="field-span-2">
                      Request support
                      <input
                        value={supportRequestDraft.title}
                        onChange={(event) => setSupportRequestDraft((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Ask for a topic, mentor, or help"
                      />
                    </label>
                    <label className="field-span-2">
                      Details
                      <textarea
                        rows={3}
                        value={supportRequestDraft.detail}
                        onChange={(event) => setSupportRequestDraft((current) => ({ ...current, detail: event.target.value }))}
                        placeholder="Tell the school team what would help you next."
                      />
                    </label>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button ghost-button-small" onClick={submitSupportRequest}>
                      Send request
                    </button>
                  </div>
                  <div className="history-list">
                    {mySupportRequests.slice(0, 3).map((entry) => (
                      <article key={entry.id} className="history-row">
                        <div>
                          <strong>{entry.title}</strong>
                          <span>{getSupportRequestStatusLabel(entry)} · {getSupportRequestOwnerLabel(entry)}</span>
                        </div>
                      </article>
                    ))}
                    {mySupportRequests.length === 0 ? (
                      <p className="empty-state">Your request history will appear here after the first message.</p>
                    ) : null}
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
                    {!hasSubmittedFeedback ? (
                      <button type="button" className="subject-card" onClick={openFeedbackPage}>
                        <span className="subject-icon">💡</span>
                        <strong>Share your thoughts</strong>
                        <span>Quick rating and comment.</span>
                      </button>
                    ) : null}
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
                  {matchingStaffMaterials.length > 0 && (
                    <div className="staff-material-summary">
                      <div className="panel-heading">
                        <p className="eyebrow">Teacher picks</p>
                        <h2>Assigned for this class</h2>
                        <p>{getFlagEmoji(country.code)} {country.name} · {profile.level}</p>
                      </div>
                      <div className="material-pill-row">
                        <span className="mini-badge">📘 {readingMaterials.length} notes</span>
                        <span className="mini-badge">📝 {quizMaterials.length} quiz guides</span>
                        <span className="mini-badge">🎓 {examMaterials.length} exam guides</span>
                      </div>
                    </div>
                  )}
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
                    <p className="eyebrow">Lesson request</p>
                    <h2>Need extra help?</h2>
                    <p>Ask the school team for extra support, another topic, or a clearer lesson.</p>
                  </div>
                  <div className="field-grid">
                    <label className="field-span-2">
                      Request title
                      <input
                        value={supportRequestDraft.title}
                        onChange={(event) => setSupportRequestDraft((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Example: Need more help with fractions"
                      />
                    </label>
                    <label className="field-span-2">
                      Details
                      <textarea
                        rows={3}
                        value={supportRequestDraft.detail}
                        onChange={(event) => setSupportRequestDraft((current) => ({ ...current, detail: event.target.value }))}
                        placeholder="Tell the school team what topic or support you want."
                      />
                    </label>
                  </div>
                  <button type="button" className="primary-button" onClick={submitSupportRequest}>
                    Send request
                  </button>
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
                  {readingMaterials.length > 0 && (
                    <section className="teacher-materials-panel">
                      <div className="panel-heading">
                        <p className="eyebrow">Teacher materials</p>
                        <h2>Assigned reading</h2>
                        <p>These notes were added for this country, level, and subject.</p>
                      </div>
                      <div className="teacher-material-grid">
                        {readingMaterials.map((material) => (
                          <article key={material.id} className="teacher-material-card">
                            <div className="teacher-material-head">
                              <strong>{material.title}</strong>
                              <span className="mini-badge">{getFlagEmoji(material.countryCode)} {material.level}</span>
                            </div>
                            <p>{material.summary}</p>
                            <div className="teacher-material-body">
                              {shouldShowInlineMaterialText(material) &&
                                material.body.split('\n').filter(Boolean).map((line, index) => (
                                  <p key={`${material.id}-${index}`}>{line}</p>
                                ))}
                              {material.resourceType === 'document' && material.attachmentData && (
                                <button
                                  type="button"
                                  className="ghost-button ghost-button-small inline-link-button"
                                  onClick={() => openMaterialViewer(material, 'Learner reading')}
                                >
                                  Open {material.attachmentName ?? 'document'} in app
                                </button>
                              )}
                              {material.resourceType === 'video' && material.videoUrl && (
                                <button
                                  type="button"
                                  className="ghost-button ghost-button-small inline-link-button"
                                  onClick={() => openMaterialViewer(material, 'Learner reading')}
                                >
                                  Watch video in app
                                </button>
                              )}
                            </div>
                            <span className="teacher-material-meta">Added by {material.uploadedBy}</span>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
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
                      <p className="eyebrow">AI lesson reel</p>
                      <h2>{learningVideo.subtitle}</h2>
                      <p>A short guided walkthrough keeps the key ideas light, visual, and easier to remember.</p>
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
                    {learningVideo.scenes.slice(0, 3).map((scene, index) => (
                      <article key={`${scene.title}-${index}`} className="video-scene-card video-scene-card-full">
                        <span className="subject-icon video-scene-icon">{scene.visual}</span>
                        <div>
                          <strong>{scene.title}</strong>
                          <p>{scene.subtitle}</p>
                          <p>{scene.narration}</p>
                          <ul className="simple-list">
                            {scene.bullets.slice(0, 2).map((bullet) => (
                              <li key={bullet}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      </article>
                    ))}
                  </div>
                  {featuredVideoMaterial && (
                    <div className="banner-actions">
                      <button
                        type="button"
                        className="primary-button inline-link-button"
                        onClick={() => openMaterialViewer(featuredVideoMaterial, 'Learner video lesson')}
                      >
                        Open approved lesson video
                      </button>
                    </div>
                  )}
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
                    <p>Full access learners can revisit each answer and compare it with the correct one.</p>
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
                    <p className="eyebrow">Share your thoughts</p>
                    <h2>Tell us how this page feels</h2>
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
                    <p className="eyebrow">Quick check-in</p>
                    <h2>{hasSubmittedFeedback ? 'Thanks for your thoughts' : 'Rate this page'}</h2>
                    <p>{hasSubmittedFeedback ? 'Your thoughts are already saved for this account.' : 'Five quick ratings and one optional comment.'}</p>
                  </div>
                  {hasSubmittedFeedback ? (
                    <article className="feedback-card">
                      <strong>Thoughts received.</strong>
                      <p>This short check-in closes after one reply so the same account does not send it twice.</p>
                      <div className="sample-buttons">
                        <button type="button" className="primary-button" onClick={() => setStudentView('subject')}>
                          Back to subject
                        </button>
                      </div>
                    </article>
                  ) : (
                    <article className="feedback-card">
                      <div className="feedback-question-list">
                        {activeFeedbackQuestions.map((question) => (
                          <div key={question.key} className="feedback-row">
                            <strong>{question.label}</strong>
                            <FeedbackStars
                              rating={feedbackRatings[question.key]}
                              onChange={(next) =>
                                setFeedbackRatings((current) => ({
                                  ...current,
                                  [question.key]: next,
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <label>
                        Optional comment
                        <textarea
                          rows={3}
                          value={feedbackComment}
                          onChange={(event) => setFeedbackComment(event.target.value)}
                          placeholder="Add one short note if you want."
                        />
                      </label>
                      {authNotice && <p className="auth-notice auth-notice-inline">{authNotice}</p>}
                      <div className="sample-buttons">
                        <button type="button" className="primary-button" onClick={submitFeedback}>
                          Send my thoughts
                        </button>
                        <button type="button" className="ghost-button" onClick={() => setStudentView('subject')}>
                          Not now
                        </button>
                      </div>
                    </article>
                  )}
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
                  <div className="history-list">
                    {FEEDBACK_SUMMARY_QUESTIONS.map((question) => {
                      const avg =
                        feedbackEntries.length > 0
                          ? Math.round(
                              (feedbackEntries.reduce(
                                (sum, entry) => sum + (entry.ratings?.[question.key] ?? entry.rating),
                                0,
                              ) /
                                feedbackEntries.length) *
                                10,
                            ) / 10
                          : 0;

                      return (
                        <article key={question.key} className="history-row">
                          <div>
                            <strong>{question.label}</strong>
                          </div>
                          <strong>{avg || '-'}</strong>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </aside>
            </>
          )}
        </main>
      ) : screen === 'staff' ? (
        staffView === 'feedback' ? (
        <main className="dashboard-layout">
          <section className="dashboard-main">
            <section className="welcome-banner">
              <div>
                <p className="eyebrow">Staff review</p>
                <h2>Tell us how the staff room feels</h2>
                <p>{getFlagEmoji(country.code)} {country.name} · {profile.subject}</p>
              </div>
              <div className="banner-actions">
                <button type="button" className="primary-button action-button-prominent" onClick={() => setStaffView('lounge')}>
                  Back to lounge
                </button>
                <button type="button" className="primary-button" onClick={logout}>
                  Sign out
                </button>
              </div>
            </section>

            <section className="setup-panel feedback-panel">
              <div className="panel-heading">
                <p className="eyebrow">Quick check-in</p>
                <h2>Staff and learner thoughts</h2>
                <p>Five short ratings and one optional comment. One reply per account.</p>
              </div>
              {hasSubmittedFeedback ? (
                <article className="feedback-card">
                  <strong>Thanks for sharing.</strong>
                  <p>Your thoughts are already saved, so this check-in now stays closed for your account.</p>
                  <div className="sample-buttons">
                    <button type="button" className="primary-button" onClick={() => setStaffView('lounge')}>
                      Back to lounge
                    </button>
                  </div>
                </article>
              ) : (
                <article className="feedback-card">
                  <div className="feedback-question-list">
                    {activeFeedbackQuestions.map((question) => (
                      <div key={question.key} className="feedback-row">
                        <strong>{question.label}</strong>
                        <FeedbackStars
                          rating={feedbackRatings[question.key]}
                          onChange={(next) =>
                            setFeedbackRatings((current) => ({
                              ...current,
                              [question.key]: next,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <label>
                    Optional comment
                    <textarea
                      rows={3}
                      value={feedbackComment}
                      onChange={(event) => setFeedbackComment(event.target.value)}
                      placeholder="Tell us what should improve next."
                    />
                  </label>
                  {authNotice && <p className="auth-notice auth-notice-inline">{authNotice}</p>}
                  <div className="sample-buttons">
                    <button type="button" className="primary-button" onClick={submitFeedback}>
                      Send my thoughts
                    </button>
                    <button type="button" className="ghost-button" onClick={() => setStaffView('lounge')}>
                      Not now
                    </button>
                  </div>
                </article>
              )}
            </section>
          </section>

          <aside className="dashboard-side">
                <section className="side-card accent-side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Staff note</p>
                    <h2>Your thoughts go to the school team</h2>
                    <p>Staff can share feedback, and the school team can read the full shared feedback board.</p>
                  </div>
              <div className="history-list">
                {mySupportRequests.length > 0 ? mySupportRequests.map((entry) => (
                  <article key={entry.id} className="history-row">
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{getSupportRequestStatusLabel(entry)} · {getSupportRequestOwnerLabel(entry)}</span>
                    </div>
                  </article>
                )) : (
                  <p className="empty-state">Your own support requests will appear here after you send one.</p>
                )}
              </div>
            </section>
          </aside>
        </main>
        ) : (
        <main className="dashboard-layout">
          <section className="dashboard-main">
            <section className="welcome-banner">
                  <div>
                <p className="eyebrow">Staff lounge</p>
                    <h2>{firstName}, support today&apos;s learners</h2>
                    <p>{getFlagEmoji(country.code)} {country.name} · {profile.subject}</p>
                  </div>
              <div className="banner-actions">
                {!hasSubmittedFeedback ? (
                  <button type="button" className="ghost-button" onClick={openFeedbackPage}>
                    Share thoughts
                  </button>
                ) : null}
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
                <strong>📤 My uploads</strong>
                <p>{myStaffMaterials.length}</p>
              </article>
              <article className="info-card">
                <strong>🕒 Pending</strong>
                <p>{myStaffMaterials.filter((material) => material.approvalStatus === 'pending').length}</p>
              </article>
            </section>

            <section className="setup-panel">
              <div className="panel-heading">
                <p className="eyebrow">Today</p>
                <h2>Staff room</h2>
                <p>Keep an eye on announcements, activity, and school team decisions on your materials.</p>
              </div>
              <div className="history-list">
                {visibleAnnouncementPreview.length > 0 ? visibleAnnouncementPreview.map((entry) => (
                  <article key={entry.id} className="announcement-preview-card">
                    <div className="announcement-preview-meta">
                      <span className="mini-badge">{getAnnouncementAudienceLabel(entry.audience)}</span>
                      <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                    <strong>{entry.title}</strong>
                    <p>{entry.message}</p>
                  </article>
                )) : (
                  <p className="empty-state">Announcements and school team updates will appear here.</p>
                )}
              </div>
              {hiddenVisibleAnnouncementCount > 0 ? (
                <p className="announcement-overflow-note">
                  {hiddenVisibleAnnouncementCount} older update{hiddenVisibleAnnouncementCount === 1 ? '' : 's'} stay on the board.
                </p>
              ) : null}
            </section>

            <section className="setup-panel">
              <div className="panel-heading">
                <p className="eyebrow">Your materials</p>
                <h2>{staffMaterialDraft.editingId ? 'Edit learner material' : 'Send material for review'}</h2>
                <p>Choose the right country, class, subject, and content type, then send it to the school team for a final check.</p>
              </div>
              <div className="field-grid">
                <label>
                  Country
                  <select
                    value={staffMaterialDraft.countryCode}
                    onChange={(event) => updateStaffMaterialDraft('countryCode', event.target.value)}
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
                    value={staffMaterialDraft.stage}
                    onChange={(event) => updateStaffMaterialDraft('stage', event.target.value as Stage)}
                  >
                    <option value="kindergarten">Kindergarten</option>
                    <option value="primary">Primary</option>
                    <option value="teen">Teen</option>
                  </select>
                </label>
                <label>
                  Level
                  <select
                    value={staffMaterialDraft.level}
                    onChange={(event) => updateStaffMaterialDraft('level', event.target.value)}
                  >
                    {getLevelOptions(staffMaterialDraft.stage).map((entry) => (
                      <option key={entry} value={entry}>{entry}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Subject
                  <select
                    value={staffMaterialDraft.subject}
                    onChange={(event) => updateStaffMaterialDraft('subject', event.target.value)}
                  >
                    {getAvailableSubjects(staffMaterialDraft.countryCode, staffMaterialDraft.stage, 'elite').map((entry) => (
                      <option key={entry} value={entry}>{entry}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Category
                  <select
                    value={staffMaterialDraft.category}
                    onChange={(event) => updateStaffMaterialDraft('category', event.target.value as StaffMaterialCategory)}
                  >
                    <option value="reading">Reading material</option>
                    <option value="quiz">Quiz</option>
                    <option value="exam">Exam</option>
                  </select>
                </label>
                {staffMaterialDraft.category === 'reading' && (
                  <label>
                    Format
                    <select
                      value={staffMaterialDraft.resourceType}
                      onChange={(event) => updateStaffMaterialDraft('resourceType', event.target.value as StaffMaterialResourceType)}
                    >
                      <option value="text">Reading text</option>
                      <option value="document">PDF / DOCX file</option>
                      <option value="video">Video link</option>
                    </select>
                  </label>
                )}
                <label className="field-span-2">
                  Title
                  <input
                    value={staffMaterialDraft.title}
                    onChange={(event) => updateStaffMaterialDraft('title', event.target.value)}
                    placeholder="Material title"
                  />
                </label>
                <label className="field-span-2">
                  Summary
                  <input
                    value={staffMaterialDraft.summary}
                    onChange={(event) => updateStaffMaterialDraft('summary', event.target.value)}
                    placeholder="Short line learners will see first"
                  />
                </label>
                {staffMaterialDraft.resourceType === 'text' && (
                  <label className="field-span-2">
                    Material
                    <textarea
                      value={staffMaterialDraft.body}
                      onChange={(event) => updateStaffMaterialDraft('body', event.target.value)}
                      placeholder="Paste the reading material learners will open."
                      rows={6}
                    />
                  </label>
                )}
                {staffMaterialDraft.resourceType === 'document' && (
                  <label className="field-span-2">
                    Upload document
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      onChange={(event) => handleStaffAttachment(event.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                {staffMaterialDraft.resourceType === 'video' && (
                  <label className="field-span-2">
                    Video link
                    <input
                      value={staffMaterialDraft.videoUrl}
                      onChange={(event) => updateStaffMaterialDraft('videoUrl', event.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                )}
                {staffMaterialDraft.resourceType === 'question-bank' && (
                  <>
                    <label>
                      Active question count
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={staffMaterialDraft.questionLimit}
                        onChange={(event) => updateStaffMaterialDraft('questionLimit', Math.max(1, Number(event.target.value) || 1))}
                      />
                    </label>
                    <div className="field-span-2 question-bank-builder">
                      <div className="panel-heading compact-heading">
                        <p className="eyebrow">Question bank</p>
                        <h2>{staffMaterialDraft.category === 'quiz' ? 'Quiz questions' : 'Exam questions'}</h2>
                        <p>Write multiple-choice questions and mark the correct answer before saving.</p>
                      </div>
                      {duplicateQuestionPrompts.length > 0 && (
                        <article className="inline-warning-card">
                          <strong>Some questions already exist</strong>
                          <p>Update these prompts before saving so learners do not get repeated staff-authored items.</p>
                          <div className="material-pill-row">
                            {duplicateQuestionPrompts.slice(0, 3).map((prompt) => (
                              <span key={prompt} className="mini-badge">{prompt}</span>
                            ))}
                          </div>
                        </article>
                      )}
                      <div className="question-builder-list">
                        {staffMaterialDraft.questions.map((question, questionIndex) => (
                          <article key={question.id} className="question-builder-card">
                            <div className="teacher-material-head">
                              <strong>Question {questionIndex + 1}</strong>
                              {staffMaterialDraft.questions.length > 1 && (
                                <button
                                  type="button"
                                  className="ghost-button ghost-button-small"
                                  onClick={() => removeQuestionDraft(question.id)}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <label>
                              Prompt
                              <textarea
                                rows={2}
                                value={question.prompt}
                                onChange={(event) => updateQuestionDraft(question.id, 'prompt', event.target.value)}
                                placeholder="Type the learner question here."
                              />
                            </label>
                            <div className="choice-grid">
                              {question.choices.map((choice, choiceIndex) => (
                                <label key={`${question.id}-${choiceIndex}`}>
                                  Choice {choiceIndex + 1}
                                  <input
                                    value={choice}
                                    onChange={(event) => updateQuestionChoice(question.id, choiceIndex, event.target.value)}
                                    placeholder={`Answer ${choiceIndex + 1}`}
                                  />
                                </label>
                              ))}
                            </div>
                            <label>
                              Correct answer
                              <select
                                value={question.answerIndex}
                                onChange={(event) => updateQuestionDraft(question.id, 'answerIndex', Number(event.target.value))}
                              >
                                <option value={0}>Choice 1</option>
                                <option value={1}>Choice 2</option>
                                <option value={2}>Choice 3</option>
                                <option value={3}>Choice 4</option>
                              </select>
                            </label>
                            <label>
                              Explanation
                              <input
                                value={question.explanation}
                                onChange={(event) => updateQuestionDraft(question.id, 'explanation', event.target.value)}
                                placeholder="One short reason or answer note."
                              />
                            </label>
                          </article>
                        ))}
                      </div>
                      <button type="button" className="ghost-button" onClick={addQuestionDraft}>
                        Add another question
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="banner-actions">
                <button type="button" className="primary-button" onClick={addStaffMaterial}>
                  {staffMaterialDraft.editingId ? 'Save changes' : 'Send for review'}
                </button>
                {staffMaterialDraft.editingId && (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setStaffMaterialDraft(createInitialMaterialDraft(profile.countryCode))}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
              <div className="teacher-material-grid">
                {myStaffMaterials.length > 0 ? myStaffMaterials.slice(0, 6).map((material) => (
                  <article key={material.id} className="teacher-material-card">
                    <div className="teacher-material-head">
                      <strong>{material.title}</strong>
                      <span className="mini-badge">{getMaterialStatusBadge(material.approvalStatus)}</span>
                    </div>
                    <p>{material.summary}</p>
                    <span className="teacher-material-meta">
                      {getFlagEmoji(material.countryCode)} {getCountryByCode(material.countryCode).name} · {material.subject} · {material.level}
                    </span>
                    <p className="teacher-material-meta">{material.aiReviewSummary ?? 'Waiting for review.'}</p>
                    {material.adminReviewNote ? <p className="teacher-material-meta">{material.adminReviewNote}</p> : null}
                    <div className="material-pill-row">
                      <span className="mini-badge">{material.resourceType === 'document' ? '📄 File' : material.resourceType === 'video' ? '🎬 Video' : material.resourceType === 'question-bank' ? '🧠 Questions' : '📘 Notes'}</span>
                      {material.questionLimit ? <span className="mini-badge">#{material.questionLimit}</span> : null}
                    </div>
                    <div className="row-actions">
                      <strong>{material.uploadedBy}</strong>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="ghost-button ghost-button-small"
                          onClick={() => openMaterialViewer(material, 'Staff preview')}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          className="ghost-button ghost-button-small"
                          onClick={() => beginEditStaffMaterial(material)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ghost-button ghost-button-small"
                          onClick={() => removeStaffMaterial(material.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                )) : (
                  <p className="empty-state">Your uploads will appear here after you send material for review.</p>
                )}
              </div>
            </section>
          </section>

          <aside className="dashboard-side">
                <section className="side-card accent-side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Your materials</p>
                    <h2>{myStaffMaterials.filter((material) => material.approvalStatus === 'approved').length} published</h2>
                    <p>Approved items are visible to learners. Waiting and returned items stay with staff and the school team only.</p>
                  </div>
              <div className="mini-stat-list">
                <article className="mini-stat-card">
                  <span>🕒</span>
                  <strong>{myStaffMaterials.filter((material) => material.approvalStatus === 'pending').length}</strong>
                </article>
                <article className="mini-stat-card">
                  <span>✅</span>
                  <strong>{myStaffMaterials.filter((material) => material.approvalStatus === 'approved').length}</strong>
                </article>
                <article className="mini-stat-card">
                  <span>🛠️</span>
                  <strong>{myStaffMaterials.filter((material) => material.approvalStatus === 'denied').length}</strong>
                </article>
              </div>
              {!hasSubmittedFeedback ? (
                <button type="button" className="ghost-button" onClick={openFeedbackPage}>
                  Share thoughts
                </button>
              ) : null}
            </section>
            <section className="side-card">
              <div className="panel-heading">
                <p className="eyebrow">Ask the school team</p>
                <h2>Need support?</h2>
                <p>Ask for upload approval help, learner follow-up, or topic planning.</p>
              </div>
              <div className="field-grid">
                <label className="field-span-2">
                  Request title
                  <input
                    value={supportRequestDraft.title}
                    onChange={(event) => setSupportRequestDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Example: Please review my Grade 4 reading pack"
                  />
                </label>
                <label className="field-span-2">
                  Details
                  <textarea
                    rows={3}
                    value={supportRequestDraft.detail}
                    onChange={(event) => setSupportRequestDraft((current) => ({ ...current, detail: event.target.value }))}
                    placeholder="Tell the school team what help you need next."
                  />
                </label>
              </div>
              <div className="banner-actions">
                <button type="button" className="ghost-button ghost-button-small" onClick={submitSupportRequest}>
                  Send request
                </button>
              </div>
              <div className="history-list">
                {mySupportRequests.slice(0, 3).map((entry) => (
                  <article key={entry.id} className="history-row">
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{getSupportRequestStatusLabel(entry)} · {getSupportRequestOwnerLabel(entry)}</span>
                    </div>
                  </article>
                ))}
                {mySupportRequests.length === 0 ? (
                  <p className="empty-state">Your request history will appear here after the first message.</p>
                ) : null}
              </div>
            </section>
            <section className="side-card">
              <div className="panel-heading">
                <p className="eyebrow">My follow-ups</p>
                <h2>{assignedSupportRequests.length} active</h2>
                <p>Short task list from the school team.</p>
              </div>
              <div className="history-list">
                {assignedSupportRequests.slice(0, 4).map((entry) => (
                  <article key={entry.id} className="history-row">
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{getSupportCategoryLabel(entry.category)} · {getFlagEmoji(entry.countryCode)} {getCountryByCode(entry.countryCode).name}</span>
                      <span>{entry.detail}</span>
                    </div>
                    <button
                      type="button"
                      className="ghost-button ghost-button-small"
                      onClick={() => void markSupportRequestDone(entry)}
                    >
                      Done
                    </button>
                  </article>
                ))}
                {assignedSupportRequests.length === 0 ? (
                  <p className="empty-state">Assigned follow-ups from the school team will appear here.</p>
                ) : null}
              </div>
            </section>
          </aside>
        </main>
        )
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
                    <strong>Pending approvals</strong>
                    <p>{pendingMaterials.length}</p>
                  </article>
                  <article className="info-card">
                    <strong>Support requests</strong>
                    <p>{openSupportRequests.length}</p>
                  </article>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">School team pages</p>
                    <h2>Open a page</h2>
                    <p>Choose the area you want to work in next.</p>
                  </div>
                  <div className="option-grid">
                    <button type="button" className="subject-card" onClick={() => openAdminView('countries')}>
                      <span className="subject-icon">🌍</span>
                      <strong>Countries</strong>
                      <span>See where learners and families have joined.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => openAdminView('staff')}>
                      <span className="subject-icon">👥</span>
                      <strong>Staff</strong>
                      <span>Create accounts and manage your school team.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => openAdminView('learners')}>
                      <span className="subject-icon">🧾</span>
                      <strong>Learners</strong>
                      <span>Search learner records and recent sign-ups.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => openAdminView('followups')}>
                      <span className="subject-icon">📌</span>
                      <strong>Follow-ups</strong>
                      <span>Open the list of tasks and requests that need attention.</span>
                    </button>
                    <button type="button" className="subject-card" onClick={() => openAdminView('reports')}>
                      <span className="subject-icon">📊</span>
                      <strong>Progress</strong>
                      <span>Check ratings, activity, and overall learning progress.</span>
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
                      <span>🕒</span>
                      <strong>{pendingMaterials.length}</strong>
                    </article>
                    <article className="mini-stat-card">
                      <span>📬</span>
                      <strong>{openSupportRequests.length}</strong>
                    </article>
                  </div>
                </section>
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Quick summary</p>
                    <h2>Feedback overview</h2>
                    <p>See how learners rated each question.</p>
                  </div>
                  <div className="mini-stat-list">
                    <article className="mini-stat-card">
                      <span>⭐</span>
                      <strong>{learnerFeedbackSummary.average || 0}</strong>
                    </article>
                    <article className="mini-stat-card">
                      <span>⚠️</span>
                      <strong>{learnerFeedbackSummary.lowCount}</strong>
                    </article>
                  </div>
                  <div className="summary-score-list">
                    {learnerSummaryQuestions.map((question) => (
                      <article key={question.key} className="summary-score-row">
                        <div>
                          <strong>{question.label}</strong>
                          <span>{question.average > 0 ? `${question.average}/5 average` : 'Waiting for ratings'}</span>
                        </div>
                        <strong>{question.average > 0 ? question.average : '-'}</strong>
                      </article>
                    ))}
                  </div>
                </section>
                <section className="side-card">
                  <div className="announcement-board-card">
                    <div className="panel-heading">
                      <p className="eyebrow">Announcements</p>
                      <h2>Post an update</h2>
                      <p>Write a clear update for learners and staff.</p>
                    </div>
                    <div className="announcement-preview-list">
                      {adminAnnouncementPreview.map((announcement) => (
                        <article key={announcement.id} className="announcement-preview-card">
                          <div className="announcement-preview-meta">
                            <span className="mini-badge">{getAnnouncementAudienceLabel(announcement.audience)}</span>
                            <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                          </div>
                          <strong>{announcement.title}</strong>
                          <p>{announcement.message}</p>
                        </article>
                      ))}
                    </div>
                    {hiddenAdminAnnouncementCount > 0 ? (
                      <p className="announcement-overflow-note">
                        {hiddenAdminAnnouncementCount} older update{hiddenAdminAnnouncementCount === 1 ? '' : 's'} stay on the board.
                      </p>
                    ) : null}
                    <div className="field-grid">
                      <label className="field-span-2">
                        Title
                        <input
                          value={announcementDraft.title}
                          onChange={(event) => setAnnouncementDraft((current) => ({ ...current, title: event.target.value }))}
                          placeholder="Example: School break on Friday"
                        />
                      </label>
                      <label className="field-span-2">
                        Message
                        <textarea
                          rows={4}
                          value={announcementDraft.message}
                          onChange={(event) => setAnnouncementDraft((current) => ({ ...current, message: event.target.value }))}
                          placeholder="Share the update learners and staff should see."
                        />
                      </label>
                      <label>
                        Audience
                        <select
                          value={announcementDraft.audience}
                          onChange={(event) => setAnnouncementDraft((current) => ({ ...current, audience: event.target.value as Announcement['audience'] }))}
                        >
                          <option value="all">Everyone</option>
                          <option value="learners">Learners only</option>
                          <option value="staff">Staff only</option>
                        </select>
                      </label>
                    </div>
                    <div className="banner-actions">
                      <button type="button" className="primary-button" onClick={addAnnouncement}>
                        Post announcement
                      </button>
                    </div>
                  </div>
                </section>
              </aside>
            </>
          ) : adminView === 'countries' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">School team page</p>
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
                    <p className="eyebrow">School team page</p>
                    <h2>Staff</h2>
                    <p>Create helpers and teachers.</p>
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
                    <h2>Create and manage staff</h2>
                    {adminNotice && <p>{adminNotice}</p>}
                  </div>
                  <AdminTabs active={adminView} onChange={openAdminView} />
                  <div className="field-grid">
                    <label>
                      Full name
                      <input
                        value={staffDraft.name}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Staff name"
                      />
                    </label>
                    <label>
                      Role
                      <select
                        value={staffDraft.role}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, role: event.target.value }))}
                      >
                        {STAFF_ROLE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Country
                      <select
                        value={staffDraft.countryCode}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, countryCode: event.target.value }))}
                      >
                        {COUNTRIES.map((entry) => (
                          <option key={entry.code} value={entry.code}>
                            {getFlagEmoji(entry.code)} {entry.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Eligibility
                      <select
                        value={staffDraft.eligibility}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, eligibility: event.target.value }))}
                      >
                        {STAFF_ELIGIBILITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field-span-2">
                      Qualifications
                      <select
                        value={staffDraft.qualifications}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, qualifications: event.target.value }))}
                      >
                        {STAFF_QUALIFICATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field-span-2">
                      Support focus
                      <select
                        value={staffDraft.focus}
                        onChange={(event) => setStaffDraft((current) => ({ ...current, focus: event.target.value }))}
                      >
                        {STAFF_SUPPORT_FOCUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button ghost-button-small" onClick={addStaffMember}>
                      Create staff account
                    </button>
                  </div>
                  <label>
                    Search staff
                    <input
                      value={staffSearch}
                      onChange={(event) => setStaffSearch(event.target.value)}
                      placeholder="Search by name, country, qualification, or email"
                    />
                  </label>
                  <div className="history-list">
                    {filteredStaff.length > 0 ? filteredStaff.map((member) => (
                      <article key={`${member.id}-${member.email}`} className="history-row">
                        <div>
                          <strong>{member.fullName}</strong>
                          <span>
                            {getFlagEmoji(member.countryCode)} {member.role} · {member.qualifications || 'Qualification pending'}
                          </span>
                          <span>{member.email} · Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="row-actions">
                          <strong>{member.eligibility || 'Ready'}</strong>
                          <button
                            type="button"
                            className="ghost-button ghost-button-small"
                            onClick={() => removeStaffMember(member.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    )) : (
                      <p className="empty-state">Add staff records here to start building your school team.</p>
                    )}
                  </div>
                </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">New account</p>
                    <h2>First password</h2>
                  </div>
                  {generatedStaffAccount ? (
                    <div className="history-list">
                      <article className="history-row">
                        <div>
                          <strong>{generatedStaffAccount.name}</strong>
                          <span>{generatedStaffAccount.email}</span>
                          <span>Password to share: {generatedStaffAccount.password}</span>
                        </div>
                      </article>
                    </div>
                  ) : (
                    <p className="empty-state">Create a staff account to get a simple first password.</p>
                  )}
                </section>
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Helpful reminders</p>
                    <h2>School team checklist</h2>
                  </div>
                  <div className="history-list">
                    <article className="history-row">
                      <div>
                        <strong>Give each person a clear focus</strong>
                        <span>Set a clear subject or country focus so large groups stay easy to support.</span>
                      </div>
                    </article>
                    <article className="history-row">
                      <div>
                        <strong>Change first passwords later</strong>
                        <span>Start with easy-to-share passwords, then replace them with private ones later.</span>
                      </div>
                    </article>
                  </div>
                </section>
              </aside>
            </>
          ) : adminView === 'learners' ? (
            <>
              <section className="dashboard-main">
                <section className="welcome-banner">
                  <div>
                    <p className="eyebrow">School team page</p>
                    <h2>Registered learners</h2>
                    <p>People who have joined.</p>
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
                  <label>
                    Search learners
                    <input
                      value={learnerSearch}
                      onChange={(event) => setLearnerSearch(event.target.value)}
                      placeholder="Search by name, email, country, subject, or level"
                    />
                  </label>
                  <div className="history-list compact-record-list">
                    {filteredLearners.length > 0 ? filteredLearners.map((entry) => (
                      <article key={entry.id} className="history-row">
                        <div>
                          <strong>{entry.fullName}</strong>
                          <span>
                            {getFlagEmoji(entry.countryCode)} {getCountryByCode(entry.countryCode).name} · {entry.subject} · {entry.level}
                          </span>
                          <span>
                            Joined {new Date(entry.createdAt).toLocaleDateString()} · Streak {entry.streakCount ?? 0}
                            {entry.birthDay && entry.birthMonth ? ` · Birthday ${entry.birthDay}/${entry.birthMonth}` : ''}
                          </span>
                        </div>
                        <div className="row-actions">
                          <strong>{getLearnerRecordLabel(entry)}</strong>
                          <button
                            type="button"
                            className="ghost-button ghost-button-small"
                            onClick={() => removeRegisteredLearner(entry.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
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
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Birthdays</p>
                    <h2>{birthdayLearners.length} today</h2>
                  </div>
                  <div className="history-list">
                    {birthdayLearners.length > 0 ? birthdayLearners.map((entry) => (
                      <article key={entry.id} className="history-row">
                        <div>
                          <strong>{entry.fullName}</strong>
                          <span>{getFlagEmoji(entry.countryCode)} {entry.level}</span>
                        </div>
                      </article>
                    )) : (
                      <p className="empty-state">Today’s learner birthdays will appear here.</p>
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
                    <p className="eyebrow">School team page</p>
                    <h2>Follow-up list</h2>
                    <p>Things that need attention.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => openAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">To-do actions</p>
                    <h2>Follow-ups</h2>
                    {adminNotice && <p>{adminNotice}</p>}
                  </div>
                  <AdminTabs active={adminView} onChange={openAdminView} />
                  <div className="banner-actions">
                    <button type="button" className="ghost-button ghost-button-small" onClick={addCountryFollowUp}>
                      Add reminder
                    </button>
                    <button type="button" className="ghost-button ghost-button-small" onClick={exportCountryReport}>
                      Save summary
                    </button>
                  </div>
                  <div className="history-list">
                    {pendingMaterials.map((item) => (
                      <article key={item.id} className="history-row">
                        <div>
                          <strong>{item.title}</strong>
                          <span>Waiting for review · {item.uploadedBy} · {getFlagEmoji(item.countryCode)} {item.subject}</span>
                          <span>{item.aiReviewSummary}</span>
                        </div>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="ghost-button ghost-button-small"
                            onClick={() => openMaterialViewer(item, 'School team review')}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            className="ghost-button ghost-button-small"
                            onClick={() => reviewPendingMaterial(item.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="ghost-button ghost-button-small"
                            onClick={() => reviewPendingMaterial(item.id, 'denied')}
                          >
                            Deny
                          </button>
                        </div>
                      </article>
                    ))}
                    {focusCountryOpenRequests.map((item) => {
                      const assignableStaff = getAssignableStaffForRequest(item);
                      const selectedStaffEmail =
                        requestAssignmentSelections[item.id] ||
                        item.assignedToEmail ||
                        assignableStaff[0]?.email ||
                        '';

                      return (
                        <article key={item.id} className="support-request-card">
                          <div className="support-request-copy">
                            <strong>{item.title}</strong>
                            <span>{getRoleLabel(item.createdByRole)} · {getSupportCategoryLabel(item.category)} · {getFlagEmoji(item.countryCode)} {getCountryByCode(item.countryCode).name}</span>
                            <span>{getSupportRequestOwnerLabel(item)}</span>
                            <span>{item.detail}</span>
                          </div>
                          <div className="support-request-actions">
                            <span className="mini-badge">{getSupportRequestStatusLabel(item)}</span>
                            <div className="request-action-group">
                              <button
                                type="button"
                                className="ghost-button ghost-button-small"
                                onClick={() => void assignSupportRequestToAdmin(item)}
                              >
                                Keep here
                              </button>
                              {assignableStaff.length > 0 ? (
                                <>
                                  <select
                                    className="compact-select"
                                    value={selectedStaffEmail}
                                    onChange={(event) =>
                                      setRequestAssignmentSelections((current) => ({
                                        ...current,
                                        [item.id]: event.target.value,
                                      }))}
                                  >
                                    {assignableStaff.map((entry) => (
                                      <option key={entry.email} value={entry.email}>
                                        {entry.fullName}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="ghost-button ghost-button-small"
                                    onClick={() => void assignSupportRequestToStaff(item)}
                                  >
                                    Assign
                                  </button>
                                </>
                              ) : null}
                              <button
                                type="button"
                                className="ghost-button ghost-button-small"
                                onClick={() => void markSupportRequestDone(item)}
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                    {followUpItems.map((item) => (
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
                    ))}
                    {pendingMaterials.length === 0 && focusCountryOpenRequests.length === 0 && followUpItems.length === 0 ? (
                      <p className="empty-state">Follow-up items will appear here when real learner activity needs support.</p>
                    ) : null}
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
                    <p className="eyebrow">School team page</p>
                    <h2>Progress</h2>
                    <p>Ratings, reviews, and learner activity in one place.</p>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button" onClick={() => openAdminView('overview')}>
                      Back to overview
                    </button>
                  </div>
                </section>

                <section className="setup-panel">
                  <div className="panel-heading">
                    <p className="eyebrow">Progress center</p>
                    <h2>Learning and support insights</h2>
                    {adminNotice && <p>{adminNotice}</p>}
                  </div>
                  <AdminTabs active={adminView} onChange={openAdminView} />
                  <div className="stats-grid report-stats-grid">
                    <article className="info-card">
                      <strong>⭐ Average rating</strong>
                      <p>{learnerFeedbackSummary.average || 0}</p>
                    </article>
                    <article className="info-card">
                      <strong>🕒 Pending approvals</strong>
                      <p>{pendingMaterials.length}</p>
                    </article>
                    <article className="info-card">
                      <strong>📬 Open requests</strong>
                      <p>{openSupportRequests.length}</p>
                    </article>
                    <article className="info-card">
                      <strong>📚 Active learners</strong>
                      <p>{recentActiveLearners.length}</p>
                    </article>
                  </div>
                  <div className="banner-actions">
                    <button type="button" className="ghost-button ghost-button-small" onClick={exportCountryReport}>
                      Download summary
                    </button>
                  </div>
                  <div className="review-priority-grid">
                    {reviewPriorityCards.map((card) => (
                      <article key={card.label} className="review-priority-card">
                        <p className="eyebrow">{card.label}</p>
                        <strong>{card.value}</strong>
                        <span>{card.detail}</span>
                      </article>
                    ))}
                  </div>
                  <div className="country-groups">
                    <section className="country-group-card">
                      <div className="panel-heading">
                        <p className="eyebrow">Question ratings</p>
                        <h2>Average by question</h2>
                      </div>
                      <div className="summary-score-list">
                        {learnerQuestionBreakdown.map((question) => (
                          <article key={question.key} className="summary-score-row">
                            <div>
                              <strong>{question.label}</strong>
                              <span>{question.average > 0 ? `${question.average}/5 average` : 'Waiting for ratings'}</span>
                            </div>
                            <strong>{question.average > 0 ? question.average : '-'}</strong>
                          </article>
                        ))}
                      </div>
                    </section>
                    <section className="country-group-card">
                      <div className="panel-heading">
                        <p className="eyebrow">Recent comments</p>
                        <h2>Latest learner notes</h2>
                      </div>
                      <div className="history-list">
                        {learnerCommentEntries.slice(0, 6).map((entry) => (
                          <article key={entry.id} className="history-row">
                            <div>
                              <strong>{'⭐'.repeat(Math.round(entry.rating))}</strong>
                              <span>{entry.choice}</span>
                              <span>{entry.comment}</span>
                            </div>
                          </article>
                        ))}
                        {learnerCommentEntries.length === 0 ? (
                          <p className="empty-state">Comments will appear here once people start sharing notes.</p>
                        ) : null}
                      </div>
                    </section>
                  </div>
              </section>
              </section>

              <aside className="dashboard-side">
                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Approvals</p>
                    <h2>Pending uploads</h2>
                  </div>
                  <div className="history-list">
                    {pendingMaterials.slice(0, 5).map((entry) => (
                      <article key={entry.id} className="history-row">
                        <div>
                          <strong>{entry.title}</strong>
                          <span>{entry.uploadedBy} · {entry.subject}</span>
                        </div>
                        <strong>{getMaterialStatusLabel(entry.approvalStatus)}</strong>
                      </article>
                    ))}
                    {pendingMaterials.length === 0 ? <p className="empty-state">No uploads are waiting for review right now.</p> : null}
                  </div>
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Requests</p>
                    <h2>Open support items</h2>
                  </div>
                  <div className="history-list">
                    {openSupportRequests.slice(0, 5).map((item) => (
                      <article key={item.id} className="history-row">
                        <div>
                          <strong>{item.title}</strong>
                          <span>{getRoleLabel(item.createdByRole)} · {getSupportCategoryLabel(item.category)}</span>
                        </div>
                        <strong>{getSupportRequestStatusLabel(item)}</strong>
                      </article>
                    ))}
                    {openSupportRequests.length === 0 ? (
                      <p className="empty-state">Support requests will appear here after staff or learners submit them.</p>
                    ) : null}
                  </div>
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Quick summary</p>
                    <h2>Question overview</h2>
                    <p>{learnerFeedbackSummary.detail}</p>
                  </div>
                  <div className="summary-score-list">
                    {learnerSummaryQuestions.map((question) => (
                      <article key={question.key} className="summary-score-row">
                        <div>
                          <strong>{question.label}</strong>
                          <span>{question.average > 0 ? `${question.average}/5 average` : 'Waiting for ratings'}</span>
                        </div>
                        <strong>{question.average > 0 ? question.average : '-'}</strong>
                      </article>
                    ))}
                  </div>
                  {recentFeedback.length > 0 ? (
                    <div className="history-list feedback-preview-list">
                      {recentFeedback.slice(0, 2).map((entry) => (
                        <article key={entry.id} className="history-row">
                          <div>
                            <strong>{'⭐'.repeat(entry.rating)}</strong>
                            <span>
                              {getFlagEmoji(entry.countryCode)} {entry.choice}
                            </span>
                            {entry.comment && <span>{entry.comment}</span>}
                          </div>
                          {profile.role === 'admin' ? (
                            <button
                              type="button"
                              className="ghost-button ghost-button-small feedback-delete-button"
                              onClick={() => void deleteFeedback(entry.id)}
                            >
                              Delete
                            </button>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="side-card">
                  <div className="panel-heading">
                    <p className="eyebrow">Learning plans</p>
                    <h2>Plan mix</h2>
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

      {activeViewerMaterial && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card modal-card-wide material-viewer-modal" role="dialog" aria-label="Learning material viewer">
            <div className="material-viewer-header">
              <div className="panel-heading">
                <p className="eyebrow">{activeMaterialViewer?.audienceLabel ?? 'Material viewer'}</p>
                <h2>{activeViewerMaterial.title}</h2>
                <p>{activeViewerMaterial.summary}</p>
              </div>
              <div className="material-viewer-actions">
                <span className="mini-badge">
                  {getFlagEmoji(activeViewerMaterial.countryCode)} {getCountryByCode(activeViewerMaterial.countryCode).name}
                </span>
                <span className="mini-badge">{activeViewerMaterial.subject}</span>
                <span className="mini-badge">
                  {activeViewerMaterial.resourceType === 'document'
                    ? 'Document'
                    : activeViewerMaterial.resourceType === 'video'
                      ? 'Video'
                      : activeViewerMaterial.resourceType === 'question-bank'
                        ? 'Question set'
                        : 'Reading note'}
                </span>
                <button type="button" className="ghost-button" onClick={closeMaterialViewer}>
                  Back
                </button>
              </div>
            </div>

            <div className="material-viewer-shell">
              {activeViewerMaterial.resourceType === 'text' && (
                <article className="material-viewer-article">
                  {activeViewerMaterial.body.split('\n').filter(Boolean).map((line, index) => (
                    <p key={`${activeViewerMaterial.id}-line-${index}`}>{line}</p>
                  ))}
                </article>
              )}

              {activeViewerMaterial.resourceType === 'question-bank' && (
                <section className="material-viewer-questions">
                  <div className="panel-heading">
                    <p className="eyebrow">Question set</p>
                    <h2>{(activeViewerMaterial.questions?.length ?? 0)} guided questions</h2>
                    <p>Use this preview to check the material without leaving the app.</p>
                  </div>
                  <div className="history-list">
                    {(activeViewerMaterial.questions ?? []).map((question, index) => (
                      <article key={question.id} className="history-row">
                        <div>
                          <strong>{index + 1}. {question.prompt}</strong>
                          <span>{question.choices.join(' • ')}</span>
                          <span>{question.explanation}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {activeViewerMaterial.resourceType === 'document' && activeViewerDocumentPreview?.kind === 'pdf' && (
                <iframe
                  className="material-viewer-frame"
                  src={activeViewerDocumentPreview.src}
                  title={activeViewerMaterial.title}
                />
              )}

              {activeViewerMaterial.resourceType === 'document' && activeViewerDocumentPreview?.kind === 'image' && (
                <div className="material-viewer-image-wrap">
                  <img
                    className="material-viewer-image"
                    src={activeViewerDocumentPreview.src}
                    alt={activeViewerMaterial.title}
                  />
                </div>
              )}

              {activeViewerMaterial.resourceType === 'document' && activeViewerDocumentPreview?.kind === 'text' && (
                <pre className="material-viewer-text">{activeViewerDocumentPreview.content}</pre>
              )}

              {activeViewerMaterial.resourceType === 'document' && activeViewerDocumentPreview?.kind === 'embed' && (
                <div className="material-viewer-fallback">
                  <iframe
                    className="material-viewer-frame"
                    src={activeViewerDocumentPreview.src}
                    title={activeViewerMaterial.title}
                  />
                  <p>This file is opening inside Review Buddy. If your device cannot render it fully, save a copy below.</p>
                </div>
              )}

              {activeViewerMaterial.resourceType === 'document' && activeViewerDocumentPreview?.kind === 'download' && (
                <div className="material-viewer-fallback">
                  <strong>Preview not ready for this file type yet.</strong>
                  <p>This item stays inside Review Buddy, but this file needs a saved copy to open on the device.</p>
                </div>
              )}

              {activeViewerMaterial.resourceType === 'video' && activeViewerVideoConfig?.kind === 'native' && (
                <video className="material-viewer-video" controls preload="metadata" src={activeViewerVideoConfig.src}>
                  Your browser could not play this lesson video.
                </video>
              )}

              {activeViewerMaterial.resourceType === 'video' && activeViewerVideoConfig?.kind === 'iframe' && (
                <iframe
                  className="material-viewer-frame material-viewer-video-frame"
                  src={activeViewerVideoConfig.src}
                  title={activeViewerMaterial.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}

              {activeViewerMaterial.resourceType === 'video' && !activeViewerVideoConfig && (
                <div className="material-viewer-fallback">
                  <strong>This video link is not ready to play.</strong>
                  <p>Update the lesson link and try again.</p>
                </div>
              )}
            </div>

            <div className="material-viewer-footer">
              <span className="teacher-material-meta">Shared by {activeViewerMaterial.uploadedBy}</span>
              {activeViewerMaterial.resourceType === 'document' && activeViewerMaterial.attachmentData && (
                <a
                  className="ghost-button inline-link-button"
                  href={activeViewerMaterial.attachmentData}
                  download={activeViewerMaterial.attachmentName ?? `${activeViewerMaterial.title}.file`}
                >
                  Save a copy
                </a>
              )}
              {activeViewerMaterial.resourceType === 'video' && activeViewerMaterial.videoUrl && (
                <a className="ghost-button inline-link-button" href={activeViewerMaterial.videoUrl} rel="noreferrer">
                  Open source link
                </a>
              )}
            </div>
          </section>
        </div>
      )}

      {showTutorial && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card" role="dialog" aria-label="Welcome tutorial">
            <div className="panel-heading">
              <p className="eyebrow">Welcome guide</p>
              <h2>How to use Review Buddy</h2>
              <p>{profile.role === 'student' ? 'A quick tour for new learners.' : profile.role === 'staff' ? 'A quick tour for staff.' : 'A quick tour for the school team.'}</p>
            </div>
            <div className="history-list">
              {tutorialStepsFor(profile.role).map((step) => (
                <article key={step} className="history-row">
                  <div>
                    <strong>{step}</strong>
                  </div>
                </article>
              ))}
            </div>
            <div className="sample-buttons">
              <button type="button" className="primary-button" onClick={closeTutorial}>
                Start using the app
              </button>
            </div>
          </section>
        </div>
      )}

      {showVersionPrompt && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card" role="dialog" aria-label="Latest changes">
            <div className="panel-heading">
              <p className="eyebrow">Latest changes</p>
              <h2>Refresh to see the newest updates</h2>
              <p>Refresh now to get the latest improvements and fixes.</p>
            </div>
            <div className="sample-buttons">
              <button type="button" className="primary-button" onClick={() => window.location.reload()}>
                Refresh now
              </button>
              <button type="button" className="ghost-button" onClick={dismissVersionPrompt}>
                Later
              </button>
            </div>
          </section>
        </div>
      )}

      {showTermsModal && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-card modal-card-wide" role="dialog" aria-label="How Review Buddy should be used">
            <div className="terms-hero">
              <div className="panel-heading">
                <p className="eyebrow">How Review Buddy should be used</p>
                <h2>Important guidance for families and schools</h2>
                <p>Updated {TERMS_UPDATED_ON}. These notes explain how Review Buddy should be used right now.</p>
              </div>
              <div className="terms-hero-badges">
                <span className="mini-badge">Early access</span>
                <span className="mini-badge">Learning support</span>
                <span className="mini-badge">Checked by the school team</span>
              </div>
            </div>
            <div className="terms-section-grid">
              <article className="terms-section-card">
                <strong>Educational support only</strong>
                <span>Review Buddy provides practice, revision, progress guidance, and learning support. It does not replace a school, teacher judgment, therapy, legal advice, medical care, or emergency services.</span>
              </article>
              <article className="terms-section-card">
                <strong>Early access notice</strong>
                <span>This is an early version of Review Buddy. Pages, scores, approvals, quick summaries, and learning materials may change as we keep improving it.</span>
              </article>
              <article className="terms-section-card">
                <strong>Account responsibility</strong>
                <span>Users are responsible for keeping their sign-in details private, using approved access only, and notifying the school team if they believe an account has been used incorrectly.</span>
              </article>
              <article className="terms-section-card">
                <strong>Content moderation and approvals</strong>
                <span>Staff uploads, learner requests, announcements, and feedback may be reviewed, delayed, edited, denied, or removed when needed to keep the app safe and appropriate.</span>
              </article>
              <article className="terms-section-card">
                <strong>Data and privacy</strong>
                <span>Profile details, progress scores, birthdays, uploads, requests, and feedback may be stored and used to keep the app running well, improve quality, and support learning decisions.</span>
              </article>
              <article className="terms-section-card">
                <strong>Children and guardian awareness</strong>
                <span>Where required, a parent, guardian, school, or program lead should supervise account creation, learning choices, and use of recommendations for younger learners.</span>
              </article>
              <article className="terms-section-card">
                <strong>Acceptable use</strong>
                <span>Users should not upload harmful, adult, hateful, illegal, misleading, or copyrighted material they do not have permission to use, and should not try to bypass approval or role controls.</span>
              </article>
              <article className="terms-section-card">
                <strong>External links and shared resources</strong>
                <span>Approved documents, videos, or outside links may still require user judgment. Review Buddy does not guarantee the availability or long-term accuracy of third-party materials.</span>
              </article>
              <article className="terms-section-card">
                <strong>Availability and product changes</strong>
                <span>We may update, pause, limit, or remove parts of the app at any time while it is still growing, including plans, features, and country-specific learning tools.</span>
              </article>
              <article className="terms-section-card">
                <strong>Limitation of liability</strong>
                <span>To the fullest extent allowed, Review Buddy is provided as it stands today without guarantees of nonstop access, perfect accuracy, or a perfect fit for every classroom, learner, or school.</span>
              </article>
              <article className="terms-section-card">
                <strong>Changes to these notes</strong>
                <span>Continuing to use Review Buddy after an update means the latest notes apply. Important changes may also be shared in announcements or update messages inside the app.</span>
              </article>
            </div>
            <div className="sample-buttons">
              <button type="button" className="primary-button" onClick={() => setShowTermsModal(false)}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      <footer className="site-footer">
        <div className="footer-brand">
          <strong>Review Buddy</strong>
          <p>{MOTTO}</p>
        </div>
        <div className="footer-release">
          <p className="eyebrow">About this app</p>
          <strong>Review Buddy</strong>
          <div className="footer-release-row">
            <span>{APP_DISPLAY_VERSION}</span>
            <span className="footer-dot" aria-hidden="true">•</span>
            <span className="footer-release-date">{APP_CREATED_ON}</span>
          </div>
        </div>
        <div className="footer-actions">
          <button type="button" className="footer-link-button footer-link-button-strong" onClick={() => setShowTermsModal(true)}>
            Important guidance
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
