import {searchPaginatedBooks, getWork, getAuthor} from "../services/openlibrary.service.js";
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

    const work = await getWork(workId);

    const authors = await Promise.all(
      (work.authors || []).map(async (item) => {
        const authorKey = item.author?.key;

        if (!authorKey) {
          return null;
        }

        const authorId = authorKey.replace("/authors/", "");

        try {
          const author =
            await getAuthor(authorId);

          return {
            id: authorId,
            name: author.name || "Unknown author"
          };
        } catch {
          return {
            id: authorId,
            name: "Unknown author"
          };
        }
      })
    );

    const validAuthors = authors.filter(Boolean);
    console.log("Valid Authors:", validAuthors);
    const book = mapWorkBook(work, validAuthors);

    return successResponse(res, book);
  } catch (error) {
    next(error);
  }
};

