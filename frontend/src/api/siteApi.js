import api from "./axios";

export const getSites = async (search = "") => {
  const response = await api.get("/sites", {
    params: { search },
  });
  return response.data;
};

export const getSiteById = async (id) => {
  const response = await api.get(`/sites/${id}`);
  return response.data;
};

export const createSite = async (payload) => {
  const response = await api.post("/sites/", payload);
  return response.data;
};

export const updateSite = async (id, payload) => {
  const response = await api.put(`/sites/${id}`, payload);
  return response.data;
};