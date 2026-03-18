import { Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/providers/AuthProvider";
import { RoleProvider } from "@/providers/RoleProvider";
import { CompanyProvider } from "@/providers/CompanyProvider";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

import EmployeeDashboard from "./pages/EmployeeDashboard";
import StartWorkflow from "./pages/StartWorkflow";
import EmployeeExpenses from "./pages/EmployeeExpenses";
import ManagerDashboard from "./pages/ManagerDashboard";
import CompanyAdminDashboard from "./pages/CompanyAdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import ManageRoster from "./pages/ManageRoster";
import PlatformDashboard from "./pages/PlatformDashboard";
import ExecutionDetail from "./pages/ExecutionDetail";
import Pricing from "./pages/Pricing";

import WorkflowList from "./pages/WorkflowList";
import WorkflowEditor from "./pages/WorkflowEditor";
import RuleEditor from "./pages/RuleEditor";
import WorkflowExecution from "./pages/WorkflowExecution";
import Executions from "./pages/Executions";
import Approvals from "./pages/Approvals";
import AuditLogs from "./pages/AuditLogs";
import SettingsPage from "./pages/Settings";
import CompanyList from "./pages/CompanyList";
import GlobalUserList from "./pages/GlobalUserList";
import SystemHealth from "./pages/SystemHealth";
import TeamExpenses from "./pages/TeamExpenses";
import ManagerReports from "./pages/ManagerReports";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import { UpsellPopup } from "@/components/UpsellPopup";

const App = () => (
  <TooltipProvider>
    <AuthProvider>
      <RoleProvider>
        <CompanyProvider>
          <UpsellPopup />
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<EmployeeDashboard />} />
              <Route path="/executions/new" element={<StartWorkflow />} />
              <Route path="/executions/my" element={<EmployeeExpenses />} />
              <Route path="/history" element={<EmployeeExpenses />} />

              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/action-items" element={<Approvals />} />
              <Route path="/manager/team-executions" element={<TeamExpenses />} />
              <Route path="/manager/audit-logs" element={<ManagerReports />} />

              <Route path="/admin/dashboard" element={<CompanyAdminDashboard />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/employees" element={<ManageRoster />} />
              <Route path="/admin/managers" element={<ManageRoster />} />
              <Route path="/admin/pricing" element={<Pricing />} />
              <Route path="/admin/workflows" element={<WorkflowList />} />
              <Route path="/admin/executions" element={<Executions />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />

              <Route path="/platform/dashboard" element={<PlatformDashboard />} />
              <Route path="/platform/companies" element={<CompanyList />} />
              <Route path="/platform/users" element={<GlobalUserList />} />
              <Route path="/platform/logs" element={<AuditLogs />} />
              <Route path="/platform/health" element={<SystemHealth />} />
              <Route path="/platform/settings" element={<SettingsPage />} />

              <Route path="/executions/detail/:id" element={<ExecutionDetail />} />

              <Route path="/workflows" element={<WorkflowList />} />
              <Route path="/workflows/new" element={<WorkflowEditor />} />
              <Route path="/workflows/:id" element={<WorkflowEditor />} />
              <Route path="/workflows/:id/rules/:stepId" element={<RuleEditor />} />
              <Route path="/executions" element={<Executions />} />
              <Route path="/executions/run/:id" element={<WorkflowExecution />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CompanyProvider>
      </RoleProvider>
    </AuthProvider>
  </TooltipProvider>
);

export default App;