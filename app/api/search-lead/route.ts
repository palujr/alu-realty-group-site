import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteSettings } from "@/lib/site-settings";

type SearchLeadRequest = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  wantsAlerts?: boolean;
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

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueEmails(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
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

  const body = (await request.json()) as SearchLeadRequest;
  const email = body.email?.trim();
  const fullName = body.name?.trim() || "there";
  const phone = body.phone?.trim();
  const message = body.message?.trim();
  const sourcePage = body.sourcePage?.trim() || "saved_search";
  const wantsAlerts = body.wantsAlerts !== false;

  if (!email) {
    return NextResponse.json(
      { error: "Email address is required." },
      { status: 400 }
    );
  }

  const siteSettings = await getSiteSettings();
  const routing = siteSettings.leadRouting;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || siteSettings.resendFromEmail;
  const leadReplyToEmail = process.env.LEAD_REPLY_TO_EMAIL || siteSettings.leadReplyToEmail;
  const envLeadNotificationEmails = parseEmailList(process.env.LEAD_NOTIFICATION_EMAILS);
  const manualLeadNotificationEmails = routing.defaultNotificationEmails;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const assignedTeamMemberSlug = routing.defaultAssignedTeamMemberSlug;
  let assignedTeamMemberId: string | null = null;
  let teamMemberNotificationEmails: string[] = [];

  const routingTeamMemberSlugs = uniqueValues([
    assignedTeamMemberSlug,
    ...routing.defaultNotificationTeamMemberSlugs
  ]);

  if (routingTeamMemberSlugs.length) {
    const { data: routingTeamMembers } = await supabase
      .from("team_members")
      .select("id, slug, email")
      .in("slug", routingTeamMemberSlugs)
      .eq("is_active", true)
      .is("deleted_at", null);

    assignedTeamMemberId = routingTeamMembers?.find((member) => member.slug === assignedTeamMemberSlug)?.id || null;
    teamMemberNotificationEmails = (routingTeamMembers || [])
      .map((member) => member.email)
      .filter(Boolean) as string[];
  }

  const leadNotificationEmails = uniqueEmails([
    ...envLeadNotificationEmails,
    ...manualLeadNotificationEmails,
    ...teamMemberNotificationEmails
  ]);

  const leadMessage = [
    message ? `Search notes: ${message}` : "Search notes: Not provided",
    `Listing alerts requested: ${wantsAlerts ? "Yes" : "No"}`
  ].join("\n");

  const { error } = await supabase.from("lead_submissions").insert({
    lead_type: "buyer",
    full_name: body.name?.trim() || null,
    email,
    phone: phone || null,
    property_address: "Custom property search request",
    message: leadMessage,
    source_page: sourcePage,
    lead_source_category: "website",
    lead_source_detail: "Saved search / custom property search",
    preferred_contact_method: "email",
    assigned_team_member_id: assignedTeamMemberId
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || "Not provided");
  const safeMessage = escapeHtml(message || "No search notes provided.");
  const safeSourcePage = escapeHtml(sourcePage);

  const clientEmail = routing.sendClientConfirmation
    ? sendResendEmail({
        to: email,
        from: resendFromEmail,
        replyTo: leadReplyToEmail,
        subject: "We received your custom property search request",
        text: `Hi ${fullName},

Thank you for requesting a custom property search from Alu Realty Group.

We received your request and will follow up with property matches and next steps.

Search notes:
${message || "No search notes provided."}

Alu Realty Group
Fathom Realty Elite`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12201a; max-width: 620px;">
            <h1 style="font-size: 26px; margin-bottom: 12px;">We received your custom property search request.</h1>
            <p>Hi ${safeName},</p>
            <p>Thank you for requesting a custom property search from <strong>Alu Realty Group</strong>.</p>
            <p>We will follow up with property matches and next steps.</p>
            <p style="padding: 16px 18px; background: #f6f1e8; border-left: 5px solid #c75b31;">
              <strong>Search notes:</strong><br />${safeMessage}
            </p>
            <p style="margin-top: 28px;">Alu Realty Group<br />Fathom Realty Elite</p>
          </div>
        `
      })
    : Promise.resolve({ skipped: true, reason: "Client confirmation emails are disabled." });

  const internalEmail = routing.sendInternalNotification && leadNotificationEmails.length
    ? sendResendEmail({
        to: leadNotificationEmails,
        from: resendFromEmail,
        replyTo: email,
        subject: `New buyer search request: ${fullName}`,
        text: `New buyer search request

Name: ${fullName}
Email: ${email}
Phone: ${phone || "Not provided"}
Search notes: ${message || "No search notes provided."}
Listing alerts requested: ${wantsAlerts ? "Yes" : "No"}
Source page: ${sourcePage}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12201a; max-width: 680px;">
            <h1 style="font-size: 24px; margin-bottom: 12px;">New buyer search request</h1>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Name</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${safeName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Email</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${safeEmail}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Phone</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${safePhone}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Search notes</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${safeMessage}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;"><strong>Listing alerts</strong></td><td style="padding: 8px; border-bottom: 1px solid #e6e0d5;">${wantsAlerts ? "Yes" : "No"}</td></tr>
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
