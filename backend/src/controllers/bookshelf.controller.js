import  {getAllBooks, getBookById} from "../services/bookshelf.service.js";
import { successResponse } from "../utils/response.js";

export const getBooks = async (req, res, next) => {
  try {
    const books = await getAllBooks();

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
      const book = await bookshelfService.createBook(
        req.validatedBody
      );

      return successResponse(res, book, 201);
    } catch (error) {
      next(error);
    }
}