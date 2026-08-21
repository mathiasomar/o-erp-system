import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

export const POST = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 });
    }

    // Read all settings we need
    const rows = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "smtp_host",
            "smtp_port",
            "smtp_user",
            "smtp_password",
            "smtp_from",
            "smtp_from_name",
            "notify_email",
            "company_name",
          ],
        },
      },
      select: { key: true, value: true },
    });

    const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    // Validate required fields
    if (!s.smtp_host) {
      return NextResponse.json(
        { message: "SMTP host is not configured" },
        { status: 400 },
      );
    }
    if (!s.smtp_user) {
      return NextResponse.json(
        { message: "SMTP username is not configured" },
        { status: 400 },
      );
    }
    if (!s.smtp_password) {
      return NextResponse.json(
        { message: "SMTP password is not configured" },
        { status: 400 },
      );
    }
    if (!s.notify_email) {
      return NextResponse.json(
        { message: "Alert email address is not configured" },
        { status: 400 },
      );
    }

    const port = parseInt(s.smtp_port ?? "587", 10);
    const secure = port === 465;
    const storeName = s.company_name || "POS System";
    const to = s.notify_email;

    // Build transporter inline so we can surface the exact error
    const transporter = nodemailer.createTransport({
      host: s.smtp_host,
      port,
      secure,
      ...(!secure && { requireTLS: true }),
      auth: {
        user: s.smtp_user,
        pass: s.smtp_password,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    // Verify connection before trying to send
    try {
      await transporter.verify();
    } catch (verifyErr) {
      const message =
        verifyErr instanceof Error
          ? verifyErr.message
          : "SMTP connection failed";

      return NextResponse.json(
        { message: `SMTP connection failed: ${message}` },
        { status: 500 },
      );
    }

    // Send the test
    const from = s.smtp_from
      ? `"${s.smtp_from_name || storeName}" <${s.smtp_from}>`
      : `"${s.smtp_from_name || storeName}" <${s.smtp_user}>`;

    await transporter.sendMail({
      from,
      to,
      subject: `Test email from ${storeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <div style="background:#000;color:#fff;padding:20px;
                      border-radius:8px 8px 0 0;">
            <h2 style="margin:0;">Test email</h2>
            <p style="margin:4px 0 0;opacity:0.7;font-size:13px;">
              ${storeName}
            </p>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #e5e5e5;
                      border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin-top:0;">
              Your email notifications are working correctly.
            </p>
            <p>You will receive alerts for:</p>
            <ul>
              <li>New orders (if enabled)</li>
              <li>Low stock / out of stock alerts (if enabled)</li>
              <li>New expenses</li>
            </ul>
            <p style="color:#666;font-size:12px;margin-top:20px;">
              Sent from ${storeName} POS System
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      message: `Test email sent successfully to ${to}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Test email] Error:", err);
    return NextResponse.json(
      { message: `Failed: ${message}` },
      { status: 500 },
    );
  }
};
