import api from "./axios";

export const getUsers = async ({
  search = "",
  role = "",
  sortBy = "created_at",
  sortOrder = "desc",
} = {}) => {
  const { data } = await api.get("/users", {
    params: {
      search,
      role,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
  });
  return Array.isArray(data) ? data : [];
};

export const createUser = async (payload) => {
  const { data } = await api.post("/users", payload);
  return data;
};

export const updateUser = async (userId, payload) => {
  const { data } = await api.put(`/users/${userId}`, payload);
  return data;
};

export const deleteUser = async (userId) => {
  await api.delete(`/users/${userId}`);
};
