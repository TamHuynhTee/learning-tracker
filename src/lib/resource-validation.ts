import { z } from "zod";
import { RESOURCE_STATUSES } from "@/lib/resources";

export const resourceSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề."),
  url: z
    .string()
    .trim()
    .refine(
      (value) => !value || (/^https?:\/\//i.test(value) && URL.canParse(value)),
      "URL không hợp lệ.",
    ),
  topic: z.string().trim(),
  notes: z.string().trim(),
  status: z.enum(RESOURCE_STATUSES),
});
export const resourceIdSchema = z.object({ id: z.string().uuid() });
