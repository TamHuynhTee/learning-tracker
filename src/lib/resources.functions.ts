import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { requireUser } from "@/lib/supabase.server";
import {
  fromResourceRow,
  resourcePayload,
  RESOURCE_COLUMNS,
  type ResourceRow,
} from "@/lib/resource-model";
import { resourceSchema, resourceIdSchema } from "@/lib/resource-validation";

// Every endpoint enforces authentication independently of its calling route.
export const requireResourceUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const { user } = await requireUser();
  return { id: user.id };
});

export const getResourcesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("resources")
    .select(RESOURCE_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Không tải được danh sách tài liệu.");
  return (data as ResourceRow[]).map(fromResourceRow);
});

export const getResourceFn = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data: input }) => {
    const { supabase, user } = await requireUser();
    if (!resourceIdSchema.safeParse(input).success) throw notFound();
    const { data, error } = await supabase
      .from("resources")
      .select(RESOURCE_COLUMNS)
      .eq("id", input.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error("Không tải được tài liệu.");
    if (!data) throw notFound();
    return fromResourceRow(data as ResourceRow);
  });

export const createResourceFn = createServerFn({ method: "POST" })
  .validator(resourceSchema)
  .handler(async ({ data: input }) => {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("resources")
      .insert({ ...resourcePayload(input), user_id: user.id })
      .select(RESOURCE_COLUMNS)
      .single();
    if (error) throw new Error("Không thêm được tài liệu.");
    return fromResourceRow(data as ResourceRow);
  });

export const updateResourceFn = createServerFn({ method: "POST" })
  .validator(resourceSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ data: input }) => {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("resources")
      .update({ ...resourcePayload(input), updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select(RESOURCE_COLUMNS)
      .single();
    if (error) throw new Error("Không cập nhật được tài liệu.");
    return fromResourceRow(data as ResourceRow);
  });

export const deleteResourceFn = createServerFn({ method: "POST" })
  .validator(resourceIdSchema)
  .handler(async ({ data: input }) => {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("resources")
      .delete()
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select("id")
      .single();
    if (error || !data) throw new Error("Không xóa được tài liệu.");
    return { success: true };
  });
