import React from "react";
import { RouterProvider } from "react-router-dom";

import router from "./app/router";
import { registerLoadingHandlers } from "./api/axios";
import { AuthProvider } from "./context/AuthContext";
import { useLoading } from "./context/LoadingContext";

export default function AppBootstrap() {
  const { startLoading, stopLoading } = useLoading();

  React.useEffect(() => {
    registerLoadingHandlers({ startLoading, stopLoading });
  }, [startLoading, stopLoading]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
