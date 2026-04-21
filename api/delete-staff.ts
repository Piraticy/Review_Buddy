import {
  listAuthUsersByEmail,
  parseJsonBody,
  requireAuthorizedRole,
  setCorsHeaders,
  type VercelRequest,
  type VercelResponse,
} from './supabase-server.js';

type DeleteStaffPayload = {
  staffId?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const authResult = await requireAuthorizedRole(req, ['admin']);
  if ('error' in authResult) {
    res.status(403).json({ error: authResult.error });
    return;
  }

  const payload = parseJsonBody<DeleteStaffPayload>(req.body) ?? {};
  const staffId = payload.staffId?.trim();

  if (!staffId) {
    res.status(400).json({ error: 'Staff id is required.' });
    return;
  }

  const { supabaseAdmin } = authResult;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('learner_profiles')
    .select('id, role, email')
    .eq('id', staffId)
    .maybeSingle();

  if (profileError) {
    res.status(400).json({ error: profileError.message ?? 'We could not find that staff account.' });
    return;
  }

  if (!profile) {
    await supabaseAdmin.from('staff_members').delete().eq('id', staffId);
    res.status(200).json({ ok: true });
    return;
  }

  if (profile.role !== 'staff') {
    res.status(400).json({ error: 'Only staff accounts can be removed here.' });
    return;
  }

  const normalizedEmail = String(profile.email).trim().toLowerCase();

  await supabaseAdmin.from('staff_members').delete().eq('id', staffId);
  await supabaseAdmin.from('learner_profiles').delete().eq('email', normalizedEmail);

  const authUsers = await listAuthUsersByEmail(supabaseAdmin, normalizedEmail);
  const authIds = Array.from(new Set([staffId, ...authUsers.map((user) => user.id)]));

  await Promise.all(
    authIds.map(async (authId) => {
      await supabaseAdmin.auth.admin.deleteUser(authId).catch(() => undefined);
    }),
  );

  res.status(200).json({ ok: true });
}
