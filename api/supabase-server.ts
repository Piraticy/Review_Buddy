import { createClient } from '@supabase/supabase-js';

export type VercelRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function normalizeEnvValue(value?: string) {
  return value?.replace(/\\n/g, '').trim();
}

export function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function getSupabaseServerConfig() {
  const supabaseUrl = normalizeEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return { supabaseUrl, serviceRoleKey };
}

export function createSupabaseAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getSupabaseServerConfig();
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const DEFAULT_ROLE_EMAILS = {
  admin: 'admin@reviewbuddy.app',
  staff: 'staff@reviewbuddy.app',
} as const;

type SupabaseAdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export async function listAuthUsersByEmail(supabaseAdmin: SupabaseAdminClient, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return [];

  const matches: Array<{ id: string; email: string }> = [];
  let page = 1;

  while (page < 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error || !data?.users?.length) {
      break;
    }

    for (const user of data.users) {
      const userEmail = user.email?.trim().toLowerCase();
      if (userEmail === normalizedEmail) {
        matches.push({ id: user.id, email: userEmail });
      }
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return matches;
}

export function getBearerToken(req: VercelRequest) {
  const raw = req.headers?.authorization ?? req.headers?.Authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function requireAuthorizedRole(
  req: VercelRequest,
  roles: Array<'admin' | 'staff'>,
) {
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return { error: 'Server auth is not configured yet.' };
  }

  const token = getBearerToken(req);
  if (!token) {
    return { error: 'You need to sign in again before doing that.' };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    return { error: 'Your session could not be confirmed. Sign in again and retry.' };
  }

  const normalizedEmail = authData.user.email?.trim().toLowerCase() ?? '';

  let { data: profile, error: profileError } = await supabaseAdmin
    .from('learner_profiles')
    .select('id, role, email, username, full_name')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (!profile && normalizedEmail) {
    const { data: emailProfile, error: emailProfileError } = await supabaseAdmin
      .from('learner_profiles')
      .select('id, role, email, username, full_name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!emailProfileError && emailProfile) {
      profile = emailProfile;
      profileError = null;
    }
  }

  let resolvedRole = profile?.role as 'admin' | 'staff' | undefined;

  if (!resolvedRole) {
    const metadataRole = String(authData.user.user_metadata?.role ?? '').toLowerCase();
    if (metadataRole === 'admin' || metadataRole === 'staff') {
      resolvedRole = metadataRole;
    } else if (normalizedEmail === DEFAULT_ROLE_EMAILS.admin) {
      resolvedRole = 'admin';
    } else if (normalizedEmail === DEFAULT_ROLE_EMAILS.staff) {
      resolvedRole = 'staff';
    }
  }

  if (!profileError && normalizedEmail && resolvedRole && (!profile || profile.id !== authData.user.id)) {
    await supabaseAdmin.from('learner_profiles').upsert({
      id: authData.user.id,
      username:
        String(profile?.username ?? authData.user.user_metadata?.username ?? normalizedEmail.split('@')[0]).slice(0, 40),
      full_name: String(profile?.full_name ?? authData.user.user_metadata?.full_name ?? `Review Buddy ${resolvedRole}`),
      email: normalizedEmail,
      role: resolvedRole,
      gender: 'boy',
      avatar_mode: 'generated',
      avatar_emoji: resolvedRole === 'admin' ? '🛡️' : '🧑🏽‍🏫',
      avatar_image: null,
      country_code: String(authData.user.user_metadata?.country_code ?? 'US'),
      plan: 'elite',
      stage: 'primary',
      level: 'Grade 4',
      mode: 'solo',
      subject: 'Mathematics',
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    });
  }

  if (profileError || !resolvedRole || !roles.includes(resolvedRole)) {
    return { error: 'You do not have permission to do that.' };
  }

  return {
    supabaseAdmin,
    profile: {
      id: authData.user.id,
      role: resolvedRole,
      email: normalizedEmail,
    },
  };
}

export function parseJsonBody<T>(body: unknown): T | null {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T;
    } catch {
      return null;
    }
  }

  return body as T;
}

export function toSafeUsername(value: string) {
  const normalized =
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '') || 'learner';

  return normalized.slice(0, 40);
}
