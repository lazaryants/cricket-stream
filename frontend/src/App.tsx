import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import DashboardPage
  from "./pages/DashboardPage";

import LoginPage
  from "./pages/LoginPage";

import StreamCreatePage
  from "./pages/StreamCreatePage";

import StreamDetailsPage
  from "./pages/StreamDetailsPage";

import StreamEditPage
  from "./pages/StreamEditPage";

import { RequireAuth }
  from "./routes/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        element={<RequireAuth />}
      >
        <Route
          path="/"
          element={<DashboardPage />}
        />

        <Route
          path="/streams/new"
          element={
            <StreamCreatePage />
          }
        />

        <Route
          path="/streams/:streamId"
          element={
            <StreamDetailsPage />
          }
        />

        <Route
          path="/streams/:streamId/edit"
          element={
            <StreamEditPage />
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}
