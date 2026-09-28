import  {getAllBooks, getBookById,createBookShelf,updateBookShelf,deleteBookShelf} from "../services/bookshelf.service.js";
import { successResponse } from "../utils/response.js";

export const getBooks = async (req, res, next) => {
  try {
    const {status}=req.validateQuery || {};
    const books = await getAllBooks(status);

    return successResponse(res, books);
  } catch (error) {
    next(error);
  }
};

export const getBook = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const book = await getBookById(id);

    return successResponse(res, book);
  } catch (error) {
    next(error);
  }
};

export const createBook = async(req, res,next)=>{
    try {
      const book = await createBookShelf(
        req.validatedBody
      );

      return successResponse(res, book, 201);
    } catch (error) {
      next(error);
    }
}

export const updateBook = async (req, res, next) => {
  try {
    const book = await updateBookShelf(
      req.params.id,
      req.validatedBody
    );

    return successResponse(res, book);
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    await deleteBookShelf(req.params.id);

    return successResponse(res, {
      message: "Book deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

