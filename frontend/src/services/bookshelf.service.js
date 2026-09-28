import api from "./api.js";

export const getBookshelf = async (status) => {
  const response = await api.get("/bookshelf", {
    params: status ? { status } : {},
  });

  return response.data;
};

export const getBookshelfBook = async (id) => {
  const response = await api.get(`/bookshelf/${id}`);

  return response.data;
};

export const addToBookshelf = async (data) => {
  const response = await api.post("/bookshelf", data);

  return response.data;
};

export const updateBookshelfBook = async (id, data) => {
  const response = await api.put(`/bookshelf/${id}`, data);

  return response.data;
};

export const deleteBookshelfBook = async (id) => {
  const response = await api.delete(`/bookshelf/${id}`);

  return response.data;
};