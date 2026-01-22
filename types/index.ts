// User Roles
export enum UserRole {
  MEMBER = "Member",
  MANAGER = "Manager",
  ADMIN = "Admin",
  SUPER_ADMIN = "SuperAdmin",
}

// Bazar Status
export enum BazarStatus {
  PENDING = "Pending",
  COMPLETED = "Completed",
}

// Transaction Types
export enum TransactionType {
  DEPOSIT = "Deposit",
  EXPENSE = "Expense",
  EXTRA = "Extra",
  ADJUSTMENT = "Adjustment",
}

// User Interface
export interface User {
  id: string;
  name: string;
  dept: string;
  institute: string;
  phone: string;
  email: string;
  picture: string;
  googleId: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Member Interface
export interface Member {
  id: string;
  userId: string;
  totalDeposit: number;
  previousDue: number;
  perExtra: number;
  totalExpense: number;
  balanceDue: number;
  border: number;
  managerReceivable: number;
  createdAt: Date;
  updatedAt: Date;
}

// Member with User details
export interface MemberWithUser extends Member {
  user: User;
}

// Daily Expense Interface
export interface DailyExpense {
  id: string;
  date: Date;
  addedBy: string | null;
  bazarShop: string;
  bazarListUpload: string;
  totalTK: number;
  extra: number;
  notes: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Daily Expense with User details
export interface DailyExpenseWithUser extends DailyExpense {
  addedByUser: User | null;
}

// Bazar List Interface
export interface BazarList {
  id: string;
  bazarNo: number;
  date: Date;
  assignedTo: string;
  status: BazarStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Bazar List with User details
export interface BazarListWithUser extends BazarList {
  assignedToUser: User;
}

// Transaction Interface
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  userId: string;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction with User details
export interface TransactionWithUser extends Transaction {
  user: User;
}

// Semester Break Interface
export interface SemesterBreak {
  id: string;
  startDate: Date;
  endDate: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice Data
export interface InvoiceData {
  member: MemberWithUser;
  month: number;
  year: number;
  transactions: Transaction[];
  totalDeposit: number;
  totalExpense: number;
  balance: number;
  border: number;
  managerReceivable: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface MemberRegistrationForm {
  name: string;
  dept: string;
  institute: string;
  phone: string;
  email: string;
  picture: string;
}

export interface DailyExpenseForm {
  date: Date;
  bazarShop: string;
  bazarListUpload?: File;
  totalTK: number;
  extra: number;
  notes: string;
}

export interface BazarListForm {
  date: Date;
  assignedTo: string;
  status: BazarStatus;
}

// Heshab Interface
export interface Heshab {
  id: string;
  userId: string;
  deposit: number;
  previousBalance: number;
  perExtra: number;
  totalExpense: number;
  currentBalance: number;
  due: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

// Heshab with User details
export interface HeshabWithUser extends Heshab {
  user: User;
}

// Daily Extra Interface
export interface DailyExtra {
  id: string;
  reason: string;
  amount: number;
  date: Date;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Daily Extra with User details
export interface DailyExtraWithUser extends DailyExtra {
  addedByUser: User;
}

// Heshab Form
export interface HeshabForm {
  userId: string;
  deposit: number;
  previousBalance: number;
  month: number;
  year: number;
}

// Daily Extra Form
export interface DailyExtraForm {
  reason: string;
  amount: number;
  date: Date;
}

// Deposit Log Interface
export interface DepositLog {
  id: string;
  userId: string;
  heshabId?: string;
  amount: number;
  date: Date;
  month: number;
  year: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Deposit Log with User details
export interface DepositLogWithUser extends DepositLog {
  user: User;
}

