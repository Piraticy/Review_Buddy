import {
  listAuthUsersByEmail,
  makeUniqueUsername,
  parseJsonBody,
  requireAuthorizedRole,
  setCorsHeaders,
  writeLearnerProfileWithSchemaFallback,
  type VercelRequest,
  type VercelResponse,
} from './supabase-server.js';

type CreateStaffPayload = {
  name: string;
  role: string;
  focus: string;
  status: string;
  countryCode?: string;
  email: string;
  username?: string;
  password: string;
  qualifications?: string;
  eligibility?: string;
  createdAt?: string;
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

  const authResult = await requireAuthorizedRole(req, ['admin']);
  if ('error' in authResult) {
    res.status(403).json({ error: authResult.error });
    return;
  }

  const payload = parseJsonBody<CreateStaffPayload>(req.body);
  if (!payload) {
    res.status(400).json({ error: 'Invalid staff payload.' });
    return;
  }

  const fullName = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!fullName || !payload.role?.trim() || !payload.focus?.trim() || !email || !password) {
    res.status(400).json({ error: 'Name, role, focus, email, and password are required.' });
    return;
  }

  const { supabaseAdmin } = authResult;
  const existingAuthUsers = await listAuthUsersByEmail(supabaseAdmin, email);
  if (existingAuthUsers.length > 0) {
    res.status(400).json({ error: 'That staff email already exists.' });
    return;
  }

  const username = await makeUniqueUsername(
    supabaseAdmin,
    payload.username?.trim() || fullName || email.split('@')[0],
  );

  const userMetadata = {
    full_name: fullName,
    username,
    role: 'staff',
    country_code: payload.countryCode ?? 'US',
  };

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (createError || !createdUser.user?.id) {
    res.status(400).json({ error: createError?.message ?? 'We could not create that staff account just now.' });
    return;
  }

  const createdUserId = createdUser.user.id;
  const createdAt = payload.createdAt ?? new Date().toISOString();

  await supabaseAdmin
    .from('learner_profiles')
    .delete()
    .eq('email', email)
    .neq('id', createdUserId);

  const profileRow = {
    id: createdUserId,
    username,
    full_name: fullName,
    email,
    role: 'staff',
    gender: 'girl',
    avatar_mode: 'generated',
    avatar_emoji: '🧑🏽‍🏫',
    avatar_image: null,
    country_code: payload.countryCode ?? 'US',
    plan: 'elite',
    stage: 'primary',
    level: 'Grade 4',
    mode: 'solo',
    subject: 'Mathematics',
    qualifications: payload.qualifications ?? null,
    eligibility: payload.eligibility ?? null,
    support_focus: payload.focus.trim(),
    tutorial_seen: false,
    created_at: createdAt,
    last_login_at: null,
  };

  const { error: profileError } = await writeLearnerProfileWithSchemaFallback(
    async (row) => await supabaseAdmin.from('learner_profiles').upsert(row),
    profileRow,
  );

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    res.status(400).json({
      error: profileError.message ?? 'The staff account was created, but the profile could not be saved.',
    });
    return;
  }

  const staffRow = {
    id: createdUserId,
    name: fullName,
    role: payload.role.trim(),
    focus: payload.focus.trim(),
    status: payload.status?.trim() || 'Ready to assign',
    country_code: payload.countryCode ?? null,
    email,
    username,
    qualifications: payload.qualifications ?? null,
    eligibility: payload.eligibility ?? null,
    created_at: createdAt,
  };

  const { data: staffMember, error: staffError } = await supabaseAdmin
    .from('staff_members')
    .upsert(staffRow)
    .select('*')
    .single();

  if (staffError || !staffMember) {
    await supabaseAdmin.from('learner_profiles').delete().eq('id', createdUserId);
    await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    res.status(400).json({
      error: staffError?.message ?? 'The staff account was created, but the staff record could not be saved.',
    });
    return;
  }

  res.status(200).json({
    staffMember,
    staffUser: {
      id: createdUserId,
      username,
      fullName,
      email,
      password,
      role: 'staff',
      gender: 'girl',
      avatarMode: 'generated',
      avatarEmoji: '🧑🏽‍🏫',
      countryCode: payload.countryCode ?? 'US',
      plan: 'elite',
      stage: 'primary',
      level: 'Grade 4',
      mode: 'solo',
      subject: 'Mathematics',
      createdAt,
      lastLoginAt: undefined,
      qualifications: payload.qualifications ?? undefined,
      eligibility: payload.eligibility ?? undefined,
      supportFocus: payload.focus.trim(),
      tutorialSeen: false,
    },
  });
}
