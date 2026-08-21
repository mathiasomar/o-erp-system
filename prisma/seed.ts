import "dotenv/config";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// System settings data
const SETTINGS = [
  // ── General ──────────────────────────────────────────────────────────────
  {
    key: "company_name",
    value: "My Company",
    group: "general",
    label: "Company name",
    type: "text",
  },
  {
    key: "company_short_name",
    value: "MC",
    group: "general",
    label: "Short name / initials",
    type: "text",
  },
  {
    key: "company_email",
    value: "",
    group: "general",
    label: "Company email",
    type: "email",
  },
  {
    key: "company_phone",
    value: "",
    group: "general",
    label: "Company phone",
    type: "phone",
  },
  {
    key: "company_address",
    value: "",
    group: "general",
    label: "Physical address",
    type: "text",
  },
  {
    key: "company_website",
    value: "",
    group: "general",
    label: "Website URL",
    type: "url",
  },
  {
    key: "favicon_url",
    value: "",
    group: "general",
    label: "Favicon / web icon",
    type: "image",
  },
  {
    key: "logo_url",
    value: "",
    group: "general",
    label: "Main logo (light mode)",
    type: "image",
  },
  {
    key: "logo_dark_url",
    value: "",
    group: "general",
    label: "Logo (dark mode)",
    type: "image",
  },
  {
    key: "currency",
    value: "KES",
    group: "general",
    label: "Currency code",
    type: "text",
  },
  {
    key: "timezone",
    value: "Africa/Nairobi",
    group: "general",
    label: "Timezone",
    type: "text",
  },
  {
    key: "date_format",
    value: "dd MMM yyyy",
    group: "general",
    label: "Date format",
    type: "text",
  },
  {
    key: "company_till",
    value: "1575255",
    group: "general",
    label: "Till Number",
    type: "text",
  },
  {
    key: "company_paybill",
    value: "",
    group: "general",
    label: "Paybill Number",
    type: "text",
  },
  {
    key: "company_account_number",
    value: "",
    group: "general",
    label: "Account Number",
    type: "text",
  },

  // ── Receipt ───────────────────────────────────────────────────────────────
  {
    key: "receipt_store_name",
    value: "My Store",
    group: "receipt",
    label: "Store name on receipt",
    type: "text",
  },
  {
    key: "receipt_footer",
    value: "Thank you for your purchase!",
    group: "receipt",
    label: "Receipt footer message",
    type: "text",
  },
  {
    key: "receipt_show_logo",
    value: "true",
    group: "receipt",
    label: "Show logo on receipt",
    type: "boolean",
  },
  {
    key: "receipt_show_cashier",
    value: "true",
    group: "receipt",
    label: "Show cashier name",
    type: "boolean",
  },
  {
    key: "receipt_paper_width",
    value: "80mm",
    group: "receipt",
    label: "Thermal paper width",
    type: "text",
  },

  // ── M-Pesa ────────────────────────────────────────────────────────────────
  {
    key: "mpesa_consumer_key",
    value: "9a92ozbGOq1uWihc8GcKKdwtnF9G62RDoSGAOMoj7DuAXVmF",
    group: "mpesa",
    label: "Consumer key",
    type: "secret",
    isSecret: true,
  },
  {
    key: "mpesa_consumer_secret",
    value: "hPP9GkSwqUQTSksDkMWvBnDxyMGfmfGhYBDHKQkX4GDk0YwCR9tXtqRXOUeP6ne8",
    group: "mpesa",
    label: "Consumer secret",
    type: "secret",
    isSecret: true,
  },
  {
    key: "mpesa_shortcode",
    value: "174379",
    group: "mpesa",
    label: "Business shortcode",
    type: "text",
  },
  {
    key: "mpesa_passkey",
    value: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    group: "mpesa",
    label: "Lipa na M-Pesa passkey",
    type: "secret",
    isSecret: true,
  },
  {
    key: "mpesa_callback_url",
    value: "https://o-pos.vercel.app/api/mpesa/callback",
    group: "mpesa",
    label: "Callback URL",
    type: "url",
  },
  {
    key: "mpesa_env",
    value: "sandbox",
    group: "mpesa",
    label: "Environment",
    type: "text",
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  {
    key: "notify_low_stock",
    value: "true",
    group: "notifications",
    label: "Low stock alerts",
    type: "boolean",
  },
  {
    key: "low_stock_threshold",
    value: "10",
    group: "notifications",
    label: "Default low stock level",
    type: "number",
  },
  {
    key: "notify_new_order",
    value: "true",
    group: "notifications",
    label: "New order alerts",
    type: "boolean",
  },
  {
    key: "notify_email",
    value: "",
    group: "notifications",
    label: "Alert email address",
    type: "email",
  },

  // ── Security ──────────────────────────────────────────────────────────────
  {
    key: "session_timeout",
    value: "7",
    group: "security",
    label: "Session timeout (days)",
    type: "number",
  },
  {
    key: "require_email_verify",
    value: "false",
    group: "security",
    label: "Require email verification",
    type: "boolean",
  },
  {
    key: "max_login_attempts",
    value: "5",
    group: "security",
    label: "Max login attempts",
    type: "number",
  },

  // ── Business ──────────────────────────────────────────────────────────────
  {
    key: "tax_rate",
    value: "16",
    group: "business",
    label: "Default tax rate (%)",
    type: "number",
  },
  {
    key: "tax_name",
    value: "VAT",
    group: "business",
    label: "Tax name",
    type: "text",
  },
  {
    key: "business_type",
    value: "retail",
    group: "business",
    label: "Business type",
    type: "text",
  },
  {
    key: "fiscal_year_start",
    value: "01-01",
    group: "business",
    label: "Fiscal year start (MM-DD)",
    type: "text",
  },
  {
    key: "enable_discounts",
    value: "true",
    group: "business",
    label: "Enable discounts",
    type: "boolean",
  },
  {
    key: "enable_tax",
    value: "true",
    group: "business",
    label: "Enable tax",
    type: "boolean",
  },

  // ── Cloudinary ────────────────────────────────────────────────────────────
  {
    key: "cloudinary_cloud_name",
    value: "dh8uoaydo",
    group: "cloudinary",
    label: "Cloud name",
    type: "text",
  },
  {
    key: "cloudinary_api_key",
    value: "113723455899474",
    group: "cloudinary",
    label: "API key",
    type: "secret",
    isSecret: true,
  },
  {
    key: "cloudinary_api_secret",
    value: "g3fze39qc8oJ068LTy_r3IOnFdg",
    group: "cloudinary",
    label: "API secret",
    type: "secret",
    isSecret: true,
  },
  {
    key: "cloudinary_upload_preset",
    value: "point-of-sale",
    group: "cloudinary",
    label: "Upload preset",
    type: "text",
  },
  // ── Email ─────────────────────────────────────────────────────────
  {
    key: "smtp_host",
    value: "",
    group: "notifications",
    label: "SMTP host",
    type: "text",
  },
  {
    key: "smtp_port",
    value: "587",
    group: "notifications",
    label: "SMTP port",
    type: "number",
  },
  {
    key: "smtp_user",
    value: "",
    group: "notifications",
    label: "SMTP username",
    type: "text",
  },
  {
    key: "smtp_password",
    value: "",
    group: "notifications",
    label: "SMTP password",
    type: "secret",
    isSecret: true,
  },
  {
    key: "smtp_from",
    value: "",
    group: "notifications",
    label: "From email address",
    type: "email",
  },
  {
    key: "smtp_from_name",
    value: "POS System",
    group: "notifications",
    label: "From name",
    type: "text",
  },
];

const PERMISSIONS = [
  // Dashboard
  { key: "dashboard.view", label: "View dashboard", group: "dashboard" },

  // Products
  { key: "products.view", label: "View products", group: "products" },
  { key: "products.create", label: "Create products", group: "products" },
  { key: "products.edit", label: "Edit products", group: "products" },
  { key: "products.delete", label: "Delete products", group: "products" },

  // Categories
  { key: "categories.view", label: "View categories", group: "categories" },
  { key: "categories.create", label: "Create categories", group: "categories" },
  { key: "categories.edit", label: "Edit categories", group: "categories" },
  { key: "categories.delete", label: "Delete categories", group: "categories" },

  // Orders
  { key: "orders.view", label: "View orders", group: "orders" },
  { key: "orders.create", label: "Create orders (POS)", group: "orders" },
  { key: "orders.cancel", label: "Cancel orders", group: "orders" },

  // Inventory
  { key: "inventory.view", label: "View inventory", group: "inventory" },
  { key: "inventory.adjust", label: "Adjust stock levels", group: "inventory" },

  // Expenses
  { key: "expenses.view", label: "View expenses", group: "expenses" },
  { key: "expenses.create", label: "Create expenses", group: "expenses" },
  { key: "expenses.edit", label: "Edit expenses", group: "expenses" },
  { key: "expenses.delete", label: "Delete expenses", group: "expenses" },

  // Payments
  { key: "payments.view", label: "View payments", group: "payments" },
  { key: "mpesa.view", label: "View M-Pesa payments", group: "payments" },

  // Users
  { key: "users.view", label: "View users", group: "users" },
  { key: "users.create", label: "Create users", group: "users" },
  { key: "users.edit", label: "Edit users", group: "users" },
  { key: "users.delete", label: "Delete users", group: "users" },

  // Reports
  { key: "reports.view", label: "View reports & analytics", group: "reports" },

  // AI
  { key: "ai.view", label: "View AI", group: "ai" },

  // Settings
  { key: "settings.view", label: "View settings", group: "settings" },
  { key: "settings.edit", label: "Edit settings", group: "settings" },

  // Exports
  { key: "exports.download", label: "Download exports", group: "exports" },

  // Customer
  { key: "customers.view", label: "View customers", group: "customers" },
  { key: "customers.create", label: "Create customers", group: "customers" },
  { key: "customers.edit", label: "Edit customers", group: "customers" },
  { key: "customers.delete", label: "Delete customers", group: "customers" },

  // ── NEW — Branches ──────────────────────────────────────────────────────
  { key: "branches.view", label: "View branches", group: "branches" },
  { key: "branches.create", label: "Create branches", group: "branches" },
  { key: "branches.edit", label: "Edit branches", group: "branches" },

  // ─── NEW — Purchase ────────────────────────────────────────────────────────
  { key: "purchases.view", label: "View purchases", group: "purchases" },

  // ─── NEW — Suppliers ────────────────────────────────────────────────────────
  { key: "suppliers.view", label: "View suppliers", group: "suppliers" },
  { key: "suppliers.create", label: "Create suppliers", group: "suppliers" },
  { key: "suppliers.edit", label: "Edit suppliers", group: "suppliers" },
  { key: "suppliers.delete", label: "Delete suppliers", group: "suppliers" },

  // ─── NEW — Receipt ────────────────────────────────────────────────────────
  { key: "receipts.view", label: "View receipts", group: "receipts" },
  { key: "receipts.combine", label: "Combine receipts", group: "receipts" },
  { key: "receipts.reprint", label: "Reprint receipts", group: "receipts" },
  { key: "receipts.void", label: "Void receipts", group: "receipts" },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: PERMISSIONS.map((p) => p.key), // admin gets everything

  MANAGER: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.edit",
    "categories.view",
    "categories.create",
    "categories.edit",
    "orders.view",
    "orders.create",
    "orders.cancel",
    "inventory.view",
    "inventory.adjust",
    "expenses.view",
    "expenses.create",
    "expenses.edit",
    "payments.view",
    "mpesa.view",
    "reports.view",
    "settings.view",
    "settings.edit",
    "exports.download",
    "customers.view",
    "customers.create",
    "customers.edit",
    "customers.delete",
    "ai.view",
    "purchases.view",
    "suppliers.view",
    "suppliers.create",
    "suppliers.edit",
    "suppliers.delete",
    "receipts.view",
    "receipts.combine",
    "receipts.reprint",
    "receipts.void",
  ],

  CASHIER: [
    "products.view",
    "orders.view",
    "orders.create",
    "inventory.view",
    "payments.view",
    "mpesa.view",
    "customers.view",
    "customers.create",
    "customers.edit",
    "receipts.view",
  ],
};

async function seedPermissions() {
  console.log("🔐 Seeding permissions...");

  // Upsert all permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { label: perm.label, group: perm.group },
      create: perm,
    });
  }

  // Upsert role-permission assignments
  for (const [role, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const key of keys) {
      const permission = await prisma.permission.findUnique({
        where: { key },
      });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { role, permissionId: permission.id },
      });
    }
  }

  console.log(`✅ ${PERMISSIONS.length} permissions seeded`);
  console.log(`✅ Role assignments complete`);
}

async function seedSystemSettings() {
  console.log("📦 Seeding system settings...");

  for (const setting of SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {}, // Don't overwrite existing values
      create: {
        key: setting.key,
        value: setting.value,
        group: setting.group,
        label: setting.label,
        type: setting.type,
        isSecret: setting.isSecret ?? false,
      },
    });
  }

  console.log(`✅ ${SETTINGS.length} system settings seeded`);
}

// ── NEW — Branch seeding + data migration ─────────────────────────────────────

async function seedDefaultBranch() {
  console.log("🏢 Seeding default branch...");

  // 1 — Ensure a default branch exists
  let branch = await prisma.branch.findFirst({
    where: { isDefault: true },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: "Main Branch",
        code: "MAIN",
        isDefault: true,
        isActive: true,
      },
    });
    console.log(`✅ Created default branch: ${branch.name} (${branch.code})`);
  } else {
    console.log(`📝 Default branch already exists: ${branch.name}`);
  }

  // 2 — Migrate any orphaned data (records created before branches existed)
  const [
    categoriesUpdated,
    productsUpdated,
    ordersUpdated,
    expensesUpdated,
    customersUpdated,
    stocksUpdated,
    usersUpdated,
  ] = await Promise.all([
    prisma.category.updateMany({
      where: { branchId: null },
      data: { branchId: branch.id },
    }),
    prisma.product.updateMany({
      where: { branchId: null },
      data: { branchId: branch.id },
    }),
    prisma.order.updateMany({
      where: { branchId: null },
      data: { branchId: branch.id },
    }),
    prisma.expense.updateMany({
      where: { branchId: null },
      data: { branchId: branch.id },
    }),
    prisma.customer.updateMany({
      where: { branchId: null },
      data: { branchId: branch.id },
    }),
    prisma.stock.updateMany({
      where: { branchId: null },
      data: { branchId: branch.id },
    }),
    prisma.user.updateMany({
      where: { branchId: null, role: { not: "ADMIN" } },
      data: { branchId: branch.id },
    }),
  ]);

  const migratedCounts = {
    categories: categoriesUpdated.count,
    products: productsUpdated.count,
    orders: ordersUpdated.count,
    expenses: expensesUpdated.count,
    customers: customersUpdated.count,
    stocks: stocksUpdated.count,
    users: usersUpdated.count,
  };

  const totalMigrated = Object.values(migratedCounts).reduce(
    (sum, n) => sum + n,
    0,
  );

  if (totalMigrated > 0) {
    console.log(`✅ Migrated existing data to default branch:`);
    for (const [entity, count] of Object.entries(migratedCounts)) {
      if (count > 0) console.log(`   - ${entity}: ${count}`);
    }
  } else {
    console.log(`📝 No orphaned data to migrate`);
  }

  return branch;
}

async function seedAdminUser() {
  const email = "admin@admin.com";
  const password = "Admin@1234";
  const username = "admin";
  const displayUsername = "Administrator";

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existingUser) {
    console.log(`📝 Admin user already exists: ${existingUser.email}`);
    return;
  }

  // Create admin user using Better Auth
  await auth.api.signUpEmail({
    body: {
      email: email,
      password: password,
      name: "Admin User",
      username: username,
      displayUsername: displayUsername,
    },
  });

  // Update role to ADMIN and verify email
  // NOTE: branchId left null — ADMIN has global access, not tied to a branch
  await prisma.user.update({
    where: { email: email },
    data: { role: "ADMIN", emailVerified: true, branchId: null },
  });

  console.log(`✅ Admin user created successfully:`);
  console.log(`\n🔐 Login credentials:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Username: ${username}`);
}

async function main() {
  // Only seed in production if explicitly enabled
  if (process.env.NODE_ENV === "production" && !process.env.SEED_DB) {
    console.log("⏭️ Skipping seed in production. Set SEED_DB=true to enable.");
    return;
  }

  console.log("🌱 Starting database seeding...\n");

  // Seed default branch + migrate any orphaned data
  // Must run BEFORE products/orders/etc. seeds if you add demo data later,
  // and before admin user creation isn't required, but keeping it first
  // ensures branchId is always available for anything seeded after.
  await seedDefaultBranch();

  console.log("");

  // Seed system settings
  await seedSystemSettings();

  console.log(""); // Empty line for spacing

  // Seed admin user
  await seedAdminUser();

  console.log("");

  // Seed permissions and role assignments
  await seedPermissions();

  console.log("\n✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
