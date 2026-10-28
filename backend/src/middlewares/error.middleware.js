import AppError from "../utils/AppError.js";
import { errorResponse } from "../utils/response.js";

const errorHandler = (err, req, res, next) => {
  console.error(err);

  // AppError is thrown on purpose and Express marks safe 4xx errors (e.g. invalid JSON) with `expose`.
  // Anything else (Prisma, bugs...) may contain internal details, so the client only gets a generic message.
  const isSafe = err instanceof AppError || err.expose;

  return errorResponse(
    res,
    isSafe ? err.message : "Internal server error",
    err.statusCode || 500,
    isSafe ? err.errors || null : null
  );
};

export default errorHandler;
