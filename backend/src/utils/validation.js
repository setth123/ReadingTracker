import { z } from "zod";

const searchBooksSchema = z.object({
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

