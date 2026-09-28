const OPEN_LIBRARY_URL = process.env.OPEN_LIBRARY_URL || "https://openlibrary.org";

export const searchPaginatedBooks = async (keyword, page = 1, limit = 20) => {
  const url = new URL(`${OPEN_LIBRARY_URL}/search.json`);

  url.searchParams.set("q", keyword);
  url.searchParams.set("page", page);
  url.searchParams.set("limit", limit);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch books from Open Library");
  }

  const data = await response.json();

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
    throw new Error("Failed to fetch book editions from Open Library");
  }

  return response.json();
};

export const getAuthor = async (authorId) => {
  const url = `${OPEN_LIBRARY_URL}/authors/${authorId}.json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch author from Open Library");
  }

  return response.json();
};

export const getPageCount = async (workId) => {
  const data = await getEditions(workId);

  const edition = data.entries?.find(
    (item) =>
      Number.isInteger(item.number_of_pages) &&
      item.number_of_pages > 0
  );

  return edition?.number_of_pages || null;
};