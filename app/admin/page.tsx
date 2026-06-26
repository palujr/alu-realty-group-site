import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteBanner, getSiteSettings } from "@/lib/site-settings";
import { AdminStatusCleanup } from "./AdminStatusCleanup";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type AdminLead = {
  id: string;
  lead_type: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  property_address: string | null;
  message: string | null;
  source_page: string | null;
  assigned_team_member_id: string | null;
  contact_status: string;
  preferred_contact_method: string | null;
  contact_notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  team_members: { full_name: string | null } | { full_name: string | null }[] | null;
};

type AdminBanner = {
  id: string;
  campaign_name: string;
  eyebrow: string | null;
  headline: string;
  body: string | null;
  theme: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number;
};

type AdminTeamMember = {
  id: string;
  slug: string;
  full_name: string;
  title: string;
  phone: string | null;
  email: string | null;
  bio: string | null;
  photo_url: string | null;
  specialties: string[];
  display_order: number;
  is_active: boolean;
};

type AdminTestimonial = {
  id: string;
  team_member_id: string | null;
  scope: string;
  client_name: string;
  context: string | null;
  quote: string;
  rating: number | null;
  is_featured: boolean;
  is_published: boolean;
};

const leadStatusOptions = [
  { value: "new", label: "New" },
  { value: "assigned", label: "Assigned" },
  { value: "contacted", label: "Contacted" },
  { value: "verified", label: "Verified" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" }
];

const contactMethodOptions = [
  { value: "", label: "Not set" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text" },
  { value: "in_person", label: "In person" },
  { value: "other", label: "Other" }
];

function formatDate(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getAssignedName(lead: AdminLead) {
  if (Array.isArray(lead.team_members)) {
    return lead.team_members[0]?.full_name || "Unassigned";
  }

  return lead.team_members?.full_name || "Unassigned";
}

function asOptionalString(value: FormDataEntryValue | null) {
  const stringValue = value?.toString().trim() || "";
  return stringValue || null;
}

function asSpecialtyArray(value: FormDataEntryValue | null) {
  return (value?.toString() || "")
    .split(/[\n,]/)
    .map((specialty) => specialty.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeLeadStatus(value: FormDataEntryValue | null) {
  const status = value?.toString() || "new";
  const allowedStatuses = ["new", "assigned", "contacted", "verified", "in_progress", "completed", "archived"];
  return allowedStatuses.includes(status) ? status : "new";
}

function normalizeContactMethod(value: FormDataEntryValue | null) {
  const method = value?.toString() || "";
  const allowedMethods = ["email", "phone", "text", "in_person", "other"];
  return allowedMethods.includes(method) ? method : null;
}

function asOptionalDateTime(value: FormDataEntryValue | null) {
  const stringValue = value?.toString().trim() || "";
  return stringValue ? new Date(stringValue).toISOString() : null;
}

async function createValuationLead(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?leadStatus=error#new-valuation");
  }

  const email = asOptionalString(formData.get("email"));
  const phone = asOptionalString(formData.get("phone"));
  const propertyAddress = asOptionalString(formData.get("propertyAddress"));

  if (!propertyAddress || (!email && !phone)) {
    redirect("/admin?leadStatus=error#new-valuation");
  }

  const { data, error } = await adminSupabase
    .from("lead_submissions")
    .insert({
      lead_type: "valuation",
      full_name: asOptionalString(formData.get("fullName")),
      email,
      phone,
      property_address: propertyAddress,
      message: asOptionalString(formData.get("message")),
      source_page: "admin_manual",
      assigned_team_member_id: asOptionalString(formData.get("assignedTeamMemberId")),
      contact_status: normalizeLeadStatus(formData.get("contactStatus")),
      preferred_contact_method: normalizeContactMethod(formData.get("preferredContactMethod")),
      contact_notes: asOptionalString(formData.get("contactNotes")),
      last_contacted_at: asOptionalDateTime(formData.get("lastContactedAt"))
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect("/admin?leadStatus=error#new-valuation");
  }

  revalidatePath("/admin");
  redirect(`/admin?leadStatus=saved&leadId=${data.id}#lead-${data.id}`);
}

async function updateValuationLead(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?leadStatus=error#lead-inbox");
  }

  const leadId = formData.get("leadId")?.toString();
  const propertyAddress = asOptionalString(formData.get("propertyAddress"));
  const email = asOptionalString(formData.get("email"));
  const phone = asOptionalString(formData.get("phone"));

  if (!leadId || !propertyAddress || (!email && !phone)) {
    redirect("/admin?leadStatus=error#lead-inbox");
  }

  const { error } = await adminSupabase
    .from("lead_submissions")
    .update({
      full_name: asOptionalString(formData.get("fullName")),
      email,
      phone,
      property_address: propertyAddress,
      message: asOptionalString(formData.get("message")),
      assigned_team_member_id: asOptionalString(formData.get("assignedTeamMemberId")),
      contact_status: normalizeLeadStatus(formData.get("contactStatus")),
      preferred_contact_method: normalizeContactMethod(formData.get("preferredContactMethod")),
      contact_notes: asOptionalString(formData.get("contactNotes")),
      last_contacted_at: asOptionalDateTime(formData.get("lastContactedAt"))
    })
    .eq("id", leadId);

  if (error) {
    redirect("/admin?leadStatus=error#lead-inbox");
  }

  revalidatePath("/admin");
  redirect(`/admin?leadStatus=saved&leadId=${leadId}#lead-${leadId}`);
}

async function createBannerCampaign(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?bannerStatus=error#new-banner-campaign");
  }

  const siteSettings = await getSiteSettings();
  const campaignName = formData.get("campaignName")?.toString().trim();
  const headline = formData.get("headline")?.toString().trim();
  const priorityValue = Number.parseInt(formData.get("priority")?.toString() || "100", 10);

  if (!campaignName || !headline) {
    redirect("/admin?bannerStatus=error#new-banner-campaign");
  }

  const { data, error } = await adminSupabase
    .from("site_banners")
    .insert({
      site_slug: siteSettings.slug,
      campaign_name: campaignName,
      eyebrow: asOptionalString(formData.get("eyebrow")),
      headline,
      body: asOptionalString(formData.get("body")),
      theme: formData.get("theme")?.toString().trim() || "seasonal",
      priority: Number.isNaN(priorityValue) ? 100 : priorityValue,
      start_date: asOptionalString(formData.get("startDate")),
      end_date: asOptionalString(formData.get("endDate")),
      is_active: formData.get("isActive") === "on"
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect("/admin?bannerStatus=error#new-banner-campaign");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin?bannerStatus=saved&bannerId=${data.id}#banner-${data.id}`);
}

async function updateBannerCampaign(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?bannerStatus=error#banner-campaigns");
  }

  const bannerId = formData.get("bannerId")?.toString();
  const campaignName = formData.get("campaignName")?.toString().trim();
  const headline = formData.get("headline")?.toString().trim();

  if (!bannerId || !campaignName || !headline) {
    redirect("/admin?bannerStatus=error#banner-campaigns");
  }

  const priorityValue = Number.parseInt(formData.get("priority")?.toString() || "100", 10);

  const { error } = await adminSupabase
    .from("site_banners")
    .update({
      campaign_name: campaignName,
      eyebrow: asOptionalString(formData.get("eyebrow")),
      headline,
      body: asOptionalString(formData.get("body")),
      theme: formData.get("theme")?.toString().trim() || "patriotic",
      priority: Number.isNaN(priorityValue) ? 100 : priorityValue,
      start_date: asOptionalString(formData.get("startDate")),
      end_date: asOptionalString(formData.get("endDate")),
      is_active: formData.get("isActive") === "on",
      updated_at: new Date().toISOString()
    })
    .eq("id", bannerId);

  if (error) {
    redirect("/admin?bannerStatus=error#banner-campaigns");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin?bannerStatus=saved&bannerId=${bannerId}#banner-${bannerId}`);
}

async function createTeamMember(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?teamStatus=error#new-team-member");
  }

  const fullName = formData.get("fullName")?.toString().trim();
  const title = formData.get("title")?.toString().trim();
  const requestedSlug = formData.get("slug")?.toString().trim();
  const displayOrderValue = Number.parseInt(formData.get("displayOrder")?.toString() || "100", 10);

  if (!fullName || !title) {
    redirect("/admin?teamStatus=error#new-team-member");
  }

  const baseSlug = slugify(requestedSlug || fullName) || `team-member-${Date.now()}`;
  const { data, error } = await adminSupabase
    .from("team_members")
    .insert({
      slug: baseSlug,
      full_name: fullName,
      title,
      phone: asOptionalString(formData.get("phone")),
      email: asOptionalString(formData.get("email")),
      bio: asOptionalString(formData.get("bio")),
      photo_url: asOptionalString(formData.get("photoUrl")),
      specialties: asSpecialtyArray(formData.get("specialties")),
      display_order: Number.isNaN(displayOrderValue) ? 100 : displayOrderValue,
      is_active: formData.get("isActive") === "on"
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect("/admin?teamStatus=error#new-team-member");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin?teamStatus=saved&teamMemberId=${data.id}#team-member-${data.id}`);
}

async function updateTeamMember(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?teamStatus=error#team-members");
  }

  const memberId = formData.get("memberId")?.toString();
  const fullName = formData.get("fullName")?.toString().trim();
  const title = formData.get("title")?.toString().trim();

  if (!memberId || !fullName || !title) {
    redirect("/admin?teamStatus=error#team-members");
  }

  const displayOrderValue = Number.parseInt(formData.get("displayOrder")?.toString() || "100", 10);

  const { error } = await adminSupabase
    .from("team_members")
    .update({
      full_name: fullName,
      title,
      phone: asOptionalString(formData.get("phone")),
      email: asOptionalString(formData.get("email")),
      bio: asOptionalString(formData.get("bio")),
      photo_url: asOptionalString(formData.get("photoUrl")),
      specialties: asSpecialtyArray(formData.get("specialties")),
      display_order: Number.isNaN(displayOrderValue) ? 100 : displayOrderValue,
      is_active: formData.get("isActive") === "on",
      updated_at: new Date().toISOString()
    })
    .eq("id", memberId);

  if (error) {
    redirect("/admin?teamStatus=error#team-members");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin?teamStatus=saved&teamMemberId=${memberId}#team-member-${memberId}`);
}

async function createTestimonial(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?testimonialStatus=error#new-testimonial");
  }

  const clientName = formData.get("clientName")?.toString().trim();
  const quote = formData.get("quote")?.toString().trim();
  const scope = formData.get("scope")?.toString() === "individual" ? "individual" : "team";
  const ratingValue = Number.parseInt(formData.get("rating")?.toString() || "", 10);
  const teamMemberId = asOptionalString(formData.get("teamMemberId"));

  if (!clientName || !quote) {
    redirect("/admin?testimonialStatus=error#new-testimonial");
  }

  const { data, error } = await adminSupabase
    .from("testimonials")
    .insert({
      team_member_id: scope === "individual" ? teamMemberId : null,
      scope,
      client_name: clientName,
      context: asOptionalString(formData.get("context")),
      quote,
      rating: Number.isNaN(ratingValue) ? null : ratingValue,
      is_featured: formData.get("isFeatured") === "on",
      is_published: formData.get("isPublished") === "on"
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect("/admin?testimonialStatus=error#new-testimonial");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin?testimonialStatus=saved&testimonialId=${data.id}#testimonial-${data.id}`);
}

async function updateTestimonial(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?testimonialStatus=error#testimonials");
  }

  const testimonialId = formData.get("testimonialId")?.toString();
  const clientName = formData.get("clientName")?.toString().trim();
  const quote = formData.get("quote")?.toString().trim();
  const scope = formData.get("scope")?.toString() === "individual" ? "individual" : "team";
  const ratingValue = Number.parseInt(formData.get("rating")?.toString() || "", 10);
  const teamMemberId = asOptionalString(formData.get("teamMemberId"));

  if (!testimonialId || !clientName || !quote) {
    redirect("/admin?testimonialStatus=error#testimonials");
  }

  const { error } = await adminSupabase
    .from("testimonials")
    .update({
      team_member_id: scope === "individual" ? teamMemberId : null,
      scope,
      client_name: clientName,
      context: asOptionalString(formData.get("context")),
      quote,
      rating: Number.isNaN(ratingValue) ? null : ratingValue,
      is_featured: formData.get("isFeatured") === "on",
      is_published: formData.get("isPublished") === "on"
    })
    .eq("id", testimonialId);

  if (error) {
    redirect("/admin?testimonialStatus=error#testimonials");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin?testimonialStatus=saved&testimonialId=${testimonialId}#testimonial-${testimonialId}`);
}

async function getAdminData() {
  const siteSettings = await getSiteSettings();
  const activeBanner = await getActiveSiteBanner(siteSettings.slug, siteSettings);
  const supabase = createClient();
  const adminSupabase = createAdminClient();
  const adminDataClient = adminSupabase || supabase;

  const [
    bannersResult,
    teamMembersResult,
    testimonialsResult
  ] = await Promise.all([
    adminDataClient
      .from("site_banners")
      .select("id, campaign_name, eyebrow, headline, body, theme, start_date, end_date, is_active, priority")
      .eq("site_slug", siteSettings.slug)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
    adminDataClient
      .from("team_members")
      .select("id, slug, full_name, title, phone, email, bio, photo_url, specialties, display_order, is_active")
      .order("display_order", { ascending: true }),
    adminDataClient
      .from("testimonials")
      .select("id, team_member_id, scope, client_name, context, quote, rating, is_featured, is_published")
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  const leadsResult = adminSupabase
    ? await adminSupabase
        .from("lead_submissions")
        .select("id, lead_type, full_name, email, phone, property_address, message, source_page, assigned_team_member_id, contact_status, preferred_contact_method, contact_notes, last_contacted_at, created_at, team_members(full_name)")
        .eq("lead_type", "valuation")
        .order("created_at", { ascending: false })
        .limit(10)
    : {
        data: [],
        error: { message: "Add SUPABASE_SERVICE_ROLE_KEY in Vercel to unlock private lead inbox data." }
      };

  const leads = (leadsResult.data || []) as AdminLead[];
  const banners = (bannersResult.data || []) as AdminBanner[];
  const teamMembers = (teamMembersResult.data || []) as AdminTeamMember[];
  const testimonials = (testimonialsResult.data || []) as AdminTestimonial[];

  return {
    siteSettings,
    activeBanner,
    leads,
    banners,
    teamMembers,
    testimonials,
    errors: {
      leads: leadsResult.error?.message,
      banners: bannersResult.error?.message,
      teamMembers: teamMembersResult.error?.message,
      testimonials: testimonialsResult.error?.message
    }
  };
}

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams?: {
    bannerStatus?: string;
    bannerId?: string;
    leadStatus?: string;
    leadId?: string;
    teamStatus?: string;
    teamMemberId?: string;
    testimonialStatus?: string;
    testimonialId?: string;
  };
}) {
  const { siteSettings, activeBanner, leads, banners, teamMembers, testimonials, errors } = await getAdminData();
  const visibleErrors = Object.values(errors).filter(Boolean);
  const bannerStatus = searchParams?.bannerStatus;
  const savedBannerId = searchParams?.bannerId;
  const leadStatus = searchParams?.leadStatus;
  const savedLeadId = searchParams?.leadId;
  const teamStatus = searchParams?.teamStatus;
  const savedTeamMemberId = searchParams?.teamMemberId;
  const testimonialStatus = searchParams?.testimonialStatus;
  const savedTestimonialId = searchParams?.testimonialId;
  const hasSavedStatus = bannerStatus === "saved" || leadStatus === "saved" || teamStatus === "saved" || testimonialStatus === "saved";

  return (
    <main className="admin-shell">
      <AdminStatusCleanup active={hasSavedStatus} />
      <header className="admin-hero">
        <div>
          <p className="admin-kicker">Admin Dashboard</p>
          <h1>{siteSettings.siteName}</h1>
          <p>Manage the pieces that make this real estate site reusable: settings, banners, team, feedback, and leads.</p>
        </div>
        <Link className="admin-button" href="/" target="_blank" rel="noopener noreferrer">View website</Link>
      </header>

      {visibleErrors.length ? (
        <section className="admin-alert">
          <strong>Some admin data could not load yet.</strong>
          <p>This usually means we still need one more Supabase read policy for the admin view.</p>
          <ul>
            {visibleErrors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </section>
      ) : null}

      {bannerStatus === "saved" ? (
        <section className="admin-success" data-admin-status="saved">
          <strong>Banner campaign saved.</strong>
          <p>Your website banner has been updated. Refresh the public site if you do not see it right away.</p>
        </section>
      ) : null}

      {bannerStatus === "error" ? (
        <section className="admin-alert">
          <strong>Banner campaign could not be saved yet.</strong>
          <p>This usually means the Supabase admin update permission still needs to be applied.</p>
        </section>
      ) : null}

      <section className="admin-stats" aria-label="Dashboard summary">
        <article>
          <span>Recent leads</span>
          <strong>{leads.length}</strong>
        </article>
        <article>
          <span>Team members</span>
          <strong>{teamMembers.length}</strong>
        </article>
        <article>
          <span>Banners</span>
          <strong>{banners.length}</strong>
        </article>
        <article>
          <span>Testimonials</span>
          <strong>{testimonials.length}</strong>
        </article>
      </section>

      <section className="admin-grid">
        <article className="admin-card admin-card-wide" id="lead-inbox">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Valuation Workspace</p>
              <h2>Track home valuation requests</h2>
            </div>
            <span>{leads.length ? "Live data" : "No valuations visible"}</span>
          </div>

          {leadStatus === "error" ? (
            <div className="admin-inline-alert" role="alert">
              <strong>Valuation could not be saved.</strong>
              <span>Please make sure there is a property address and at least one contact method.</span>
            </div>
          ) : null}

          <details className="admin-create-panel" id="new-valuation">
            <summary>Add valuation request from phone, text, or email</summary>
            <form className="admin-form-card" action={createValuationLead}>
              <div className="admin-form-grid">
                <label>
                  Client name
                  <input name="fullName" type="text" placeholder="Client name" />
                </label>
                <label>
                  Property address
                  <input name="propertyAddress" type="text" placeholder="Property address" required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" placeholder="client@email.com" />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" placeholder="(480) 555-0123" />
                </label>
                <label>
                  Assigned team member
                  <select name="assignedTeamMemberId" defaultValue="">
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.full_name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select name="contactStatus" defaultValue="new">
                    {leadStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Contact method
                  <select name="preferredContactMethod" defaultValue="">
                    {contactMethodOptions.map((option) => (
                      <option key={option.value || "none"} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Last contacted
                  <input name="lastContactedAt" type="datetime-local" />
                </label>
              </div>
              <label>
                Request details
                <textarea name="message" placeholder="What did they ask for?" rows={3}></textarea>
              </label>
              <label>
                Contact notes
                <textarea name="contactNotes" placeholder="Follow-up notes, verification details, preferred timing, etc." rows={3}></textarea>
              </label>
              <div className="admin-form-footer">
                <small>Email or phone is required so the request can be followed up.</small>
                {leadStatus === "saved" && savedLeadId && !leads.some((lead) => lead.id === savedLeadId) ? (
                  <span className="admin-save-confirmation" data-admin-status="saved">Saved successfully</span>
                ) : null}
                <button className="admin-save-button" type="submit">Add valuation</button>
              </div>
            </form>
          </details>

          <div className="admin-form-list">
            {leads.map((lead) => (
              <form className="admin-form-card" action={updateValuationLead} id={`lead-${lead.id}`} key={lead.id}>
                <input name="leadId" type="hidden" value={lead.id} />
                <div className="admin-card-header admin-form-title">
                  <div>
                    <p className="admin-kicker">{lead.contact_status || "new"} valuation</p>
                    <h3>{lead.property_address || "No property address"}</h3>
                  </div>
                  <span>{formatDate(lead.created_at)}</span>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Client name
                    <input name="fullName" type="text" defaultValue={lead.full_name || ""} />
                  </label>
                  <label>
                    Property address
                    <input name="propertyAddress" type="text" defaultValue={lead.property_address || ""} required />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" defaultValue={lead.email || ""} />
                  </label>
                  <label>
                    Phone
                    <input name="phone" type="tel" defaultValue={lead.phone || ""} />
                  </label>
                  <label>
                    Assigned team member
                    <select name="assignedTeamMemberId" defaultValue={lead.assigned_team_member_id || ""}>
                      <option value="">Unassigned</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>{member.full_name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select name="contactStatus" defaultValue={lead.contact_status || "new"}>
                      {leadStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Contact method
                    <select name="preferredContactMethod" defaultValue={lead.preferred_contact_method || ""}>
                      {contactMethodOptions.map((option) => (
                        <option key={option.value || "none"} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Last contacted
                    <input name="lastContactedAt" type="datetime-local" defaultValue={formatDateTimeLocal(lead.last_contacted_at)} />
                  </label>
                </div>
                <label>
                  Request details
                  <textarea name="message" rows={3} defaultValue={lead.message || ""}></textarea>
                </label>
                <label>
                  Contact notes
                  <textarea name="contactNotes" rows={3} defaultValue={lead.contact_notes || ""}></textarea>
                </label>
                <div className="admin-form-footer">
                  <small>Assigned to {getAssignedName(lead)} - Source: {lead.source_page || "website"}</small>
                  {leadStatus === "saved" && savedLeadId === lead.id ? (
                    <span className="admin-save-confirmation" data-admin-status="saved">Saved successfully</span>
                  ) : null}
                  <button className="admin-save-button" type="submit">Save valuation</button>
                </div>
              </form>
            ))}
            {!leads.length ? <p className="admin-empty">No valuation requests are available to this dashboard yet.</p> : null}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Active Banner</p>
              <h2>{activeBanner?.headline || "No active banner"}</h2>
            </div>
          </div>
          {activeBanner ? (
            <div className={`admin-banner-preview banner-theme-${activeBanner.theme}`}>
              <p>{activeBanner.eyebrow}</p>
              <h3>{activeBanner.headline}</h3>
              <span>{activeBanner.body}</span>
            </div>
          ) : null}
          <p>{activeBanner ? "This is the banner currently displayed beneath the team logo on the website." : "The site will use fallback banner settings or hide the banner when no active campaign is available."}</p>
        </article>

        <article className="admin-card" id="banner-campaigns">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Campaigns</p>
              <h2>Edit banner campaigns</h2>
            </div>
          </div>
          {bannerStatus === "error" ? (
            <div className="admin-inline-alert" role="alert">
              <strong>Save did not complete.</strong>
              <span>Please check the required fields or Supabase update permission.</span>
            </div>
          ) : null}
          <details className="admin-create-panel" id="new-banner-campaign">
            <summary>Add new banner campaign</summary>
            <form className="admin-form-card" action={createBannerCampaign}>
              <label>
                Campaign name
                <input name="campaignName" type="text" placeholder="Fall buyer campaign" required />
              </label>
              <label>
                Eyebrow
                <input name="eyebrow" type="text" placeholder="Seasonal update" />
              </label>
              <label>
                Headline
                <input name="headline" type="text" placeholder="A fresh season for your next move." required />
              </label>
              <label>
                Body
                <textarea name="body" placeholder="Short supporting line for the banner." rows={3}></textarea>
              </label>
              <div className="admin-form-grid">
                <label>
                  Start date
                  <input name="startDate" type="date" />
                </label>
                <label>
                  End date
                  <input name="endDate" type="date" />
                </label>
                <label>
                  Priority
                  <input name="priority" type="number" defaultValue="100" min="1" step="1" />
                </label>
                <label>
                  Theme
                  <select name="theme" defaultValue="seasonal">
                    <option value="patriotic">Patriotic</option>
                    <option value="market">Market</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </label>
              </div>
              <label className="admin-checkbox">
                <input name="isActive" type="checkbox" />
                Active on site
              </label>
              <div className="admin-form-footer">
                <small>New banners can stay inactive until you are ready to use them.</small>
                <button className="admin-save-button" type="submit">Create banner</button>
              </div>
            </form>
          </details>
          <div className="admin-form-list">
            {banners.map((banner) => (
              <form className="admin-form-card" action={updateBannerCampaign} id={`banner-${banner.id}`} key={banner.id}>
                <input name="bannerId" type="hidden" value={banner.id} />
                <label>
                  Campaign name
                  <input name="campaignName" type="text" defaultValue={banner.campaign_name} required />
                </label>
                <label>
                  Eyebrow
                  <input name="eyebrow" type="text" defaultValue={banner.eyebrow || ""} />
                </label>
                <label>
                  Headline
                  <input name="headline" type="text" defaultValue={banner.headline} required />
                </label>
                <label>
                  Body
                  <textarea name="body" defaultValue={banner.body || ""} rows={3}></textarea>
                </label>
                <div className="admin-form-grid">
                  <label>
                    Start date
                    <input name="startDate" type="date" defaultValue={banner.start_date || ""} />
                  </label>
                  <label>
                    End date
                    <input name="endDate" type="date" defaultValue={banner.end_date || ""} />
                  </label>
                  <label>
                    Priority
                    <input name="priority" type="number" defaultValue={banner.priority} min="1" step="1" />
                  </label>
                  <label>
                    Theme
                    <select name="theme" defaultValue={banner.theme}>
                      <option value="patriotic">Patriotic</option>
                      <option value="market">Market</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </label>
                </div>
                <label className="admin-checkbox">
                  <input name="isActive" type="checkbox" defaultChecked={banner.is_active} />
                  Active on site
                </label>
                <div className="admin-form-footer">
                  <small>{banner.is_active ? "Currently active" : "Currently inactive"} - {formatDate(banner.start_date)} to {formatDate(banner.end_date)}</small>
                  {bannerStatus === "saved" && savedBannerId === banner.id ? (
                    <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                  ) : null}
                  <button className="admin-save-button" type="submit">Save banner</button>
                </div>
              </form>
            ))}
          </div>
        </article>

        <article className="admin-card admin-card-wide" id="team-members">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Team</p>
              <h2>Edit agent profiles</h2>
            </div>
          </div>
          {teamStatus === "error" ? (
            <div className="admin-inline-alert" role="alert">
              <strong>Team profile could not be saved.</strong>
              <span>Please check the required name and title fields or Supabase update permission.</span>
            </div>
          ) : null}
          <details className="admin-create-panel" id="new-team-member">
            <summary>Add new team member</summary>
            <form className="admin-form-card" action={createTeamMember}>
              <div className="admin-form-grid">
                <label>
                  Full name
                  <input name="fullName" type="text" placeholder="New Agent" required />
                </label>
                <label>
                  Title
                  <input name="title" type="text" placeholder="Realtor | Alu Realty Group" required />
                </label>
                <label>
                  Slug
                  <input name="slug" type="text" placeholder="new-agent" />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" />
                </label>
                <label>
                  Display order
                  <input name="displayOrder" type="number" defaultValue="100" min="1" step="1" />
                </label>
                <label>
                  Photo URL
                  <input name="photoUrl" type="text" placeholder="/assets/agent-photo.jpg" />
                </label>
              </div>
              <label>
                Bio
                <textarea name="bio" rows={4}></textarea>
              </label>
              <label>
                Specialties
                <textarea name="specialties" placeholder="Buyers, Sellers, Relocation" rows={2}></textarea>
              </label>
              <label className="admin-checkbox">
                <input name="isActive" type="checkbox" defaultChecked />
                Visible on site
              </label>
              <div className="admin-form-footer">
                <small>Leave slug blank to create one from the name.</small>
                <button className="admin-save-button" type="submit">Create team member</button>
              </div>
            </form>
          </details>
          <div className="admin-form-list">
            {teamMembers.map((member) => (
              <form className="admin-form-card" action={updateTeamMember} id={`team-member-${member.id}`} key={member.id}>
                <input name="memberId" type="hidden" value={member.id} />
                <div className="admin-form-grid">
                  <label>
                    Full name
                    <input name="fullName" type="text" defaultValue={member.full_name} required />
                  </label>
                  <label>
                    Title
                    <input name="title" type="text" defaultValue={member.title} required />
                  </label>
                  <label>
                    Phone
                    <input name="phone" type="tel" defaultValue={member.phone || ""} />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" defaultValue={member.email || ""} />
                  </label>
                  <label>
                    Display order
                    <input name="displayOrder" type="number" defaultValue={member.display_order} min="1" step="1" />
                  </label>
                  <label>
                    Photo URL
                    <input name="photoUrl" type="text" defaultValue={member.photo_url || ""} placeholder="/assets/agent-photo.jpg" />
                  </label>
                </div>
                <label>
                  Bio
                  <textarea name="bio" defaultValue={member.bio || ""} rows={4}></textarea>
                </label>
                <label>
                  Specialties
                  <textarea name="specialties" defaultValue={member.specialties.join(", ")} rows={2}></textarea>
                </label>
                <label className="admin-checkbox">
                  <input name="isActive" type="checkbox" defaultChecked={member.is_active} />
                  Visible on site
                </label>
                <div className="admin-form-footer">
                  <small>{member.is_active ? "Currently visible" : "Currently hidden"} - {member.slug}</small>
                  {teamStatus === "saved" && savedTeamMemberId === member.id ? (
                    <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                  ) : null}
                  <button className="admin-save-button" type="submit">Save team member</button>
                </div>
              </form>
            ))}
          </div>
        </article>

        <article className="admin-card admin-card-wide" id="testimonials">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Feedback</p>
              <h2>Edit testimonials</h2>
            </div>
          </div>
          {testimonialStatus === "error" ? (
            <div className="admin-inline-alert" role="alert">
              <strong>Testimonial could not be saved.</strong>
              <span>Please check the required client name and quote fields.</span>
            </div>
          ) : null}
          <details className="admin-create-panel" id="new-testimonial">
            <summary>Add new testimonial</summary>
            <form className="admin-form-card" action={createTestimonial}>
              <div className="admin-form-grid">
                <label>
                  Client name
                  <input name="clientName" type="text" placeholder="Client name" required />
                </label>
                <label>
                  Context
                  <input name="context" type="text" placeholder="Scottsdale purchase" />
                </label>
                <label>
                  Scope
                  <select name="scope" defaultValue="team">
                    <option value="team">Team</option>
                    <option value="individual">Individual agent</option>
                  </select>
                </label>
                <label>
                  Assigned team member
                  <select name="teamMemberId" defaultValue="">
                    <option value="">No individual assignment</option>
                    {teamMembers.map((member) => (
                      <option value={member.id} key={member.id}>{member.full_name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Rating
                  <input name="rating" type="number" min="1" max="5" step="1" />
                </label>
              </div>
              <label>
                Quote
                <textarea name="quote" placeholder="What did the client say?" rows={3} required></textarea>
              </label>
              <div className="admin-checkbox-row">
                <label className="admin-checkbox">
                  <input name="isPublished" type="checkbox" defaultChecked />
                  Published on site
                </label>
                <label className="admin-checkbox">
                  <input name="isFeatured" type="checkbox" />
                  Featured first
                </label>
              </div>
              <div className="admin-form-footer">
                <small>New testimonials can be saved as drafts by unchecking published.</small>
                <button className="admin-save-button" type="submit">Create testimonial</button>
              </div>
            </form>
          </details>
          <div className="admin-form-list">
            {testimonials.map((testimonial) => (
              <form className="admin-form-card" action={updateTestimonial} id={`testimonial-${testimonial.id}`} key={testimonial.id}>
                <input name="testimonialId" type="hidden" value={testimonial.id} />
                <div className="admin-form-grid">
                  <label>
                    Client name
                    <input name="clientName" type="text" defaultValue={testimonial.client_name} required />
                  </label>
                  <label>
                    Context
                    <input name="context" type="text" defaultValue={testimonial.context || ""} placeholder="Scottsdale purchase" />
                  </label>
                  <label>
                    Scope
                    <select name="scope" defaultValue={testimonial.scope}>
                      <option value="team">Team</option>
                      <option value="individual">Individual agent</option>
                    </select>
                  </label>
                  <label>
                    Assigned team member
                    <select name="teamMemberId" defaultValue={testimonial.team_member_id || ""}>
                      <option value="">No individual assignment</option>
                      {teamMembers.map((member) => (
                        <option value={member.id} key={member.id}>{member.full_name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Rating
                    <input name="rating" type="number" defaultValue={testimonial.rating || ""} min="1" max="5" step="1" />
                  </label>
                </div>
                <label>
                  Quote
                  <textarea name="quote" defaultValue={testimonial.quote} rows={3} required></textarea>
                </label>
                <div className="admin-checkbox-row">
                  <label className="admin-checkbox">
                    <input name="isPublished" type="checkbox" defaultChecked={testimonial.is_published} />
                    Published on site
                  </label>
                  <label className="admin-checkbox">
                    <input name="isFeatured" type="checkbox" defaultChecked={testimonial.is_featured} />
                    Featured first
                  </label>
                </div>
                <div className="admin-form-footer">
                  <small>{testimonial.is_published ? "Currently published" : "Currently draft"} - {testimonial.scope}</small>
                  {testimonialStatus === "saved" && savedTestimonialId === testimonial.id ? (
                    <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                  ) : null}
                  <button className="admin-save-button" type="submit">Save testimonial</button>
                </div>
              </form>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
