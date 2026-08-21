import { getSetting } from "@/actions/settings.action";

const key = await getSetting("mpesa_consumer_key");
const secret = await getSetting("mpesa_consumer_secret");
const env = await getSetting("mpesa_env");
const short = await getSetting("mpesa_shortcode");
const passkey = await getSetting("mpesa_passkey");
const callbackUrl = await getSetting("mpesa_callback_url");

const base =
  env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

// ── Get OAuth access token ───────────────────────────────────────────────────
export const getDarajaToken = async (): Promise<string> => {
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${base}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    },
  );

  if (!res.ok) throw new Error("Failed to get Daraja token");
  const data = await res.json();
  return data.access_token;
};

// ── Generate STK Push password ───────────────────────────────────────────────
export function getStkPassword(): { password: string; timestamp: string } {
  const shortcode = short;
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
    "base64",
  );
  return { password, timestamp };
}

// ── STK Push request ─────────────────────────────────────────────────────────
export type StkPushInput = {
  phone: string; // 254XXXXXXXXX format
  amount: number;
  reference: string; // order number
  desc: string;
};

export type StkPushResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

export async function initiateStkPush(
  input: StkPushInput,
): Promise<StkPushResponse> {
  const token = await getDarajaToken();
  const { password, timestamp } = getStkPassword();
  const shortcode = short;

  const res = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(input.amount),
      PartyA: input.phone,
      PartyB: shortcode,
      PhoneNumber: input.phone,
      CallBackURL: callbackUrl,
      AccountReference: input.reference,
      TransactionDesc: input.desc,
    }),
  });

  if (!res.ok) throw new Error("STK Push request failed");
  return res.json();
}

// ── Format phone to 254XXXXXXXXX ────────────────────────────────────────────
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("7") || cleaned.startsWith("1"))
    return `254${cleaned}`;
  throw new Error("Invalid phone number format");
}
