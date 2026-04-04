import { useEffect, useState } from "react";

const emptyForm = {
  ne_id: "",
  fe_id: "",
  link_id: "",
  management_ip: "",
  web_protocol: "http",
  link_class: "",
  is_active: true,
  vendor: "",
  model: "",
  type: "",
  status: "",
};

function AdminMicrowaveLinkForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        ne_id: initialData.ne_id ?? "",
        fe_id: initialData.fe_id ?? "",
        link_id: initialData.link_id ?? "",
        management_ip: initialData.management_ip ?? "",
        web_protocol: initialData.web_protocol ?? "http",
        link_class: initialData.link_class ?? "",
        is_active: initialData.is_active ?? true,
        vendor: initialData.vendor ?? "",
        model: initialData.model ?? "",
        type: initialData.type ?? "",
        status: initialData.status ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={gridStyle}>
        <FormField label="NE ID">
          <input
            name="ne_id"
            value={form.ne_id}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter NE ID"
          />
        </FormField>

        <FormField label="FE ID">
          <input
            name="fe_id"
            value={form.fe_id}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter FE ID"
          />
        </FormField>

        <FormField label="Link ID" required>
          <input
            name="link_id"
            value={form.link_id}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter Link ID"
            required
          />
        </FormField>

        <FormField label="Management IP">
          <input
            name="management_ip"
            value={form.management_ip}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter management IP"
          />
        </FormField>

        <FormField label="Web Protocol">
          <select
            name="web_protocol"
            value={form.web_protocol}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="http">http</option>
            <option value="https">https</option>
          </select>
        </FormField>

        <FormField label="Link Class">
          <input
            name="link_class"
            value={form.link_class}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter link class"
          />
        </FormField>

        <FormField label="Vendor">
          <input
            name="vendor"
            value={form.vendor}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter vendor"
          />
        </FormField>

        <FormField label="Model">
          <input
            name="model"
            value={form.model}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter model"
          />
        </FormField>

        <FormField label="Type">
          <input
            name="type"
            value={form.type}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter type"
          />
        </FormField>

        <FormField label="Status">
          <input
            name="status"
            value={form.status}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter status"
          />
        </FormField>

        <div style={checkboxWrap}>
          <label style={checkboxLabel}>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <span>Active</span>
          </label>
        </div>
      </div>

      <div style={buttonRow}>
        <button type="submit" style={primaryBtn}>
          {submitLabel}
        </button>

        <button type="button" onClick={onCancel} style={secondaryBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>
        {label} {required && <span style={requiredStyle}>*</span>}
      </label>
      {children}
    </div>
  );
}

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const fieldWrap = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const requiredStyle = {
  color: "#dc2626",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
  background: "#fff",
  outline: "none",
};

const checkboxWrap = {
  display: "flex",
  alignItems: "flex-end",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  color: "#111827",
  cursor: "pointer",
};

const buttonRow = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const secondaryBtn = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

export default AdminMicrowaveLinkForm;