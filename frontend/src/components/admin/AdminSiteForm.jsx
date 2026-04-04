import { useEffect, useState } from "react";

const emptyForm = {
  site_code: "",
  site_name: "",
  region: "",
  vendor: "",
  model: "",
  latitude: "",
  longitude: "",
  management_ip: "",
  web_protocol: "http",
  status: "",
  site_class: "",
  is_active: true,
};

function AdminSiteForm({ initialData, onSubmit, onCancel, submitLabel = "Save" }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        site_code: initialData.site_code ?? "",
        site_name: initialData.site_name ?? "",
        region: initialData.region ?? "",
        vendor: initialData.vendor ?? "",
        model: initialData.model ?? "",
        latitude: initialData.latitude ?? "",
        longitude: initialData.longitude ?? "",
        management_ip: initialData.management_ip ?? "",
        web_protocol: initialData.web_protocol ?? "http",
        status: initialData.status ?? "",
        site_class: initialData.site_class ?? "",
        is_active: initialData.is_active ?? true,
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

    const payload = {
      ...form,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={gridStyle}>
        <div>
          <label>Site Code</label>
          <input name="site_code" value={form.site_code} onChange={handleChange} style={inputStyle} required />
        </div>

        <div>
          <label>Site Name</label>
          <input name="site_name" value={form.site_name} onChange={handleChange} style={inputStyle} required />
        </div>

        <div>
          <label>Region</label>
          <input name="region" value={form.region} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label>Vendor</label>
          <input name="vendor" value={form.vendor} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label>Model</label>
          <input name="model" value={form.model} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label>Latitude</label>
          <input name="latitude" value={form.latitude} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label>Longitude</label>
          <input name="longitude" value={form.longitude} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label>Management IP</label>
          <input name="management_ip" value={form.management_ip} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label>Web Protocol</label>
          <select name="web_protocol" value={form.web_protocol} onChange={handleChange} style={inputStyle}>
            <option value="http">http</option>
            <option value="https">https</option>
          </select>
        </div>

        <div>
          <label>Status</label>
          <input name="status" value={form.status} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label>Site Class</label>
          <input name="site_class" value={form.site_class} onChange={handleChange} style={inputStyle} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
          <input
            id="is_active"
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          <label htmlFor="is_active">Active</label>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button type="submit">{submitLabel}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

const formStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
  gap: 16,
};

const inputStyle = {
  width: "100%",
  padding: 10,
  marginTop: 6,
  boxSizing: "border-box",
};

export default AdminSiteForm;