export const mapSearchBook = (book) => {
  return {
    workId: book.key?.replace("/works/", "") || null,

    title: book.title || "Unknown title",

    author: book.author_name?.[0] || null,

    coverId: book.cover_i || null,

    publishedYear: book.first_publish_year || null
  };
};

export const extractDescription = (description) => {
  if (!description) {
    return null;
  }

  if (typeof description === "string") {
    return description;
  }

  if (typeof description === "object" && description.value) {
    return description.value;
  }

  return null;
};

export const mapWorkBook = (work,authors) => {
  return {
    workId: work.key?.replace("/works/", "") || null,

    title: work.title || "Unknown title",

    description: extractDescription(work.description),

    authors,

    subjects: work.subjects || [],

    publishedYear: work.first_publish_date
      ? Number(work.first_publish_date.match(/\d{4}/)?.[0]) || null
      : null,

    coverId: work.covers?.[0] || null,
  };
};

