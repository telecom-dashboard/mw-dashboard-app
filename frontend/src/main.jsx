import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import router from "./app/router";
import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider, useLoading } from "./context/LoadingContext";
import { registerLoadingHandlers } from "./api/axios";

function AppBootstrap() {
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LoadingProvider>
      <AppBootstrap />
    </LoadingProvider>
  </React.StrictMode>
);