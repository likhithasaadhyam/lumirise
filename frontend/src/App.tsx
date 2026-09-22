import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PermissionRoute } from './components/auth/PermissionRoute';
import { AppShell } from './components/shell/AppShell';

// Auth Pages
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';

// Dashboard
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Operations
import { ProductionOrdersPage } from './pages/operations/ProductionOrdersPage';
import { QualityPage } from './pages/operations/QualityPage';
import { FinishedGoodsPage } from './pages/operations/FinishedGoodsPage';
import { DispatchPage } from './pages/operations/DispatchPage';

// Inventory
import { RawMaterialsPage } from './pages/inventory/RawMaterialsPage';
import { ProductsPage } from './pages/inventory/ProductsPage';
import { WarehousesPage } from './pages/inventory/WarehousesPage';
import { StockLedgerPage } from './pages/inventory/StockLedgerPage';
import { BatchesPage } from './pages/inventory/BatchesPage';
import { SuppliersPage } from './pages/inventory/SuppliersPage';
import { StockInOutPage } from './pages/inventory/StockInOutPage';

// People / HRMS
import { EmployeesPage } from './pages/hrms/EmployeesPage';
import { AttendancePage } from './pages/hrms/AttendancePage';
import { LeavePage } from './pages/hrms/LeavePage';
import { RecruitmentPage } from './pages/hrms/RecruitmentPage';
import { PayrollPage } from './pages/hrms/PayrollPage';

// Business / CRM
import { LeadsPage } from './pages/crm/LeadsPage';
import { CustomersPage } from './pages/crm/CustomersPage';
import { SalesOrdersPage } from './pages/crm/SalesOrdersPage';
import { InvoicesPage } from './pages/crm/InvoicesPage';

// Reports & Administration
import { ReportsPage } from './pages/reports/ReportsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { RolesPermissionsPage } from './pages/admin/RolesPermissionsPage';

// Employee Self-Service Portal
import { EmployeeTasksPage } from './pages/portal/EmployeeTasksPage';
import { EmployeePayslipsPage } from './pages/portal/EmployeePayslipsPage';
import { EmployeeProfilePage } from './pages/portal/EmployeeProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* Protected Enterprise ERP App */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            {/* Dashboard / Workspace */}
            <Route path="/" element={<DashboardPage />} />

            {/* Employee Self-Service Portal */}
            <Route
              path="/portal/tasks"
              element={
                <PermissionRoute requiredPermission={['my_tasks.view', 'my_orders.view']} moduleName="My Tasks">
                  <EmployeeTasksPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/portal/payslips"
              element={
                <PermissionRoute requiredPermission="my_payslips.view" moduleName="My Payslips">
                  <EmployeePayslipsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/portal/profile"
              element={
                <PermissionRoute requiredPermission="my_profile.view" moduleName="My Profile">
                  <EmployeeProfilePage />
                </PermissionRoute>
              }
            />

            {/* Operations */}
            <Route
              path="/operations/production"
              element={
                <PermissionRoute requiredPermission="production.view" moduleName="Production Orders">
                  <ProductionOrdersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/operations/quality"
              element={
                <PermissionRoute requiredPermission="quality.view" moduleName="Quality Control">
                  <QualityPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/operations/finished-goods"
              element={
                <PermissionRoute requiredPermission="finished_goods.view" moduleName="Finished Goods">
                  <FinishedGoodsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/operations/dispatch"
              element={
                <PermissionRoute requiredPermission="dispatch.view" moduleName="Dispatch & Shipping">
                  <DispatchPage />
                </PermissionRoute>
              }
            />

            {/* Inventory */}
            <Route
              path="/inventory/raw-materials"
              element={
                <PermissionRoute requiredPermission="inventory.view" moduleName="Raw Materials">
                  <RawMaterialsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/products"
              element={
                <PermissionRoute requiredPermission="inventory.view" moduleName="Products Catalog">
                  <ProductsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/warehouses"
              element={
                <PermissionRoute requiredPermission="warehouse.view" moduleName="Depots & Warehouses">
                  <WarehousesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/ledger"
              element={
                <PermissionRoute requiredPermission="stock.view" moduleName="Stock Ledger">
                  <StockLedgerPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/batches"
              element={
                <PermissionRoute requiredPermission="stock.view" moduleName="Batches & Lots">
                  <BatchesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/suppliers"
              element={
                <PermissionRoute requiredPermission="supplier.view" moduleName="Suppliers & Vendors">
                  <SuppliersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventory/stock-in-out"
              element={
                <PermissionRoute requiredPermission="stock.manage" moduleName="Stock In & Out Movements">
                  <StockInOutPage />
                </PermissionRoute>
              }
            />

            {/* People / HRMS */}
            <Route
              path="/people/employees"
              element={
                <PermissionRoute requiredPermission="employees.view" moduleName="Employee Directory">
                  <EmployeesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/people/attendance"
              element={
                <PermissionRoute requiredPermission={['attendance.view', 'my_attendance.view']} moduleName="Attendance & Shifts">
                  <AttendancePage />
                </PermissionRoute>
              }
            />
            <Route
              path="/people/leave"
              element={
                <PermissionRoute requiredPermission={['leave.view', 'my_leave.view']} moduleName="Leave Requests">
                  <LeavePage />
                </PermissionRoute>
              }
            />
            <Route
              path="/people/recruitment"
              element={
                <PermissionRoute requiredPermission="recruitment.view" moduleName="Recruitment & Hiring">
                  <RecruitmentPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/people/payroll"
              element={
                <PermissionRoute requiredPermission="payroll.view" moduleName="Payroll & Compensation">
                  <PayrollPage />
                </PermissionRoute>
              }
            />

            {/* Business / CRM */}
            <Route
              path="/business/leads"
              element={
                <PermissionRoute requiredPermission="leads.view" moduleName="Leads & Pipeline">
                  <LeadsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/business/customers"
              element={
                <PermissionRoute requiredPermission="customers.view" moduleName="Customer Accounts">
                  <CustomersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/business/orders"
              element={
                <PermissionRoute requiredPermission="sales_orders.view" moduleName="Sales Orders">
                  <SalesOrdersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/business/invoices"
              element={
                <PermissionRoute requiredPermission="invoices.view" moduleName="Invoices & Billing">
                  <InvoicesPage />
                </PermissionRoute>
              }
            />

            {/* Reports & Governance */}
            <Route
              path="/reports"
              element={
                <PermissionRoute requiredPermission="reports.view" moduleName="Operational Reports">
                  <ReportsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/administration/audit"
              element={
                <PermissionRoute requiredPermission="audit.view" moduleName="System Audit Logs">
                  <AuditLogsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/administration/roles"
              element={
                <PermissionRoute requiredPermission="roles.manage" moduleName="Roles & Permissions Matrix">
                  <RolesPermissionsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/administration/settings"
              element={
                <PermissionRoute requiredPermission="settings.view" moduleName="Company Settings">
                  <SettingsPage />
                </PermissionRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
