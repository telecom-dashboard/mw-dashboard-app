import { ArrowRight, Calculator, FileSpreadsheet, Network } from "lucide-react";
import { Link } from "react-router-dom";

function AdminLinkBudgetPage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 p-2 md:p-3">
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Calculator size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Link Budget Workspace
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                This route is being consolidated into the microwave link budget
                workflow. Use the active modules below to manage records,
                topology context, and Excel-based planning data.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <QuickLinkCard
            title="Budget Records"
            description="Open the main microwave link budget page to review and edit planning rows."
            to="/admin/microwave-link-budgets"
            icon={FileSpreadsheet}
          />
          <QuickLinkCard
            title="Link Level"
            description="Open the network view to inspect topology relationships and operational context."
            to="/admin/link-level"
            icon={Network}
          />
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Next Step</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              If you want, this route can become a real overview page for
              templates, validation status, and recent budget imports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLinkCard({ title, description, to, icon }) {
  const IconComponent = icon;

  return (
    <Link
      to={to}
      className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-sky-100 group-hover:text-sky-700">
          <IconComponent size={18} />
        </div>
        <ArrowRight
          size={16}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-600"
        />
      </div>
      <h2 className="mt-4 text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}

export default AdminLinkBudgetPage;
