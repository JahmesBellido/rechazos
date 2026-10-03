import { BrowserRouter, Routes, Route } from "react-router";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/Dashboard/Home";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import Profile from "./pages/UserProfiles";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import DataRechazosList from "./pages/DataRechazos/DataRechazosList";
import AnalisisList from "./pages/Analisis/AnalisisList";
import UsersList from "./pages/Users/UsersList";
import TransportistasList from "./pages/Transportistas/TransportistasList";
import DataList from "./pages/Data/DataList";
import CalendarioRechazos from "./pages/Calendario/CalendarioRechazos";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/OtherPage/NotFound";
import { AuthProvider } from "./context/AuthContext";

const App = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AuthProvider>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/calendario-rechazos" element={<ProtectedRoute><CalendarioRechazos /></ProtectedRoute>} />
            <Route path="/data-rechazos" element={<ProtectedRoute><DataRechazosList /></ProtectedRoute>} />
            <Route path="/analisis" element={<ProtectedRoute requiredRole="admin"><AnalisisList /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requiredRole="admin"><UsersList /></ProtectedRoute>} />
            <Route path="/transportistas" element={<ProtectedRoute requiredRole="admin"><TransportistasList /></ProtectedRoute>} />
            <Route path="/data" element={<ProtectedRoute requiredRole="admin"><DataList /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
