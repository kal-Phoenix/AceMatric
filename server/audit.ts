import { supabaseAdmin as supabase, formatSupabaseError } from './db';

export interface AuditEntry {
  adminEmail: string;
  action: string;
  targetEmail?: string;
  details?: Record<string, any>;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_log')
      .insert([{
        admin_email: entry.adminEmail,
        action: entry.action,
        target_email: entry.targetEmail || null,
        details: entry.details || {},
      }]);

    if (error) console.error('[audit] Failed to log:', formatSupabaseError(error));
  } catch (err: any) {
    console.error('[audit] Failed to log:', err.message);
  }
}

export async function getAuditLog(params?: {
  adminEmail?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ entries: any[]; total: number }> {
  try {
    const pageNum = params?.page || 1;
    const pageSize = Math.min(params?.limit || 50, 100);
    const from = (pageNum - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' });

    if (params?.adminEmail) query = query.eq('admin_email', params.adminEmail);
    if (params?.action) query = query.eq('action', params.action);
    if (params?.from) query = query.gte('created_at', params.from);
    if (params?.to) query = query.lte('created_at', params.to);

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { entries: data || [], total: count || 0 };
  } catch {
    return { entries: [], total: 0 };
  }
}
