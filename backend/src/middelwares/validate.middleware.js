import AppError from "../utils/AppError.js";

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return next(
        new AppError(
          "Invalid query parameters",
          400,
          result.error.issues
        )
      );
    }

    req.validateQuery=result.data;
    next();
  };
};

export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(
        new AppError(
          "Invalid request body",
          400,
          result.error.issues
        )
      );
    }

    req.validatedBody = result.data;

    next();
  };
};