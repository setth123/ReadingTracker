const OPEN_LIBRARY_URL = process.env.OPEN_LIBRARY_URL || "https://openlibrary.org";
import AppError from "../utils/AppError.js";
import {mapWorkBook} from "../utils/book.mapper.js";


const bookDetailCache = new Map();

const BOOK_DETAIL_CACHE_TTL = 5 * 60 * 1000;

const searchCache = new Map();

const SEARCH_CACHE_TTL = 5 * 60 * 1000;

const authorCache = new Map();
const AUTHOR_CACHE_TTL= 5 * 60 * 1000;

export const searchPaginatedBooks = async (keyword, page = 1, limit = 20) => {
  const cacheKey = `${keyword.trim().toLowerCase()}:${page}:${limit}`;

  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    return cached.value;
  }

  const url = new URL(`${OPEN_LIBRARY_URL}/search.json`);

  url.searchParams.set("q", keyword);
  url.searchParams.set("page", page);
  url.searchParams.set("limit", limit);

  const response = await fetch(url);

  if (!response.ok) {
    throw new AppError("Failed to fetch books from Open Library", 502);
  }

  const data = await response.json();
  
  searchCache.set(cacheKey, {
    value: data,
    timestamp: Date.now(),
  });

  return data;
};

export const getWork = async (workId) => {
  const url = `${OPEN_LIBRARY_URL}/works/${workId}.json`;

  const response = await fetch(url);

  if (response.status === 404) {
    throw new AppError(
      "Book not found in Open Library",
      404
    );
  }

  if (!response.ok) {
    throw new AppError(
      "Failed to fetch book from Open Library",
      502
    );
  }

  return response.json();
};

export const getEditions = async (workId) => {
  const url = `${OPEN_LIBRARY_URL}/works/${workId}/editions.json?limit=20`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new AppError("Failed to fetch book editions from Open Library", 502);
  }

  return response.json();
};

export const getAuthor = async (authorId) => {
  const cached = authorCache.get(authorId);
  if (cached && Date.now() - cached.timestamp < AUTHOR_CACHE_TTL) {
    return cached.value;
  }

  const url = `${OPEN_LIBRARY_URL}/authors/${authorId}.json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new AppError("Failed to fetch author from Open Library");
  }

  const author = await response.json();
  authorCache.set(authorId, { value: author, timestamp: Date.now() });

  return author;
};

export const getPageCount = async (workId) => {

  const editions = await getEditions(workId);

  const edition = editions.entries?.find(
    (item) =>
      Number.isInteger(item.number_of_pages) &&
      item.number_of_pages > 0
  );

  const pageCount = edition?.number_of_pages || null;

  return pageCount;
};

export const getBookDetailData = async (workId) => {
  const cached = bookDetailCache.get(workId);

  if (cached && Date.now() - cached.timestamp < BOOK_DETAIL_CACHE_TTL) {
    return cached.value;
  }

  const [work, pageCount] = await Promise.all([
    getWork(workId),
    getPageCount(workId),
  ]);

  const authors = await Promise.all(
    (work.authors || []).map(async (author) => {
      const authorId = author.author?.key?.replace("/authors/", "");

      if (!authorId) {
        return null;
      }

      const authorData = await getAuthor(authorId);

      return authorData.name || null;
    })
  );

  const book = mapWorkBook(
    work,
    authors.filter(Boolean),
    pageCount
  );

  bookDetailCache.set(workId, {
    value: book,
    timestamp: Date.now(),
  });

  return book;
};
