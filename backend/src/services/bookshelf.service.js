import prisma from "../utils/prisma.js";
import { getBookDetailData } from "../services/openlibrary.service.js";
import AppError from "../utils/AppError.js";
import { mapBookshelfBook } from "../utils/book.mapper.js";

const BOOK_NOT_FOUND = "Không tìm thấy sách";
const BOOK_ALREADY_EXISTS = "Sách đã tồn tại trong giá sách";

// Prisma error codes
const UNIQUE_CONSTRAINT_FAILED = "P2002";
const RECORD_NOT_FOUND = "P2025";

export const getAllBooks = async (status) => {
  // One GROUP BY query instead of four COUNT queries, run in parallel with the list query
  const [books, statusCounts] = await Promise.all([
    prisma.bookshelf.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    }),
    prisma.bookshelf.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countOf = (bookStatus) =>
    statusCounts.find((group) => group.status === bookStatus)?._count._all || 0;

  const wantToRead = countOf("WANT_TO_READ");
  const reading = countOf("READING");
  const completed = countOf("COMPLETED");

  return {
    books: books.map(mapBookshelfBook),
    statistics: {
      total: wantToRead + reading + completed,
      wantToRead,
      reading,
      completed,
    },
  };
};

export const getBookById = async (id) => {
  const book = await prisma.bookshelf.findUnique({ where: { id } });

  if (!book) {
    throw new AppError(BOOK_NOT_FOUND, 404);
  }

  return mapBookshelfBook(book);
};

export const createBookShelf = async ({ workId, status }) => {
  // Check early to avoid calling Open Library for a book that is already on the shelf
  const existingBook = await prisma.bookshelf.findUnique({ where: { workId } });

  if (existingBook) {
    throw new AppError(BOOK_ALREADY_EXISTS, 409);
  }

  // Reuses the detail cache, so adding right after viewing the detail page is instant
  const { title, authors, coverId, description, pageCount, publishedYear, subjects } =
    await getBookDetailData(workId);

  const isCompleted = status === "COMPLETED";
  const now = new Date();

  try {
    const book = await prisma.bookshelf.create({
      data: {
        workId,
        title,
        author: authors.length > 0 ? authors.join(", ") : null,
        coverId,
        description,
        pageCount,
        publishedYear,
        subjects,
        status,
        currentPage: isCompleted && pageCount ? pageCount : 0,
        startedAt: status === "READING" || isCompleted ? now : null,
        finishedAt: isCompleted ? now : null,
      },
    });

    return mapBookshelfBook(book);
  } catch (error) {
    // Two requests can pass the check above at the same time; the unique index on work_id stops the second one
    if (error.code === UNIQUE_CONSTRAINT_FAILED) {
      throw new AppError(BOOK_ALREADY_EXISTS, 409);
    }

    throw error;
  }
};

export const updateBookShelf = async (id, data) => {
  const book = await prisma.bookshelf.findUnique({ where: { id } });

  if (!book) {
    throw new AppError(BOOK_NOT_FOUND, 404);
  }

  const currentPage = data.currentPage ?? book.currentPage;
  let status = data.status ?? book.status;

  if (book.pageCount !== null && currentPage > book.pageCount) {
    throw new AppError(`Số trang hiện tại không được vượt quá ${book.pageCount}`, 400);
  }

  let startedAt = book.startedAt;
  let finishedAt = book.finishedAt;

  // First transition to READING
  if (status === "READING" && !startedAt) {
    startedAt = new Date();
  }

  // Reaching the last page completes the book
  if (book.pageCount !== null && currentPage === book.pageCount) {
    status = "COMPLETED";
  }

  // Transition to COMPLETED
  if (status === "COMPLETED" && book.status !== "COMPLETED") {
    finishedAt = new Date();
    startedAt ??= finishedAt;
  }

  // If the book leaves COMPLETED, the old finishedAt no longer represents the current reading session
  if (status !== "COMPLETED") {
    finishedAt = null;
  }

  const updatedBook = await prisma.bookshelf.update({
    where: { id },
    data: {
      currentPage,
      status,
      // Prisma skips fields that are undefined, so rating/note only change when they are sent
      rating: data.rating,
      note: data.note,
      startedAt,
      finishedAt,
    },
  });

  return mapBookshelfBook(updatedBook);
};

export const deleteBookShelf = async (id) => {
  try {
    await prisma.bookshelf.delete({ where: { id } });
  } catch (error) {
    if (error.code === RECORD_NOT_FOUND) {
      throw new AppError(BOOK_NOT_FOUND, 404);
    }

    throw error;
  }
};
