export interface Category {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  household_id?: string | null;
}

export interface Budget {
  id: string;
  month: number;
  year: number;
  total_budget: number;
  household_id: string;
  category_budgets?: CategoryBudget[];
}

export interface CategoryBudget {
  id: string;
  budget_id: string;
  category_id: string;
  amount: number;
  category?: Category;
}

export interface Receipt {
  id: string;
  store_name: string | null;
  total_amount: number;
  receipt_date: string;
  image_url: string | null;
  raw_ocr_text: string | null;
  created_at: string;
  household_id: string;
  created_by_user: string | null;
  paid_by_user: string | null;
  items?: ReceiptItem[];
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  raw_text: string;
  price: number;
  quantity: number;
  unit_price: number | null;
  category_id: string | null;
  needs_review: boolean;
  included_in_totals: boolean;
  category?: Category;
}

export interface ItemCategoryMapping {
  id: string;
  item_pattern: string;
  category_id: string;
  frequency: number;
  household_id: string;
}

export interface SplitRatio {
  id: string;
  household_id: string;
  user_id: string;
  ratio: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  household_id: string;
  name: string;
  quantity: number;
  category_id: string | null;
  added_by_user: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  estimated_price?: number;
}

export interface SpendingSummary {
  totalSpent: number;
  totalBudget: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  categorySpending: CategorySpending[];
}

export interface CategorySpending {
  category: Category;
  spent: number;
  budget: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export interface ParsedReceipt {
  storeName: string | null;
  totalAmount: number;
  date: string | null;
  items: Array<{
    rawText: string;
    price: number;
    quantity: number;
    unitPrice: number | null;
    categoryId: string | null;
    needsReview: boolean;
  }>;
  rawText: string;
}
