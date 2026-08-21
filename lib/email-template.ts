type OrderEmailData = {
  orderNumber: string;
  total: number;
  items: { name: string; qty: number; price: number }[];
  paymentMethod: string;
  cashierName: string;
  branchName: string;
  storeName: string;
};

type LowStockEmailData = {
  products: {
    name: string;
    sku: string;
    quantity: number;
    threshold: number;
  }[];
  branchName: string;
  storeName: string;
};

type ExpenseEmailData = {
  title: string;
  amount: number;
  category: string;
  addedBy: string;
  branchName: string;
  storeName: string;
};

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 560px; margin: 0 auto; color: #1a1a1a;
`;
const headerStyle = `
  background: #000; color: #fff; padding: 20px 24px;
  border-radius: 8px 8px 0 0;
`;
const bodyStyle = `
  background: #fff; padding: 24px; border: 1px solid #e5e5e5;
  border-top: none; border-radius: 0 0 8px 8px;
`;
const labelStyle = `color: #666; font-size: 12px; text-transform: uppercase;
  letter-spacing: 0.5px; margin-bottom: 2px;`;
const valueStyle = `font-size: 16px; font-weight: 600; margin-bottom: 12px;`;
const tableStyle = `
  width: 100%; border-collapse: collapse; margin: 16px 0;
  font-size: 14px;
`;
const thStyle = `
  text-align: left; padding: 8px 12px; background: #f5f5f5;
  border-bottom: 1px solid #e5e5e5; font-weight: 600;
`;
const tdStyle = `
  padding: 8px 12px; border-bottom: 1px solid #f0f0f0;
`;

export const newOrderTemplate = (data: OrderEmailData): string => `
<div style="${baseStyle}">
  <div style="${headerStyle}">
    <h2 style="margin:0;font-size:18px;">New order — ${data.orderNumber}</h2>
    <p style="margin:4px 0 0;opacity:0.7;font-size:13px;">${data.storeName} · ${data.branchName}</p>
  </div>
  <div style="${bodyStyle}">
    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:16px;">
      <div>
        <p style="${labelStyle}">Total</p>
        <p style="${valueStyle}">KES ${data.total.toLocaleString()}</p>
      </div>
      <div>
        <p style="${labelStyle}">Payment</p>
        <p style="${valueStyle}">${data.paymentMethod}</p>
      </div>
      <div>
        <p style="${labelStyle}">Cashier</p>
        <p style="${valueStyle}">${data.cashierName}</p>
      </div>
    </div>

    <table style="${tableStyle}">
      <thead>
        <tr>
          <th style="${thStyle}">Item</th>
          <th style="${thStyle}">Qty</th>
          <th style="${thStyle};text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (item) => `
          <tr>
            <td style="${tdStyle}">${item.name}</td>
            <td style="${tdStyle}">${item.qty}</td>
            <td style="${tdStyle};text-align:right;">
              KES ${(item.qty * item.price).toLocaleString()}
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>

    <p style="color:#666;font-size:12px;margin-top:20px;">
      This is an automated notification from ${data.storeName}.
    </p>
  </div>
</div>
`;

export const lowStockTemplate = (data: LowStockEmailData): string => `
<div style="${baseStyle}">
  <div style="${headerStyle.replace("#000", "#dc2626")}">
    <h2 style="margin:0;font-size:18px;">⚠ Low stock alert</h2>
    <p style="margin:4px 0 0;opacity:0.7;font-size:13px;">${data.storeName} · ${data.branchName}</p>
  </div>
  <div style="${bodyStyle}">
    <p style="margin-top:0;">
      The following products are running low and need to be restocked:
    </p>

    <table style="${tableStyle}">
      <thead>
        <tr>
          <th style="${thStyle}">Product</th>
          <th style="${thStyle}">SKU</th>
          <th style="${thStyle}">In stock</th>
          <th style="${thStyle}">Alert at</th>
        </tr>
      </thead>
      <tbody>
        ${data.products
          .map(
            (p) => `
          <tr>
            <td style="${tdStyle}">${p.name}</td>
            <td style="${tdStyle};font-family:monospace;font-size:12px;">${p.sku}</td>
            <td style="${tdStyle};color:${p.quantity === 0 ? "#dc2626" : "#f97316"};font-weight:600;">
              ${p.quantity === 0 ? "OUT OF STOCK" : p.quantity}
            </td>
            <td style="${tdStyle};color:#666;">${p.threshold}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>

    <p style="color:#666;font-size:12px;margin-top:20px;">
      This is an automated notification from ${data.storeName}.
    </p>
  </div>
</div>
`;

export const expenseTemplate = (data: ExpenseEmailData): string => `
<div style="${baseStyle}">
  <div style="${headerStyle.replace("#000", "#7c3aed")}">
    <h2 style="margin:0;font-size:18px;">New expense recorded</h2>
    <p style="margin:4px 0 0;opacity:0.7;font-size:13px;">${data.storeName} · ${data.branchName}</p>
  </div>
  <div style="${bodyStyle}">
    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:16px;">
      <div>
        <p style="${labelStyle}">Title</p>
        <p style="${valueStyle}">${data.title}</p>
      </div>
      <div>
        <p style="${labelStyle}">Amount</p>
        <p style="${valueStyle};color:#dc2626;">KES ${data.amount.toLocaleString()}</p>
      </div>
      <div>
        <p style="${labelStyle}">Category</p>
        <p style="${valueStyle}">${data.category}</p>
      </div>
      <div>
        <p style="${labelStyle}">Added by</p>
        <p style="${valueStyle}">${data.addedBy}</p>
      </div>
    </div>
    <p style="color:#666;font-size:12px;margin-top:20px;">
      This is an automated notification from ${data.storeName}.
    </p>
  </div>
</div>
`;
