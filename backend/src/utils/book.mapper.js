const buildCoverUrl = (coverId) =>
  coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;

const extractWorkId = (key) => key?.replace("/works/", "") || null;

export const mapSearchBook = (book) => ({
  workId: extractWorkId(book.key),
  title: book.title || "Unknown title",
  author: book.author_name?.[0] || null,
  coverId: book.cover_i || null,
  coverUrl: buildCoverUrl(book.cover_i),
  publishedYear: book.first_publish_year || null,
});

const extractDescription = (description) => {
  let text = typeof description === "string" ? description : description?.value;

  if (!text) {
    return null;
  }

  // Remove markdown reference definitions
  text = text.replace(/^\s*\[\d+\]:\s*\S+\s*$/gm, "");

  // Convert [Source][1] -> Source
  text = text.replace(/\[([^\]]+)\]\[\d+\]/g, "$1");

  // Remove excessive whitespace
  return text.replace(/\s+/g, " ").trim();
};

export const mapWorkBook = (work, { authors = [], pageCount = null, coverId = null, publishedYear = null } = {}) => {
  // Prefer search data so detail shows the same cover and year as the search page
  const finalCoverId = coverId || work.covers?.find((id) => id > 0) || null;
  const workYear = Number(work.first_publish_date?.match(/\d{4}/)?.[0]) || null;

  return {
    workId: extractWorkId(work.key),
    title: work.title || "Unknown title",
    description: extractDescription(work.description),
    authors,
    pageCount,
    subjects: work.subjects || [],
    publishedYear: publishedYear || workYear,
    coverId: finalCoverId,
    coverUrl: buildCoverUrl(finalCoverId),
  };
};

export const mapBookshelfBook = (book) => ({
  ...book,
  coverUrl: buildCoverUrl(book.coverId),
});
