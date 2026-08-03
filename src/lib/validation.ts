import { z } from "zod";

export const planSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type PlanInput = z.infer<typeof planSchema>;

const recurrenceTypeSchema = z.enum([
  "NONE",
  "DAILY",
  "WEEKLY",
  "MULTI_WEEKLY",
  "MONTHLY",
]);

// daysOfWeek follows JS Date.getDay() convention: 0=Sunday..6=Saturday.
const baseDeadlineSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  recurrenceType: recurrenceTypeSchema,
  dueDate: z.string().optional(), // yyyy-MM-dd, only for NONE
  dueTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time.")
    .optional()
    .or(z.literal("")), // HH:mm, optional for any recurrence type
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional().default([]),
  daysOfMonth: z.array(z.number().int().min(1).max(31)).optional().default([]),
  planId: z.string().optional().or(z.literal("")),
});

export const deadlineSchema = baseDeadlineSchema.superRefine((data, ctx) => {
  switch (data.recurrenceType) {
    case "NONE":
      if (!data.dueDate) {
        ctx.addIssue({
          code: "custom",
          path: ["dueDate"],
          message: "A one-time deadline needs a due date.",
        });
      }
      break;

    case "WEEKLY":
    case "MONTHLY":
      if (data.recurrenceType === "WEEKLY" && data.daysOfWeek.length !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["daysOfWeek"],
          message: "Weekly deadlines need exactly one day of the week.",
        });
      }
      if (data.recurrenceType === "MONTHLY" && data.daysOfMonth.length !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["daysOfMonth"],
          message: "Monthly deadlines need exactly one day of the month.",
        });
      }
      break;

    case "MULTI_WEEKLY": {
      const unique = new Set(data.daysOfWeek);
      if (data.daysOfWeek.length < 2 || unique.size !== data.daysOfWeek.length) {
        ctx.addIssue({
          code: "custom",
          path: ["daysOfWeek"],
          message: "Multi-weekly deadlines need at least two distinct days.",
        });
      }
      break;
    }
  }
});

export type DeadlineInput = z.infer<typeof baseDeadlineSchema>;
