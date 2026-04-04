import { createContext, useContext, useMemo, useRef, useState } from "react";

const LoadingContext = createContext(undefined);

export function LoadingProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const routeTimerRef = useRef(null);

  const startLoading = () => {
    setLoadingCount((prev) => prev + 1);
  };

  const stopLoading = () => {
    setLoadingCount((prev) => Math.max(prev - 1, 0));
  };

  const pulseLoading = (duration = 400) => {
    setLoadingCount((prev) => prev + 1);

    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current);
    }

    routeTimerRef.current = setTimeout(() => {
      setLoadingCount((prev) => Math.max(prev - 1, 0));
      routeTimerRef.current = null;
    }, duration);
  };

  const value = useMemo(
    () => ({
      isLoading: loadingCount > 0,
      startLoading,
      stopLoading,
      pulseLoading,
    }),
    [loadingCount]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error("useLoading must be used inside LoadingProvider");
  }

  return context;
}