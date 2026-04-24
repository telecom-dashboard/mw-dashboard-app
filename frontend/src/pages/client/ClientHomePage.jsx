import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RadioTower } from "lucide-react";

import {
  clientPageQueryKeys,
  fetchPublishedClientPagesForNav,
  fetchPublishedHybridPagesForNav,
} from "../../api/clientPageApi";

function ClientHomePage() {
  const {
    data: tableItems = [],
    isLoading: tableLoading,
    error: tableError,
  } = useQuery({
    queryKey: clientPageQueryKeys.publishedNav,
    queryFn: fetchPublishedClientPagesForNav,
  });

  const {
    data: hybridItems = [],
    isLoading: hybridLoading,
    error: hybridError,
  } = useQuery({
    queryKey: clientPageQueryKeys.publishedHybridNav,
    queryFn: fetchPublishedHybridPagesForNav,
  });

  const firstPath = useMemo(
    () => tableItems[0]?.path || hybridItems[0]?.client_path || null,
    [hybridItems, tableItems]
  );

  if (tableLoading || hybridLoading) {
    return <div className="p-4 text-sm text-slate-600">Loading client workspace...</div>;
  }

  if (firstPath) {
    return <Navigate to={firstPath} replace />;
  }

  const error =
    tableError?.response?.data?.detail ||
    hybridError?.response?.data?.detail ||
    tableError?.message ||
    hybridError?.message ||
    "";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <RadioTower size={24} />
      </div>
      <h1 className="mt-4 text-base font-bold text-slate-900">
        No client pages available
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {error || "Ask an admin to publish a client page or enable hybrid page access."}
      </p>
    </div>
  );
}

export default ClientHomePage;
