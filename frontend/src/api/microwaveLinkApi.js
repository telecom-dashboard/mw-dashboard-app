import api from "./axios";

export const getMicrowaveLinks = async (params = {}) => {
  const response = await api.get("/microwave-links", {
    params,
  });
  return response.data;
};

export const createMicrowaveLink = async (payload) => {
  const response = await api.post("/microwave-links/", payload);
  return response.data;
};

export const updateMicrowaveLink = async (id, payload) => {
  const response = await api.put(`/microwave-links/${id}`, payload);
  return response.data;
};