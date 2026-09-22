export type UserRoleType =
  | 'ADMIN'
  | 'PRODUCTION_MANAGER'
  | 'WAREHOUSE_MANAGER'
  | 'HR_MANAGER'
  | 'ACCOUNTANT'
  | 'PRODUCTION_EMPLOYEE'
  | 'WAREHOUSE_EMPLOYEE'
  | 'EMPLOYEE';

export interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  employeeId?: string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  industry?: string;
  size?: string;
  country?: string;
  email?: string;
  currency: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  employeeCount?: number;
}

export interface Shift {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export interface Employee {
  id: string;
  organizationId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  departmentId: string;
  departmentName?: string;
  designation: string;
  roleId?: string;
  roleName?: string;
  shiftId?: string;
  shiftName?: string;
  managerId?: string;
  managerName?: string;
  joiningDate: string;
  employmentType: string;
  workLocation: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';
  shiftName?: string;
  workHours?: number;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface JobOpening {
  id: string;
  organizationId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  openings: number;
  experience?: string;
  salaryRange?: string;
  location: string;
  status: 'OPEN' | 'IN_REVIEW' | 'CLOSED';
  candidateCount?: number;
  createdAt: string;
}

export interface Candidate {
  id: string;
  organizationId: string;
  jobOpeningId: string;
  jobTitle?: string;
  name: string;
  email: string;
  phone?: string;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'SELECTED' | 'OFFER' | 'JOINED' | 'REJECTED';
  rating: number;
  notes?: string;
  createdAt: string;
}

export interface PayrollPeriod {
  id: string;
  organizationId: string;
  month: number;
  year: number;
  name: string;
  status: 'DRAFT' | 'PROCESSING' | 'APPROVED' | 'PAID';
  totalAmount: number;
  employeeCount?: number;
}

export interface PayrollSlip {
  id: string;
  organizationId: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  designation: string;
  basicSalary: number;
  allowances: number;
  overtime: number;
  deductions: number;
  netSalary: number;
  status: 'GENERATED' | 'APPROVED' | 'PAID';
  paymentDate?: string;
}

export interface Warehouse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  location: string;
  capacity?: string;
  itemCount?: number;
}

export interface Supplier {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  rating: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RawMaterial {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  minStockLevel: number;
  currentStock: number;
  supplierName?: string;
}

export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  minStockLevel: number;
  currentStock: number;
}

export interface StockLedgerEntry {
  id: string;
  organizationId: string;
  warehouseName: string;
  itemType: 'RAW_MATERIAL' | 'PRODUCT';
  itemName: string;
  transactionType: string;
  quantity: number;
  balanceAfter: number;
  referenceNumber?: string;
  batchNumber?: string;
  createdByName: string;
  createdAt: string;
}

export interface Batch {
  id: string;
  organizationId: string;
  batchNumber: string;
  itemType: string;
  itemName: string;
  quantity: number;
  initialQuantity: number;
  manufacturingDate: string;
  expiryDate?: string;
  status: 'QUARANTINE' | 'RELEASED' | 'REJECTED' | 'EXPIRED';
}

export interface ProductionOrder {
  id: string;
  organizationId: string;
  orderNumber: string;
  planNumber?: string;
  productId: string;
  productName: string;
  productSku: string;
  targetQuantity: number;
  completedQuantity: number;
  rejectedQuantity: number;
  status: 'DRAFT' | 'PLANNED' | 'MATERIAL_PENDING' | 'READY' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  dueDate: string;
  shiftName?: string;
  supervisorName?: string;
  notes?: string;
}

export interface QualityInspection {
  id: string;
  organizationId: string;
  inspectionNumber: string;
  stage: 'MATERIAL_RECEIVED' | 'IN_PROCESS' | 'FINISHED_PRODUCT';
  referenceType: string;
  referenceNumber: string;
  itemName: string;
  inspectorName: string;
  sampleSize: number;
  defectsCount: number;
  status: 'PASS' | 'FAIL' | 'HOLD' | 'REWORK';
  notes?: string;
  createdAt: string;
}

export interface DispatchOrder {
  id: string;
  organizationId: string;
  dispatchNumber: string;
  salesOrderNumber: string;
  customerName: string;
  carrier: string;
  trackingNumber?: string;
  dispatchDate: string;
  status: 'PREPARING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  itemSummary: string;
  totalItems: number;
  destination: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  creditLimit: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
  estimatedValue: number;
  assignedToName?: string;
}

export interface SalesOrder {
  id: string;
  organizationId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'DRAFT' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_TO_DISPATCH' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export interface AuditLog {
  id: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  link?: string;
  isRead: boolean;
  createdAt: string;
}
