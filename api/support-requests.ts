import {
  parseJsonBody,
  requireAuthorizedRole,
  setCorsHeaders,
  type VercelRequest,
  type VercelResponse,
} from './supabase-server.js';

type SupportRequestPayload = {
  id?: string;
  title?: string;
  detail?: string;
  category?: string;
  status?: string;
  assignedToName?: string;
  assignedToEmail?: string;
  assignedToRole?: string;
  completedAt?: string;
  completedBy?: string;
  relatedMaterialId?: string;
};

type RequestPayload = {
  action?: 'list' | 'update';
  request?: SupportRequestPayload;
};

const OPTIONAL_SUPPORT_REQUEST_COLUMNS = new Set([
  'assigned_to_name',
  'assigned_to_email',
  'assigned_to_role',
  'completed_at',
  'completed_by',
]);

function normalizeStatus(status?: string) {
  if (status === 'assigned' || status === 'in-review' || status === 'done') {
    return status;
  }
  if (status === 'resolved') {
    return 'done';
  }
  return 'new';
}

function getMissingSupportRequestColumn(error: { message?: string } | null | undefined) {
  const message = error?.message ?? '';
  const match = /Could not find the '([^']+)' column of 'support_requests' in the schema cache/i.exec(message);
  return match?.[1] ?? null;
}

async function writeSupportRequestWithSchemaFallback(
  write: (row: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>,
  initialRow: Record<string, unknown>,
) {
  const nextRow = { ...initialRow };

  while (true) {
    const { error } = await write(nextRow);
    if (!error) {
      return { error: null, row: nextRow };
    }

    const missingColumn = getMissingSupportRequestColumn(error);
    if (!missingColumn || !OPTIONAL_SUPPORT_REQUEST_COLUMNS.has(missingColumn) || !(missingColumn in nextRow)) {
      return { error, row: nextRow };
    }

    delete nextRow[missingColumn];
  }
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

  const authResult = await requireAuthorizedRole(req, ['admin', 'staff']);
  if ('error' in authResult) {
    res.status(403).json({ error: authResult.error });
    return;
  }

  const payload = parseJsonBody<RequestPayload>(req.body) ?? {};
  const action = payload.action ?? 'list';
  const { supabaseAdmin, profile } = authResult;

  if (action === 'list') {
    const { data, error } = await supabaseAdmin
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      res.status(400).json({ error: error.message ?? 'We could not load support requests just now.' });
      return;
    }

    const requests =
      profile.role === 'staff'
        ? (data ?? []).filter((entry) => {
            const createdByEmail = String(entry.created_by_email ?? '').trim().toLowerCase();
            const assignedToEmail = String(entry.assigned_to_email ?? '').trim().toLowerCase();
            return createdByEmail === profile.email || assignedToEmail === profile.email;
          })
        : (data ?? []);

    res.status(200).json({ requests });
    return;
  }

  const request = payload.request;
  const requestId = request?.id?.trim();
  if (!requestId) {
    res.status(400).json({ error: 'Request id is required.' });
    return;
  }

  const { data: existingRequest, error: existingError } = await supabaseAdmin
    .from('support_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();

  if (existingError || !existingRequest) {
    res.status(404).json({ error: existingError?.message ?? 'That request could not be found.' });
    return;
  }

  const normalizedAssignedEmail = request?.assignedToEmail?.trim().toLowerCase() ?? '';
  const existingAssignedEmail = String(existingRequest.assigned_to_email ?? '').trim().toLowerCase();
  const nextStatus = normalizeStatus(request?.status);

  if (profile.role === 'staff') {
    if (!existingAssignedEmail || existingAssignedEmail !== profile.email) {
      res.status(403).json({ error: 'Only the assigned staff member can finish that request.' });
      return;
    }

    if (nextStatus !== 'done') {
      res.status(403).json({ error: 'Staff can only mark their assigned request as done.' });
      return;
    }
  }

  const assignedToName =
    profile.role === 'staff'
      ? String(existingRequest.assigned_to_name ?? '')
      : request?.assignedToName?.trim() || '';
  const assignedToEmail =
    profile.role === 'staff'
      ? String(existingRequest.assigned_to_email ?? '').trim().toLowerCase()
      : normalizedAssignedEmail;
  const assignedToRole =
    profile.role === 'staff'
      ? String(existingRequest.assigned_to_role ?? '')
      : request?.assignedToRole;

  const updateRow = {
    title: profile.role === 'staff' ? String(existingRequest.title ?? '') : request?.title?.trim() || String(existingRequest.title ?? ''),
    detail: profile.role === 'staff' ? String(existingRequest.detail ?? '') : request?.detail?.trim() || String(existingRequest.detail ?? ''),
    category: profile.role === 'staff' ? String(existingRequest.category ?? 'general') : request?.category?.trim() || String(existingRequest.category ?? 'general'),
    status: nextStatus,
    assigned_to_name: assignedToName || null,
    assigned_to_email: assignedToEmail || null,
    assigned_to_role:
      assignedToRole === 'admin' || assignedToRole === 'staff'
        ? assignedToRole
        : null,
    completed_at: request?.completedAt?.trim() || (nextStatus === 'done' ? new Date().toISOString() : null),
    completed_by: request?.completedBy?.trim() || (nextStatus === 'done' ? profile.email : null),
    related_material_id: request?.relatedMaterialId?.trim() || existingRequest.related_material_id || null,
  };

  const { error } = await writeSupportRequestWithSchemaFallback(
    async (row) => await supabaseAdmin.from('support_requests').update(row).eq('id', requestId),
    updateRow,
  );

  if (error) {
    res.status(400).json({ error: error.message ?? 'We could not update that request just now.' });
    return;
  }

  res.status(200).json({ ok: true });
}
