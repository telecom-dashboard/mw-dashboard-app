import { useState } from "react";
import {
  StandardAdminForm,
  StandardFormActions,
  StandardFormField,
  StandardFormGrid,
  StandardFormSection,
  StandardFormToggleField,
} from "../common/StandardAdminForm";
import { standardFormInputClass } from "../common/StandardAdminFormStyles";

const emptyForm = {
  sitea_id: "",
  siteb_id: "",
  link_id: "",
  category_ne: "",
  depth: "",
  dependency: "",
  pop_site: "",
  child_site_connectivity: "",
  child_site_name: "",
  is_active: true,
};

function AdminSiteConnectivityForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}) {
  const [form, setForm] = useState(() => buildFormState(initialData));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const normalizePayload = () => ({
    sitea_id: form.sitea_id.trim(),
    siteb_id: form.siteb_id.trim(),
    link_id: form.link_id.trim(),
    category_ne: form.category_ne.trim(),
    depth: form.depth === "" ? null : Number(form.depth),
    dependency: form.dependency.trim(),
    pop_site: form.pop_site.trim(),
    child_site_connectivity: form.child_site_connectivity.trim(),
    child_site_name: form.child_site_name.trim(),
    is_active: Boolean(form.is_active),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(normalizePayload());
  };

  return (
    <StandardAdminForm onSubmit={handleSubmit}>
      <StandardFormSection
        title="General Information"
        description="Maintain the site connectivity record."
      >
        <StandardFormGrid>
          <StandardFormField label="SiteA ID" required>
          <input
            name="sitea_id"
            value={form.sitea_id}
            onChange={handleChange}
            className={standardFormInputClass}
            required
          />
          </StandardFormField>

          <StandardFormField label="SiteB ID" required>
          <input
            name="siteb_id"
            value={form.siteb_id}
            onChange={handleChange}
            className={standardFormInputClass}
            required
          />
          </StandardFormField>

          <StandardFormField label="Link ID" required>
          <input
            name="link_id"
            value={form.link_id}
            onChange={handleChange}
            className={standardFormInputClass}
            required
          />
          </StandardFormField>

          <StandardFormField label="Category [NE]">
          <input
            name="category_ne"
            value={form.category_ne}
            onChange={handleChange}
            className={standardFormInputClass}
          />
          </StandardFormField>

          <StandardFormField label="Depth">
          <input
            type="number"
            name="depth"
            value={form.depth}
            onChange={handleChange}
            className={standardFormInputClass}
          />
          </StandardFormField>

          <StandardFormField label="Dependency">
          <input
            name="dependency"
            value={form.dependency}
            onChange={handleChange}
            className={standardFormInputClass}
          />
          </StandardFormField>

          <StandardFormField label="POP Site">
          <input
            name="pop_site"
            value={form.pop_site}
            onChange={handleChange}
            className={standardFormInputClass}
          />
          </StandardFormField>

          <StandardFormField label="Child Site connectivity">
          <input
            name="child_site_connectivity"
            value={form.child_site_connectivity}
            onChange={handleChange}
            className={standardFormInputClass}
          />
          </StandardFormField>

          <StandardFormField label="Child Site Name">
          <input
            name="child_site_name"
            value={form.child_site_name}
            onChange={handleChange}
            className={standardFormInputClass}
          />
          </StandardFormField>

          <StandardFormToggleField
            className="md:col-span-2 xl:col-span-3"
            label="Active State"
            description="Toggle record status"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
        </StandardFormGrid>
      </StandardFormSection>

      <StandardFormActions onCancel={onCancel} submitLabel={submitLabel} />
    </StandardAdminForm>
  );
}

function buildFormState(initialData) {
  return initialData
    ? {
        ...emptyForm,
        ...initialData,
        depth:
          initialData.depth === null || initialData.depth === undefined
            ? ""
            : initialData.depth,
        is_active: initialData.is_active ?? true,
      }
    : emptyForm;
}

export default AdminSiteConnectivityForm;
