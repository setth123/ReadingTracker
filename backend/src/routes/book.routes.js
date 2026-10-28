import express from "express";

import { searchBooks, getBookDetail, getSearchHistorySuggestions } from "../controllers/book.controller.js";
import { searchBooksSchema, searchHistoryQuerySchema } from "../utils/validation.js";
import { validateQuery } from "../middlewares/validate.middleware.js";

const router = express.Router();

// Must be declared before "/:workId", otherwise "search" would be treated as a workId
router.get("/search", validateQuery(searchBooksSchema), searchBooks);

router.get("/search/history", validateQuery(searchHistoryQuerySchema), getSearchHistorySuggestions);

router.get("/:workId", getBookDetail);

export default router;
