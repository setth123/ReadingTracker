import prisma from "../utils/prisma.js";
import {getPageCount,getWork, getAuthor} from "../services/openlibrary.service.js";
import AppError from "../utils/AppError.js";
import { mapBookshelfBook } from "../utils/book.mapper.js";

export const getAllBooks = async (status=undefined) => {

  const where = status? { status }: {};
  const books=await prisma.bookshelf.findMany({
    where,
    orderBy: {
      createdAt: "desc"
    }
  });
  const [total,wantToRead, reading, completed] = await Promise.all([
    prisma.bookshelf.count(),
    prisma.bookshelf.count({
      where: {
        status: "WANT_TO_READ"
      }
    }),
    prisma.bookshelf.count({
      where: {
        status: "READING"
      }
    }),
    prisma.bookshelf.count({
      where: {
        status: "COMPLETED"
      }
    })    
  ]);
  return { books: books.map(mapBookshelfBook),statistics: {total, wantToRead, reading, completed } };
};

export const getBookById = async (id) => {
  return prisma.bookshelf.findUnique({
    where: {
      id
    }
  });
};

export const createBookShelf = async ({ workId, status }) => {
  const existingBook = await prisma.bookshelf.findUnique({
    where: {
      workId
    }
  });

  if (existingBook) {
    throw new AppError(
      "Sách đã tồn tại trong giá sách",
      409
    );
  }

  const work = await getWork(workId);

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
          const author = await getAuthor(authorId);

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
  

  const isCompleted = status === "COMPLETED";

  const currentPage = isCompleted && pageCount
    ? pageCount
    : 0;

  const now = new Date();
  try{
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
  }
  catch(error){
    if(error.code="P2002"){
      throw new AppError(
        "Sách đã tồn tại trong giá sách",
        409
      );
    }
    throw error;
  }
};

export const updateBookShelf = async (id, data) => {
  const book = await prisma.bookshelf.findUnique({
    where: { id: Number(id) },
  });

  if (!book) {
    throw new AppError("Không tìm thấy sách", 404);
  }

  let currentPage = data.currentPage ?? book.currentPage;
  let status = data.status ?? book.status;

  if (book.pageCount !== null && currentPage > book.pageCount) {
    throw new AppError(
      `Số trang hiện tại không được vượt quá 300. (${book.pageCount})`,
      400
    );
  }

  let startedAt = book.startedAt;
  let finishedAt = book.finishedAt;

  // First transition to READING
  if (status === "READING" && book.status !== "READING" && !book.startedAt) {
    startedAt = new Date();
  }

  // React to last page -> COMPLETED
  if (book.pageCount !== null && currentPage === book.pageCount) {
    status = "COMPLETED";
  }

  // Transition to COMPLETED
  if (status === "COMPLETED" && book.status !== "COMPLETED") {
    finishedAt = new Date();

    if (!startedAt) {
      startedAt = new Date();
    }
  }

  // If the book leaves COMPLETED, the old finishedAt should no longer represent the current reading session
  if(status !== "COMPLETED" && book.status === "COMPLETED")finishedAt=null;

  return prisma.bookshelf.update({
    where: { id: Number(id) },
    data: {
      currentPage,
      status,
      rating: data.rating !== undefined
        ? data.rating
        : book.rating,
      note: data.note !== undefined
        ? data.note
        : book.note,
      startedAt,
      finishedAt,
    },
  });
};

export const deleteBookShelf = async (id) => {
  const book = await prisma.bookshelf.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!book) {
    throw new AppError("Không tìm thấy sách", 404);
  }

  await prisma.bookshelf.delete({
    where: {
      id: Number(id),
    },
  });
};