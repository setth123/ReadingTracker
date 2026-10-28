import AppError from "../utils/AppError.js";
import { createCache } from "../utils/cache.js";
import { mapWorkBook } from "../utils/book.mapper.js";

const OPEN_LIBRARY_URL = process.env.OPEN_LIBRARY_URL || "https://openlibrary.org";

const REQUEST_TIMEOUT_MS = 8000;

const searchCache = createCache({ ttl: 5 * 60 * 1000, maxSize: 200 });
const bookDetailCache = createCache({ ttl: 5 * 60 * 1000, maxSize: 200 });

// Turns every Open Library failure (timeout, network, bad status) into an AppError
const fetchOpenLibrary = async (url, notFoundMessage = "Not found in Open Library") => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

    if (response.status === 404) {
      throw new AppError(notFoundMessage, 404);
    }

    if (!response.ok) {
      throw new AppError("Failed to fetch data from Open Library", 502);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.name === "TimeoutError") {
      throw new AppError("Open Library took too long to respond", 504);
    }

    throw new AppError("Could not connect to Open Library", 502);
  }
};

export const searchPaginatedBooks = (keyword, page = 1, limit = 20) => {
  const cacheKey = `${keyword.toLowerCase()}:${page}:${limit}`;

  return searchCache(cacheKey, () => {
    const url = new URL(`${OPEN_LIBRARY_URL}/search.json`);

    url.searchParams.set("q", keyword);
    url.searchParams.set("page", page);
    url.searchParams.set("limit", limit);
    url.searchParams.set("fields", "numFound,key,title,author_name,cover_i,first_publish_year");

    return fetchOpenLibrary(url);
  });
};

const getWork = (workId) =>
  fetchOpenLibrary(`${OPEN_LIBRARY_URL}/works/${workId}.json`, "Book not found in Open Library");

// One search request gives the same cover as the search page, a page count and author names,
// which is much faster than fetching editions.json plus every author separately
const getWorkSearchData = async (workId) => {
  const url = new URL(`${OPEN_LIBRARY_URL}/search.json`);

  url.searchParams.set("q", `key:/works/${workId}`);
  url.searchParams.set("fields", "cover_i,number_of_pages_median,author_name,first_publish_year");
  url.searchParams.set("limit", 1);

  const data = await fetchOpenLibrary(url);
  const doc = data.docs?.[0] || {};

  return {
    coverId: doc.cover_i || null,
    pageCount: doc.number_of_pages_median || null,
    authors: doc.author_name || [],
    publishedYear: doc.first_publish_year || null,
  };
};

export const getBookDetailData = (workId) =>
  bookDetailCache(workId, async () => {
    const [work, searchData] = await Promise.all([
      getWork(workId),
      getWorkSearchData(workId),
    ]);

    return mapWorkBook(work, searchData);
  });
