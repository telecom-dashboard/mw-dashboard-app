import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../../api/userApi";
import StandardDataTable from "../../components/common/StandardDataTable";
import {
  StandardAdminForm,
  StandardFormActions,
  StandardFormField,
  StandardFormGrid,
  StandardFormSection,
  StandardFormToggleField,
} from "../../components/common/StandardAdminForm";
import { standardFormInputClass } from "../../components/common/StandardAdminFormStyles";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "client", label: "Client" },
];

const tableColumns = [
  { key: "id", label: "ID" },
  { key: "username", label: "Username" },
  { key: "email", label: "Email" },
  {
    key: "role",
    label: "Role",
    filterType: "select",
  },
  {
    key: "is_active",
    label: "Status",
    filterType: "select",
  },
  {
    key: "created_at",
    label: "Created",
    filterable: false,
  },
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    filterable: false,
    headerClassName: "min-w-[160px]",
  },
];

const inputClass =
  "h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-500";

const smallButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition";

function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toastTimerRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchUsers = async ({
    searchValue = search,
    roleValue = roleFilter,
    sortValue = sortConfig,
  } = {}) => {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers({
        search: searchValue,
        role: roleValue === "all" ? "" : roleValue,
        sortBy: sortValue.key,
        sortOrder: sortValue.direction,
      });

      setRows(data);
      setSelectedIds((prev) => prev.filter((id) => data.some((row) => row.id === id)));
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to load users";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, sortConfig]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, sortConfig]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const admins = rows.filter((row) => row.role === "admin").length;
    const clients = rows.filter((row) => row.role === "client").length;
    const active = rows.filter((row) => row.is_active).length;
    const inactive = total - active;

    return [
      {
        label: "Total Users",
        value: total,
        sub: "Loaded from database",
        icon: Users,
        iconWrap: "bg-sky-100 text-sky-700",
      },
      {
        label: "Admins",
        value: admins,
        sub: "Privileged accounts",
        icon: Shield,
        iconWrap: "bg-violet-100 text-violet-700",
      },
      {
        label: "Clients",
        value: clients,
        sub: "Client user accounts",
        icon: User,
        iconWrap: "bg-cyan-100 text-cyan-700",
      },
      {
        label: "Active",
        value: active,
        sub: "Can access the app",
        icon: CheckCircle2,
        iconWrap: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Inactive",
        value: inactive,
        sub: "Access disabled",
        icon: AlertTriangle,
        iconWrap: "bg-amber-100 text-amber-700",
      },
    ];
  }, [rows]);

  const selectedUsers = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds]
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, rows]);

  const isModalOpen = showCreateForm || Boolean(editingUser);

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleSort = (key) => {
    setPage(1);
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (visibleRowIds) => {
    const allSelected =
      visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedIds.includes(id));

    setSelectedIds(allSelected ? [] : visibleRowIds);
  };

  const handleSubmitCreate = async (payload) => {
    try {
      setSaving(true);
      setError("");
      await createUser(payload);
      setShowCreateForm(false);
      await fetchUsers();
      showToast("User created successfully");
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to create user";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSubmitUpdate = async (payload) => {
    if (!editingUser) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await updateUser(editingUser.id, payload);
      setEditingUser(null);
      await fetchUsers();
      showToast("User updated successfully");
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to update user";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await deleteUser(deleteTarget.id);

      setDeleteTarget(null);
      setEditingUser((prev) => (prev?.id === deleteTarget.id ? null : prev));
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      await fetchUsers();
      showToast("User deleted successfully");
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to delete user";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (user) => {
    setDeleteTarget(user);
  };

  const handleEditSelected = () => {
    if (selectedUsers.length !== 1) {
      return;
    }

    setEditingUser(selectedUsers[0]);
  };

  const handleDeleteSelected = () => {
    if (selectedUsers.length !== 1) {
      return;
    }

    openDeleteModal(selectedUsers[0]);
  };

  const closeModal = () => {
    setShowCreateForm(false);
    setEditingUser(null);
  };

  const renderCell = (row, key) => {
    if (key === "role") {
      return (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${
            row.role === "admin"
              ? "bg-violet-100 text-violet-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {row.role}
        </span>
      );
    }

    if (key === "is_active") {
      return (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
            row.is_active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      );
    }

    if (key === "created_at") {
      return formatDateTime(row.created_at);
    }

    if (key === "actions") {
      const isSelf = currentUser?.id === row.id;

      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setEditingUser(row);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Pencil size={11} />
            Edit
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openDeleteModal(row);
            }}
            disabled={isSelf}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={11} />
            Delete
          </button>
        </div>
      );
    }

    return row[key];
  };

  return (
    <div className="min-h-[calc(100vh-1rem)] w-full max-w-full overflow-hidden bg-slate-50 p-2 md:p-3">
      <div className="mx-auto w-full max-w-full space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">User Management</h1>
            <p className="text-[11px] text-slate-500">
              Create, update, and remove application users directly from the database.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        {stat.label}
                      </div>
                      <div className="mt-0.5 text-base font-bold leading-tight text-slate-900">
                        {stat.value}
                      </div>
                      <div className="text-[10px] text-slate-400">{stat.sub}</div>
                    </div>

                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${stat.iconWrap}`}
                    >
                      <Icon size={13} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-full rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative w-full max-w-[260px]">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search username or email"
                    className={`w-full pl-9 pr-9 ${inputClass}`}
                  />

                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className={`${inputClass} min-w-[140px]`}
                >
                  <option value="all">All Roles</option>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                <button
                  type="button"
                  onClick={() => fetchUsers()}
                  className={`${smallButtonClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                >
                  <Users size={12} />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setShowCreateForm(true);
                  }}
                  className={`${smallButtonClass} border-sky-600 bg-sky-600 text-white hover:bg-sky-700`}
                >
                  <Plus size={12} />
                  Add User
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                Selected: <span className="font-semibold text-slate-900">{selectedIds.length}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleEditSelected}
                  disabled={selectedUsers.length !== 1}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-blue-300 bg-white px-2.5 text-[11px] font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil size={12} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedUsers.length !== 1 || selectedUsers[0]?.id === currentUser?.id}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-red-300 bg-white px-2.5 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {saving && (
            <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Saving user changes...
            </div>
          )}

          {loading && (
            <div className="border-b border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              Loading users...
            </div>
          )}

          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Database Users</h2>
                <p className="text-xs text-slate-500">
                  Column filters are available directly inside the table header.
                </p>
              </div>

              <div className="text-xs text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-900">
                  {rows.length === 0 ? 0 : Math.min(currentPage * pageSize, rows.length)}
                </span>
                {" of "}
                <span className="font-semibold text-slate-900">{rows.length}</span>
                {" "}user{rows.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto bg-white px-2 py-2">
            <StandardDataTable
              columns={tableColumns}
              rows={paginatedRows}
              selectedIds={selectedIds}
              onToggleSelectRow={handleToggleSelectRow}
              onToggleSelectAll={handleToggleSelectAll}
              sortConfig={sortConfig}
              onSort={handleSort}
              renderCell={renderCell}
              emptyTitle="No users found"
              emptyDescription="Create a new user or adjust the current filters."
            />
          </div>

          <div className="border-t border-slate-200 bg-white px-3 py-2.5">
            <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPage(1);
                    setPageSize(Number(event.target.value));
                  }}
                  className={inputClass}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5">
                  Page <span className="font-semibold text-slate-900">{currentPage}</span> /{" "}
                  <span className="font-semibold text-slate-900">{totalPages}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed right-3 top-3 z-[70]">
          <div
            className={`rounded-lg px-3 py-2 text-xs font-semibold shadow-lg ${
              toast.type === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {showCreateForm ? "Create User" : "Edit User"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {showCreateForm
                    ? "Add a new application account."
                    : "Update account details, role, password, or access state."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-4 py-4">
              <UserForm
                key={showCreateForm ? "create-user" : editingUser?.id || "edit-user"}
                initialData={showCreateForm ? null : editingUser}
                onSubmit={showCreateForm ? handleSubmitCreate : handleSubmitUpdate}
                onCancel={closeModal}
                currentUserId={currentUser?.id}
              />
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />

          <div className="relative z-10 w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-base font-bold text-slate-900">Delete User</h3>
              <p className="mt-1 text-xs text-slate-500">
                This permanently removes the selected user from the database.
              </p>
            </div>

            <div className="space-y-3 px-4 py-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  User
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {deleteTarget.username}
                </div>
                <div className="mt-1 text-xs text-slate-500">{deleteTarget.email}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserForm({ initialData, onSubmit, onCancel, currentUserId }) {
  const isEditMode = Boolean(initialData);
  const [formState, setFormState] = useState(() => ({
    username: initialData?.username || "",
    email: initialData?.email || "",
    role: initialData?.role || "client",
    password: "",
    is_active: initialData?.is_active ?? true,
  }));
  const [submitError, setSubmitError] = useState("");

  const isSelf = initialData?.id === currentUserId;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const payload = {
      username: formState.username.trim(),
      email: formState.email.trim(),
      role: formState.role,
      is_active: formState.is_active,
      password: formState.password.trim(),
    };

    if (!payload.username || !payload.email || !payload.role) {
      setSubmitError("Username, email, and role are required.");
      return;
    }

    if (!isEditMode && !payload.password) {
      setSubmitError("Password is required when creating a user.");
      return;
    }

    if (isEditMode && !payload.password) {
      delete payload.password;
    }

    try {
      await onSubmit(payload);
    } catch {
      // The parent page shows API errors; the form only handles local validation.
    }
  };

  return (
    <StandardAdminForm onSubmit={handleSubmit}>
      <StandardFormSection
        title="Account Details"
        description="Set the identity, access level, and optional password update for this account."
      >
        <StandardFormGrid>
          <StandardFormField label="Username" required>
            <input
              name="username"
              value={formState.username}
              onChange={handleChange}
              className={standardFormInputClass}
              placeholder="Enter username"
            />
          </StandardFormField>

          <StandardFormField label="Email" required>
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              className={standardFormInputClass}
              placeholder="Enter email"
            />
          </StandardFormField>

          <StandardFormField label="Role" required>
            <select
              name="role"
              value={formState.role}
              onChange={handleChange}
              className={standardFormInputClass}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </StandardFormField>

          <StandardFormField label={isEditMode ? "New Password" : "Password"} required={!isEditMode}>
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleChange}
              className={standardFormInputClass}
              placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
            />
          </StandardFormField>

          <div className="md:col-span-2 xl:col-span-2">
            <StandardFormToggleField
              label="Account Status"
              description={
                isSelf
                  ? "Your own account must stay active while you are signed in."
                  : "Inactive users remain in the database but cannot log in."
              }
              name="is_active"
              checked={formState.is_active}
              onChange={handleChange}
              disabled={isSelf}
            />
          </div>
        </StandardFormGrid>

        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}
      </StandardFormSection>

      <StandardFormActions
        onCancel={onCancel}
        submitLabel={isEditMode ? "Update User" : "Create User"}
      />
    </StandardAdminForm>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

export default AdminUsersPage;
