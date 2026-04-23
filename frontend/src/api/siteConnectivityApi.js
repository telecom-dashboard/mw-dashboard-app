import api from "./axios";

export const getSiteConnectivity = async ({
  search = "",
  category = "",
  page = 1,
  pageSize = 10,
  sortBy = "id",
  sortOrder = "desc",
} = {}) => {
  const { data } = await api.get("/site-connectivity", {
    params: {
      search,
      category,
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
  });
  return data;
};

export const getSiteConnectivitySummary = async (category = "") => {
  const { data } = await api.get("/site-connectivity/summary", {
    params: { category },
  });
  return data;
};

export const getSiteConnectivityCategoryOptions = async () => {
  const { data } = await api.get("/site-connectivity/category-options");
  return data;
};

export const createSiteConnectivity = async (payload) => {
  const { data } = await api.post("/site-connectivity", payload);
  return data;
};

export const updateSiteConnectivity = async (id, payload) => {
  const { data } = await api.put(`/site-connectivity/${id}`, payload);
  return data;
};

export const deleteSiteConnectivity = async (id) => {
  const { data } = await api.delete(`/site-connectivity/${id}`);
  return data;
};

export const bulkDeleteSiteConnectivity = async (ids) => {
  const { data } = await api.post("/site-connectivity/bulk-delete", { ids });
  return data;
};

export const deleteAllSiteConnectivity = async () => {
  const { data } = await api.delete("/site-connectivity");
  return data;
};

export const importSiteConnectivityExcel = async (file) => {
  const name = file?.name?.toLowerCase() || "";
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    throw new Error("Only Excel files (.xlsx, .xls) are allowed.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/site-connectivity/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

export const exportSiteConnectivityExcel = async (search = "", category = "") => {
  const response = await api.get("/site-connectivity/export/excel", {
    params: { search, category },
    responseType: "blob",
  });

  return response.data;
};

export const exportSelectedSiteConnectivityExcel = async (ids = []) => {
  const response = await api.post(
    "/site-connectivity/export/selected-excel",
    { ids },
    { responseType: "blob" }
  );

  return response.data;
};

export const downloadSiteConnectivityTemplateExcel = async () => {
  const response = await api.get("/site-connectivity/export/template", {
    responseType: "blob",
  });

  return response.data;
};