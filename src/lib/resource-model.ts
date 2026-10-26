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
export const RESOURCE_COLUMNS = "id,user_id,title,url,topic,notes,status,created_at,updated_at";

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
