import { getSupabase } from "@/lib/supabase";
import { RESOURCE_STATUSES, type Resource } from "@/lib/resources";

export interface ResourceRow {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  topic: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type ResourceInput = Pick<Resource, "title" | "url" | "topic" | "status"> & {
  notes: string;
};
const columns = "id,user_id,title,url,topic,notes,status,created_at,updated_at";

export function fromResourceRow(row: ResourceRow): Resource {
  const status = RESOURCE_STATUSES.find((value) => value === row.status);
  if (!status) throw new Error(`Trạng thái database chưa được hỗ trợ: ${row.status}`);
  return {
    id: row.id,
    title: row.title,
    url: row.url ?? "",
    topic: row.topic ?? "",
    notes: row.notes ?? "",
    status,
    createdAt: row.created_at.slice(0, 10),
  };
}

export function resourcePayload(input: ResourceInput) {
  return {
    title: input.title.trim(),
    url: input.url.trim() || null,
    topic: input.topic.trim() || null,
    notes: input.notes.trim() || null,
    status: input.status,
  };
}

// Explicit user filters complement RLS. The database policies remain responsible
// for authorization; no service-role/secret key is used by this application.
export async function listResources(userId: string, signal?: AbortSignal) {
  let query = getSupabase()
    .from("resources")
    .select(columns)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return (data as ResourceRow[]).map(fromResourceRow);
}

export async function fetchResource(userId: string, id: string, signal?: AbortSignal) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  let query = getSupabase().from("resources").select(columns).eq("user_id", userId).eq("id", id);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? fromResourceRow(data as ResourceRow) : null;
}

export async function createResource(userId: string, input: ResourceInput) {
  const { data, error } = await getSupabase()
    .from("resources")
    .insert({ ...resourcePayload(input), user_id: userId })
    .select(columns)
    .single();
  if (error) throw error;
  return fromResourceRow(data as ResourceRow);
}

export async function updateResource(userId: string, id: string, input: ResourceInput) {
  const { data, error } = await getSupabase()
    .from("resources")
    .update({ ...resourcePayload(input), updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .select(columns)
    .single();
  if (error) throw error;
  return fromResourceRow(data as ResourceRow);
}

export async function deleteResource(userId: string, id: string) {
  const { data, error } = await getSupabase()
    .from("resources")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Không tìm thấy tài liệu để xóa.");
}
