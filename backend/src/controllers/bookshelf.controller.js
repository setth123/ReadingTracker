import { getAllBooks, getBookById, createBookShelf, updateBookShelf, deleteBookShelf } from "../services/bookshelf.service.js";
import { successResponse } from "../utils/response.js";

// Express 5 forwards errors from async handlers to the error middleware, so no try/catch is needed

export const getBooks = async (req, res) => {
  const books = await getAllBooks(req.validated.query.status);

  return successResponse(res, books);
};

export const getBook = async (req, res) => {
  const book = await getBookById(req.validated.params.id);

  return successResponse(res, book);
};

export const createBook = async (req, res) => {
  const book = await createBookShelf(req.validated.body);

  return successResponse(res, book, 201);
};

export const updateBook = async (req, res) => {
  const book = await updateBookShelf(req.validated.params.id, req.validated.body);

  return successResponse(res, book);
};

export const deleteBook = async (req, res) => {
  await deleteBookShelf(req.validated.params.id);

  return successResponse(res, { message: "Book deleted successfully" });
};
