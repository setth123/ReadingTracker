import express from "express";

import {getBooks,getBook,createBook,updateBook,deleteBook} from "../controllers/bookshelf.controller.js";
import {createBookshelfSchema,updateBookshelfSchema,bookshelfQuerySchema} from "../utils/validation.js";
import { validateQuery, validateBody } from "../middelwares/validate.middleware.js";

const router = express.Router();

router.get("/", validateQuery(bookshelfQuerySchema), getBooks);

router.get("/:id", getBook);

router.post("/",validateBody(createBookshelfSchema),createBook)

router.put("/:id",validateBody(updateBookshelfSchema),updateBook)

router.delete("/:id",deleteBook)

export default router;