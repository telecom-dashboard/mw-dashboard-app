import { Outlet } from "react-router-dom";
import ClientTopNav from "../client/ClientTopNav";

function ClientLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ClientTopNav />

      <main className="p-3 md:p-4">
        <div className="mx-auto w-full max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default ClientLayout;