export const mapSearchBook = (book) => {
  return {
    workId: book.key?.replace("/works/", "") || null,

    title: book.title || "Unknown title",

    author: book.author_name?.[0] || null,

    coverId: book.cover_i || null,

    coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,

    publishedYear: book.first_publish_year || null
  };
};

export const extractDescription = (description) => {
  if (!description) {
    return null;
  }

  let text =
    typeof description === "string"
      ? description
      : description.value;

  if (!text) {
    return null;
  }

  // Remove markdown reference definitions
  text = text.replace(
    /^\s*\[\d+\]:\s*\S+\s*$/gm,
    ""
  );

  // Convert [Source][1] -> Source
  text = text.replace(
    /\[([^\]]+)\]\[\d+\]/g,
    "$1"
  );

  // Remove excessive whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
};

export const getWorkCoverId = (work) => work.covers?.find((id) => id > 0) || null;

export const mapWorkBook = (work,authors,pageCount=null,searchCoverId=null) => {
  // Prefer the search cover so detail shows the same image as the search page
  const coverId = searchCoverId || getWorkCoverId(work);

  return {
    workId: work.key?.replace("/works/", "") || null,

    title: work.title || "Unknown title",

    description: extractDescription(work.description),

    authors,

    pageCount,

    subjects: work.subjects || [],

    publishedYear: work.first_publish_date
      ? Number(work.first_publish_date.match(/\d{4}/)?.[0]) || null
      : null,

    coverId,
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,

  };
};

export const mapBookshelfBook = (book) => ({
  ...book,
  coverUrl: book.coverId
    ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`
    : null,
});

