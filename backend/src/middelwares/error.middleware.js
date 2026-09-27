import { errorResponse } from "../utils/response.js";

const errorHandler = (err, req, res, next) => {
  console.error(err);

  return errorResponse(
    res,
    err.message || "Internal server error",
    err.statusCode || 500,
    err.errors || null
  );
};
export default errorHandler;
