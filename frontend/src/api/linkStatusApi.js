import api from "./axios";

export const getMicrowaveLinkStatus = async (params = {}) => {
  const response = await api.get("/microwave-links/status/view", {
    params,
  });
  return response.data;
};

export const getMicrowaveLinkStatusSummary = async () => {
  const response = await api.get("/microwave-links/status/summary");
  return response.data;
};