import express from "express";
import cors from "cors";
import 'dotenv/config';
import errorHandler from "./middelwares/error.middleware.js";

import bookshelfRoutes from "./routes/bookshelf.routes.js";
import bookRoutes from "./routes/book.routes.js";
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Reading Tracker API is running"
  });
});

app.use("/api/bookshelf", bookshelfRoutes);
app.use("/api/books", bookRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});