import {
  parseJsonBody,
  requireAuthorizedRole,
  setCorsHeaders,
  type VercelRequest,
  type VercelResponse,
} from './supabase-server.js';

type DeleteMaterialPayload = {
  materialId?: string;
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

  const authResult = await requireAuthorizedRole(req, ['admin', 'staff']);
  if ('error' in authResult) {
    res.status(403).json({ error: authResult.error });
    return;
  }

  const payload = parseJsonBody<DeleteMaterialPayload>(req.body) ?? {};
  const materialId = payload.materialId?.trim();

  if (!materialId) {
    res.status(400).json({ error: 'Material id is required.' });
    return;
  }

  const { supabaseAdmin, profile } = authResult;

  if (profile.role === 'staff') {
    const { data: material, error: lookupError } = await supabaseAdmin
      .from('staff_materials')
      .select('id, uploaded_by_email')
      .eq('id', materialId)
      .maybeSingle();

    if (lookupError) {
      res.status(400).json({ error: lookupError.message ?? 'We could not find that material.' });
      return;
    }

    const uploadedByEmail = String(material?.uploaded_by_email ?? '').trim().toLowerCase();
    if (uploadedByEmail && uploadedByEmail !== profile.email) {
      res.status(403).json({ error: 'You can only remove your own uploads.' });
      return;
    }
  }

  const { error } = await supabaseAdmin.from('staff_materials').delete().eq('id', materialId);
  if (error) {
    res.status(400).json({ error: error.message ?? 'We could not remove that material just now.' });
    return;
  }

  res.status(200).json({ ok: true });
}
