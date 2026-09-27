import express from "express";

import {searchBooks,getBookDetail} from "../controllers/book.controller.js";
import {validateQuery,createBookshelfSchema} from "../middelwares/validate.middleware.js";

import searchBooksSchema from "../utils/validation.js";

const router = express.Router();

router.get(
  "/search",
  validateQuery(searchBooksSchema),
  searchBooks
);
 router.get(
  "/:workId",  
  getBookDetail
);
export default router;