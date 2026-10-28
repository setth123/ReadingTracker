import express from "express";

import { getBooks, getBook, createBook, updateBook, deleteBook } from "../controllers/bookshelf.controller.js";
import {
  bookshelfIdParamsSchema,
  bookshelfQuerySchema,
  createBookshelfSchema,
  updateBookshelfSchema,
} from "../utils/validation.js";
import { validateQuery, validateBody, validateParams } from "../middlewares/validate.middleware.js";

const router = express.Router();
const validateId = validateParams(bookshelfIdParamsSchema);

router.get("/", validateQuery(bookshelfQuerySchema), getBooks);

router.get("/:id", validateId, getBook);

router.post("/", validateBody(createBookshelfSchema), createBook);

router.put("/:id", validateId, validateBody(updateBookshelfSchema), updateBook);

router.delete("/:id", validateId, deleteBook);

export default router;
