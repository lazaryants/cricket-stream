import {
  Navigate,
  Route,
  Routes,
} from "react-router";
import DashboardPage
  from "./pages/DashboardPage";
import LoginPage
  from "./pages/LoginPage";
import ComponentsPage
  from "./pages/ComponentsPage";
import MonitorPage
  from "./pages/MonitorPage";
import LibrariesPage
  from "./pages/LibrariesPage";
import StreamCreatePage
  from "./pages/StreamCreatePage";
import StreamDetailsPage
  from "./pages/StreamDetailsPage";
import StreamEditPage
  from "./pages/StreamEditPage";
import StreamsPage
  from "./pages/StreamsPage";
import AccountPage
  from "./pages/AccountPage";
import UsersPage
  from "./pages/UsersPage";
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
          path="/streams"
          element={<StreamsPage />}
        />
        <Route
          path="/monitor"
          element={<MonitorPage />}
        />

        <Route
          path="/libraries"
          element={<LibrariesPage />}
        />

        <Route
          path="/components"
          element={<ComponentsPage />}
        />

        <Route
          path="/account"
          element={<AccountPage />}
        />

        <Route
          path="/users"
          element={<UsersPage />}
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
