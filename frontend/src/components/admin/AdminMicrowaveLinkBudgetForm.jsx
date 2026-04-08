import { useEffect, useState } from "react";

const emptyForm = {
  vendor: "",
  site_name_s1: "",
  site_name_s2: "",
  state_province: "",
  township: "",
  zone: "",
  region: "",
  ring_id_span_name: "",
  media_type: "",
  link_id: "",
  revise: "",
  site_name_s1_ip: "",
  site_name_s2_ip: "",
  site_name_s1_port: "",
  site_name_s2_port: "",
  link_class: "",
  model: "",
  status: "",
  active: true,
  protocol: "",
  comment: "",
  status_1: "",
  type: "",
  bandwidth: "",
  planning_capacity: "",

  latitude_s1: "",
  latitude_s2: "",
  longitude_s1: "",
  longitude_s2: "",
  true_azimuth_s1: "",
  true_azimuth_s2: "",
  tower_height_s1: "",
  tower_height_s2: "",

  tr_antenna_model_s1: "",
  tr_antenna_model_s2: "",
  tr_antenna_diameter_s1: "",
  tr_antenna_diameter_s2: "",
  tr_antenna_height_s1: "",
  tr_antenna_height_s2: "",

  frequency_mhz: "",
  polarization: "",
  path_length_km: "",
  radio_model_s1: "",
  radio_model_s2: "",

  design_frequency_1_s1: "",
  design_frequency_1_s2: "",
  design_frequency_2_s1: "",
  design_frequency_2_s2: "",
  design_frequency_3_s1: "",
  design_frequency_3_s2: "",
  design_frequency_4_s1: "",
  design_frequency_4_s2: "",

  tx_power_dbm_s1: "",
  tx_power_dbm_s2: "",
  rx_threshold_level_dbm_s1: "",
  rx_threshold_level_dbm_s2: "",

  radio_file_name_s1: "",
  radio_file_name_s2: "",

  receive_signal_dbm_s1: "",
  receive_signal_dbm_s2: "",
  thermal_fade_margin_db_s1: "",
  thermal_fade_margin_db_s2: "",
  effective_fade_margin_db_s1: "",
  effective_fade_margin_db_s2: "",

  annual_multipath_availability_s1: "",
  annual_multipath_availability_s2: "",
  annual_rain_availability_s1: "",
  annual_rain_availability_s2: "",

  atpc_1_s1: "",
  atpc_1_s2: "",
};

const numberFields = new Set([
  "latitude_s1",
  "latitude_s2",
  "longitude_s1",
  "longitude_s2",
  "true_azimuth_s1",
  "true_azimuth_s2",
  "tower_height_s1",
  "tower_height_s2",
  "tr_antenna_diameter_s1",
  "tr_antenna_diameter_s2",
  "tr_antenna_height_s1",
  "tr_antenna_height_s2",
  "frequency_mhz",
  "path_length_km",
  "design_frequency_1_s1",
  "design_frequency_1_s2",
  "design_frequency_2_s1",
  "design_frequency_2_s2",
  "design_frequency_3_s1",
  "design_frequency_3_s2",
  "design_frequency_4_s1",
  "design_frequency_4_s2",
  "tx_power_dbm_s1",
  "tx_power_dbm_s2",
  "rx_threshold_level_dbm_s1",
  "rx_threshold_level_dbm_s2",
  "receive_signal_dbm_s1",
  "receive_signal_dbm_s2",
  "thermal_fade_margin_db_s1",
  "thermal_fade_margin_db_s2",
  "effective_fade_margin_db_s1",
  "effective_fade_margin_db_s2",
  "annual_multipath_availability_s1",
  "annual_multipath_availability_s2",
  "annual_rain_availability_s1",
  "annual_rain_availability_s2",
]);

function AdminMicrowaveLinkBudgetForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(
      initialData
        ? {
            ...emptyForm,
            ...initialData,
            active: initialData.active ?? true,
          }
        : emptyForm
    );
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const normalizePayload = () => {
    const payload = { ...form };

    Object.keys(payload).forEach((key) => {
      if (numberFields.has(key)) {
        payload[key] =
          payload[key] === "" || payload[key] === null
            ? null
            : Number(payload[key]);
      } else if (typeof payload[key] === "string") {
        payload[key] = payload[key].trim();
      }
    });

    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(normalizePayload());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionTitle
        title="General Information"
        description="Maintain the microwave link budget record."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FormField label="Vendor">
          <input name="vendor" value={form.vendor} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Site name S1">
          <input name="site_name_s1" value={form.site_name_s1} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Site name S2">
          <input name="site_name_s2" value={form.site_name_s2} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="State / Province">
          <input name="state_province" value={form.state_province} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Township">
          <input name="township" value={form.township} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Zone">
          <input name="zone" value={form.zone} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Region">
          <input name="region" value={form.region} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Ring ID / Span Name">
          <input name="ring_id_span_name" value={form.ring_id_span_name} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Media Type">
          <input name="media_type" value={form.media_type} onChange={handleChange} className={inputClass} placeholder="Fiber / Microwave" />
        </FormField>

        <FormField label="Link ID" required>
          <input name="link_id" value={form.link_id} onChange={handleChange} className={inputClass} required />
        </FormField>

        <FormField label="Revise">
          <input name="revise" value={form.revise} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Class">
          <input name="link_class" value={form.link_class} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Model">
          <input name="model" value={form.model} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Status">
          <input name="status" value={form.status} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Protocol">
          <input name="protocol" value={form.protocol} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Status.1">
          <input name="status_1" value={form.status_1} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Type">
          <input name="type" value={form.type} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Bandwidth">
          <input name="bandwidth" value={form.bandwidth} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Planning Capacity">
          <input name="planning_capacity" value={form.planning_capacity} onChange={handleChange} className={inputClass} />
        </FormField>

        <FormField label="Comment" className="md:col-span-2 xl:col-span-3">
          <textarea
            name="comment"
            value={form.comment}
            onChange={handleChange}
            className={textareaClass}
            rows={3}
          />
        </FormField>

        <div className="flex items-end md:col-span-2 xl:col-span-3">
          <label className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Active State</div>
              <div className="text-xs text-slate-500">Toggle operational activity</div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  form.active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {form.active ? "Active" : "Inactive"}
              </span>

              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </label>
        </div>
      </div>

      <SectionTitle
        title="IP and Port Information"
        description="Endpoint addresses and physical port mapping."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FormField label="Site name S1 IP">
          <input name="site_name_s1_ip" value={form.site_name_s1_ip} onChange={handleChange} className={inputClass} />
        </FormField>
        <FormField label="Site name S2 IP">
          <input name="site_name_s2_ip" value={form.site_name_s2_ip} onChange={handleChange} className={inputClass} />
        </FormField>
        <FormField label="Site name S1 Port">
          <input name="site_name_s1_port" value={form.site_name_s1_port} onChange={handleChange} className={inputClass} />
        </FormField>
        <FormField label="Site name S2 Port">
          <input name="site_name_s2_port" value={form.site_name_s2_port} onChange={handleChange} className={inputClass} />
        </FormField>
      </div>

      <SectionTitle
        title="Coordinates and Tower"
        description="Site coordinates, azimuth and height values."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["latitude_s1", "Latitude S1"],
          ["latitude_s2", "Latitude S2"],
          ["longitude_s1", "Longitude S1"],
          ["longitude_s2", "Longitude S2"],
          ["true_azimuth_s1", "True azimuth (°) S1"],
          ["true_azimuth_s2", "True azimuth (°) S2"],
          ["tower_height_s1", "Tower height (m) S1"],
          ["tower_height_s2", "Tower height (m) S2"],
        ].map(([name, label]) => (
          <FormField key={name} label={label}>
            <input type="number" step="any" name={name} value={form[name]} onChange={handleChange} className={inputClass} />
          </FormField>
        ))}
      </div>

      <SectionTitle
        title="Antenna and Radio"
        description="Antenna models, radio models and frequency planning."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["tr_antenna_model_s1", "TR Antenna model S1", "text"],
          ["tr_antenna_model_s2", "TR Antenna model S2", "text"],
          ["tr_antenna_diameter_s1", "TR Antenna diameter (m) S1", "number"],
          ["tr_antenna_diameter_s2", "TR Antenna diameter (m) S2", "number"],
          ["tr_antenna_height_s1", "TR Antenna height (m) S1", "number"],
          ["tr_antenna_height_s2", "TR Antenna height (m) S2", "number"],
          ["frequency_mhz", "Frequency (MHz)", "number"],
          ["polarization", "Polarization", "text"],
          ["path_length_km", "Path length (km)", "number"],
          ["radio_model_s1", "Radio model S1", "text"],
          ["radio_model_s2", "Radio model S2", "text"],
          ["radio_file_name_s1", "Radio file name S1", "text"],
          ["radio_file_name_s2", "Radio file name S2", "text"],
        ].map(([name, label, type]) => (
          <FormField key={name} label={label}>
            <input
              type={type === "number" ? "number" : "text"}
              step="any"
              name={name}
              value={form[name]}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>
        ))}
      </div>

      <SectionTitle
        title="Design Frequency and Signal"
        description="Design channels, transmit power and signal thresholds."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["design_frequency_1_s1", "#1 Design frequency S1"],
          ["design_frequency_1_s2", "#1 Design frequency S2"],
          ["design_frequency_2_s1", "#2 Design frequency S1"],
          ["design_frequency_2_s2", "#2 Design frequency S2"],
          ["design_frequency_3_s1", "#3 Design frequency S1"],
          ["design_frequency_3_s2", "#3 Design frequency S2"],
          ["design_frequency_4_s1", "#4 Design frequency S1"],
          ["design_frequency_4_s2", "#4 Design frequency S2"],
          ["tx_power_dbm_s1", "TX power (dBm) S1"],
          ["tx_power_dbm_s2", "TX power (dBm) S2"],
          ["rx_threshold_level_dbm_s1", "RX threshold level (dBm) S1"],
          ["rx_threshold_level_dbm_s2", "RX threshold level (dBm) S2"],
          ["receive_signal_dbm_s1", "Receive signal (dBm) S1"],
          ["receive_signal_dbm_s2", "Receive signal (dBm) S2"],
        ].map(([name, label]) => (
          <FormField key={name} label={label}>
            <input type="number" step="any" name={name} value={form[name]} onChange={handleChange} className={inputClass} />
          </FormField>
        ))}
      </div>

      <SectionTitle
        title="Fade Margin and Availability"
        description="Margins, availability and ATPC configuration."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["thermal_fade_margin_db_s1", "Thermal fade margin (dB) S1", "number"],
          ["thermal_fade_margin_db_s2", "Thermal fade margin (dB) S2", "number"],
          ["effective_fade_margin_db_s1", "Effective fade margin (dB) S1", "number"],
          ["effective_fade_margin_db_s2", "Effective fade margin (dB) S2", "number"],
          ["annual_multipath_availability_s1", "Annual multipath availability (%) S1", "number"],
          ["annual_multipath_availability_s2", "Annual multipath availability (%) S2", "number"],
          ["annual_rain_availability_s1", "Annual rain availability (%) S1", "number"],
          ["annual_rain_availability_s2", "Annual rain availability (%) S2", "number"],
          ["atpc_1_s1", "#1 ATPC S1", "text"],
          ["atpc_1_s2", "#1 ATPC S2", "text"],
        ].map(([name, label, type]) => (
          <FormField key={name} label={label}>
            <input
              type={type === "number" ? "number" : "text"}
              step="any"
              name={name}
              value={form[name]}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <button type="button" onClick={onCancel} className={secondaryBtnClass}>
          Cancel
        </button>

        <button type="submit" className={primaryBtnClass}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function FormField({ label, required = false, children, className = "" }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="mb-2 text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const textareaClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const secondaryBtnClass =
  "rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

const primaryBtnClass =
  "rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700";

export default AdminMicrowaveLinkBudgetForm;