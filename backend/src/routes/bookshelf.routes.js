import express from "express";

import {getBooks,getBook,createBook} from "../controllers/bookshelf.controller.js";
import {createBookshelfSchema} from "../validations/bookshelf.validation.js";

const router = express.Router();

router.get("/", getBooks);

router.get("/:id", getBook);

router.post("/",validateBody(createBookshelfSchema))

export default router;