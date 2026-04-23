import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import AppBootstrap from "./AppBootstrap";
import { LoadingProvider } from "./context/LoadingContext";
import { queryClient } from "./lib/queryClient";

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <LoadingProvider>
      <AppBootstrap />
    </LoadingProvider>
  </QueryClientProvider>
);
