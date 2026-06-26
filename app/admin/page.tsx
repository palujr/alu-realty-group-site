import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteBanner, getSiteSettings } from "@/lib/site-settings";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type AdminLead = {
  id: string;
  lead_type: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  property_address: string | null;
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
  client_name: string;
  context: string | null;
  is_published: boolean;
};

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
  redirect("/admin?bannerStatus=saved#banner-campaigns");
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
  redirect("/admin?teamStatus=saved#team-members");
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
    supabase
      .from("testimonials")
      .select("id, client_name, context, is_published")
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  const leadsResult = adminSupabase
    ? await adminSupabase
        .from("lead_submissions")
        .select("id, lead_type, full_name, email, phone, property_address, created_at, team_members(full_name)")
        .order("created_at", { ascending: false })
        .limit(8)
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
  searchParams?: { bannerStatus?: string; teamStatus?: string };
}) {
  const { siteSettings, activeBanner, leads, banners, teamMembers, testimonials, errors } = await getAdminData();
  const visibleErrors = Object.values(errors).filter(Boolean);
  const bannerStatus = searchParams?.bannerStatus;
  const teamStatus = searchParams?.teamStatus;

  return (
    <main className="admin-shell">
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
        <section className="admin-success">
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
        <article className="admin-card admin-card-wide">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Lead Inbox</p>
              <h2>Recent valuation requests</h2>
            </div>
            <span>{leads.length ? "Live data" : "No leads visible"}</span>
          </div>
          <div className="admin-table">
            <div className="admin-table-row admin-table-head">
              <span>Name</span>
              <span>Property</span>
              <span>Assigned</span>
              <span>Date</span>
            </div>
            {leads.map((lead) => (
              <div className="admin-table-row" key={lead.id}>
                <span>
                  <strong>{lead.full_name || "No name"}</strong>
                  <small>{lead.email}</small>
                </span>
                <span>{lead.property_address || "No property address"}</span>
                <span>{getAssignedName(lead)}</span>
                <span>{formatDate(lead.created_at)}</span>
              </div>
            ))}
            {!leads.length ? <p className="admin-empty">No recent leads are available to this dashboard yet.</p> : null}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Active Banner</p>
              <h2>{activeBanner?.headline || "No active banner"}</h2>
            </div>
          </div>
          <p>{activeBanner?.body || "The site will use fallback banner settings or hide the banner when no active campaign is available."}</p>
        </article>

        <article className="admin-card" id="banner-campaigns">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Campaigns</p>
              <h2>Edit banner campaigns</h2>
            </div>
          </div>
          {bannerStatus === "saved" ? (
            <div className="admin-inline-success" role="status">
              <strong>Saved successfully.</strong>
              <span>The banner campaign is updated and ready on the website.</span>
            </div>
          ) : null}
          {bannerStatus === "error" ? (
            <div className="admin-inline-alert" role="alert">
              <strong>Save did not complete.</strong>
              <span>Please check the required fields or Supabase update permission.</span>
            </div>
          ) : null}
          <div className="admin-form-list">
            {banners.map((banner) => (
              <form className="admin-form-card" action={updateBannerCampaign} key={banner.id}>
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
                  <small>{banner.is_active ? "Currently active" : "Currently inactive"} · {formatDate(banner.start_date)} to {formatDate(banner.end_date)}</small>
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
          {teamStatus === "saved" ? (
            <div className="admin-inline-success" role="status">
              <strong>Team profile saved.</strong>
              <span>The agent details are updated on the website.</span>
            </div>
          ) : null}
          {teamStatus === "error" ? (
            <div className="admin-inline-alert" role="alert">
              <strong>Team profile could not be saved.</strong>
              <span>Please check the required name and title fields or Supabase update permission.</span>
            </div>
          ) : null}
          <div className="admin-form-list">
            {teamMembers.map((member) => (
              <form className="admin-form-card" action={updateTeamMember} key={member.id}>
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
                  <small>{member.is_active ? "Currently visible" : "Currently hidden"} · {member.slug}</small>
                  <button className="admin-save-button" type="submit">Save team member</button>
                </div>
              </form>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Feedback</p>
              <h2>Testimonials</h2>
            </div>
          </div>
          <div className="admin-list">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id}>
                <strong>{testimonial.client_name}</strong>
                <span>{testimonial.context || "No context"}</span>
                <small>{testimonial.is_published ? "Published" : "Draft"}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
