import api from "./axios";

export const pingSite = async (siteId) => {
  const response = await api.post(`/tools/ping/site/${siteId}`);
  return response.data;
};

export const getPingHistory = async (siteId) => {
  const response = await api.get(`/tools/ping/history/${siteId}`);
  return response.data;
};