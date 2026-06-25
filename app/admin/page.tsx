import Link from "next/link";
import { revalidatePath } from "next/cache";
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
  full_name: string;
  title: string;
  email: string | null;
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

async function updateBannerCampaign(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const bannerId = formData.get("bannerId")?.toString();
  const campaignName = formData.get("campaignName")?.toString().trim();
  const headline = formData.get("headline")?.toString().trim();

  if (!bannerId || !campaignName || !headline) {
    throw new Error("Banner ID, campaign name, and headline are required.");
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
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

async function getAdminData() {
  const siteSettings = await getSiteSettings();
  const activeBanner = await getActiveSiteBanner(siteSettings.slug, siteSettings);
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  const [
    bannersResult,
    teamMembersResult,
    testimonialsResult
  ] = await Promise.all([
    supabase
      .from("site_banners")
      .select("id, campaign_name, eyebrow, headline, body, theme, start_date, end_date, is_active, priority")
      .eq("site_slug", siteSettings.slug)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("team_members")
      .select("id, full_name, title, email, is_active")
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

export default async function AdminDashboardPage() {
  const { siteSettings, activeBanner, leads, banners, teamMembers, testimonials, errors } = await getAdminData();
  const visibleErrors = Object.values(errors).filter(Boolean);

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

        <article className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Campaigns</p>
              <h2>Edit banner campaigns</h2>
            </div>
          </div>
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

        <article className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Team</p>
              <h2>Agent profiles</h2>
            </div>
          </div>
          <div className="admin-list">
            {teamMembers.map((member) => (
              <div key={member.id}>
                <strong>{member.full_name}</strong>
                <span>{member.title}</span>
                <small>{member.is_active ? "Visible on site" : "Hidden"} · {member.email || "No email"}</small>
              </div>
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
