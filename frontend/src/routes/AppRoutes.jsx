import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// =========================================================
// PUBLIC
// =========================================================
import Home from "../pages/Home";
import AboutUs from "../pages/AboutUs";
import Products from "../pages/Products";
import Services from "../pages/Services";
import Industries from "../pages/Industries";
import Projects from "../pages/Projects";
import ProjectGallery from "../pages/ProjectGallery";
import KnowledgeCenter from "../pages/KnowledgeCenter";
import ContactUs from "../pages/ContactUs";
import GetAQuote from "../pages/GetAQuote";
import UpsCalculator from "../pages/UpsCalculator";
import BatteryCalculator from "../pages/BatteryCalculator";
import ThreePhaseUps from "../pages/ThreePhaseUps";
import AiPowerAssistant from "../pages/AiPowerAssistant";
import PublicAmcRequest from "../pages/PublicAmcRequest";

// =========================================================
// AUTH
// =========================================================
import PortalLogin from "../pages/PortalLogin";
import Register from "../pages/Register";

// =========================================================
// CUSTOMER PORTAL
// =========================================================
import CustomerDashboard from "../pages/CustomerDashboard";
import EquipmentDetails from "../pages/customer/EquipmentDetails";
import ServiceHistory from "../pages/customer/ServiceHistory";
import ServiceRequest from "../pages/ServiceRequest";
import AmcRequest from "../pages/AmcRequest";
import CustomerSupport from "../pages/CustomerSupport";

// =========================================================
// ADMIN PORTAL
// =========================================================
import AdminDashboard from "../pages/admin/Dashboard";
import LeadManagement from "../pages/admin/LeadManagement";
import LeadDetail from "../pages/admin/LeadDetail";
import QuoteManagement from "../pages/admin/QuoteManagement";
import EditQuotation from "../pages/admin/EditQuotation";
import ServiceAMCManagement from "../pages/admin/ServiceAMCManagement";
import ServiceRequestManagement from "../pages/admin/ServiceRequestManagement";
import Inventory from "../pages/admin/Inventory";
import Analytics from "../pages/admin/Analytics";

export default function AppRoutes() {
  return (
    <Routes>
      {/* =======================================================
          PUBLIC WEBSITE
      ======================================================= */}

      <Route path="/" element={<Home />} />

      <Route path="/about" element={<AboutUs />} />

      <Route path="/products" element={<Products />} />

      <Route path="/services" element={<Services />} />

      <Route path="/industries" element={<Industries />} />

      <Route path="/projects" element={<Projects />} />

      <Route
        path="/project-gallery"
        element={<ProjectGallery />}
      />

      <Route
        path="/knowledge"
        element={<KnowledgeCenter />}
      />

      <Route
        path="/contact"
        element={<ContactUs />}
      />

      <Route
        path="/quote"
        element={<GetAQuote />}
      />

      <Route
        path="/ups-calculator"
        element={<UpsCalculator />}
      />

      <Route
        path="/battery-calculator"
        element={<BatteryCalculator />}
      />

      <Route
        path="/three-phase-ups"
        element={<ThreePhaseUps />}
      />

      <Route
        path="/ai-power-assistant"
        element={<AiPowerAssistant />}
      />

      {/* =======================================================
          PUBLIC AMC / SERVICE REQUEST
      ======================================================= */}

      <Route
        path="/support/amc-request"
        element={<PublicAmcRequest />}
      />

      {/* =======================================================
          AUTHENTICATION
      ======================================================= */}

      <Route
        path="/portal/login"
        element={<PortalLogin />}
      />

      <Route
        path="/portal/register"
        element={<Register />}
      />

      {/* /portal → login */}

      <Route
        path="/portal"
        element={
          <Navigate
            to="/portal/login"
            replace
          />
        }
      />

      {/* =======================================================
          CUSTOMER PORTAL
          Protected: customer only
      ======================================================= */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["customer"]}
          />
        }
      >
        {/* Customer Dashboard */}

        <Route
          path="/portal/dashboard"
          element={<CustomerDashboard />}
        />

        {/* Customer Equipment */}

        <Route
          path="/portal/equipment"
          element={<EquipmentDetails />}
        />

        {/* Service History */}

        <Route
          path="/portal/service-history"
          element={<ServiceHistory />}
        />

        {/* Service Request */}

        <Route
          path="/portal/service-request"
          element={<ServiceRequest />}
        />

        {/* AMC Request */}

        <Route
          path="/portal/amc-request"
          element={<AmcRequest />}
        />

        {/* Customer Support */}

        <Route
          path="/portal/support"
          element={<CustomerSupport />}
        />

        {/* Old AMC URL → new AMC URL */}

        <Route
          path="/portal/amc-enquiry"
          element={
            <Navigate
              to="/portal/amc-request"
              replace
            />
          }
        />
      </Route>

      {/* =======================================================
          ADMIN PORTAL
          Protected: admin only
      ======================================================= */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["admin"]}
          />
        }
      >
        {/* -----------------------------------------------------
            ADMIN DASHBOARD
        ----------------------------------------------------- */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        {/* -----------------------------------------------------
            LEADS
        ----------------------------------------------------- */}

        <Route
          path="/admin/leads"
          element={<LeadManagement />}
        />

        <Route
          path="/admin/leads/:id"
          element={<LeadDetail />}
        />

        {/* -----------------------------------------------------
            QUOTES
        ----------------------------------------------------- */}

        <Route
          path="/admin/quotes"
          element={<QuoteManagement />}
        />

        <Route
          path="/admin/quotes/:id/edit"
          element={<EditQuotation />}
        />

        {/* -----------------------------------------------------
            SERVICE & AMC
        ----------------------------------------------------- */}

        <Route
          path="/admin/service-amc"
          element={<ServiceAMCManagement />}
        />

        {/* -----------------------------------------------------
            SERVICE REQUESTS
        ----------------------------------------------------- */}

        <Route
          path="/admin/service-requests"
          element={<ServiceRequestManagement />}
        />

        {/* -----------------------------------------------------
            INVENTORY
        ----------------------------------------------------- */}

        <Route
          path="/admin/inventory"
          element={<Inventory />}
        />

        {/* -----------------------------------------------------
            ANALYTICS
        ----------------------------------------------------- */}

        <Route
          path="/admin/analytics"
          element={<Analytics />}
        />
      </Route>

      {/* =======================================================
          ADMIN BACKWARD COMPATIBILITY
      ======================================================= */}

      <Route
        path="/admin/dashboard"
        element={
          <Navigate
            to="/admin"
            replace
          />
        }
      />

      {/* =======================================================
          FALLBACK
      ======================================================= */}

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