export type SopStatus = "Draft" | "Active" | "Needs Review" | "Archived";

export type SopCategory =
  | "Office Procedures"
  | "Field Operations"
  | "Safety"
  | "HR / Employee"
  | "Inventory"
  | "Work Orders"
  | "Customer Follow-Up"
  | "Billing / Admin";

export type Sop = {
  id: string;
  title: string;
  description: string;
  category: SopCategory;
  department: string;
  owner: string;
  status: SopStatus;
  lastUpdated: string;
  reviewDate?: string;
  relatedFileIds?: string[];
  relatedFormIds?: string[];
  relatedTaskIds?: string[];
  relatedWorkOrderIds?: string[];
};
