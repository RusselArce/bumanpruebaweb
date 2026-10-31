import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes/routes.tsx";
import { useSubcription } from "./shared/store/auth.store.ts";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./shared/theme/ThemeProvider";
useSubcription
  .getState()
  .init()
  .catch((e) => console.error("Auth init error:", e))
  .finally(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </StrictMode>
    );
  });
