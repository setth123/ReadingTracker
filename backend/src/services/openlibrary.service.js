const OPEN_LIBRARY_URL = process.env.OPEN_LIBRARY_URL || "https://openlibrary.org";
import AppError from "../utils/AppError.js";
import {mapWorkBook} from "../utils/book.mapper.js";


const bookDetailCache = new Map();

const BOOK_DETAIL_CACHE_TTL = 5 * 60 * 1000;

const searchCache = new Map();

const SEARCH_CACHE_TTL = 5 * 60 * 1000;

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
  url.searchParams.set(
  "fields",
  "numFound,key,title,author_name,cover_i,first_publish_year"
);

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

// One search request gives the same cover as the search page, a page count and author names,
// which is much faster than fetching editions.json plus every author separately
export const getWorkSearchData = async (workId) => {
  const url = new URL(`${OPEN_LIBRARY_URL}/search.json`);

  url.searchParams.set("q", `key:/works/${workId}`);
  url.searchParams.set("fields", "cover_i,number_of_pages_median,author_name");
  url.searchParams.set("limit", 1);

  const response = await fetch(url);

  if (!response.ok) {
    throw new AppError("Failed to fetch book from Open Library", 502);
  }

  const data = await response.json();
  const doc = data.docs?.[0] || {};

  return {
    coverId: doc.cover_i || null,
    pageCount: doc.number_of_pages_median || null,
    authors: doc.author_name || [],
  };
};

export const getBookDetailData = async (workId) => {
  const cached = bookDetailCache.get(workId);

  if (cached && Date.now() - cached.timestamp < BOOK_DETAIL_CACHE_TTL) {
    return cached.value;
  }

  const [work, { pageCount, coverId, authors }] = await Promise.all([
    getWork(workId),
    getWorkSearchData(workId),
  ]);

  const book = mapWorkBook(work, authors, pageCount, coverId);

  bookDetailCache.set(workId, {
    value: book,
    timestamp: Date.now(),
  });

  return book;
};
