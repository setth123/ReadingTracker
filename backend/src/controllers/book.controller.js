import {searchPaginatedBooks, getBookDetailData} from "../services/openlibrary.service.js";
import {mapSearchBook, mapWorkBook} from "../utils/book.mapper.js";
import { successResponse } from "../utils/response.js";

export const searchBooks = async (req, res, next) => {
  try {
    const { q, page } = req.validateQuery;

    const result = await searchPaginatedBooks(
      q,
      page,
      20
    );

    const books = result.docs.map(mapSearchBook);

    return successResponse(res, {
      books,
      pagination: {
        page,
        limit: 20,
        total: result.numFound
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBookDetail = async (req, res, next) => {
  try {
    const { workId } = req.params;

    const book = await getBookDetailData(workId);

    return successResponse(res, book);
  } catch (error) {
    next(error);
  }
};

