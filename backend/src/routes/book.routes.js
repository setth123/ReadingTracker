import express from "express";

import {searchBooks,getBookDetail, getSearchHistorySuggestions} from "../controllers/book.controller.js";
import {searchBooksSchema,searchHistoryQuerySchema} from "../utils/validation.js";
import {validateQuery} from "../middelwares/validate.middleware.js";
const router = express.Router();

router.get(
  "/search",
  validateQuery(searchBooksSchema),
  searchBooks
);
router.get(
  "/search/history",
  validateQuery(searchHistoryQuerySchema),
  getSearchHistorySuggestions
);

router.get("/:workId", getBookDetail);
export default router;