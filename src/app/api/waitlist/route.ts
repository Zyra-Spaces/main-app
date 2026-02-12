import { google } from "googleapis";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // ---------------------------
    // 1️⃣ Save to Google Sheets (if configured)
    // ---------------------------

    if (
      process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID
    ) {
      // Normalize key: handle \n, CRLF, trim
      const key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

      const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        undefined,
        key,
        ["https://www.googleapis.com/auth/spreadsheets"]
      );

      const sheets = google.sheets({ version: "v4", auth });

      // Check for duplicate (optional)
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A:A",
      });

      const emails = existing.data.values?.flat() ?? [];
      if (emails.some((e) => e?.toString().toLowerCase() === trimmedEmail)) {
        return NextResponse.json({ success: true });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A:C",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[trimmedEmail, new Date().toISOString(), "New"]],
        },
      });
    }

    // ---------------------------
    // 2️⃣ Send Confirmation Email (if configured)
    // ---------------------------

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Zyra" <${process.env.EMAIL_USER}>`,
        to: trimmedEmail,
        subject: "You're on the Zyra waitlist 🚀",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #0a0a0a; margin-bottom: 16px;">Welcome to Zyra</h2>
            <p style="color: #171717; line-height: 1.6;">
              You're now officially on our early access waitlist.
            </p>
            <p style="color: #171717; line-height: 1.6;">
              We'll notify you as soon as we launch. Where builders meet builders.
            </p>
            <br/>
            <p style="color: #525252; font-size: 14px;">— The Zyra Team</p>
          </div>
        `,
      });

      // Optional: Admin notification
      if (process.env.ADMIN_EMAIL) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: "New Zyra Waitlist Signup",
          text: `New signup: ${trimmedEmail}`,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[waitlist]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
