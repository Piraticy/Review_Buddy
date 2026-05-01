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

function getMissingStaffMaterialColumn(error: { message?: string } | null | undefined) {
  const message = error?.message ?? '';
  const match = /Could not find the '([^']+)' column of 'staff_materials' in the schema cache/i.exec(message);
  return match?.[1] ?? null;
}

async function loadMaterialForDelete(
  selectMaterial: (fields: string) => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>,
) {
  const fields = ['id', 'uploaded_by', 'uploaded_by_email', 'attachment_name', 'attachment_data'];

  while (fields.length > 0) {
    const result = await selectMaterial(fields.join(', '));
    if (!result.error) {
      return result;
    }

    const missingColumn = getMissingStaffMaterialColumn(result.error);
    if (!missingColumn) {
      return result;
    }

    const fieldIndex = fields.indexOf(missingColumn);
    if (fieldIndex < 0) {
      return result;
    }

    fields.splice(fieldIndex, 1);
  }

  return { data: null, error: { message: 'We could not find that material.' } };
}

function getStoragePathFromAttachment(attachmentData: string, attachmentName?: string) {
  const publicPrefix = '/storage/v1/object/public/staff-materials/';

  if (attachmentData.includes(publicPrefix)) {
    try {
      const url = new URL(attachmentData);
      const marker = `${publicPrefix}`;
      const index = url.pathname.indexOf(marker);
      if (index >= 0) {
        return decodeURIComponent(url.pathname.slice(index + marker.length));
      }
    } catch {
      const index = attachmentData.indexOf(publicPrefix);
      if (index >= 0) {
        return decodeURIComponent(attachmentData.slice(index + publicPrefix.length).split(/[?#]/)[0]);
      }
    }
  }

  if (attachmentData.startsWith('data:') || !attachmentName?.trim()) {
    return null;
  }

  return null;
}

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
  const { data: material, error: lookupError } = await loadMaterialForDelete(async (fields) =>
    await supabaseAdmin
      .from('staff_materials')
      .select(fields)
      .eq('id', materialId)
      .maybeSingle(),
  );

  if (lookupError) {
    res.status(400).json({ error: lookupError.message ?? 'We could not find that material.' });
    return;
  }

  if (!material) {
    res.status(404).json({ error: 'That material could not be found.' });
    return;
  }

  if (profile.role === 'staff') {
    const uploadedByEmail = String(material.uploaded_by_email ?? '').trim().toLowerCase();
    const uploadedByName = String(material.uploaded_by ?? '').trim().toLowerCase();
    const currentFullName = String(profile.fullName ?? '').trim().toLowerCase();
    const currentShortName = profile.email.split('@')[0]?.trim().toLowerCase() ?? '';

    const matchesOwner =
      (uploadedByEmail && uploadedByEmail === profile.email) ||
      (uploadedByName && (uploadedByName === currentFullName || uploadedByName === currentShortName));

    if ((uploadedByEmail || uploadedByName) && !matchesOwner) {
      res.status(403).json({ error: 'You can only remove your own uploads.' });
      return;
    }
  }

  await supabaseAdmin
    .from('support_requests')
    .update({ related_material_id: null })
    .eq('related_material_id', materialId);

  const attachmentData = String(material.attachment_data ?? '').trim();
  const attachmentName = String(material.attachment_name ?? '').trim();
  const storagePath = getStoragePathFromAttachment(attachmentData, attachmentName);
  if (storagePath) {
    await supabaseAdmin.storage.from('staff-materials').remove([storagePath]).catch(() => undefined);
  }

  const { error } = await supabaseAdmin.from('staff_materials').delete().eq('id', materialId);
  if (error) {
    res.status(400).json({ error: error.message ?? 'We could not remove that material just now.' });
    return;
  }

  res.status(200).json({ ok: true });
}
