import AppError from "../utils/AppError.js";

const ERROR_MESSAGES = {
  query: "Invalid query parameters",
  body: "Invalid request body",
  params: "Invalid route parameters",
};

// Parsed data goes to req.validated[source] because req.query is read-only in Express 5
const validate = (source, schema) => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    return next(new AppError(ERROR_MESSAGES[source], 400, result.error.issues));
  }

  req.validated = { ...req.validated, [source]: result.data };
  next();
};

export const validateQuery = (schema) => validate("query", schema);
export const validateBody = (schema) => validate("body", schema);
export const validateParams = (schema) => validate("params", schema);
