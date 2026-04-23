import api from "./axios";

export const getAuditLogs = async ({
  search = "",
  action = "",
  tableName = "",
  changedFrom = "",
  changedTo = "",
  page = 1,
  pageSize = 10,
  sortBy = "changed_at",
  sortOrder = "desc",
} = {}) => {
  const { data } = await api.get("/audit-logs", {
    params: {
      search,
      action,
      table_name: tableName,
      changed_from: changedFrom,
      changed_to: changedTo,
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
  });
  return data;
};

export const getAuditLogSummary = async () => {
  const { data } = await api.get("/audit-logs/summary");
  return data;
};

export const deleteAuditLog = async (logId) => {
  const { data } = await api.delete(`/audit-logs/${logId}`);
  return data;
};

export const bulkDeleteAuditLogs = async (ids) => {
  const { data } = await api.post("/audit-logs/bulk-delete", { ids });
  return data;
};

export const exportAuditLogsExcel = async ({
  search = "",
  action = "",
  tableName = "",
  changedFrom = "",
  changedTo = "",
} = {}) => {
  const response = await api.get("/audit-logs/export/excel", {
    params: {
      search,
      action,
      table_name: tableName,
      changed_from: changedFrom,
      changed_to: changedTo,
    },
    responseType: "blob",
  });
  return response.data;
};

export const exportSelectedAuditLogsExcel = async (ids = []) => {
  const response = await api.post(
    "/audit-logs/export/selected-excel",
    { ids },
    { responseType: "blob" }
  );
  return response.data;
};
