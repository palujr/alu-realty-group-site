import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteSettings } from "@/lib/site-settings";

type ValuationRequest = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  message?: string;
  sourcePage?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

function parseEmailList(value?: string) {
  return (value || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);
}

function escapeHtml(value?: string | null) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendResendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  from
}: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  from: string;
}) {
  if (!resendApiKey) {
    return { skipped: true, reason: "RESEND_API_KEY is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend email failed: ${details}`);
  }

  return response.json();
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 500 }
    );
  }

  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    return NextResponse.json(
      { error: "Supabase project URL is not configured correctly. It should look like https://your-project-id.supabase.co." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as ValuationRequest;
  const email = body.email?.trim();
  const propertyAddress = body.address?.trim();
  const fullName = body.name?.trim() || "there";
  const phone = body.phone?.trim();
  const message = body.message?.trim();
  const sourcePage = body.sourcePage?.trim() || "home";
  const siteSettings = await getSiteSettings();
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || siteSettings.resendFromEmail;
  const leadReplyToEmail = process.env.LEAD_REPLY_TO_EMAIL || siteSettings.leadReplyToEmail;
  const leadNotificationEmails = parseEmailList(process.env.LEAD_NOTIFICATION_EMAILS)
    .concat(process.env.LEAD_NOTIFICATION_EMAILS ? [] : siteSettings.leadNotificationEmails);

  if (!email || !propertyAddress) {
    return NextResponse.json(
      { error: "Email and property address are required." },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.from("lead_submissions").insert({
    lead_type: "valuation",
    full_name: body.name?.trim() || null,
    email,
    phone: phone || null,
    property_address: propertyAddress,
    message: message || null,
    source_page: sourcePage
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const safeName = escapeHtml(fullName);
  const safeAddress = escapeHtml(propertyAddress);
  const safePhone = escapeHtml(phone || "Not provided");
  const safeMessage = escapeHtml(message || "No additional notes provided.");
  const safeSourcePage = escapeHtml(sourcePage);

  const clientEmail = sendResendEmail({
    to: email,
    from: resendFromEmail,
    replyTo: leadReplyToEmail,
    subject: "We received your home valuation request",
    text: `Hi ${fullName},

Thank you for requesting a home valuation from Alu Realty Group.

We received your request for:
${propertyAddress}

Phil or Denise will review the details and follow up with a personal home value review.

Alu Realty Group
Fathom Realty Elite`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12201a; max-width: 620px;">
        <h1 style="font-size: 26px; margin-bottom: 12px;">We received your home valuation request.</h1>
        <p>Hi ${safeName},</p>
        <p>Thank you for requesting a home valuation from <strong>Alu Realty Group</strong>.</p>
        <p style="padding: 16px 18px; background: #f6f1e8; border-left: 5px solid #c75b31;">
          <strong>Property:</strong><br />${safeAddress}
        </p>
        <p>Phil or Denise will review the details and follow up with a personal home value review.</p>
        <p style="margin-top: 28px;">Alu Realty Group<br />Fathom Realty Elite</p>
      </div>
    `
  });

  const internalEmail = leadNotificationEmails.length
    ? sendResendEmail({
        to: leadNotificationEmails,
        from: resendFromEmail,
        replyTo: email,
        subject: `New valuation request: ${propertyAddress}`,
        text: `New valuation request

Name: ${fullName}
Email: ${email}
Phone: ${phone || "Not provided"}
Property: ${propertyAddress}
Message: ${message || "No additional notes provided."}
Source page: ${sourcePage}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12201a; max-width: 680px;">
            <h1 style="font-size: 24px; margin-bottom: 12px;">New valuation request</h1>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Name</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${safeName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Email</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${escapeHtml(email)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Phone</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${safePhone}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Property</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${safeAddress}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Message</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${safeMessage}</td></tr>
              <tr><td style="padding: 8px;"><strong>Source page</strong></td><td style="padding: 8px;">${safeSourcePage}</td></tr>
            </table>
          </div>
        `
      })
    : Promise.resolve({ skipped: true, reason: "No lead notification emails configured." });

  const emailResults = await Promise.allSettled([clientEmail, internalEmail]);

  return NextResponse.json({
    ok: true,
    email: emailResults.map((result) => result.status)
  });
}
