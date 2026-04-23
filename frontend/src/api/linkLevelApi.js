import api from "./axios";

export const linkLevelQueryKeys = {
  flow: ["link-level", "flow"],
  view: (linkId) => ["link-level", "view", linkId],
};

export const getLinkLevelFlow = async (params = {}) => {
  const response = await api.get("/link-level", {
    params: {
      search: params.search || "",
    },
  });
  return response.data;
};

export const fetchLinkLevelFlow = async () => {
  const response = await getLinkLevelFlow({});
  return Array.isArray(response?.items) ? response.items : [];
};

export const getLinkLevelView = async (linkId) => {
  const response = await api.get(`/link-level/view/${encodeURIComponent(linkId)}`);
  return response.data;
};

export const pingNodeIp = async (ip) => {
  if (!ip) {
    throw new Error("IP address is required");
  }

  try {
    const response = await api.get("/tools/ping", {
      params: { host: ip },
    });
    return response.data;
  } catch {
    const response = await api.get("/tools/ping", {
      params: { ip },
    });
    return response.data;
  }
};
