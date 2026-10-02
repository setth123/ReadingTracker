import {searchPaginatedBooks, getBookDetailData} from "../services/openlibrary.service.js";
import {saveSearchHistory, getSearchHistory} from "../services/search-history.service.js";
import {mapSearchBook, mapWorkBook} from "../utils/book.mapper.js";
import { successResponse } from "../utils/response.js";

export const searchBooks = async (req, res, next) => {
  try {
    const { q, page } = req.validateQuery;
    saveSearchHistory(q);

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

    const [book, bookshelfItem] = await Promise.all([
      getBookDetailData(workId),
      prisma.bookshelf.findUnique({ where: { workId }, select: { id: true } }),
    ]);

    return successResponse(res, { ...book, isAdded: Boolean(bookshelfItem) });


    return successResponse(res, book);
  } catch (error) {
    next(error);
  }
};

export const getSearchHistorySuggestions = async (req, res, next) => {
  try {
    const { q = "" } = req.validateQuery;

    const keywords = getSearchHistory(q);

    return successResponse(res, {
      keywords,
    });
  } catch (error) {
    next(error);
  }
};
