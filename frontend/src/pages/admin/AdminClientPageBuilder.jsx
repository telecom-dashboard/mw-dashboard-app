import { useEffect, useMemo, useState } from "react";
import {
  createClientPageApi,
  deleteClientPageApi,
  getHybridPagesApi,
  getClientPageTableMetadataApi,
  getClientPageApi,
  getClientPagesApi,
  updateHybridPageAccessApi,
  updateClientPageApi,
} from "../../api/clientPageApi";

const emptyConfig = {
  name: "",
  slug: "",
  title: "",
  source_table: "microwave_link_budgets",
  is_published: false,
  layout: {
    type: "table",
    columns: [],
    filters: [],
    joins: [],
    default_sort: { key: "link_id", direction: "asc" },
    search: {
      enabled: true,
      placeholder: "Search link ID, site, vendor, region...",
    },
    pagination: {
      enabled: true,
      page_size: 10,
    },
  },
};

function AdminClientPageBuilder() {
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [form, setForm] = useState(emptyConfig);
  const [metadata, setMetadata] = useState({ tables: [], blocked_tables: [] });
  const [hybridPages, setHybridPages] = useState([]);
  const [hybridPagesLoading, setHybridPagesLoading] = useState(true);
  const [hybridPagesError, setHybridPagesError] = useState("");
  const [updatingHybridKey, setUpdatingHybridKey] = useState("");
  const [pendingHybridChange, setPendingHybridChange] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [draggedField, setDraggedField] = useState(null);
  const [draggedFilterKey, setDraggedFilterKey] = useState("");

  const fetchPages = async () => {
    const data = await getClientPagesApi();
    setPages(data || []);
  };

  const fetchHybridPages = async () => {
    try {
      setHybridPagesLoading(true);
      setHybridPagesError("");
      const data = await getHybridPagesApi();
      setHybridPages(data || []);
    } catch (error) {
      setHybridPages([]);
      setHybridPagesError(
        error?.response?.data?.detail || "Failed to load hybrid page access"
      );
    } finally {
      setHybridPagesLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    fetchHybridPages();
    getClientPageTableMetadataApi().then((data) => {
      setMetadata(data || { tables: [], blocked_tables: [] });
    });
  }, []);

  const selectedColumns = form.layout.columns.map((c) => c.key);
  const tables = metadata.tables || [];
  const sourceTable = tables.find((table) => table.name === form.source_table);
  const joinedTableNames = form.layout.joins.map((join) => join.table);
  const selectableTables = tables.filter(
    (table) => table.name === form.source_table || joinedTableNames.includes(table.name)
  );

  const availableFieldGroups = useMemo(
    () =>
      selectableTables
        .map((table) => ({
          ...table,
          fields: table.columns.filter((field) => !selectedColumns.includes(field.key)),
        }))
        .filter((table) => table.fields.length > 0),
    [selectableTables, selectedColumns]
  );

  const loadPage = async (pageId) => {
    const data = await getClientPageApi(pageId);
    setSelectedPageId(data.id);
    setForm({
      name: data.name,
      slug: data.slug,
      title: data.title,
      source_table: data.source_table || "microwave_link_budgets",
      is_published: data.is_published,
      layout: {
        ...emptyConfig.layout,
        ...data.layout,
        joins: data.layout?.joins || [],
      },
    });
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLayoutChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [key]: value,
      },
    }));
  };

  const handleSourceTableChange = (sourceTableName) => {
    setForm((prev) => ({
      ...prev,
      source_table: sourceTableName,
      layout: {
        ...prev.layout,
        columns: [],
        filters: [],
        joins: [],
        default_sort: { key: "id", direction: "asc" },
      },
    }));
  };

  const buildColumnFromField = (field) => ({
    key: field.key,
    label: field.label,
    table: field.table,
    column: field.name,
    visible: true,
    width: 140,
  });

  const buildFilterFromColumn = (column) => ({
    key: column.key,
    label: column.label,
    table: column.table,
    column: column.column,
    type: "select",
    enabled: true,
  });

  const addColumn = (field) => {
    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        columns: [...prev.layout.columns, buildColumnFromField(field)],
      },
    }));
  };

  const addFieldAsFilter = (field) => {
    setForm((prev) => {
      const existingColumn = prev.layout.columns.find((col) => col.key === field.key);
      const column = existingColumn || buildColumnFromField(field);
      const hasFilter = prev.layout.filters.some((filter) => filter.key === column.key);

      return {
        ...prev,
        layout: {
          ...prev.layout,
          columns: existingColumn
            ? prev.layout.columns
            : [...prev.layout.columns, column],
          filters: hasFilter
            ? prev.layout.filters
            : [...prev.layout.filters, buildFilterFromColumn(column)],
        },
      };
    });
  };

  const removeColumn = (key) => {
    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        columns: prev.layout.columns.filter((col) => col.key !== key),
        filters: prev.layout.filters.filter((f) => f.key !== key),
      },
    }));
  };

  const moveColumn = (index, direction) => {
    const newColumns = [...form.layout.columns];
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= newColumns.length) return;

    [newColumns[index], newColumns[targetIndex]] = [
      newColumns[targetIndex],
      newColumns[index],
    ];

    handleLayoutChange("columns", newColumns);
  };

  const toggleColumnVisible = (key) => {
    handleLayoutChange(
      "columns",
      form.layout.columns.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const updateColumnLabel = (key, label) => {
    handleLayoutChange(
      "columns",
      form.layout.columns.map((col) =>
        col.key === key ? { ...col, label } : col
      )
    );
  };

  const sortFiltersByColumns = (filters, columns) => {
    const columnOrder = new Map(columns.map((column, index) => [column.key, index]));

    return [...filters].sort(
      (left, right) =>
        (columnOrder.get(left.key) ?? Number.MAX_SAFE_INTEGER) -
        (columnOrder.get(right.key) ?? Number.MAX_SAFE_INTEGER)
    );
  };

  const moveColumnByKey = (fromKey, toKey) => {
    if (!fromKey || fromKey === toKey) return;

    setForm((prev) => {
      const fromIndex = prev.layout.columns.findIndex((col) => col.key === fromKey);
      const toIndex = prev.layout.columns.findIndex((col) => col.key === toKey);

      if (fromIndex < 0 || toIndex < 0) return prev;

      const nextColumns = [...prev.layout.columns];
      const [movedColumn] = nextColumns.splice(fromIndex, 1);
      nextColumns.splice(toIndex, 0, movedColumn);

      return {
        ...prev,
        layout: {
          ...prev.layout,
          columns: nextColumns,
          filters: sortFiltersByColumns(prev.layout.filters, nextColumns),
        },
      };
    });
  };

  const toggleFilter = (column) => {
    const exists = form.layout.filters.find((f) => f.key === column.key);

    if (exists) {
      handleLayoutChange(
        "filters",
        form.layout.filters.filter((f) => f.key !== column.key)
      );
    } else {
      handleLayoutChange("filters", [
        ...form.layout.filters,
        buildFilterFromColumn(column),
      ]);
    }
  };

  const handleFilterDrop = () => {
    if (draggedField) {
      addFieldAsFilter(draggedField);
    }

    setDraggedField(null);
    setDraggedFilterKey("");
  };

  const getPreferredJoinColumn = (columns) =>
    columns.find((column) => column.name === "link_id") ||
    columns.find((column) => column.is_primary) ||
    columns[0];

  const addJoin = () => {
    const targetTable = getJoinableTables(-1)[0];
    const sourceLinkColumn = getPreferredJoinColumn(sourceTable?.columns || []);
    const targetLinkColumn = getPreferredJoinColumn(targetTable?.columns || []);

    if (!targetTable || !sourceLinkColumn || !targetLinkColumn) return;

    handleLayoutChange("joins", [
      ...form.layout.joins,
      {
        table: targetTable.name,
        type: "left",
        left: sourceLinkColumn.key,
        right: targetLinkColumn.key,
      },
    ]);
  };

  const updateJoin = (index, key, value) => {
    if (key === "table") {
      const previousTable = form.layout.joins[index]?.table;
      const nextTableColumns = getColumnsForTable(value);
      const nextRightColumn = getPreferredJoinColumn(nextTableColumns);

      setForm((prev) => ({
        ...prev,
        layout: {
          ...prev.layout,
          joins: normalizeJoinLeftColumns(prev.layout.joins.map((join, joinIndex) =>
            joinIndex === index
              ? { ...join, table: value, right: nextRightColumn?.key || join.right }
              : join
          )),
          columns: previousTable
            ? prev.layout.columns.filter((col) => col.table !== previousTable)
            : prev.layout.columns,
          filters: previousTable
            ? prev.layout.filters.filter((filter) => filter.table !== previousTable)
            : prev.layout.filters,
        },
      }));
      return;
    }

    handleLayoutChange(
      "joins",
      form.layout.joins.map((join, joinIndex) =>
        joinIndex === index ? { ...join, [key]: value } : join
      )
    );
  };

  const removeJoin = (index) => {
    const removedTable = form.layout.joins[index]?.table;

    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        joins: normalizeJoinLeftColumns(
          prev.layout.joins.filter((_, joinIndex) => joinIndex !== index)
        ),
        columns: removedTable
          ? prev.layout.columns.filter((col) => col.table !== removedTable)
          : prev.layout.columns,
        filters: removedTable
          ? prev.layout.filters.filter((filter) => filter.table !== removedTable)
          : prev.layout.filters,
      },
    }));
  };

  const savePage = async () => {
    try {
      setSaving(true);
      setMessage("");

      if (selectedPageId) {
        await updateClientPageApi(selectedPageId, form);
        setMessage("Client page updated successfully");
      } else {
        await createClientPageApi(form);
        setMessage("Client page created successfully");
      }

      await fetchPages();
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Failed to save client page");
    } finally {
      setSaving(false);
    }
  };

  const createNew = () => {
    setSelectedPageId(null);
    setForm(emptyConfig);
    setMessage("");
  };

  const deletePage = async () => {
    if (!selectedPageId) return;

    try {
      await deleteClientPageApi(selectedPageId);
      setMessage("Client page deleted successfully");
      setSelectedPageId(null);
      setForm(emptyConfig);
      await fetchPages();
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Failed to delete client page");
    }
  };

  const toggleHybridPage = async (pageKey, isEnabled) => {
    try {
      setUpdatingHybridKey(pageKey);
      const updated = await updateHybridPageAccessApi(pageKey, {
        is_enabled: isEnabled,
      });
      setHybridPages((prev) =>
        prev.map((page) => (page.key === pageKey ? updated : page))
      );
      setMessage(
        `${updated.title} ${updated.is_enabled ? "enabled" : "disabled"} for client access`
      );
    } catch (error) {
      setMessage(
        error?.response?.data?.detail || "Failed to update shared page access"
      );
    } finally {
      setUpdatingHybridKey("");
    }
  };

  const requestHybridPageToggle = (page, isEnabled) => {
    setPendingHybridChange({
      key: page.key,
      title: page.title,
      isEnabled,
    });
  };

  const confirmHybridPageToggle = async () => {
    if (!pendingHybridChange) return;

    const { key, isEnabled } = pendingHybridChange;
    setPendingHybridChange(null);
    await toggleHybridPage(key, isEnabled);
  };

  const cancelHybridPageToggle = () => {
    setPendingHybridChange(null);
  };

  const getColumnsForTable = (tableName) =>
    tables.find((table) => table.name === tableName)?.columns || [];

  const getTableLabel = (tableName) =>
    tables.find((table) => table.name === tableName)?.label || tableName;

  const formatColumnLabel = (column) =>
    `${getTableLabel(column.table)} / ${column.label}`;

  const getLeftJoinColumns = (joinIndex) => {
    const availableTableNames = [
      form.source_table,
      ...form.layout.joins.slice(0, joinIndex).map((join) => join.table),
    ];

    return availableTableNames.flatMap((tableName) => getColumnsForTable(tableName));
  };

  const normalizeJoinLeftColumns = (joins) =>
    joins.map((join, joinIndex) => {
      const availableTableNames = [
        form.source_table,
        ...joins.slice(0, joinIndex).map((item) => item.table),
      ];
      const availableColumns = availableTableNames.flatMap((tableName) =>
        getColumnsForTable(tableName)
      );
      const currentLeftColumn = availableColumns.find(
        (column) => column.key === join.left
      );
      const fallbackLeftColumn = getPreferredJoinColumn(availableColumns);

      return {
        ...join,
        left: currentLeftColumn?.key || fallbackLeftColumn?.key || join.left,
      };
    });

  const getJoinableTables = (currentJoinIndex) => {
    const otherJoinedTables = form.layout.joins
      .filter((_, index) => index !== currentJoinIndex)
      .map((join) => join.table);

    return tables.filter(
      (table) =>
        table.name !== form.source_table && !otherJoinedTables.includes(table.name)
    );
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Client Page Builder</h1>
            <p className="text-xs text-slate-500">
              Configure client-facing table views using microwave link budget data.
            </p>
          </div>

          <button
            onClick={createNew}
            className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
          >
            New Page
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-sm font-bold text-slate-900">Hybrid Page Access</h2>
          <p className="text-xs text-slate-500">
            Publish approved admin tools into the client workspace without exposing the admin console.
          </p>
        </div>

        {hybridPagesLoading ? (
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
            Loading hybrid page access...
          </div>
        ) : hybridPagesError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {hybridPagesError}
          </div>
        ) : hybridPages.length === 0 ? (
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
            No hybrid pages are registered.
          </div>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {hybridPages.map((page) => (
              <div
                key={page.key}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800">
                    {page.title}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {page.description}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-slate-400">
                    Client path: {page.client_path}
                  </div>
                </div>

                <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={page.is_enabled}
                    disabled={updatingHybridKey === page.key}
                    onChange={(e) => requestHybridPageToggle(page, e.target.checked)}
                  />
                  Client access
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingHybridChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-900">Confirm client access</h2>
            <p className="mt-2 text-center text-base font-medium text-slate-700">
              {pendingHybridChange.isEnabled
                ? "Are you sure to show this page to client"
                : "Are you sure not to show this page to client"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={confirmHybridPageToggle}
                className="rounded-md border border-sky-600 bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={cancelHybridPageToggle}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {message}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Saved Pages</h2>

          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {pages.length === 0 ? (
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                No client pages yet.
              </div>
            ) : (
              pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => loadPage(page.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs transition ${
                    selectedPageId === page.id
                      ? "border-sky-400 bg-sky-50 text-sky-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{page.title}</div>
                  <div className="mt-1 text-[11px] text-slate-500">/{page.slug}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Page Settings</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Slug">
                <input
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className={inputClass}
                  placeholder="client-microwave-view"
                />
              </Field>

              <Field label="Title" className="md:col-span-2">
                <input
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Source table">
                <select
                  value={form.source_table}
                  onChange={(e) => handleSourceTableChange(e.target.value)}
                  className={inputClass}
                >
                  {tables.map((table) => (
                    <option key={table.name} value={table.name}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Default page size">
                <select
                  value={form.layout.pagination.page_size}
                  onChange={(e) =>
                    handleLayoutChange("pagination", {
                      ...form.layout.pagination,
                      page_size: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </Field>

              <Field label="Published">
                <label className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => handleChange("is_published", e.target.checked)}
                  />
                  Publish for client
                </label>
              </Field>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Multi-Table Joins</h2>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {form.layout.joins.length} joined
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Add multiple related operational tables before selecting their columns.
                </p>
              </div>

              <button
                type="button"
                onClick={addJoin}
                disabled={getJoinableTables(-1).length === 0}
                className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Table Join
              </button>
            </div>

            {form.layout.joins.length === 0 ? (
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                No joins configured. Add a table join to combine columns from multiple tables.
              </div>
            ) : (
              <div className="space-y-3">
                {form.layout.joins.map((join, index) => {
                  const joinableTables = getJoinableTables(index);
                  const joinTableColumns = getColumnsForTable(join.table);
                  const leftColumns = getLeftJoinColumns(index);

                  return (
                    <div
                      key={`${join.table}-${index}`}
                      className="rounded-md border border-slate-200 p-3"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            Join {index + 1}: {getTableLabel(join.table)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Match an existing table column to a column on the joined table.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeJoin(index)}
                          className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_130px_minmax(0,1fr)_minmax(0,1fr)]">
                        <Field label="Join table">
                          <select
                            value={join.table}
                            onChange={(e) => updateJoin(index, "table", e.target.value)}
                            className={inputClass}
                          >
                            {joinableTables.map((table) => (
                              <option key={table.name} value={table.name}>
                                {table.label}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Join type">
                          <select
                            value={join.type || "left"}
                            onChange={(e) => updateJoin(index, "type", e.target.value)}
                            className={inputClass}
                          >
                            <option value="left">Left join</option>
                            <option value="inner">Inner join</option>
                          </select>
                        </Field>

                        <Field label="Existing table column">
                          <select
                            value={join.left}
                            onChange={(e) => updateJoin(index, "left", e.target.value)}
                            className={inputClass}
                          >
                            {leftColumns.map((column) => (
                              <option key={column.key} value={column.key}>
                                {formatColumnLabel(column)}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Joined table column">
                          <select
                            value={join.right}
                            onChange={(e) => updateJoin(index, "right", e.target.value)}
                            className={inputClass}
                          >
                            {joinTableColumns.map((column) => (
                              <option key={column.key} value={column.key}>
                                {formatColumnLabel(column)}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900">Available Fields</h2>
                <p className="text-xs text-slate-500">
                  Choose columns from the source table and configured joins.
                </p>
              </div>

              {availableFieldGroups.length === 0 ? (
                <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                  All available fields are already selected.
                </div>
              ) : (
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {availableFieldGroups.map((table) => (
                    <div
                      key={table.name}
                      className="overflow-hidden rounded-md border border-slate-200"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-slate-800">
                            {table.label}
                          </div>
                          <div className="truncate text-[11px] text-slate-500">
                            {table.name}
                          </div>
                        </div>

                        <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {table.fields.length} fields
                        </span>
                      </div>

                      <div className="grid gap-2 p-2 sm:grid-cols-2">
                        {table.fields.map((field) => (
                          <button
                            key={field.key}
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              setDraggedField(field);
                              event.dataTransfer.effectAllowed = "copy";
                            }}
                            onDragEnd={() => setDraggedField(null)}
                            onClick={() => addColumn(field)}
                            className="min-w-0 cursor-grab rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-sky-200 hover:bg-sky-50 active:cursor-grabbing"
                          >
                            <div className="truncate text-xs font-semibold text-slate-700">
                              {field.label}
                            </div>
                            <div className="mt-0.5 truncate text-[10px] text-slate-400">
                              {field.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900">Enabled Filters</h2>
                <p className="text-xs text-slate-500">
                  Drag fields here to enable filters, then drag columns to reorder.
                </p>
              </div>

              <div
                onDragOver={(event) => {
                  if (draggedField) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFilterDrop();
                }}
                className={`min-h-[132px] rounded-md border border-dashed p-2 transition ${
                  draggedField
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                {form.layout.columns.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-md bg-white px-3 text-center text-xs text-slate-500">
                    Drag available fields here or click fields to add columns first.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {form.layout.columns.map((col) => {
                      const active = form.layout.filters.some((f) => f.key === col.key);
                      return (
                        <div
                          key={col.key}
                          draggable
                          onDragStart={(event) => {
                            setDraggedFilterKey(col.key);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(event) => {
                            if (draggedFilterKey || draggedField) {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = draggedField ? "copy" : "move";
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (draggedFilterKey) {
                              moveColumnByKey(draggedFilterKey, col.key);
                            } else {
                              handleFilterDrop();
                            }
                          }}
                          onDragEnd={() => setDraggedFilterKey("")}
                          className={`flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs ${
                            active
                              ? "cursor-grab border-sky-300 bg-sky-50 text-sky-700 active:cursor-grabbing"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleFilter(col)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="block truncate font-semibold">
                              {col.label}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                              {active ? "Enabled" : "Click to enable"}
                            </span>
                          </button>

                          {active && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeColumn(col.key);
                              }}
                              className="shrink-0 rounded-md border border-red-300 bg-white px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-slate-900">Selected Columns</h2>

            {form.layout.columns.length === 0 ? (
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                No columns selected yet.
              </div>
            ) : (
              <div className="space-y-2">
                {form.layout.columns.map((col, index) => (
                  <div
                    key={col.key}
                    className="grid gap-2 rounded-md border border-slate-200 p-3 xl:grid-cols-[160px_minmax(0,1fr)_auto]"
                  >
                    <div className="text-xs font-semibold text-slate-700">{col.key}</div>

                    <input
                      value={col.label}
                      onChange={(e) => updateColumnLabel(col.key, e.target.value)}
                      className={inputClass}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => moveColumn(index, -1)}
                        className={tinyBtnClass}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveColumn(index, 1)}
                        className={tinyBtnClass}
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => toggleColumnVisible(col.key)}
                        className={tinyBtnClass}
                      >
                        {col.visible ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => removeColumn(col.key)}
                        className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-slate-900">Preview Config</h2>
            <pre className="max-h-[360px] overflow-auto rounded-md bg-slate-900 p-3 text-[11px] text-slate-100">
              {JSON.stringify(form, null, 2)}
            </pre>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {selectedPageId && (
              <button
                onClick={deletePage}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Delete Page
              </button>
            )}

            <button
              onClick={savePage}
              disabled={saving}
              className="rounded-md border border-sky-600 bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : selectedPageId ? "Update Page" : "Create Page"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-sky-500";

const tinyBtnClass =
  "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50";

export default AdminClientPageBuilder;
