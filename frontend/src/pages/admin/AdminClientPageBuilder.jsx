import { useEffect, useMemo, useState } from "react";
import {
  createClientPageApi,
  deleteClientPageApi,
  getClientPageApi,
  getClientPagesApi,
  updateClientPageApi,
} from "../../api/clientPageApi";
import { clientPageFields } from "../../constants/clientPageFields";

const emptyConfig = {
  name: "",
  slug: "",
  title: "",
  is_published: false,
  layout: {
    type: "table",
    columns: [],
    filters: [],
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchPages = async () => {
    const data = await getClientPagesApi();
    setPages(data || []);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const selectedColumns = form.layout.columns.map((c) => c.key);

  const availableFields = useMemo(
    () => clientPageFields.filter((field) => !selectedColumns.includes(field.key)),
    [selectedColumns]
  );

  const loadPage = async (pageId) => {
    const data = await getClientPageApi(pageId);
    setSelectedPageId(data.id);
    setForm({
      name: data.name,
      slug: data.slug,
      title: data.title,
      is_published: data.is_published,
      layout: data.layout,
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

  const addColumn = (field) => {
    setForm((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        columns: [
          ...prev.layout.columns,
          {
            key: field.key,
            label: field.label,
            visible: true,
            width: 140,
          },
        ],
      },
    }));
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

  const toggleFilter = (field) => {
    const exists = form.layout.filters.find((f) => f.key === field.key);

    if (exists) {
      handleLayoutChange(
        "filters",
        form.layout.filters.filter((f) => f.key !== field.key)
      );
    } else {
      handleLayoutChange("filters", [
        ...form.layout.filters,
        { key: field.key, label: field.label, type: "select", enabled: true },
      ]);
    }
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

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-slate-900">Available Fields</h2>

              <div className="grid gap-2 sm:grid-cols-2">
                {availableFields.map((field) => (
                  <button
                    key={field.key}
                    onClick={() => addColumn(field)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {field.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-slate-900">Enabled Filters</h2>

              <div className="grid gap-2 sm:grid-cols-2">
                {form.layout.columns.map((col) => {
                  const active = form.layout.filters.some((f) => f.key === col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() =>
                        toggleFilter({
                          key: col.key,
                          label: col.label,
                        })
                      }
                      className={`rounded-md border px-3 py-2 text-left text-xs ${
                        active
                          ? "border-sky-300 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {col.label}
                    </button>
                  );
                })}
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