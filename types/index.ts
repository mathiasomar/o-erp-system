export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type Category = {
  id: string;
  name: string;
  color: string | null;
};

export type Stock = {
  id: string;
  quantity: number;
  lowStockAt: number;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  lastPrice: number;
  costPrice: number;
  costPriceInclTax: number;
  purchaseTaxRate: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  category: Category | null;
  stock: Stock | null;
  discountRate?: number | null;
  taxRate?: number | null;
};

export type CartItem = {
  product: Product;
  quantity: number;
  customPrice?: number | null;
};

export type Cart = {
  items: CartItem[];
};

// Orders and payments

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type SplitPayment = {
  id: string;
  paymentId: string;
  method: string;
  amount: number;
  mpesaRef: string | null;
  mpesaPhone: string | null;
  createdAt: string;
};

export type Payment = {
  id: string;
  orderId: string;
  amount: number;
  createdAt: string;
  splitPayments: SplitPayment[];
};

export type Order = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "VOIDED";
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  change: number;
  amountPaid: number;
  note: string | null;
  userId: string | null;
  user: User | null;
  customer: Customer | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment: Payment | null;
};

export type StockLog = {
  id: string;
  stockId: string;
  productId: string;
  reason: string;
  quantityBefore: number;
  quantityAfter: number;
  change: number;
  note: string | null;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  productId: string;
  quantity: number;
  lowStockAt: number;
  updatedAt: string;
  product: Product & { category: Category | null };
};

export type PaymentWithOrder = Payment & {
  order: {
    orderNumber: string;
    status: string;
    total: number;
    items: { quantity: number }[];
  };
};

export type Layaway = {
  id: string;
  orderNumber: string;
  status: string;
  depositAmount: number;
  totalAmount: number;
  balanceAmount: number;
  dueDate: string;
  notes: string | null;
  createdAt: string;
  customer: { name: string; phone: string | null } | null;
  items: { productName: string; quantity: number; unitPrice: number }[];
  payments: { amount: number; method: string; createdAt: string }[];
};

export type PaymentsResponse = {
  payments: PaymentWithOrder[];
  totalRevenue: number;
  byMethod: {
    CASH: number;
    MPESA: number;
    CARD: number;
  };
};

export type MpesaTransaction = {
  id: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  phoneNumber: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  mpesaReceiptNumber: string | null;
  resultCode: number | null;
  resultDesc: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MpesaTransactionsResponse = {
  transactions: MpesaTransaction[];
  summary: {
    totalSuccess: number;
    totalPending: number;
    totalFailed: number;
    totalCount: number;
  };
};

export type ExpenseCategory = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseCategoryWithCount = ExpenseCategory & {
  _count: { expenses: number };
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  note: string | null;
  userId: string | null;
  user: User | null;
  receiptUrl: string | null;
  paymentMethod: "CASH" | "MPESA" | "CARD" | "BANK_TRANSFER";
  frequency: "ONE_TIME" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  isRecurring: boolean;
  categoryId: string | null;
  category: ExpenseCategory | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpensesResponse = {
  expenses: Expense[];
  totalAmount: number;
  byMethod: {
    CASH: number;
    MPESA: number;
    CARD: number;
    BANK_TRANSFER: number;
  };
  byCategory: Record<string, number>;
};

export type DashboardData = {
  kpis: {
    totalRevenue: number;
    totalExpensesInRange: number;
    netProfit: number;
    totalOrders: number;
    completedOrders: number;
    totalProducts: number;
    totalCategories: number;
    outOfStockItems: number;
    totalExpensesAllTime: number;
  };
  chartData: {
    date: string;
    revenue: number;
    expenses: number;
    costOfGoods: number;
    grossProfit: number;
    netProfit: number;
    profitLoss: number;
    margin: number;
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    items: { quantity: number }[];
    primaryMethod: string | null;
    splitPayments: { method: string; amount: number }[];
  }[];
  topProducts: {
    productId: string;
    productName: string;
    _sum: {
      quantity: number | null;
      total: number | null;
    };
  }[];
  paymentBreakdown: Record<string, { count: number; amount: number }>;
  mpesaStats: {
    status: string;
    _count: { id: number };
    _sum: { amount: number | null };
  }[];
};

export type ProductPerformance = {
  chartData: { date: string; revenue: number; units: number }[];
  totalRevenue: number;
  totalUnits: number;
  totalOrders: number;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  branchId: string | null;
  isActive: boolean;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
    expenses: number;
  };
};

export type UserActivity = {
  chartData: {
    date: string;
    orders: number;
    revenue: number;
    activities: number;
  }[];
  totalOrders: number;
  totalRevenue: number;
  totalActivities: number;
  recentActivity: ActivityLog[];
};

export type SystemSetting = {
  id: string;
  key: string;
  value: string;
  group: string;
  label: string;
  type: string;
  isSecret: boolean;
  updatedAt: string;
  updatedBy: string | null;
};

export type SettingsGroup = {
  group: string;
  settings: SystemSetting[];
};

// Settings as a flat key-value map for easy access
export type SettingsMap = Record<string, string>;

// System Metadata — dynamically generated from database settings
export type SystemMetadata = {
  title: string;
  description: string;
  databaseName: string;
  databaseType: string;
  databaseUrl: string;
  companyName: string;
  companyShortName: string;
  faviconUrl: string | null;
  logoUrl: string | null;
  icons: {
    icon: string;
    shortcut: string;
    apple: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  features: {
    mpesaEnabled: boolean;
    cloudinaryEnabled: boolean;
    inventoryEnabled: boolean;
  };
};

export type ReportData = {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number; // Keeping for backward compatibility
    totalCostOfGoods: number; // New: Total cost of products sold
    totalGrossProfit: number; // New: Revenue - COGS
    totalNetProfit: number; // New: Revenue - COGS - Expenses
    totalOrders: number;
    cancelledOrders: number;
    avgOrderValue: number;
    outOfStock: number;
    lowStock: number;
    totalStock: number;
    stockValue: number;
    overallMargin: number; // New: (Net Profit / Revenue) * 100
    grossMargin: number; // New: (Gross Profit / Revenue) * 100
  };
  trendData: {
    date: string;
    revenue: number;
    expenses: number;
    orders: number;
    profit: number; // Keeping for backward compatibility
    costOfGoods: number; // New
    grossProfit: number; // New
    netProfit: number; // New
    profitMargin: number; // New: (Net Profit / Revenue) * 100
    grossMargin: number; // New: (Gross Profit / Revenue) * 100
  }[];
  topProducts: {
    id: string;
    name: string;
    category: string;
    units: number;
    revenue: number;
    cost: number; // New: Total cost of units sold
    profit: number; // New: Revenue - Cost
    margin: number; // New: (Profit / Revenue) * 100
  }[];
  paymentBreakdown: Record<string, { count: number; amount: number }>;
  expenseByCategory: Record<string, number>;
  stockMovement: {
    product: string;
    reason: string;
    change: number;
    before: number;
    after: number;
    note: string | null;
    date: string;
  }[];
  cashierPerformance: {
    name: string;
    orders: number;
    revenue: number;
    cost: number; // New: Total cost of products sold by cashier
    profit: number; // New: Revenue - Cost
    margin: number; // New: (Profit / Revenue) * 100
  }[];
};

export type AnalyticsData = {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    grossMargin: number;
    totalOrders: number;
    avgOrderValue: number;
  };
  hourlyData: {
    hour: number;
    label: string;
    orders: number;
    revenue: number;
  }[];
  dayData: { day: string; orders: number; revenue: number }[];
  categoryBreakdown: { name: string; revenue: number; units: number }[];
  cashierLeaderboard: {
    name: string;
    orders: number;
    revenue: number;
    avgOrder: number;
  }[];
  methodTrend: Record<string, number>;
  orderDistribution: { label: string; count: number }[];
};

export type ActivityLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  entityLabel: string | null;
  meta: Record<string, unknown> | null;
  userId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export type ActivityResponse = {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
};

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  image: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
    expenses: number;
    activityLogs: number;
  };
};

export type ProfileStats = {
  totalOrders: number;
  totalRevenue: number;
  last30Orders: number;
  totalExpenses: number;
  recentActivity: ActivityLog[];
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  userId: string | null;
  roles: string[];
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
};

export type SearchResults = {
  products: {
    id: string;
    name: string;
    sku: string;
    price: number;
    category: { name: string; color: string | null } | null;
  }[];
  orders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  points: number;
  createdAt: string;
  updatedAt: string;
  _count: { orders: number };
};

export type CustomerDetail = Customer & {
  pointLogs: LoyaltyLog[];
  orders: Order[];
};

export type LoyaltyLog = {
  id: string;
  customerId: string;
  orderId: string | null;
  points: number;
  type: "EARNED" | "REDEEMED" | "ADJUSTED" | "EXPIRED";
  description: string | null;
  createdAt: string;
};

export type CustomerSearchResult = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  points: number;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    orders: number;
    products: number;
  };
};

export type ReceiptItem = {
  id: string;
  receiptId: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Receipt = {
  id: string;
  receiptNumber: string;
  orderId: string | null;
  branchId: string | null;
  userId: string | null;
  customerId: string | null;
  type: "SALE" | "RETURN" | "COMBINED" | "DUPLICATE";
  status: "ACTIVE" | "VOIDED" | "COMBINED" | "DUPLICATE";
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  voidedAt: string | null;
  voidReason: string | null;
  parentReceiptId: string | null;
  combinedAt: string | null;
  originalReceiptId: string | null;
  note: string | null;
  printCount: number;
  lastPrintedAt: string | null;
  createdAt: string;
  updatedAt: string;

  items: ReceiptItem[];
  user: { id: string; name: string; role: string } | null;
  customer: { id: string; name: string; phone: string | null } | null;
  voidedBy: { id: string; name: string } | null;
  order: {
    payment: {
      amount: number;
      splitPayments: {
        method: string;
        amount: number;
        mpesaRef: string | null;
      }[];
    } | null;
  } | null;
  childReceipts: {
    id: string;
    receiptNumber: string;
    total: number;
    status: string;
  }[];
  parentReceipt: { id: string; receiptNumber: string } | null;
  originalReceipt: { id: string; receiptNumber: string } | null;
  duplicates: { id: string; receiptNumber: string; createdAt: string }[];
};
