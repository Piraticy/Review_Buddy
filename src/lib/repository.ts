import type {
  AdminStaffMember,
  Announcement,
  FeedbackEntry,
  LearnerProfile,
  RegisteredUser,
  StaffMaterial,
  StaffQuestionItem,
  SupportRequest,
} from '../data';
import { getCountryByCode } from '../data';
import { supabase } from './supabase';

const STORAGE_KEY = 'review-buddy-state-clean';
const DEFAULT_ADMIN_EMAIL = 'admin@reviewbuddy.app';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_STAFF_EMAIL = 'staff@reviewbuddy.app';

type StoredState = {
  registeredUsers?: RegisteredUser[];
  staffMembers?: AdminStaffMember[];
  staffMaterials?: StaffMaterial[];
  feedbackEntries?: FeedbackEntry[];
  supportRequests?: SupportRequest[];
  announcements?: Announcement[];
};

type VerificationRequest = {
  email: string;
  fullName: string;
  username: string;
  role: RegisteredUser['role'];
  countryCode: string;
};

const OPTIONAL_LEARNER_PROFILE_COLUMNS = new Set([
  'birth_day',
  'birth_month',
  'birth_year',
  'streak_count',
  'last_active_on',
  'tutorial_seen',
  'qualifications',
  'eligibility',
  'support_focus',
]);

const OPTIONAL_SUPPORT_REQUEST_COLUMNS = new Set([
  'assigned_to_name',
  'assigned_to_email',
  'assigned_to_role',
  'completed_at',
  'completed_by',
]);

const CACHE_TTL_MS = 15000;
const listCache = new Map<string, { timestamp: number; data: unknown }>();

function getMissingLearnerProfileColumn(error: { message?: string } | null | undefined) {
  const message = error?.message ?? '';
  const match = /Could not find the '([^']+)' column of 'learner_profiles' in the schema cache/i.exec(message);
  return match?.[1] ?? null;
}

function getMissingSupportRequestColumn(error: { message?: string } | null | undefined) {
  const message = error?.message ?? '';
  const match = /Could not find the '([^']+)' column of 'support_requests' in the schema cache/i.exec(message);
  return match?.[1] ?? null;
}

async function writeLearnerProfileWithSchemaFallback(
  write: (row: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>,
  initialRow: Record<string, unknown>,
) {
  const nextRow = { ...initialRow };

  while (true) {
    const { error } = await write(nextRow);
    if (!error) {
      return { error: null, row: nextRow };
    }

    const missingColumn = getMissingLearnerProfileColumn(error);
    if (!missingColumn || !OPTIONAL_LEARNER_PROFILE_COLUMNS.has(missingColumn) || !(missingColumn in nextRow)) {
      return { error, row: nextRow };
    }

    delete nextRow[missingColumn];
  }
}

async function writeSupportRequestWithSchemaFallback(
  write: (row: Record<string, unknown>) => Promise<{ error: { message?: string } | null; data?: unknown }>,
  initialRow: Record<string, unknown>,
) {
  const nextRow = { ...initialRow };

  while (true) {
    const result = await write(nextRow);
    if (!result.error) {
      return { ...result, error: null, row: nextRow };
    }

    const missingColumn = getMissingSupportRequestColumn(result.error);
    if (!missingColumn || !OPTIONAL_SUPPORT_REQUEST_COLUMNS.has(missingColumn) || !(missingColumn in nextRow)) {
      return { ...result, row: nextRow };
    }

    delete nextRow[missingColumn];
  }
}

function readListCache<T>(key: string) {
  const cached = listCache.get(key);
  if (!cached || Date.now() - cached.timestamp > CACHE_TTL_MS) {
    if (cached) {
      listCache.delete(key);
    }
    return null;
  }

  return cached.data as T;
}

function writeListCache<T>(key: string, data: T) {
  listCache.set(key, { timestamp: Date.now(), data });
  return data;
}

function invalidateListCache(...keys: string[]) {
  keys.forEach((key) => listCache.delete(key));
}

function readStoredState(): StoredState {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as StoredState;
  } catch {
    return {};
  }
}

function mergeStoredState(next: StoredState) {
  if (typeof window === 'undefined') return;
  const current = readStoredState();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...next }));
}

function getLocalUsers() {
  return readStoredState().registeredUsers ?? [];
}

function mergeRemoteUserWithLocalState(user: RegisteredUser) {
  const localMatch = getLocalUsers().find(
    (entry) => entry.email.toLowerCase() === user.email.toLowerCase(),
  );

  if (!localMatch) {
    return user;
  }

  return {
    ...localMatch,
    ...user,
    password: localMatch.password || user.password,
    birthDay: user.birthDay ?? localMatch.birthDay,
    birthMonth: user.birthMonth ?? localMatch.birthMonth,
    birthYear: user.birthYear ?? localMatch.birthYear,
    streakCount: user.streakCount ?? localMatch.streakCount,
    lastActiveOn: user.lastActiveOn ?? localMatch.lastActiveOn,
    tutorialSeen: user.tutorialSeen ?? localMatch.tutorialSeen,
    lastLoginAt: user.lastLoginAt ?? localMatch.lastLoginAt,
    qualifications: user.qualifications ?? localMatch.qualifications,
    eligibility: user.eligibility ?? localMatch.eligibility,
    supportFocus: user.supportFocus ?? localMatch.supportFocus,
  };
}

function withFallbackLocalUsers(users: RegisteredUser[]) {
  const nextUsers = [...users];
  const hasAdmin = nextUsers.some(
    (user) =>
      user.email.toLowerCase() === DEFAULT_ADMIN_EMAIL ||
      user.username.toLowerCase() === 'admin',
  );

  if (!hasAdmin) nextUsers.unshift(createAdminFallbackUser());

  return nextUsers;
}

function saveLocalUsers(users: RegisteredUser[]) {
  mergeStoredState({ registeredUsers: users });
}

async function getAccessToken() {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function findLocalUser(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const localUsers = withFallbackLocalUsers(getLocalUsers());
  const match = localUsers.find(
    (user) =>
      user.email.toLowerCase() === normalizedIdentifier ||
      user.username.toLowerCase() === normalizedIdentifier,
  );

  if (!match || match.password !== password) {
    return null;
  }

  const nextUser = {
    ...match,
    lastLoginAt: new Date().toISOString(),
  };

  saveLocalUsers(localUsers.map((user) => (user.id === nextUser.id ? nextUser : user)));
  return nextUser;
}

function saveLocalUser(user: RegisteredUser) {
  const localUsers = getLocalUsers();
  const nextUsers = [
    ...localUsers.filter(
      (entry) => entry.id !== user.id && entry.email.toLowerCase() !== user.email.toLowerCase(),
    ),
    user,
  ];
  saveLocalUsers(nextUsers);
}

function updateLocalUserByEmail(
  email: string,
  updater: (user: RegisteredUser) => RegisteredUser,
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  const localUsers = getLocalUsers();
  saveLocalUsers(
    localUsers.map((entry) =>
      entry.email.toLowerCase() === normalizedEmail ? updater(entry) : entry,
    ),
  );
}

function createAdminFallbackUser(): RegisteredUser {
  return {
    id: 'default-admin',
    username: 'Admin',
    fullName: 'Review Buddy Admin',
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    role: 'admin',
    gender: 'boy',
    avatarMode: 'generated',
    avatarEmoji: '🛡️',
    countryCode: 'US',
    plan: 'elite',
    stage: 'teen',
    level: 'Year 10',
    mode: 'solo',
    subject: 'Mathematics',
    createdAt: new Date('2026-03-31T00:00:00.000Z').toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

function mapProfileRow(row: Record<string, unknown>): RegisteredUser {
  return {
    id: String(row.id ?? ''),
    username: String(row.username ?? ''),
    fullName: String(row.full_name ?? ''),
    email: String(row.email ?? ''),
    password: '',
    role: (row.role as RegisteredUser['role']) ?? 'student',
    gender: (row.gender as RegisteredUser['gender']) ?? 'boy',
    avatarMode: (row.avatar_mode as RegisteredUser['avatarMode']) ?? 'generated',
    avatarEmoji: String(row.avatar_emoji ?? '🙂'),
    avatarImage: row.avatar_image ? String(row.avatar_image) : undefined,
    countryCode: String(row.country_code ?? 'KE'),
    plan: (row.plan as RegisteredUser['plan']) ?? 'free',
    stage: (row.stage as RegisteredUser['stage']) ?? 'primary',
    level: String(row.level ?? 'Grade 1'),
    mode: (row.mode as RegisteredUser['mode']) ?? 'solo',
    subject: String(row.subject ?? 'Mathematics'),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : undefined,
    birthDay: row.birth_day ? Number(row.birth_day) : undefined,
    birthMonth: row.birth_month ? Number(row.birth_month) : undefined,
    birthYear: row.birth_year ? Number(row.birth_year) : undefined,
    streakCount: row.streak_count ? Number(row.streak_count) : undefined,
    lastActiveOn: row.last_active_on ? String(row.last_active_on) : undefined,
    tutorialSeen: typeof row.tutorial_seen === 'boolean' ? Boolean(row.tutorial_seen) : undefined,
    qualifications: row.qualifications ? String(row.qualifications) : undefined,
    eligibility: row.eligibility ? String(row.eligibility) : undefined,
    supportFocus: row.support_focus ? String(row.support_focus) : undefined,
  };
}

function mapStaffRow(row: Record<string, unknown>): AdminStaffMember {
  return {
    id: row.id ? String(row.id) : undefined,
    name: String(row.name ?? ''),
    role: String(row.role ?? ''),
    focus: String(row.focus ?? ''),
    status: String(row.status ?? 'Online'),
    countryCode: row.country_code ? String(row.country_code) : undefined,
    email: row.email ? String(row.email) : undefined,
    username: row.username ? String(row.username) : undefined,
    password: row.password ? String(row.password) : undefined,
    qualifications: row.qualifications ? String(row.qualifications) : undefined,
    eligibility: row.eligibility ? String(row.eligibility) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

function mapStaffMaterialRow(row: Record<string, unknown>): StaffMaterial {
  const questions = Array.isArray(row.questions) ? (row.questions as StaffQuestionItem[]) : undefined;

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    summary: String(row.summary ?? ''),
    body: String(row.body ?? ''),
    countryCode: String(row.country_code ?? 'KE'),
    stage: (row.stage as StaffMaterial['stage']) ?? 'primary',
    level: String(row.level ?? 'Grade 1'),
    subject: String(row.subject ?? 'Mathematics'),
    category: (row.category as StaffMaterial['category']) ?? 'reading',
    resourceType: (row.resource_type as StaffMaterial['resourceType']) ?? 'text',
    attachmentName: row.attachment_name ? String(row.attachment_name) : undefined,
    attachmentData: row.attachment_data ? String(row.attachment_data) : undefined,
    videoUrl: row.video_url ? String(row.video_url) : undefined,
    questionLimit: row.question_limit ? Number(row.question_limit) : undefined,
    questions,
    uploadedBy: String(row.uploaded_by ?? 'Staff'),
    uploadedByEmail: row.uploaded_by_email ? String(row.uploaded_by_email) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    approvalStatus: row.approval_status ? (String(row.approval_status) as StaffMaterial['approvalStatus']) : undefined,
    aiReviewSummary: row.ai_review_summary ? String(row.ai_review_summary) : undefined,
    adminReviewNote: row.admin_review_note ? String(row.admin_review_note) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : undefined,
  };
}

function mapFeedbackRow(row: Record<string, unknown>): FeedbackEntry {
  return {
    id: String(row.id ?? ''),
    userName: String(row.user_name ?? ''),
    userKey: String(row.user_key ?? ''),
    role: (row.role as FeedbackEntry['role']) ?? 'student',
    countryCode: String(row.country_code ?? 'KE'),
    rating: Number(row.rating ?? 0),
    choice: String(row.choice ?? ''),
    ratings: (row.ratings as FeedbackEntry['ratings']) ?? {
      ease: 0,
      clarity: 0,
      look: 0,
      speed: 0,
      confidence: 0,
    },
    comment: String(row.comment ?? ''),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function normalizeSupportRequestStatus(
  status: unknown,
): SupportRequest['status'] {
  if (status === 'assigned' || status === 'in-review' || status === 'done' || status === 'resolved') {
    return status;
  }
  return 'new';
}

function normalizeSupportRequest(entry: SupportRequest): SupportRequest {
  return {
    ...entry,
    status: normalizeSupportRequestStatus(entry.status),
  };
}

function mapSupportRequestRow(row: Record<string, unknown>): SupportRequest {
  return {
    id: String(row.id ?? ''),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    createdBy: String(row.created_by ?? ''),
    createdByRole: (row.created_by_role as SupportRequest['createdByRole']) ?? 'student',
    countryCode: String(row.country_code ?? 'KE'),
    title: String(row.title ?? ''),
    detail: String(row.detail ?? ''),
    category: (row.category as SupportRequest['category']) ?? 'general',
    status: normalizeSupportRequestStatus(row.status),
    assignedToName: row.assigned_to_name ? String(row.assigned_to_name) : undefined,
    assignedToEmail: row.assigned_to_email ? String(row.assigned_to_email) : undefined,
    assignedToRole:
      row.assigned_to_role === 'admin' || row.assigned_to_role === 'staff'
        ? row.assigned_to_role
        : undefined,
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    completedBy: row.completed_by ? String(row.completed_by) : undefined,
    relatedMaterialId: row.related_material_id ? String(row.related_material_id) : undefined,
  };
}

function mapAnnouncementRow(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    message: String(row.message ?? ''),
    audience: (row.audience as Announcement['audience']) ?? 'all',
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

async function registerLearner(user: RegisteredUser) {
  const supabaseClient = supabase;

  if (!supabaseClient) {
    saveLocalUser(user);
    invalidateListCache('registeredUsers');
    return user;
  }

  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: string;
        user?: RegisteredUser;
      }
    | null;

  if (!response.ok || !payload?.user) {
    throw new Error(payload?.error ?? 'We could not create the learner account just now.');
  }

  const normalizedEmail = payload.user.email.toLowerCase();
  const { data: signinData, error: signinError } = await supabaseClient.auth.signInWithPassword({
    email: normalizedEmail,
    password: user.password,
  });

  if (signinError || !signinData.user?.id) {
    throw new Error(
      'Your account was created, but the first sign-in could not finish. Try signing in now with your email and password.',
    );
  }

  const savedUser: RegisteredUser = {
    ...payload.user,
    lastLoginAt: new Date().toISOString(),
  };
  saveLocalUser(savedUser);
  invalidateListCache('registeredUsers');
  return savedUser;
}

async function sendRegistrationCode(request: VerificationRequest) {
  if (!supabase) {
    throw new Error('Supabase is required for email verification.');
  }

  const normalizedEmail = request.email.trim().toLowerCase();
  const temporaryPassword = `ReviewBuddy-${Math.random().toString(36).slice(2)}-Otp1!`;

  const { error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: temporaryPassword,
    options: {
      data: {
        full_name: request.fullName,
        username: request.username,
        role: request.role,
        country_code: request.countryCode,
      },
    },
  });

  if (error) {
    throw error;
  }

  return normalizedEmail;
}

async function verifyRegistrationCode(user: RegisteredUser, code: string) {
  const supabaseClient = supabase;

  if (!supabaseClient) {
    saveLocalUser(user);
    return user;
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const normalizedCode = code.trim();

  const { data: otpData, error: otpError } = await supabaseClient.auth.verifyOtp({
    email: normalizedEmail,
    token: normalizedCode,
    type: 'email',
  });

  if (otpError || !otpData.user) {
    throw otpError ?? new Error('The verification code could not be confirmed.');
  }

  const authUserId = otpData.user.id;
  const { error: updateError } = await supabaseClient.auth.updateUser({
    password: user.password,
  });

  if (updateError) throw updateError;

  const profileRow = {
    id: authUserId,
    username: user.username,
    full_name: user.fullName,
    email: normalizedEmail,
    role: user.role,
    gender: user.gender,
    avatar_mode: user.avatarMode,
    avatar_emoji: user.avatarEmoji,
    avatar_image: user.avatarImage ?? null,
    country_code: user.countryCode,
    plan: user.plan,
    stage: user.stage,
    level: user.level,
    mode: user.mode,
    subject: user.subject,
    created_at: user.createdAt,
    last_login_at: new Date().toISOString(),
  };

  const { error: upsertError } = await writeLearnerProfileWithSchemaFallback(
    async (row) => await supabaseClient.from('learner_profiles').upsert(row),
    profileRow,
  );
  if (upsertError) {
    throw upsertError;
  }

  return {
    ...user,
    id: String(authUserId),
    email: normalizedEmail,
    lastLoginAt: profileRow.last_login_at,
  };
}

async function resendRegistrationCode(email: string) {
  if (!supabase) {
    throw new Error('Supabase is required for email verification.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
  });

  if (error) {
    throw error;
  }

  return normalizedEmail;
}

async function requestPasswordReset(identifier: string) {
  if (!supabase) {
    throw new Error('Password reset is not available right now.');
  }

  let email = identifier.trim().toLowerCase();

  if (!email) {
    throw new Error('Enter your email first.');
  }

  if (email === 'admin') {
    email = DEFAULT_ADMIN_EMAIL;
  }

  if (!email.includes('@')) {
    const { data: usernameRow } = await supabase
      .from('learner_profiles')
      .select('email')
      .eq('username', email)
      .limit(1)
      .maybeSingle();

    if (usernameRow?.email) {
      email = String(usernameRow.email).toLowerCase();
    }
  }

  if (!email.includes('@')) {
    throw new Error('Use your email address to reset the password.');
  }

  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/?type=recovery` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    throw error;
  }

  return email;
}

async function completePasswordReset(password: string) {
  if (!supabase) {
    throw new Error('Password reset is not available right now.');
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw error;
  }

  await supabase.auth.signOut();
}

async function signIn(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim();

  if (!supabase) {
    return findLocalUser(normalizedIdentifier, password);
  }

  let email = normalizedIdentifier.toLowerCase();
  const isAdminShortcut = email === 'admin' && password === DEFAULT_ADMIN_PASSWORD;

  if (email === 'admin') {
    email = DEFAULT_ADMIN_EMAIL;
  }

  if (!email.includes('@')) {
    const { data: usernameRow } = await supabase
      .from('learner_profiles')
      .select('email')
      .eq('username', email)
      .limit(1)
      .maybeSingle();

    if (usernameRow?.email) {
      email = String(usernameRow.email).toLowerCase();
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    if (isAdminShortcut) {
      return createAdminFallbackUser();
    }

    return findLocalUser(normalizedIdentifier, password);
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('learner_profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  let resolvedProfileRow = profileRow;

  if (!resolvedProfileRow) {
    const { data: emailRow } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    resolvedProfileRow = emailRow ?? null;
  }

  if (!resolvedProfileRow && !profileError) {
    const metadata = data.user.user_metadata ?? {};
    const inferredRole =
      email === DEFAULT_ADMIN_EMAIL
        ? 'admin'
        : email === DEFAULT_STAFF_EMAIL
          ? 'staff'
          : String(metadata.role ?? 'student');
    const repairedProfile = {
      id: data.user.id,
      username: String(metadata.username ?? email.split('@')[0]),
      full_name: String(metadata.full_name ?? email.split('@')[0]),
      email,
      role: inferredRole,
      gender: 'boy',
      avatar_mode: 'generated',
      avatar_emoji: '🙂',
      avatar_image: null,
      country_code: String(metadata.country_code ?? 'KE'),
      plan: 'free',
      stage: 'primary',
      level: 'Grade 1',
      mode: 'solo',
      subject: 'Mathematics',
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };

    const { data: repairedRow } = await supabase
      .from('learner_profiles')
      .upsert(repairedProfile)
      .select('*')
      .single();

    resolvedProfileRow = repairedRow ?? null;
  }

  if (
    resolvedProfileRow &&
    isAdminShortcut &&
    resolvedProfileRow.role !== 'admin'
  ) {
    const role = 'admin';
    const avatarEmoji = '🛡️';
    const { data: repairedRow } = await supabase
      .from('learner_profiles')
      .upsert({
        ...resolvedProfileRow,
        id: data.user.id,
        email,
        role,
        avatar_emoji: avatarEmoji,
        avatar_mode: resolvedProfileRow.avatar_mode ?? 'generated',
        full_name: resolvedProfileRow.full_name ?? (role === 'admin' ? 'Review Buddy Admin' : 'Review Buddy Staff'),
      })
      .select('*')
      .single();

    resolvedProfileRow = repairedRow ?? resolvedProfileRow;
  }

  if (profileError || !resolvedProfileRow) {
    if (isAdminShortcut) {
      return createAdminFallbackUser();
    }

    return findLocalUser(normalizedIdentifier, password);
  }

  const nextUser = mergeRemoteUserWithLocalState(mapProfileRow(resolvedProfileRow));
  await supabase
    .from('learner_profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('email', email);

  const signedInUser = {
    ...nextUser,
    lastLoginAt: new Date().toISOString(),
  };

  saveLocalUser(signedInUser);
  return signedInUser;
}

async function listRegisteredUsers() {
  const cached = readListCache<RegisteredUser[]>('registeredUsers');
  if (cached) {
    return cached;
  }

  if (!supabase) {
    return writeListCache('registeredUsers', withFallbackLocalUsers(getLocalUsers()));
  }

  const { data, error } = await supabase
    .from('learner_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const localUsers = getLocalUsers();

  if (error || !data) {
    return writeListCache('registeredUsers', localUsers);
  }

  const remoteUsers = data.map((row) => mergeRemoteUserWithLocalState(mapProfileRow(row)));
  const mergedUsers = [
    ...remoteUsers,
    ...localUsers.filter(
      (localUser) =>
        !remoteUsers.some((remoteUser) => remoteUser.email.toLowerCase() === localUser.email.toLowerCase()),
    ),
  ];

  return writeListCache('registeredUsers', mergedUsers);
}

async function listStaffMembers() {
  const cached = readListCache<AdminStaffMember[]>('staffMembers');
  if (cached) {
    return cached;
  }

  if (!supabase) {
    return writeListCache('staffMembers', readStoredState().staffMembers ?? []);
  }

  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .order('created_at', { ascending: false });

  const localStaff = readStoredState().staffMembers ?? [];

  if (error || !data) {
    return writeListCache('staffMembers', localStaff);
  }

  const remoteStaff = data.map((row) => mapStaffRow(row));
  const mergedStaff = [
    ...remoteStaff,
    ...localStaff.filter(
      (localMember) =>
        !remoteStaff.some(
          (remoteMember) =>
            remoteMember.id === localMember.id ||
            (remoteMember.name === localMember.name && remoteMember.role === localMember.role),
        ),
    ),
  ];

  return writeListCache('staffMembers', mergedStaff);
}

async function listStaffMaterials() {
  const cached = readListCache<StaffMaterial[]>('staffMaterials');
  if (cached) {
    return cached;
  }

  const localMaterials = readStoredState().staffMaterials ?? [];

  if (!supabase) {
    return writeListCache('staffMaterials', localMaterials);
  }

  const { data, error } = await supabase
    .from('staff_materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return writeListCache('staffMaterials', localMaterials);
  }

  const remoteMaterials = data.map((row) => mapStaffMaterialRow(row));
  return writeListCache('staffMaterials', [
    ...remoteMaterials,
    ...localMaterials.filter(
      (localMaterial) => !remoteMaterials.some((remoteMaterial) => remoteMaterial.id === localMaterial.id),
    ),
  ]);
}

async function listFeedbackEntries() {
  const cached = readListCache<FeedbackEntry[]>('feedbackEntries');
  if (cached) {
    return cached;
  }

  const localFeedback = readStoredState().feedbackEntries ?? [];

  if (!supabase) {
    return writeListCache('feedbackEntries', localFeedback);
  }

  const { data, error } = await supabase
    .from('feedback_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return writeListCache('feedbackEntries', localFeedback);
  }

  const remoteFeedback = data.map((row) => mapFeedbackRow(row));
  return writeListCache('feedbackEntries', [
    ...remoteFeedback,
    ...localFeedback.filter(
      (localEntry) => !remoteFeedback.some((remoteEntry) => remoteEntry.id === localEntry.id),
    ),
  ]);
}

async function listSupportRequests() {
  const localRequests = (readStoredState().supportRequests ?? []).map(normalizeSupportRequest);

  if (!supabase) {
    return localRequests;
  }

  const token = await getAccessToken();
  if (token) {
    const response = await fetch('/api/support-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'list' }),
    });

    if (response.ok) {
      const payload = (await response.json().catch(() => null)) as { requests?: Record<string, unknown>[] } | null;
      if (payload?.requests) {
        return payload.requests.map((row) => mapSupportRequestRow(row));
      }
    }
  }

  const { data, error } = await supabase
    .from('support_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return localRequests;
  }

  const remoteRequests = data.map((row) => mapSupportRequestRow(row));
  return [
    ...remoteRequests,
    ...localRequests.filter(
      (localRequest) => !remoteRequests.some((remoteRequest) => remoteRequest.id === localRequest.id),
    ),
  ];
}

async function listAnnouncements() {
  const cached = readListCache<Announcement[]>('announcements');
  if (cached) {
    return cached;
  }

  const localAnnouncements = readStoredState().announcements ?? [];

  if (!supabase) {
    return writeListCache('announcements', localAnnouncements);
  }

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return writeListCache('announcements', localAnnouncements);
  }

  const remoteAnnouncements = data.map((row) => mapAnnouncementRow(row));
  return writeListCache('announcements', [
    ...remoteAnnouncements,
    ...localAnnouncements.filter(
      (localAnnouncement) => !remoteAnnouncements.some((remoteAnnouncement) => remoteAnnouncement.id === localAnnouncement.id),
    ),
  ]);
}

async function addStaffMember(member: AdminStaffMember) {
  if (!supabase) {
    const localStaff = readStoredState().staffMembers ?? [];
    const nextMember = {
      ...member,
      id: member.id ?? `staff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    };
    mergeStoredState({ staffMembers: [...localStaff, nextMember] });
    invalidateListCache('staffMembers', 'registeredUsers');
    return nextMember;
  }

  const token = await getAccessToken();
  if (!token) {
    const nextMember = {
      ...member,
      id: member.id ?? `staff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    };
    const localStaff = readStoredState().staffMembers ?? [];
    mergeStoredState({ staffMembers: [...localStaff, nextMember] });
    invalidateListCache('staffMembers', 'registeredUsers');
    return nextMember;
  }

  const response = await fetch('/api/create-staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(member),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: string;
        staffMember?: Record<string, unknown>;
      }
    | null;

  if (!response.ok || !payload?.staffMember) {
    throw new Error(payload?.error ?? 'We could not create that staff account just now.');
  }

  invalidateListCache('staffMembers', 'registeredUsers');
  return mapStaffRow(payload.staffMember);
}

async function addStaffMaterial(material: StaffMaterial) {
  const localMaterials = readStoredState().staffMaterials ?? [];

  if (!supabase) {
    mergeStoredState({ staffMaterials: [material, ...localMaterials] });
    invalidateListCache('staffMaterials');
    return material;
  }

  if (material.resourceType === 'document' && material.attachmentData?.startsWith('data:')) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Sign in again before uploading a document.');
    }

    const response = await fetch('/api/upsert-material', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(material),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          material?: Record<string, unknown>;
        }
      | null;

    if (!response.ok || !payload?.material) {
      throw new Error(payload?.error ?? 'We could not upload that document just now.');
    }

    invalidateListCache('staffMaterials');
    return mapStaffMaterialRow(payload.material);
  }

  const insertRow = {
    id: material.id,
    title: material.title,
    summary: material.summary,
    body: material.body,
    country_code: material.countryCode,
    stage: material.stage,
    level: material.level,
    subject: material.subject,
    category: material.category,
    resource_type: material.resourceType,
    attachment_name: material.attachmentName ?? null,
    attachment_data: material.attachmentData ?? null,
    video_url: material.videoUrl ?? null,
    question_limit: material.questionLimit ?? null,
    questions: material.questions ?? [],
    uploaded_by: material.uploadedBy,
    uploaded_by_email: material.uploadedByEmail ?? null,
    created_at: material.createdAt,
    updated_at: material.updatedAt ?? material.createdAt,
    approval_status: material.approvalStatus ?? 'approved',
    ai_review_summary: material.aiReviewSummary ?? null,
    admin_review_note: material.adminReviewNote ?? null,
    reviewed_at: material.reviewedAt ?? null,
    reviewed_by: material.reviewedBy ?? null,
  };

  const { data, error } = await supabase.from('staff_materials').insert(insertRow).select('*').single();

  if (error || !data) {
    mergeStoredState({ staffMaterials: [material, ...localMaterials] });
    invalidateListCache('staffMaterials');
    return material;
  }

  invalidateListCache('staffMaterials');
  return mapStaffMaterialRow(data);
}

async function addFeedbackEntry(entry: FeedbackEntry) {
  const localFeedback = readStoredState().feedbackEntries ?? [];

  if (!supabase) {
    mergeStoredState({ feedbackEntries: [entry, ...localFeedback].slice(0, 120) });
    invalidateListCache('feedbackEntries');
    return entry;
  }

  const insertRow = {
    id: entry.id,
    user_name: entry.userName,
    user_key: entry.userKey,
    role: entry.role,
    country_code: entry.countryCode,
    rating: entry.rating,
    choice: entry.choice,
    ratings: entry.ratings,
    comment: entry.comment,
    created_at: entry.createdAt,
  };

  const { data, error } = await supabase
    .from('feedback_entries')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) {
    mergeStoredState({ feedbackEntries: [entry, ...localFeedback].slice(0, 120) });
    invalidateListCache('feedbackEntries');
    return entry;
  }

  invalidateListCache('feedbackEntries');
  return mapFeedbackRow(data);
}

async function addSupportRequest(request: SupportRequest) {
  const localRequests = (readStoredState().supportRequests ?? []).map(normalizeSupportRequest);
  const nextRequest = normalizeSupportRequest(request);
  const supabaseClient = supabase;

  if (!supabaseClient) {
    mergeStoredState({ supportRequests: [nextRequest, ...localRequests] });
    invalidateListCache('supportRequests');
    return nextRequest;
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  const createdByEmail = user?.email?.trim().toLowerCase() ?? request.createdBy.trim().toLowerCase();

  const insertRow = {
    id: nextRequest.id,
    created_at: nextRequest.createdAt,
    created_by: nextRequest.createdBy,
    created_by_role: nextRequest.createdByRole,
    created_by_email: createdByEmail,
    country_code: nextRequest.countryCode,
    title: nextRequest.title,
    detail: nextRequest.detail,
    category: nextRequest.category,
    status: nextRequest.status,
    assigned_to_name: nextRequest.assignedToName ?? null,
    assigned_to_email: nextRequest.assignedToEmail ?? null,
    assigned_to_role: nextRequest.assignedToRole ?? null,
    completed_at: nextRequest.completedAt ?? null,
    completed_by: nextRequest.completedBy ?? null,
    related_material_id: nextRequest.relatedMaterialId ?? null,
  };

  const { data, error } = await writeSupportRequestWithSchemaFallback(
    async (row) => await supabaseClient.from('support_requests').insert(row).select('*').single(),
    insertRow,
  );

  if (error || !data) {
    mergeStoredState({ supportRequests: [nextRequest, ...localRequests] });
    invalidateListCache('supportRequests');
    return nextRequest;
  }

  invalidateListCache('supportRequests');
  return mapSupportRequestRow(data as Record<string, unknown>);
}

async function updateSupportRequest(request: SupportRequest) {
  const localRequests = (readStoredState().supportRequests ?? []).map(normalizeSupportRequest);
  const nextRequest = normalizeSupportRequest(request);
  const supabaseClient = supabase;

  if (!supabaseClient) {
    mergeStoredState({
      supportRequests: localRequests.map((entry) => (entry.id === nextRequest.id ? nextRequest : entry)),
    });
    invalidateListCache('supportRequests');
    return;
  }

  const token = await getAccessToken();
  if (token) {
    const response = await fetch('/api/support-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'update', request: nextRequest }),
    });

    if (response.ok) {
      invalidateListCache('supportRequests');
      return;
    }
  }

  const updateRow = {
    title: nextRequest.title,
    detail: nextRequest.detail,
    category: nextRequest.category,
    status: nextRequest.status,
    assigned_to_name: nextRequest.assignedToName ?? null,
    assigned_to_email: nextRequest.assignedToEmail ?? null,
    assigned_to_role: nextRequest.assignedToRole ?? null,
    completed_at: nextRequest.completedAt ?? null,
    completed_by: nextRequest.completedBy ?? null,
    related_material_id: nextRequest.relatedMaterialId ?? null,
  };

  const { error } = await writeSupportRequestWithSchemaFallback(
    async (row) => await supabaseClient.from('support_requests').update(row).eq('id', nextRequest.id),
    updateRow,
  );

  if (!error) {
    invalidateListCache('supportRequests');
    return;
  }

  mergeStoredState({
    supportRequests: localRequests.map((entry) => (entry.id === nextRequest.id ? nextRequest : entry)),
  });
  invalidateListCache('supportRequests');
}

async function addAnnouncement(announcement: Announcement) {
  const localAnnouncements = readStoredState().announcements ?? [];

  if (!supabase) {
    mergeStoredState({ announcements: [announcement, ...localAnnouncements] });
    invalidateListCache('announcements');
    return announcement;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const insertRow = {
    id: announcement.id,
    title: announcement.title,
    message: announcement.message,
    audience: announcement.audience,
    published_by_email: user?.email?.trim().toLowerCase() ?? '',
    created_at: announcement.createdAt,
  };

  const { data, error } = await supabase
    .from('announcements')
    .insert(insertRow)
    .select('*')
    .single();

  if (error || !data) {
    mergeStoredState({ announcements: [announcement, ...localAnnouncements] });
    invalidateListCache('announcements');
    return announcement;
  }

  invalidateListCache('announcements');
  return mapAnnouncementRow(data);
}

async function deleteFeedbackEntry(feedbackId: string) {
  const localFeedback = readStoredState().feedbackEntries ?? [];

  if (!supabase) {
    mergeStoredState({
      feedbackEntries: localFeedback.filter((entry) => entry.id !== feedbackId),
    });
    invalidateListCache('feedbackEntries');
    return;
  }

  const token = await getAccessToken();
  if (!token) {
    throw new Error('Sign in again before removing feedback.');
  }

  const response = await fetch('/api/delete-feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ feedbackId }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'We could not remove that feedback just now.');
  }

  mergeStoredState({
    feedbackEntries: localFeedback.filter((entry) => entry.id !== feedbackId),
  });
  invalidateListCache('feedbackEntries');
}

async function updateStaffMaterial(material: StaffMaterial) {
  const localMaterials = readStoredState().staffMaterials ?? [];

  if (!supabase) {
    mergeStoredState({
      staffMaterials: [material, ...localMaterials.filter((entry) => entry.id !== material.id)],
    });
    invalidateListCache('staffMaterials');
    return material;
  }

  if (material.resourceType === 'document' && material.attachmentData?.startsWith('data:')) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Sign in again before updating that document.');
    }

    const response = await fetch('/api/upsert-material', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(material),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          material?: Record<string, unknown>;
        }
      | null;

    if (!response.ok || !payload?.material) {
      throw new Error(payload?.error ?? 'We could not update that document just now.');
    }

    invalidateListCache('staffMaterials');
    return mapStaffMaterialRow(payload.material);
  }

  const updateRow = {
    title: material.title,
    summary: material.summary,
    body: material.body,
    country_code: material.countryCode,
    stage: material.stage,
    level: material.level,
    subject: material.subject,
    category: material.category,
    resource_type: material.resourceType,
    attachment_name: material.attachmentName ?? null,
    attachment_data: material.attachmentData ?? null,
    video_url: material.videoUrl ?? null,
    question_limit: material.questionLimit ?? null,
    questions: material.questions ?? [],
    uploaded_by: material.uploadedBy,
    uploaded_by_email: material.uploadedByEmail ?? null,
    updated_at: material.updatedAt ?? new Date().toISOString(),
    approval_status: material.approvalStatus ?? 'approved',
    ai_review_summary: material.aiReviewSummary ?? null,
    admin_review_note: material.adminReviewNote ?? null,
    reviewed_at: material.reviewedAt ?? null,
    reviewed_by: material.reviewedBy ?? null,
  };

  const { data, error } = await supabase
    .from('staff_materials')
    .update(updateRow)
    .eq('id', material.id)
    .select('*')
    .single();

  if (error || !data) {
    mergeStoredState({
      staffMaterials: [material, ...localMaterials.filter((entry) => entry.id !== material.id)],
    });
    invalidateListCache('staffMaterials');
    return material;
  }

  invalidateListCache('staffMaterials');
  return mapStaffMaterialRow(data);
}

async function removeStaffMember(memberIdOrName: string) {
  if (!supabase) {
    const localStaff = readStoredState().staffMembers ?? [];
    mergeStoredState({
      staffMembers: localStaff.filter((member) => member.id !== memberIdOrName && member.name !== memberIdOrName),
    });
    invalidateListCache('staffMembers', 'registeredUsers');
    return;
  }

  const token = await getAccessToken();
  if (!token) {
    const localStaff = readStoredState().staffMembers ?? [];
    mergeStoredState({
      staffMembers: localStaff.filter((member) => member.id !== memberIdOrName && member.name !== memberIdOrName),
    });
    invalidateListCache('staffMembers', 'registeredUsers');
    return;
  }

  const response = await fetch('/api/delete-staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ staffId: memberIdOrName }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'We could not remove that staff account just now.');
  }

  invalidateListCache('staffMembers', 'registeredUsers');
}

async function removeStaffMaterial(materialId: string) {
  const localMaterials = readStoredState().staffMaterials ?? [];

  if (!supabase) {
    mergeStoredState({
      staffMaterials: localMaterials.filter((material) => material.id !== materialId),
    });
    invalidateListCache('staffMaterials');
    return;
  }

  const { error } = await supabase.from('staff_materials').delete().eq('id', materialId);
  if (!error) {
    invalidateListCache('staffMaterials');
    return;
  }

  mergeStoredState({
    staffMaterials: localMaterials.filter((material) => material.id !== materialId),
  });
  invalidateListCache('staffMaterials');
}

async function removeRegisteredLearner(userId: string) {
  if (!supabase) {
    const localUsers = readStoredState().registeredUsers ?? [];
    mergeStoredState({
      registeredUsers: localUsers.filter((entry) => entry.id !== userId),
    });
    invalidateListCache('registeredUsers');
    return;
  }

  const token = await getAccessToken();
  if (token) {
    const response = await fetch('/api/delete-learner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ learnerId: userId }),
    });

    if (response.ok) {
      invalidateListCache('registeredUsers');
      return;
    }

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'We could not remove that learner just now.');
  }

  const localUsers = getLocalUsers();
  saveLocalUsers(localUsers.filter((entry) => entry.id !== userId));
  invalidateListCache('registeredUsers');
}

async function syncLearnerProfile(
  user: Pick<LearnerProfile, 'email' | 'countryCode' | 'plan' | 'stage' | 'level' | 'mode' | 'subject'>
    & Partial<Pick<LearnerProfile, 'birthDay' | 'birthMonth' | 'birthYear' | 'streakCount' | 'lastActiveOn' | 'tutorialSeen'>>,
) {
  const normalizedEmail = user.email.trim().toLowerCase();
  const supabaseClient = supabase;

  if (!normalizedEmail) {
    return;
  }

  if (!supabaseClient) {
    updateLocalUserByEmail(normalizedEmail, (entry) => ({
      ...entry,
      countryCode: user.countryCode,
      plan: user.plan,
      stage: user.stage,
      level: user.level,
      mode: user.mode,
      subject: user.subject,
      birthDay: user.birthDay,
      birthMonth: user.birthMonth,
      birthYear: user.birthYear,
      streakCount: user.streakCount ?? entry.streakCount,
      lastActiveOn: user.lastActiveOn ?? entry.lastActiveOn,
      tutorialSeen: user.tutorialSeen ?? entry.tutorialSeen,
      lastLoginAt: new Date().toISOString(),
    }));
    invalidateListCache('registeredUsers');
    return;
  }

  const profileUpdate = {
      country_code: user.countryCode,
      plan: user.plan,
      stage: user.stage,
      level: user.level,
      mode: user.mode,
      subject: user.subject,
      birth_day: user.birthDay ?? null,
      birth_month: user.birthMonth ?? null,
      birth_year: user.birthYear ?? null,
      streak_count: user.streakCount ?? 0,
      last_active_on: user.lastActiveOn ?? null,
      tutorial_seen: user.tutorialSeen ?? false,
      last_login_at: new Date().toISOString(),
    };

  const { error } = await writeLearnerProfileWithSchemaFallback(
    async (row) => await supabaseClient.from('learner_profiles').update(row).eq('email', normalizedEmail),
    profileUpdate,
  );

  if (!error) {
    invalidateListCache('registeredUsers');
    return;
  }

  updateLocalUserByEmail(normalizedEmail, (entry) => ({
    ...entry,
    countryCode: user.countryCode,
    plan: user.plan,
    stage: user.stage,
    level: user.level,
    mode: user.mode,
    subject: user.subject,
    birthDay: user.birthDay,
    birthMonth: user.birthMonth,
    birthYear: user.birthYear,
    streakCount: user.streakCount ?? entry.streakCount,
    lastActiveOn: user.lastActiveOn ?? entry.lastActiveOn,
    tutorialSeen: user.tutorialSeen ?? entry.tutorialSeen,
    lastLoginAt: new Date().toISOString(),
  }));
  invalidateListCache('registeredUsers');
}

function buildCountrySummary(users: RegisteredUser[]) {
  return users
    .filter((user) => user.role === 'student')
    .reduce<Record<string, { learners: number; families: number }>>((summary, user) => {
    const existing = summary[user.countryCode] ?? { learners: 0, families: 0 };
    const nextLearners = existing.learners + 1;

    summary[user.countryCode] = {
      learners: nextLearners,
      families: Math.max(1, Math.ceil(nextLearners * 0.6)),
    };

    return summary;
    }, {});
}

function countryLeadFor(code: string, staffMembers: AdminStaffMember[]) {
  const country = getCountryByCode(code);
  const match = staffMembers.find((member) => member.countryCode === code || member.focus.includes(country.name));
  return match?.name ?? 'Waiting for staff assignment';
}

async function listCountryRegistrations() {
  const [users, staff] = await Promise.all([listRegisteredUsers(), listStaffMembers()]);
  const summary = buildCountrySummary(users);

  return Object.entries(summary).map(([code, values]) => ({
    code,
    learners: values.learners,
    families: values.families,
    staffLead: countryLeadFor(code, staff),
  }));
}

export const appRepository = {
  registerLearner,
  sendRegistrationCode,
  verifyRegistrationCode,
  resendRegistrationCode,
  requestPasswordReset,
  completePasswordReset,
  signIn,
  syncLearnerProfile,
  listRegisteredUsers,
  listStaffMembers,
  listStaffMaterials,
  listFeedbackEntries,
  listSupportRequests,
  listAnnouncements,
  addStaffMember,
  addStaffMaterial,
  addFeedbackEntry,
  addSupportRequest,
  addAnnouncement,
  deleteFeedbackEntry,
  updateStaffMaterial,
  updateSupportRequest,
  removeStaffMember,
  removeStaffMaterial,
  removeRegisteredLearner,
  listCountryRegistrations,
};
