  import { z } from "zod";

  export const searchBooksSchema = z.object({
    q: z
      .string()
      .trim()
      .min(3, "Keyword need to be longer than 2 characters")
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
      .number({
      invalid_type_error: "Current page must be a number",
    })
      .int("Current page must be an integer")
      .min(0, "Current page must be at least 0")
      .optional(),
    
    status: z
      .enum(["WANT_TO_READ", "READING", "COMPLETED"])
      .optional(),

    rating: z
      .number()
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating must be at most 5")
      .nullable()
      .optional(),

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

  export const searchHistoryQuerySchema = z.object({
    q: z.string().trim().optional().default(""),
  });
