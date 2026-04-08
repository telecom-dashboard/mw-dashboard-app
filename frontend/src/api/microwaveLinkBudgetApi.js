import api from "./axios";

export const getMicrowaveLinkBudgets = async (params = {}) => {
  const response = await api.get("/microwave-link-budgets", { params });
  return response.data;
};

export const getMicrowaveLinkBudgetSummary = async () => {
  const response = await api.get("/microwave-link-budgets/summary");
  return response.data;
};

export const createMicrowaveLinkBudget = async (payload) => {
  const response = await api.post("/microwave-link-budgets", payload);
  return response.data;
};

export const updateMicrowaveLinkBudget = async (id, payload) => {
  const response = await api.put(`/microwave-link-budgets/${id}`, payload);
  return response.data;
};

export const deleteMicrowaveLinkBudget = async (id) => {
  const response = await api.delete(`/microwave-link-budgets/${id}`);
  return response.data;
};

export const deleteAllMicrowaveLinkBudgets = async () => {
  const response = await api.delete("/microwave-link-budgets/delete-all");
  return response.data;
};

export const bulkDeleteMicrowaveLinkBudgets = async (ids) => {
  const response = await api.delete("/microwave-link-budgets", {
    params: { ids },
    paramsSerializer: {
      indexes: null,
    },
  });
  return response.data;
};

export const exportMicrowaveLinkBudgetsExcel = async (params = {}) => {
  const response = await api.get("/microwave-link-budgets/export/excel", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export const exportSelectedMicrowaveLinkBudgetsExcel = async (ids) => {
  const response = await api.get("/microwave-link-budgets/export/excel-selected", {
    params: { ids },
    paramsSerializer: {
      indexes: null,
    },
    responseType: "blob",
  });
  return response.data;
};

export const downloadMicrowaveLinkBudgetTemplateExcel = async () => {
  const response = await api.get("/microwave-link-budgets/template/excel", {
    responseType: "blob",
  });
  return response.data;
};

export const importMicrowaveLinkBudgetsExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/microwave-link-budgets/import/excel", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};