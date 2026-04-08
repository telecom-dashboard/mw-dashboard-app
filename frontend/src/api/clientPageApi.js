import api from "./axios";

export const getClientPagesApi = async () => {
  const response = await api.get("/client-pages");
  return response.data;
};

export const getClientPageApi = async (pageId) => {
  const response = await api.get(`/client-pages/${pageId}`);
  return response.data;
};

export const createClientPageApi = async (payload) => {
  const response = await api.post("/client-pages", payload);
  return response.data;
};

export const updateClientPageApi = async (pageId, payload) => {
  const response = await api.put(`/client-pages/${pageId}`, payload);
  return response.data;
};

export const deleteClientPageApi = async (pageId) => {
  const response = await api.delete(`/client-pages/${pageId}`);
  return response.data;
};

export const getPublicClientPageApi = async (slug) => {
  const response = await api.get(`/client-pages/view/${slug}`);
  return response.data;
};

export const getPublicClientPageDataApi = async (slug, params = {}) => {
  const response = await api.get(`/client-pages/view/${slug}/data`, { params });
  return response.data;
};

export const getPublishedClientPagesForNavApi = async () => {
  const response = await api.get("/client-pages/published/nav");
  return response.data;
};