import {
  createSupabaseAdminClient,
  listAuthUsersByEmail,
  parseJsonBody,
  setCorsHeaders,
  toSafeUsername,
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
  createdAt: string;
  lastLoginAt?: string;
};

async function makeUniqueUsername(supabaseAdmin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, proposed: string) {
  const base = toSafeUsername(proposed);
  const { data, error } = await supabaseAdmin
    .from('learner_profiles')
    .select('username')
    .ilike('username', `${base}%`);

  if (error || !data || data.length === 0) {
    return base;
  }

  const taken = new Set(data.map((row) => String(row.username).toLowerCase()));
  if (!taken.has(base)) return base;

  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}.${index}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  return `${base}.${Date.now().toString(36).slice(-4)}`;
}

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

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const userMetadata = {
    full_name: payload.fullName,
    username: payload.username,
    role: payload.role,
    country_code: payload.countryCode,
  };

  let createdUserId: string | null = null;
  let reusedExistingAuthUser = false;

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (createError || !createdUser.user?.id) {
    const alreadyExists =
      createError?.message?.toLowerCase().includes('already') ||
      createError?.message?.toLowerCase().includes('exists');

    if (!alreadyExists) {
      res.status(400).json({ error: createError?.message ?? 'We could not create the learner account just now.' });
      return;
    }

    const existingAuthUsers = await listAuthUsersByEmail(supabaseAdmin, email);
    const reusableAuthUser = existingAuthUsers[0];

    if (!reusableAuthUser?.id) {
      res.status(400).json({ error: 'That email is already registered. Please sign in instead.' });
      return;
    }

    reusedExistingAuthUser = true;
    createdUserId = reusableAuthUser.id;

    const { error: updateExistingError } = await supabaseAdmin.auth.admin.updateUserById(reusableAuthUser.id, {
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (updateExistingError) {
      res.status(400).json({
        error: updateExistingError.message ?? 'That account exists already, but we could not refresh it just now.',
      });
      return;
    }
  } else {
    createdUserId = createdUser.user.id;
  }

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
    role: payload.role,
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
    created_at: payload.createdAt,
    last_login_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabaseAdmin.from('learner_profiles').upsert(profileRow);

  if (upsertError) {
    if (!reusedExistingAuthUser) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }
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
      email,
      lastLoginAt: profileRow.last_login_at,
    },
  });
}
