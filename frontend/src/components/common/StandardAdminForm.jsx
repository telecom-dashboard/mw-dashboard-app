import {
  standardFormPrimaryButtonClass,
  standardFormSecondaryButtonClass,
} from "./StandardAdminFormStyles";

export function StandardAdminForm({
  onSubmit,
  className = "space-y-5",
  children,
}) {
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}

export function StandardFormSection({ title, description, children }) {
  return (
    <section className="space-y-4">
      <div>
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {children}
    </section>
  );
}

export function StandardFormGrid({
  className = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
  children,
}) {
  return <div className={className}>{children}</div>;
}

export function StandardFormField({
  label,
  required = false,
  className = "",
  children,
}) {
  return (
    <div className={`flex flex-col ${className}`.trim()}>
      <label className="mb-2 text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}

export function StandardFormToggleField({
  label,
  description,
  name,
  checked,
  onChange,
  disabled = false,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  className = "",
}) {
  return (
    <div className={`flex items-end ${className}`.trim()}>
      <label
        className={`flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 ${
          disabled ? "bg-slate-100" : "bg-white"
        }`}
      >
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              checked
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {checked ? activeLabel : inactiveLabel}
          </span>

          <input
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </label>
    </div>
  );
}

export function StandardFormActions({
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className={standardFormSecondaryButtonClass}
      >
        {cancelLabel}
      </button>

      <button type="submit" className={standardFormPrimaryButtonClass}>
        {submitLabel}
      </button>
    </div>
  );
}
