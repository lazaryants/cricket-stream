import { StrictMode } from "react";

import { createRoot }
  from "react-dom/client";

import {
  CssBaseline,
  ThemeProvider,
} from "@mui/material";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { BrowserRouter }
  from "react-router";

import { RuntimeWebSocketBridge } from "./websocket/RuntimeWebSocketBridge";
import App from "./App";

import { AuthProvider }
  from "./auth/AuthContext";

import { theme }
  from "./theme/theme";

const queryClient =
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus:
          false,
      },
    },
  });

const rootElement =
  document.getElementById(
    "root",
  );

if (!rootElement) {
  throw new Error(
    "Root element was not found",
  );
}

createRoot(
  rootElement,
).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <QueryClientProvider
        client={queryClient}
      >
        <BrowserRouter>
          <AuthProvider>
            <RuntimeWebSocketBridge />
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
