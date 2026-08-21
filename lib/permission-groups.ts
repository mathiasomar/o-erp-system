export const PERMISSION_GROUPS: Record<string, string[]> = {
  dashboard: ["dashboard.view"],
  products: [
    "products.view",
    "products.create",
    "products.edit",
    "products.delete",
  ],
  categories: [
    "categories.view",
    "categories.create",
    "categories.edit",
    "categories.delete",
  ],
  orders: ["orders.view", "orders.create", "orders.cancel"],
  inventory: ["inventory.view", "inventory.adjust"],
  expenses: [
    "expenses.view",
    "expenses.create",
    "expenses.edit",
    "expenses.delete",
  ],
  payments: ["payments.view"],
  users: ["users.view", "users.create", "users.edit", "users.delete"],
  reports: ["reports.view"],
  settings: ["settings.view", "settings.edit"],
};
