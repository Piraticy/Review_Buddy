import { createClient } from '@supabase/supabase-js';

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

type VercelRequest = {
  method?: string;
  body?: string | RegisteredUserPayload;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function parseBody(body: VercelRequest['body']): RegisteredUserPayload | null {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as RegisteredUserPayload;
    } catch {
      return null;
    }
  }

  return body;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({
      error:
        'Registration backend is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY in Vercel so public signup can work.',
    });
    return;
  }

  const payload = parseBody(req.body);
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

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: payload.fullName,
      username: payload.username,
      role: payload.role,
      country_code: payload.countryCode,
    },
  });

  if (createError || !createdUser.user?.id) {
    const message =
      createError?.message?.toLowerCase().includes('already') ||
      createError?.message?.toLowerCase().includes('exists')
        ? 'That email is already registered. Please sign in instead.'
        : createError?.message ?? 'We could not create the learner account just now.';

    res.status(400).json({ error: message });
    return;
  }

  const profileRow = {
    id: createdUser.user.id,
    username: payload.username,
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
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    res.status(400).json({
      error: upsertError.message ?? 'The learner account was created, but the profile could not be saved.',
    });
    return;
  }

  res.status(200).json({
    user: {
      ...payload,
      id: createdUser.user.id,
      email,
      lastLoginAt: profileRow.last_login_at,
    },
  });
}
