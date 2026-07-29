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
  "TWICE_WEEKLY",
  "MONTHLY",
  "TWICE_MONTHLY",
]);

// daysOfWeek follows JS Date.getDay() convention: 0=Sunday..6=Saturday.
const baseDeadlineSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  recurrenceType: recurrenceTypeSchema,
  dueDate: z.string().optional(), // yyyy-MM-dd, only for NONE
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

    case "TWICE_WEEKLY": {
      const unique = new Set(data.daysOfWeek);
      if (data.daysOfWeek.length !== 2 || unique.size !== 2) {
        ctx.addIssue({
          code: "custom",
          path: ["daysOfWeek"],
          message: "Twice-weekly deadlines need exactly two distinct days.",
        });
      }
      break;
    }

    case "TWICE_MONTHLY": {
      const unique = new Set(data.daysOfMonth);
      if (data.daysOfMonth.length !== 2 || unique.size !== 2) {
        ctx.addIssue({
          code: "custom",
          path: ["daysOfMonth"],
          message: "Twice-monthly deadlines need exactly two distinct days.",
        });
      }
      break;
    }
  }
});

export type DeadlineInput = z.infer<typeof baseDeadlineSchema>;
