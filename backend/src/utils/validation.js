import { z } from "zod";

export const searchBooksSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Keyword is required")
    .max(100, "Keyword is too long"),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
});

export const createBookshelfSchema = z.object({
  workId: z
    .string()
    .trim()
    .min(1, "Work ID is required"),

  status: z.enum([
    "WANT_TO_READ",
    "READING",
    "COMPLETED"
  ])
});

export const updateBookshelfSchema = z.object({
  currentPage: z.coerce
    .number()
    .int("Current page must be an integer")
    .min(0, "Current page must be at least 0")
    .optional(),

  status: z
    .enum(["WANT_TO_READ", "READING", "COMPLETED"])
    .optional(),

  rating: z
    .union([
      z.coerce.number().int().min(1).max(5),
      z.literal(""),
    ])
    .optional()
    .transform((value) => {
      return value === "" ? null : value;
    }),

  note: z
    .string()
    .max(1000, "Note is too long")
    .nullable()
    .optional(),
});

export const bookshelfQuerySchema = z.object({
  status: z
    .enum(["WANT_TO_READ", "READING", "COMPLETED"])
    .optional(),
});