import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";

// Components
import Sidebar from "./components/sidebar";
import AuthGuard from "./components/AuthGuard";
import ToastContainer from "./components/ToastContainer";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MaterielPage from "./pages/Materiels";
import IncidentsPage from "./pages/Incidents";
import InventairePage from "./pages/Inventaires";
import ListeSalles from "./pages/ListeSalles";
import SallesPage from "./pages/Salles";
import PositionsPage from "./pages/Positions";
import AffectationsPage from "./pages/Affectations";
import UtilisateursPage from "./pages/Utilisateurs";
import PersonnesPage from "./pages/Personnels";

// Layout principal avec Sidebar
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`layout ${isExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}>
      <Sidebar onToggle={setIsExpanded} />
      <div className="main-content">
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* ====== PUBLIC ====== */}
        <Route element={<AuthGuard requireAuth={false} />}>
          <Route path="/" element={<Login />} />
        </Route>

        {/* ====== PROTECTED ====== */}
        <Route element={<AuthGuard />}>
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />

          <Route
            path="/equipment"
            element={
              <Layout>
                <MaterielPage />
              </Layout>
            }
          />

          <Route
            path="/incidents"
            element={
              <Layout>
                <IncidentsPage />
              </Layout>
            }
          />

          <Route
            path="/inventory"
            element={
              <Layout>
                <InventairePage />
              </Layout>
            }
          />

          <Route
            path="/liste-salles"
            element={
              <Layout>
                <ListeSalles />
              </Layout>
            }
          />

          <Route
            path="/rooms"
            element={
              <Layout>
                <SallesPage />
              </Layout>
            }
          />

          <Route
            path="/positions"
            element={
              <Layout>
                <PositionsPage />
              </Layout>
            }
          />

          <Route
            path="/affectations"
            element={
              <Layout>
                <AffectationsPage />
              </Layout>
            }
          />

          <Route
            path="/personnes"
            element={
              <Layout>
                <PersonnesPage />
              </Layout>
            }
          />
        </Route>

        {/* ====== ADMIN ====== */}
        <Route element={<AuthGuard allowedRoles={["Administrateur"]} />}>
            <Route
              path="/utilisateurs"
              element={
                <Layout>
                  <UtilisateursPage />
                </Layout>
              }
            />
        </Route>
      </Routes>
      
      <ToastContainer />
    </Router>
  );
};

export default App;
