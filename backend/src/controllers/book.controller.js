import { searchPaginatedBooks, getBookDetailData } from "../services/openlibrary.service.js";
import { saveSearchHistory, getSearchHistory } from "../services/search-history.service.js";
import { mapSearchBook } from "../utils/book.mapper.js";
import prisma from "../utils/prisma.js";
import { successResponse } from "../utils/response.js";

const SEARCH_LIMIT = 20;

export const searchBooks = async (req, res) => {
  const { q, page } = req.validated.query;

  const result = await searchPaginatedBooks(q, page, SEARCH_LIMIT);

  // Saved only after the search succeeds, so failed searches don't show up as suggestions
  saveSearchHistory(q);

  return successResponse(res, {
    books: result.docs.map(mapSearchBook),
    pagination: {
      page,
      limit: SEARCH_LIMIT,
      total: result.numFound,
    },
  });
};

export const getBookDetail = async (req, res) => {
  const { workId } = req.params;

  // Open Library data is cached, but isAdded always comes fresh from the database
  const [book, bookshelfItem] = await Promise.all([
    getBookDetailData(workId),
    prisma.bookshelf.findUnique({ where: { workId }, select: { id: true } }),
  ]);

  return successResponse(res, { ...book, isAdded: Boolean(bookshelfItem) });
};

export const getSearchHistorySuggestions = (req, res) => {
  const keywords = getSearchHistory(req.validated.query.q);

  return successResponse(res, { keywords });
};
