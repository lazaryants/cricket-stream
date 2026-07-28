import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import DashboardPage
  from "./pages/DashboardPage";

import LoginPage
  from "./pages/LoginPage";

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
          element={
            <DashboardPage />
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
