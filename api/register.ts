import {
  createSupabaseAdminClient,
  makeUniqueUsername,
  parseJsonBody,
  setCorsHeaders,
  writeLearnerProfileWithSchemaFallback,
  type VercelRequest,
  type VercelResponse,
} from './supabase-server.js';

type RegisteredUserPayload = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: 'student' | 'admin' | 'staff';
  gender: 'boy' | 'girl';
  avatarMode: 'generated' | 'upload';
  avatarEmoji: string;
  avatarImage?: string;
  countryCode: string;
  plan: 'free' | 'trial' | 'elite';
  stage: 'kindergarten' | 'primary' | 'teen';
  level: string;
  mode: 'solo' | 'group';
  subject: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  streakCount?: number;
  lastActiveOn?: string;
  tutorialSeen?: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    res.status(500).json({
      error:
        'Registration backend is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY in Vercel so public signup can work.',
    });
    return;
  }

  const payload = parseJsonBody<RegisteredUserPayload>(req.body);
  if (!payload) {
    res.status(400).json({ error: 'Invalid registration payload.' });
    return;
  }

  const email = payload.email.trim().toLowerCase();
  const password = payload.password;
  const role: RegisteredUserPayload['role'] = 'student';

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  if (payload.role !== 'student') {
    res.status(403).json({ error: 'Only learner self-registration is allowed here.' });
    return;
  }

  const userMetadata = {
    full_name: payload.fullName,
    username: payload.username,
    role,
    country_code: payload.countryCode,
  };

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (createError || !createdUser.user?.id) {
    const message = createError?.message?.toLowerCase() ?? '';
    if (message.includes('already') || message.includes('exists')) {
      res.status(400).json({ error: 'That email is already registered. Please sign in instead.' });
      return;
    }

    res.status(400).json({ error: createError?.message ?? 'We could not create the learner account just now.' });
    return;
  }

  const createdUserId = createdUser.user.id;
  if (!createdUserId) {
    res.status(400).json({ error: 'We could not create the learner account just now.' });
    return;
  }

  const nextUsername = await makeUniqueUsername(supabaseAdmin, payload.username || payload.fullName || email.split('@')[0]);

  await supabaseAdmin
    .from('learner_profiles')
    .delete()
    .eq('email', email)
    .neq('id', createdUserId);

  const profileRow = {
    id: createdUserId,
    username: nextUsername,
    full_name: payload.fullName,
    email,
    role,
    gender: payload.gender,
    avatar_mode: payload.avatarMode,
    avatar_emoji: payload.avatarEmoji,
    avatar_image: payload.avatarImage ?? null,
    country_code: payload.countryCode,
    plan: payload.plan,
    stage: payload.stage,
    level: payload.level,
    mode: payload.mode,
    subject: payload.subject,
    birth_day: payload.birthDay ?? null,
    birth_month: payload.birthMonth ?? null,
    birth_year: payload.birthYear ?? null,
    streak_count: payload.streakCount ?? 0,
    last_active_on: payload.lastActiveOn ?? new Date().toISOString().slice(0, 10),
    tutorial_seen: payload.tutorialSeen ?? false,
    created_at: payload.createdAt,
    last_login_at: new Date().toISOString(),
  };

  const { error: upsertError } = await writeLearnerProfileWithSchemaFallback(
    (row) => supabaseAdmin.from('learner_profiles').upsert(row),
    profileRow,
  );

  if (upsertError) {
    await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    res.status(400).json({
      error: upsertError.message ?? 'The learner account was created, but the profile could not be saved.',
    });
    return;
  }

  res.status(200).json({
    user: {
      ...payload,
      id: createdUserId,
      username: nextUsername,
      role,
      email,
      lastLoginAt: profileRow.last_login_at,
      birthDay: payload.birthDay,
      birthMonth: payload.birthMonth,
      birthYear: payload.birthYear,
      streakCount: payload.streakCount ?? 0,
      lastActiveOn: profileRow.last_active_on,
      tutorialSeen: payload.tutorialSeen ?? false,
    },
  });
}
