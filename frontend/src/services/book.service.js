import api from "./api.js";

export const searchBooks = async (params,config = {}) => {
  const response = await api.get("/books/search", {
   ...config, params
  });

  return response.data;
};

export const getBookDetail = async (workId) => {
  const response = await api.get(`/books/${workId}`);

  return response.data;
};
