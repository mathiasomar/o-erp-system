import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

const getTransporter = async () => {
  const keys = [
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_password",
    "smtp_from",
    "smtp_from_name",
  ];

  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });

  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  if (!s.smtp_host || !s.smtp_user || !s.smtp_password) {
    return null;
  }

  const port = parseInt(s.smtp_port ?? "587", 10);
  const secure = port === 465; // true for SSL, false for STARTTLS (587)

  const transporter = nodemailer.createTransport({
    host: s.smtp_host,
    port,
    secure,
    // For port 587 Gmail requires STARTTLS — this forces it
    ...(!secure && { requireTLS: true }),
    auth: {
      user: s.smtp_user,
      pass: s.smtp_password, // ← must be App Password, NOT your Gmail password
    },
    // Increase timeouts — Gmail can be slow
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return {
    transporter,
    from: s.smtp_from
      ? `"${s.smtp_from_name || "POS System"}" <${s.smtp_from}>`
      : `"${s.smtp_from_name || "POS System"}" <${s.smtp_user}>`,
  };
};

export const sendEmail = async (payload: EmailPayload): Promise<boolean> => {
  try {
    const config = await getTransporter();
    if (!config) {
      console.warn("[Email] SMTP not configured — skipping");
      return false;
    }

    await config.transporter.sendMail({
      from: config.from,
      to: Array.isArray(payload.to) ? payload.to.join(",") : payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    console.log(`[Email] Sent to ${payload.to}: ${payload.subject}`);
    return true;
  } catch (err) {
    // Log the full error so you can see exactly what Gmail says
    console.error("[Email] Failed to send:", err);
    return false;
  }
};
