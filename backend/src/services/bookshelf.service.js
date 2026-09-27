import prisma from "../utils/prisma.js";
import {getPageCount} from "../utils/openLibrary.js";
import AppError from "../utils/appError.js";

export const getAllBooks = async () => {
  return prisma.bookshelf.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const getBookById = async (id) => {
  return prisma.bookshelf.findUnique({
    where: {
      id
    }
  });
};

export const createBook = async ({ workId, status }) => {
  const existingBook = await prisma.bookshelf.findUnique({
    where: {
      workId
    }
  });

  if (existingBook) {
    throw new AppError(
      "Book already exists in bookshelf",
      409
    );
  }

  const work = await openLibraryService.getWork(workId);

  const pageCount = await getPageCount(workId);

  const title = work.title || "Unknown title";

  const authorKeys = (work.authors || [])
    .map((item) => item.author?.key)
    .filter(Boolean);

  let authors = [];

  if (authorKeys.length > 0) {
    authors = await Promise.all(
      authorKeys.map(async (key) => {
        const authorId = key.replace("/authors/", "");

        try {
          const author =
            await openLibraryService.getAuthor(authorId);

          return author.name || "Unknown author";
        } catch {
          return "Unknown author";
        }
      })
    );
  }

  const author = authors.length > 0
    ? authors.join(", ")
    : null;

  const description =
    typeof work.description === "string"
      ? work.description
      : work.description?.value || null;

  const publishedYear = work.first_publish_date
    ? Number(
        work.first_publish_date.match(/\d{4}/)?.[0]
      ) || null
    : null;

  const book = await prisma.bookshelf.create({
    data: {
      workId,
      title,
      author,
      coverId: work.covers?.[0] || null,
      description,
      pageCount,
      publishedYear,
      subjects: work.subjects || [],
      status,
      currentPage,
      startedAt: status === "READING" || isCompleted
        ? now
        : null,

      finishedAt: isCompleted
        ? now
        : null
    }
  });

  return book;
};