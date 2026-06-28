import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteBanner, getSiteSettings } from "@/lib/site-settings";
import { AdminDataFreshness } from "./AdminDataFreshness";
import { AdminLeadFormReset } from "./AdminLeadFormReset";
import { AdminStatusCleanup } from "./AdminStatusCleanup";
import { BrandColorField } from "./BrandColorField";

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
  lead_source_category: string;
  assigned_team_member_id: string | null;
  contact_status: string;
  preferred_contact_method: string | null;
  contact_notes: string | null;
  last_contacted_at: string | null;
  lead_priority: string;
  next_follow_up_at: string | null;
  lead_source_detail: string | null;
  created_at: string;
  team_members: { full_name: string | null } | { full_name: string | null }[] | null;
};

const adminLeadSelect = "id, lead_type, full_name, email, phone, property_address, message, source_page, lead_source_category, assigned_team_member_id, contact_status, preferred_contact_method, contact_notes, last_contacted_at, lead_priority, next_follow_up_at, lead_source_detail, created_at, team_members(full_name)";

type AdminLeadWorkQueueItem = Pick<
  AdminLead,
  | "id"
  | "lead_type"
  | "full_name"
  | "email"
  | "phone"
  | "property_address"
  | "assigned_team_member_id"
  | "contact_status"
  | "lead_priority"
  | "next_follow_up_at"
  | "created_at"
  | "team_members"
>;

type AdminLeadActivity = {
  id: string;
  lead_id: string;
  activity_type: string;
  activity_at: string;
  summary: string;
  outcome: string;
  created_by_name: string | null;
  follow_up_at: string | null;
  updated_by_name: string | null;
  updated_at: string | null;
  created_at: string;
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

type LeadFilters = {
  search: string;
  type: string;
  status: string;
  assigned: string;
  priority: string;
  source: string;
  followUp: string;
};

type AdminPageRequest = {
  page: number;
  pageSize: number;
};

type AdminPages = {
  leads: AdminPageRequest;
  teamMembers: AdminPageRequest;
  testimonials: AdminPageRequest;
};

type AdminPagination = {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  from: number;
  to: number;
  pageParam: string;
  pageSizeParam: string;
  selectedPageSize: string;
  anchor: string;
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

const leadTypeOptions = [
  { value: "seller", label: "Seller" },
  { value: "buyer", label: "Buyer" },
  { value: "buyer_seller", label: "Buyer / Seller" },
  { value: "valuation", label: "Valuation" },
  { value: "investor", label: "Investor" },
  { value: "lease", label: "Lease" },
  { value: "contact", label: "General contact" },
  { value: "saved_search", label: "Saved search" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" }
];

const contactMethodOptions = [
  { value: "", label: "Not set" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text" },
  { value: "in_person", label: "In person" },
  { value: "other", label: "Other" }
];

const leadPriorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

const leadSourceCategoryOptions = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "phone_call", label: "Phone call" },
  { value: "sign_call", label: "Sign call" },
  { value: "open_house", label: "Open house" },
  { value: "social_media", label: "Social media" },
  { value: "email", label: "Email" },
  { value: "direct_mail", label: "Direct mail" },
  { value: "past_client", label: "Past client" },
  { value: "agent_network", label: "Agent network" },
  { value: "manual", label: "Manual entry" },
  { value: "import", label: "Imported list" },
  { value: "other", label: "Other" }
];

const followUpFilterOptions = [
  { value: "", label: "All follow-ups" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "none", label: "No follow-up" }
];

const defaultAdminTimeZone = "America/Phoenix";

const timeZoneOptions = [
  { value: "America/Phoenix", label: "Mountain Standard Time - Arizona" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/New_York", label: "Eastern Time" }
];

const leadActivityTypeOptions = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },
  { value: "meeting", label: "Meeting" },
  { value: "task", label: "Task" },
  { value: "status_update", label: "Status update" }
];

const teamPhotoBucket = "team-photos";
const siteLogoBucket = "site-logos";
const siteHeroImageBucket = "site-hero-images";
const adminPageSize = 10;
const adminPageSizeOptions = [10, 20, 50, 75];
const maxAdminImageSize = 5 * 1024 * 1024;
const transientAdminSearchParams = new Set([
  "siteStatus",
  "siteSection",
  "siteError",
  "bannerStatus",
  "bannerId",
  "leadStatus",
  "leadId",
  "leadActivityStatus",
  "teamStatus",
  "teamMemberId",
  "testimonialStatus",
  "testimonialId"
]);

function formatDate(value?: string | null, timeZone = defaultAdminTimeZone) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function getDateTimeLocalValue(value: Date, timeZone = defaultAdminTimeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(value);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = partMap.hour === "24" ? "00" : partMap.hour;

  return `${partMap.year}-${partMap.month}-${partMap.day}T${hour}:${partMap.minute}`;
}

function formatDateTimeLocal(value?: string | null, timeZone = defaultAdminTimeZone) {
  if (!value) {
    return "";
  }

  return getDateTimeLocalValue(new Date(value), timeZone);
}

function formatDateTime(value?: string | null, timeZone = defaultAdminTimeZone) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getTimeZoneOffsetMinutes(date: Date, timeZone = defaultAdminTimeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = partMap.hour === "24" ? "00" : partMap.hour;
  const asUtc = Date.UTC(
    Number(partMap.year),
    Number(partMap.month) - 1,
    Number(partMap.day),
    Number(hour),
    Number(partMap.minute),
    Number(partMap.second)
  );

  return (asUtc - date.getTime()) / 60000;
}

function dateTimeLocalToIso(value: string, timeZone = defaultAdminTimeZone) {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offsetMinutes * 60000).toISOString();
}

function addDaysToDateInput(dateInput: string, days: number) {
  const [year, month, day] = dateInput.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function getRelativeFollowUpIso(daysFromToday: number, timeZone = defaultAdminTimeZone, hour = 9, minute = 0) {
  const today = getDateTimeLocalValue(new Date(), timeZone).slice(0, 10);
  const targetDate = addDaysToDateInput(today, daysFromToday);
  const targetHour = hour.toString().padStart(2, "0");
  const targetMinute = minute.toString().padStart(2, "0");

  return dateTimeLocalToIso(`${targetDate}T${targetHour}:${targetMinute}`, timeZone);
}

function getAssignedName(lead: Pick<AdminLead, "team_members">) {
  if (Array.isArray(lead.team_members)) {
    return lead.team_members[0]?.full_name || "Unassigned";
  }

  return lead.team_members?.full_name || "Unassigned";
}

function getTeamMemberNameById(teamMembers: AdminTeamMember[], id?: string | null) {
  if (!id) {
    return "Team";
  }

  return teamMembers.find((member) => member.id === id)?.full_name || "Team";
}

async function getTeamMemberNamesByIds(
  adminSupabase: NonNullable<ReturnType<typeof createAdminClient>>,
  ids: string[]
) {
  if (!ids.length) {
    return null;
  }

  const { data } = await adminSupabase
    .from("team_members")
    .select("id, full_name")
    .in("id", ids);
  const namesById = new Map((data || []).map((member) => [member.id, member.full_name]));

  return ids
    .map((id) => namesById.get(id))
    .filter(Boolean)
    .join(", ") || null;
}

function truncateText(value?: string | null, maxLength = 86) {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function asOptionalString(value: FormDataEntryValue | null) {
  const stringValue = value?.toString().trim() || "";
  return stringValue || null;
}

function asHexColor(value: FormDataEntryValue | null, fallback: string) {
  const stringValue = value?.toString().trim() || "";
  const withHash = stringValue.startsWith("#") ? stringValue : `#${stringValue}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toLowerCase() : fallback;
}

function asClampedNumber(value: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const numberValue = Number.parseInt(value?.toString() || "", 10);
  return Number.isNaN(numberValue) ? fallback : Math.min(Math.max(numberValue, min), max);
}

function asSpecialtyArray(value: FormDataEntryValue | null) {
  return (value?.toString() || "")
    .split(/[\n,]/)
    .map((specialty) => specialty.trim())
    .filter(Boolean);
}

function asEmailArray(value: FormDataEntryValue | null) {
  return (value?.toString() || "")
    .split(/[\n,]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function asFormStringArray(values: FormDataEntryValue[]) {
  return values
    .map((value) => value.toString().trim())
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

function normalizeLeadType(value: FormDataEntryValue | null) {
  const leadType = value?.toString() || "seller";
  const allowedTypes = leadTypeOptions.map((option) => option.value);
  return allowedTypes.includes(leadType) ? leadType : "seller";
}

function normalizeLeadSourceCategory(value: FormDataEntryValue | null, fallback = "website") {
  const category = value?.toString() || fallback;
  const allowedCategories = leadSourceCategoryOptions.map((option) => option.value);
  return allowedCategories.includes(category) ? category : fallback;
}

function getLeadTypeLabel(value?: string | null) {
  return leadTypeOptions.find((option) => option.value === value)?.label || "Lead";
}

function getLeadPriorityLabel(value?: string | null) {
  return leadPriorityOptions.find((option) => option.value === value)?.label || "Normal";
}

function getLeadStatusLabel(value?: string | null) {
  return leadStatusOptions.find((option) => option.value === value)?.label || "New";
}

function getLeadSourceCategoryLabel(value?: string | null) {
  return leadSourceCategoryOptions.find((option) => option.value === value)?.label || "Website";
}

function getLeadSourceLabel(lead: Pick<AdminLead, "lead_source_category" | "lead_source_detail" | "source_page">) {
  const categoryLabel = getLeadSourceCategoryLabel(lead.lead_source_category);

  if (lead.lead_source_detail) {
    return `${categoryLabel}: ${lead.lead_source_detail}`;
  }

  return categoryLabel || lead.source_page || "Website";
}

function getSearchLeadSummary(lead: Pick<AdminLead, "lead_type" | "lead_source_detail" | "message">) {
  const isSearchLead = lead.lead_type === "buyer" || lead.lead_source_detail?.toLowerCase().includes("search");

  if (!isSearchLead || !lead.message) {
    return null;
  }

  const details = lead.message.split(/\r?\n/).reduce(
    (summary, line) => {
      const [rawLabel, ...rawValue] = line.split(":");
      const label = rawLabel.trim().toLowerCase();
      const value = rawValue.join(":").trim();

      if (label === "search notes") {
        summary.notes = value;
      }

      if (label === "listing alerts requested") {
        summary.alerts = value;
      }

      return summary;
    },
    { notes: "", alerts: "" }
  );

  if (!details.notes && !details.alerts) {
    return null;
  }

  return details;
}

function getLeadActivityTypeLabel(value?: string | null) {
  return leadActivityTypeOptions.find((option) => option.value === value)?.label || "Note";
}

function getLeadFollowUpLabel(lead: AdminLead, timeZone = defaultAdminTimeZone) {
  if (!lead.next_follow_up_at) {
    return "No follow-up";
  }

  return `Next: ${formatDate(lead.next_follow_up_at, timeZone)}`;
}

function getPriorityTone(value?: string | null) {
  if (value === "urgent") {
    return "urgent";
  }

  if (value === "high") {
    return "high";
  }

  if (value === "low") {
    return "low";
  }

  return "normal";
}

function getStatusTone(value?: string | null) {
  if (value === "completed" || value === "verified") {
    return "complete";
  }

  if (value === "contacted" || value === "in_progress") {
    return "active";
  }

  if (value === "archived") {
    return "muted";
  }

  return "new";
}

function getFollowUpTone(value?: string | null, timeZone = defaultAdminTimeZone) {
  if (!value) {
    return "none";
  }

  const followUpDate = getDateTimeLocalValue(new Date(value), timeZone).slice(0, 10);
  const today = getDateTimeLocalValue(new Date(), timeZone).slice(0, 10);

  if (followUpDate < today) {
    return "overdue";
  }

  if (followUpDate === today) {
    return "today";
  }

  return "upcoming";
}

function getOpenActivityTasks(activities: AdminLeadActivity[]) {
  return activities
    .filter((activity) => activity.follow_up_at)
    .sort((first, second) => new Date(first.follow_up_at || "").getTime() - new Date(second.follow_up_at || "").getTime());
}

function getActivityTaskLabel(activity: AdminLeadActivity, timeZone = defaultAdminTimeZone) {
  const tone = getFollowUpTone(activity.follow_up_at, timeZone);
  const dateLabel = formatDateTime(activity.follow_up_at, timeZone);

  if (tone === "overdue") {
    return `Overdue: ${dateLabel}`;
  }

  if (tone === "today") {
    return `Due today: ${dateLabel}`;
  }

  return `Upcoming: ${dateLabel}`;
}

function getLeadCrmFocus(
  lead: AdminLead,
  openActivityTasks: AdminLeadActivity[],
  searchLeadSummary: ReturnType<typeof getSearchLeadSummary>,
  timeZone = defaultAdminTimeZone
) {
  const nextTask = openActivityTasks[0];

  if (nextTask) {
    return {
      tone: getFollowUpTone(nextTask.follow_up_at, timeZone),
      title: getActivityTaskLabel(nextTask, timeZone),
      body: nextTask.outcome || nextTask.summary || "Review the scheduled activity task."
    };
  }

  if ((lead.contact_status === "new" || lead.contact_status === "assigned") && !lead.last_contacted_at) {
    return {
      tone: "today",
      title: "Make first contact",
      body: `Use ${contactMethodOptions.find((option) => option.value === lead.preferred_contact_method)?.label || "the best available contact method"} and log the outcome.`
    };
  }

  if (searchLeadSummary?.alerts?.toLowerCase() === "yes") {
    return {
      tone: "upcoming",
      title: "Confirm saved search setup",
      body: "Review the client's search notes and confirm their listing alert criteria."
    };
  }

  if (!lead.next_follow_up_at && !["completed", "archived"].includes(lead.contact_status)) {
    return {
      tone: "none",
      title: "Schedule the next follow-up",
      body: "Set the next follow-up date so this lead stays visible in the task queue."
    };
  }

  if (lead.contact_status === "completed") {
    return {
      tone: "complete",
      title: "Lead marked complete",
      body: "Review notes only if more follow-up is needed."
    };
  }

  return {
    tone: getFollowUpTone(lead.next_follow_up_at, timeZone),
    title: "Review recent activity",
    body: "Check the timeline before adding the next note or task."
  };
}

function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function redirectSiteSettingsError(message: string): never {
  redirect(`/admin?siteStatus=error&siteError=${encodeURIComponent(message)}#site-settings`);
}

function normalizePageParam(value: string) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function normalizePageSizeParam(value: string) {
  if (value === "all") {
    return 0;
  }

  const pageSize = Number.parseInt(value, 10);
  return adminPageSizeOptions.includes(pageSize) ? pageSize : adminPageSize;
}

function getSelectedPageSizeLabel(pageSize: number) {
  return pageSize === 0 ? "all" : pageSize.toString();
}

function getRangeEnd(start: number, pageSize: number) {
  return pageSize === 0 ? undefined : start + pageSize - 1;
}

function getPagination(page: number, pageSize: number, totalCount: number, pageParam: string, pageSizeParam: string, anchor: string): AdminPagination {
  const effectivePageSize = pageSize === 0 ? Math.max(totalCount, 1) : pageSize;
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalCount / effectivePageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const from = totalCount ? (safePage - 1) * effectivePageSize + 1 : 0;
  const to = totalCount ? Math.min(safePage * effectivePageSize, totalCount) : 0;

  return {
    page: safePage,
    totalPages,
    totalCount,
    pageSize: effectivePageSize,
    from,
    to,
    pageParam,
    pageSizeParam,
    selectedPageSize: getSelectedPageSizeLabel(pageSize),
    anchor
  };
}

function buildAdminPageHref(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  pageParam: string,
  page: number,
  anchor: string
) {
  const params = new URLSearchParams();

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (transientAdminSearchParams.has(key)) {
      return;
    }

    const stringValue = Array.isArray(value) ? value[0] : value;

    if (stringValue) {
      params.set(key, stringValue);
    }
  });

  if (page <= 1) {
    params.delete(pageParam);
  } else {
    params.set(pageParam, page.toString());
  }

  const query = params.toString();
  return query ? `/admin?${query}#${anchor}` : `/admin#${anchor}`;
}

function buildAdminPageSizeHref(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  pageParam: string,
  pageSizeParam: string,
  pageSize: string,
  anchor: string
) {
  const params = new URLSearchParams();

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (transientAdminSearchParams.has(key) || key === pageParam || key === pageSizeParam) {
      return;
    }

    const stringValue = Array.isArray(value) ? value[0] : value;

    if (stringValue) {
      params.set(key, stringValue);
    }
  });

  if (pageSize !== adminPageSize.toString()) {
    params.set(pageSizeParam, pageSize);
  }

  const query = params.toString();
  return query ? `/admin?${query}#${anchor}` : `/admin#${anchor}`;
}

function AdminPaginationControls({
  pagination,
  searchParams
}: {
  pagination: AdminPagination;
  searchParams: Record<string, string | string[] | undefined> | undefined;
}) {
  if (pagination.totalCount <= adminPageSize) {
    return null;
  }

  return (
    <nav className="admin-pagination" aria-label={`${pagination.anchor} pages`}>
      <span>
        Showing {pagination.from}-{pagination.to} of {pagination.totalCount} records
      </span>
      <div className="admin-page-size-controls">
        <span>Show</span>
        {[...adminPageSizeOptions.map((option) => option.toString()), "all"].map((pageSize) => (
          pagination.selectedPageSize === pageSize ? (
            <strong key={pageSize}>{pageSize === "all" ? "All" : pageSize}</strong>
          ) : (
            <Link key={pageSize} href={buildAdminPageSizeHref(searchParams, pagination.pageParam, pagination.pageSizeParam, pageSize, pagination.anchor)}>
              {pageSize === "all" ? "All" : pageSize}
            </Link>
          )
        ))}
      </div>
      <div>
        {pagination.page > 1 ? (
          <Link href={buildAdminPageHref(searchParams, pagination.pageParam, pagination.page - 1, pagination.anchor)}>Previous</Link>
        ) : (
          <span className="admin-pagination-disabled">Previous</span>
        )}
        <strong>Page {pagination.page} of {pagination.totalPages}</strong>
        {pagination.page < pagination.totalPages ? (
          <Link href={buildAdminPageHref(searchParams, pagination.pageParam, pagination.page + 1, pagination.anchor)}>Next</Link>
        ) : (
          <span className="admin-pagination-disabled">Next</span>
        )}
      </div>
    </nav>
  );
}

function AdminLeadQueueList({
  title,
  emptyText,
  leads,
  timeZone
}: {
  title: string;
  emptyText: string;
  leads: AdminLeadWorkQueueItem[];
  timeZone: string;
}) {
  return (
    <article className="admin-work-queue-card">
      <div className="admin-work-queue-heading">
        <span>{title}</span>
        <strong>{leads.length}</strong>
      </div>
      <div className="admin-work-queue-list">
        {leads.map((lead) => (
          <a className="admin-work-queue-row" href={`/admin?leadId=${encodeURIComponent(lead.id)}#lead-${lead.id}`} key={`${title}-${lead.id}`} data-open-lead-panel="true">
            <span>
              <strong>{lead.property_address || "No property address"}</strong>
              <small>{lead.full_name || "No name"} - {getAssignedName(lead)}</small>
            </span>
            <span>
              <strong>{formatDateTime(lead.next_follow_up_at, timeZone)}</strong>
              <small>{getLeadPriorityLabel(lead.lead_priority)} - {lead.contact_status || "new"}</small>
            </span>
          </a>
        ))}
        {!leads.length ? (
          <p>{emptyText}</p>
        ) : null}
      </div>
    </article>
  );
}

function normalizeLeadFilter(value: string, allowedValues: string[]) {
  return allowedValues.includes(value) ? value : "";
}

function normalizeLeadAssignedFilter(value: string) {
  if (value === "unassigned") {
    return value;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : "";
}

function sanitizeLeadSearch(value: string) {
  return value
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function normalizeContactMethod(value: FormDataEntryValue | null) {
  const method = value?.toString() || "";
  const allowedMethods = ["email", "phone", "text", "in_person", "other"];
  return allowedMethods.includes(method) ? method : null;
}

function normalizeLeadPriority(value: FormDataEntryValue | null) {
  const priority = value?.toString() || "normal";
  const allowedPriorities = leadPriorityOptions.map((option) => option.value);
  return allowedPriorities.includes(priority) ? priority : "normal";
}

function normalizeLeadActivityType(value: FormDataEntryValue | null) {
  const activityType = value?.toString() || "note";
  const allowedTypes = leadActivityTypeOptions.map((option) => option.value);
  return allowedTypes.includes(activityType) ? activityType : "note";
}

function normalizeAdminTimeZone(value: FormDataEntryValue | null) {
  const timeZone = value?.toString() || defaultAdminTimeZone;
  return timeZoneOptions.some((option) => option.value === timeZone) ? timeZone : defaultAdminTimeZone;
}

function asOptionalDateTime(value: FormDataEntryValue | null, timeZone = defaultAdminTimeZone) {
  const stringValue = value?.toString().trim() || "";
  return stringValue ? dateTimeLocalToIso(stringValue, timeZone) : null;
}

function normalizeFooterLogoDisplay(value: FormDataEntryValue | null) {
  const display = value?.toString() || "broker";
  return display === "team" || display === "both" || display === "broker" ? display : "broker";
}

async function uploadAdminImage(
  adminSupabase: NonNullable<ReturnType<typeof createAdminClient>>,
  file: FormDataEntryValue | null,
  slug: string,
  bucket: string,
  fallbackSlug: string
) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/") || file.size > maxAdminImageSize) {
    throw new Error("Please upload a JPG, PNG, WebP, or GIF image under 5 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const safeSlug = slugify(slug) || fallbackSlug;
  const filePath = `${safeSlug}/${Date.now()}.${extension}`;

  const { error } = await adminSupabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = adminSupabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

async function uploadTeamPhoto(
  adminSupabase: NonNullable<ReturnType<typeof createAdminClient>>,
  file: FormDataEntryValue | null,
  slug: string
) {
  return uploadAdminImage(adminSupabase, file, slug, teamPhotoBucket, "team-member");
}

async function uploadSiteLogo(
  adminSupabase: NonNullable<ReturnType<typeof createAdminClient>>,
  file: FormDataEntryValue | null,
  slug: string
) {
  return uploadAdminImage(adminSupabase, file, slug, siteLogoBucket, "site-logo");
}

async function uploadSiteHeroImage(
  adminSupabase: NonNullable<ReturnType<typeof createAdminClient>>,
  file: FormDataEntryValue | null,
  slug: string
) {
  return uploadAdminImage(adminSupabase, file, slug, siteHeroImageBucket, "home-property");
}

async function updateSiteSettings(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirectSiteSettingsError("Supabase admin access is not configured.");
  }

  const siteSlug = formData.get("siteSlug")?.toString() || "alu-realty-group";
  const siteSection = formData.get("siteSection")?.toString() || "site-settings";
  const currentSiteSettings = await getSiteSettings(siteSlug);
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (siteSection === "branding") {
    const siteName = formData.get("siteName")?.toString().trim();

    if (!siteName) {
      redirectSiteSettingsError("Site name is required before branding can be saved.");
    }

    let brokerLogoUrl = asOptionalString(formData.get("brokerLogoUrl"));
    let teamLogoUrl = asOptionalString(formData.get("teamLogoUrl"));
    let fairHousingLogoUrl = asOptionalString(formData.get("fairHousingLogoUrl"));
    let realtorLogoUrl = asOptionalString(formData.get("realtorLogoUrl"));

    try {
      brokerLogoUrl =
        (await uploadSiteLogo(adminSupabase, formData.get("brokerLogoFile"), `${siteSlug}-broker-logo`)) ||
        brokerLogoUrl;
      teamLogoUrl =
        (await uploadSiteLogo(adminSupabase, formData.get("teamLogoFile"), `${siteSlug}-team-logo`)) ||
        teamLogoUrl;
      fairHousingLogoUrl =
        (await uploadSiteLogo(adminSupabase, formData.get("fairHousingLogoFile"), `${siteSlug}-fair-housing-logo`)) ||
        fairHousingLogoUrl;
      realtorLogoUrl =
        (await uploadSiteLogo(adminSupabase, formData.get("realtorLogoFile"), `${siteSlug}-realtor-logo`)) ||
        realtorLogoUrl;
    } catch (error) {
      redirectSiteSettingsError(error instanceof Error ? error.message : "One of the logo uploads could not be completed.");
    }

    Object.assign(updatePayload, {
      site_name: siteName,
      brokerage_name: asOptionalString(formData.get("brokerageName")),
      primary_domain: asOptionalString(formData.get("primaryDomain")),
      broker_logo_url: brokerLogoUrl,
      team_logo_url: teamLogoUrl,
      homepage_sections: {
        ...currentSiteSettings.homepageSections,
        footerLogoDisplay: normalizeFooterLogoDisplay(formData.get("footerLogoDisplay")),
        fairHousingLogoUrl,
        fairHousingText: asOptionalString(formData.get("fairHousingText")) || currentSiteSettings.fairHousingText,
        fairHousingShowText: formData.get("fairHousingShowText") === "on",
        realtorLogoUrl,
        headerBrokerLogoHeight: asClampedNumber(formData.get("headerBrokerLogoHeight"), currentSiteSettings.headerBrokerLogoHeight, 32, 90),
        headerTeamLogoHeight: asClampedNumber(formData.get("headerTeamLogoHeight"), currentSiteSettings.headerTeamLogoHeight, 56, 140),
        footerBrandLogoHeight: asClampedNumber(formData.get("footerBrandLogoHeight"), currentSiteSettings.footerBrandLogoHeight, 36, 140),
        footerComplianceLogoHeight: asClampedNumber(formData.get("footerComplianceLogoHeight"), currentSiteSettings.footerComplianceLogoHeight, 14, 48)
      },
      brand_primary: asHexColor(formData.get("brandPrimary"), currentSiteSettings.brandPrimary),
      brand_accent: asHexColor(formData.get("brandAccent"), currentSiteSettings.brandAccent),
      brand_header_footer: asHexColor(formData.get("brandHeaderFooter"), currentSiteSettings.brandHeaderFooter),
      brand_section_background: asHexColor(formData.get("brandSectionBackground"), currentSiteSettings.brandSectionBackground)
    });
  } else if (siteSection === "homepage-photo") {
    let heroImageUrl = asOptionalString(formData.get("heroImageUrl"));

    try {
      heroImageUrl =
        (await uploadSiteHeroImage(adminSupabase, formData.get("heroImageFile"), `${siteSlug}-home-property`)) ||
        heroImageUrl;
    } catch (error) {
      redirectSiteSettingsError(error instanceof Error ? error.message : "The homepage property image upload could not be completed.");
    }

    Object.assign(updatePayload, {
      hero_image_url: heroImageUrl || currentSiteSettings.heroImageUrl
    });
  } else if (siteSection === "idx-search") {
    Object.assign(updatePayload, {
      idx_enabled: formData.get("idxEnabled") === "on",
      idx_provider_name: asOptionalString(formData.get("idxProviderName")) || currentSiteSettings.idxProviderName,
      idx_embed_url: asOptionalString(formData.get("idxEmbedUrl")),
      idx_embed_code: asOptionalString(formData.get("idxEmbedCode")),
      idx_search_url: asOptionalString(formData.get("idxSearchUrl")),
      idx_fallback_message: asOptionalString(formData.get("idxFallbackMessage")) || currentSiteSettings.idxFallbackMessage
    });
  } else if (siteSection === "hero-promo") {
    Object.assign(updatePayload, {
      hero_eyebrow: asOptionalString(formData.get("heroEyebrow")),
      hero_headline: asOptionalString(formData.get("heroHeadline")),
      hero_subheadline: asOptionalString(formData.get("heroSubheadline")),
      promo_enabled: formData.get("promoEnabled") === "on",
      promo_eyebrow: asOptionalString(formData.get("promoEyebrow")),
      promo_headline: asOptionalString(formData.get("promoHeadline")),
      promo_body: asOptionalString(formData.get("promoBody"))
    });
  } else if (siteSection === "contact") {
    const contactEmail = asOptionalString(formData.get("contactEmail"));
    const leadNotificationEmails = asEmailArray(formData.get("leadNotificationEmails"));
    const safeLeadNotificationEmails = leadNotificationEmails.length
      ? leadNotificationEmails
      : contactEmail
        ? [contactEmail]
        : [];
    const valuationNotificationEmails = asEmailArray(formData.get("valuationNotificationEmails"));

    Object.assign(updatePayload, {
      contact_email: contactEmail,
      contact_phone: asOptionalString(formData.get("contactPhone")),
      lead_notification_emails: safeLeadNotificationEmails,
      resend_from_email: asOptionalString(formData.get("resendFromEmail")),
      lead_reply_to_email: asOptionalString(formData.get("leadReplyToEmail")),
      time_zone: normalizeAdminTimeZone(formData.get("timeZone")),
      lead_routing: {
        ...currentSiteSettings.leadRouting,
        defaultNotificationEmails: safeLeadNotificationEmails,
        valuationNotificationEmails: valuationNotificationEmails.length ? valuationNotificationEmails : safeLeadNotificationEmails
      }
    });
  } else if (siteSection === "homepage-copy") {
    Object.assign(updatePayload, {
      homepage_sections: {
        ...currentSiteSettings.homepageSections,
        propertiesEyebrow: formData.get("propertiesEyebrow")?.toString().trim(),
        propertiesHeadline: formData.get("propertiesHeadline")?.toString().trim(),
        ratesEyebrow: formData.get("ratesEyebrow")?.toString().trim(),
        ratesHeadline: formData.get("ratesHeadline")?.toString().trim(),
        ratesBody: formData.get("ratesBody")?.toString().trim(),
        ratesStatus: formData.get("ratesStatus")?.toString().trim(),
        teamEyebrow: formData.get("teamEyebrow")?.toString().trim(),
        teamHeadline: formData.get("teamHeadline")?.toString().trim(),
        teamBody: formData.get("teamBody")?.toString().trim(),
        testimonialsEyebrow: formData.get("testimonialsEyebrow")?.toString().trim(),
        testimonialsHeadline: formData.get("testimonialsHeadline")?.toString().trim(),
        insightsEyebrow: formData.get("insightsEyebrow")?.toString().trim(),
        insightsHeadline: formData.get("insightsHeadline")?.toString().trim(),
        savedSearchEyebrow: formData.get("savedSearchEyebrow")?.toString().trim(),
        savedSearchHeadline: formData.get("savedSearchHeadline")?.toString().trim(),
        savedSearchBody: formData.get("savedSearchBody")?.toString().trim(),
        sellEyebrow: formData.get("sellEyebrow")?.toString().trim(),
        sellHeadline: formData.get("sellHeadline")?.toString().trim(),
        sellBody: formData.get("sellBody")?.toString().trim(),
        sellButtonText: formData.get("sellButtonText")?.toString().trim()
      }
    });
  } else if (siteSection === "lead-routing") {
    Object.assign(updatePayload, {
      lead_routing: {
        ...currentSiteSettings.leadRouting,
        defaultNotificationTeamMemberSlugs: asFormStringArray(formData.getAll("defaultNotificationTeamMemberSlugs")),
        valuationNotificationTeamMemberSlugs: asFormStringArray(formData.getAll("valuationNotificationTeamMemberSlugs")),
        defaultAssignedTeamMemberSlug: formData.get("defaultAssignedTeamMemberSlug")?.toString().trim() || "",
        valuationAssignedTeamMemberSlug: formData.get("valuationAssignedTeamMemberSlug")?.toString().trim() || "",
        sendClientConfirmation: formData.get("sendClientConfirmation") === "on",
        sendInternalNotification: formData.get("sendInternalNotification") === "on"
      }
    });
  } else {
    redirectSiteSettingsError("The requested site settings section was not recognized.");
  }

  const { error } = await adminSupabase
    .from("broker_sites")
    .update(updatePayload)
    .eq("slug", siteSlug);

  if (error) {
    redirectSiteSettingsError(error.message);
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/admin");
  redirect(`/admin?siteStatus=saved&siteSection=${siteSection}#site-settings`);
}

async function createLead(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();
  const siteSettings = await getSiteSettings();

  if (!adminSupabase) {
    redirect("/admin?leadStatus=error#new-lead");
  }

  const email = asOptionalString(formData.get("email"));
  const phone = asOptionalString(formData.get("phone"));
  const propertyAddress = asOptionalString(formData.get("propertyAddress"));

  if (!propertyAddress || (!email && !phone)) {
    redirect("/admin?leadStatus=error#new-lead");
  }

  const { data, error } = await adminSupabase
    .from("lead_submissions")
    .insert({
      lead_type: normalizeLeadType(formData.get("leadType")),
      full_name: asOptionalString(formData.get("fullName")),
      email,
      phone,
      property_address: propertyAddress,
      message: asOptionalString(formData.get("message")),
      source_page: "admin_manual",
      lead_source_category: normalizeLeadSourceCategory(formData.get("leadSourceCategory"), "manual"),
      assigned_team_member_id: asOptionalString(formData.get("assignedTeamMemberId")),
      contact_status: normalizeLeadStatus(formData.get("contactStatus")),
      preferred_contact_method: normalizeContactMethod(formData.get("preferredContactMethod")),
      contact_notes: asOptionalString(formData.get("contactNotes")),
      last_contacted_at: asOptionalDateTime(formData.get("lastContactedAt"), siteSettings.timeZone),
      lead_priority: normalizeLeadPriority(formData.get("leadPriority")),
      next_follow_up_at: asOptionalDateTime(formData.get("nextFollowUpAt"), siteSettings.timeZone),
      lead_source_detail: asOptionalString(formData.get("leadSourceDetail"))
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect("/admin?leadStatus=error#new-lead");
  }

  revalidatePath("/admin");
  redirect(`/admin?leadStatus=saved&leadId=${data.id}#lead-${data.id}`);
}

async function updateLead(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();
  const siteSettings = await getSiteSettings();

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
      lead_type: normalizeLeadType(formData.get("leadType")),
      full_name: asOptionalString(formData.get("fullName")),
      email,
      phone,
      property_address: propertyAddress,
      message: asOptionalString(formData.get("message")),
      lead_source_category: normalizeLeadSourceCategory(formData.get("leadSourceCategory")),
      assigned_team_member_id: asOptionalString(formData.get("assignedTeamMemberId")),
      contact_status: normalizeLeadStatus(formData.get("contactStatus")),
      preferred_contact_method: normalizeContactMethod(formData.get("preferredContactMethod")),
      contact_notes: asOptionalString(formData.get("contactNotes")),
      last_contacted_at: asOptionalDateTime(formData.get("lastContactedAt"), siteSettings.timeZone),
      lead_priority: normalizeLeadPriority(formData.get("leadPriority")),
      next_follow_up_at: asOptionalDateTime(formData.get("nextFollowUpAt"), siteSettings.timeZone),
      lead_source_detail: asOptionalString(formData.get("leadSourceDetail"))
    })
    .eq("id", leadId);

  if (error) {
    redirect("/admin?leadStatus=error#lead-inbox");
  }

  revalidatePath("/admin");
  redirect(`/admin?leadStatus=saved&leadId=${leadId}#lead-${leadId}`);
}

async function updateLeadQuickAction(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();
  const siteSettings = await getSiteSettings();

  if (!adminSupabase) {
    redirect("/admin?leadStatus=error#lead-inbox");
  }

  const leadId = formData.get("leadId")?.toString();
  const action = formData.get("quickAction")?.toString() || "";
  const updatePayload: Record<string, unknown> = {};

  if (!leadId) {
    redirect("/admin?leadStatus=error#lead-inbox");
  }

  if (action === "mark-contacted") {
    updatePayload.contact_status = "contacted";
    updatePayload.last_contacted_at = new Date().toISOString();
  } else if (action === "follow-up-today") {
    updatePayload.next_follow_up_at = getRelativeFollowUpIso(0, siteSettings.timeZone);
  } else if (action === "follow-up-tomorrow") {
    updatePayload.next_follow_up_at = getRelativeFollowUpIso(1, siteSettings.timeZone);
  } else if (action === "clear-follow-up") {
    updatePayload.next_follow_up_at = null;
  } else if (action === "high-priority") {
    updatePayload.lead_priority = "high";
  } else if (action === "assign") {
    updatePayload.assigned_team_member_id = asOptionalString(formData.get("assignedTeamMemberId"));
    updatePayload.contact_status = "assigned";
  }

  if (!Object.keys(updatePayload).length) {
    redirect(`/admin?leadStatus=error#lead-${leadId}`);
  }

  const { error } = await adminSupabase
    .from("lead_submissions")
    .update(updatePayload)
    .eq("id", leadId);

  if (error) {
    redirect(`/admin?leadStatus=error#lead-${leadId}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?leadStatus=saved&leadId=${leadId}#lead-${leadId}`);
}

async function createLeadActivity(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();
  const siteSettings = await getSiteSettings();

  if (!adminSupabase) {
    redirect("/admin?leadActivityStatus=error#lead-inbox");
  }

  const leadId = formData.get("leadId")?.toString();
  const summary = formData.get("activitySummary")?.toString().trim();
  const outcome = formData.get("activityOutcome")?.toString().trim();

  if (!leadId || !summary || !outcome) {
    redirect("/admin?leadActivityStatus=error#lead-inbox");
  }

  const createdByTeamMemberIds = asFormStringArray(formData.getAll("createdByTeamMemberIds"));
  let createdByName = asOptionalString(formData.get("createdByName"));

  if (createdByTeamMemberIds.length) {
    createdByName = (await getTeamMemberNamesByIds(adminSupabase, createdByTeamMemberIds)) || createdByName;
  }

  const { error } = await adminSupabase
    .from("lead_activities")
    .insert({
      lead_id: leadId,
      activity_type: normalizeLeadActivityType(formData.get("activityType")),
      activity_at: asOptionalDateTime(formData.get("activityAt"), siteSettings.timeZone) || new Date().toISOString(),
      summary,
      outcome,
      created_by_name: createdByName,
      follow_up_at: asOptionalDateTime(formData.get("activityFollowUpAt"), siteSettings.timeZone)
    });

  if (error) {
    redirect(`/admin?leadActivityStatus=error#lead-${leadId}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?leadActivityStatus=saved&leadId=${leadId}#lead-${leadId}`);
}

async function updateLeadActivity(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();
  const siteSettings = await getSiteSettings();

  if (!adminSupabase) {
    redirect("/admin?leadActivityStatus=error#lead-inbox");
  }

  const leadId = formData.get("leadId")?.toString();
  const activityId = formData.get("activityId")?.toString();
  const summary = formData.get("activitySummary")?.toString().trim();
  const outcome = formData.get("activityOutcome")?.toString().trim();

  if (!leadId || !activityId || !summary || !outcome) {
    redirect("/admin?leadActivityStatus=error#lead-inbox");
  }

  const updatedByTeamMemberIds = asFormStringArray(formData.getAll("updatedByTeamMemberIds"));
  let updatedByName = asOptionalString(formData.get("updatedByName"));

  if (updatedByTeamMemberIds.length) {
    updatedByName = (await getTeamMemberNamesByIds(adminSupabase, updatedByTeamMemberIds)) || updatedByName;
  }

  const { error } = await adminSupabase
    .from("lead_activities")
    .update({
      activity_type: normalizeLeadActivityType(formData.get("activityType")),
      activity_at: asOptionalDateTime(formData.get("activityAt"), siteSettings.timeZone) || new Date().toISOString(),
      summary,
      outcome,
      follow_up_at: asOptionalDateTime(formData.get("activityFollowUpAt"), siteSettings.timeZone),
      updated_by_name: updatedByName,
      updated_at: new Date().toISOString()
    })
    .eq("id", activityId)
    .eq("lead_id", leadId);

  if (error) {
    redirect(`/admin?leadActivityStatus=error#lead-${leadId}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?leadActivityStatus=updated&leadId=${leadId}#lead-${leadId}`);
}

async function completeLeadActivityTask(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?leadActivityStatus=error#lead-inbox");
  }

  const leadId = formData.get("leadId")?.toString();
  const activityId = formData.get("activityId")?.toString();
  const completedByTeamMemberId = formData.get("completedByTeamMemberId")?.toString();
  const completedByName = completedByTeamMemberId
    ? await getTeamMemberNamesByIds(adminSupabase, [completedByTeamMemberId])
    : asOptionalString(formData.get("completedByName"));

  if (!leadId || !activityId) {
    redirect("/admin?leadActivityStatus=error#lead-inbox");
  }

  const { error } = await adminSupabase
    .from("lead_activities")
    .update({
      follow_up_at: null,
      updated_by_name: completedByName,
      updated_at: new Date().toISOString()
    })
    .eq("id", activityId)
    .eq("lead_id", leadId);

  if (error) {
    redirect(`/admin?leadActivityStatus=error#lead-${leadId}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?leadActivityStatus=completed&leadId=${leadId}#lead-${leadId}`);
}

async function deleteLeadActivity(formData: FormData) {
  "use server";

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect("/admin?leadActivityStatus=error#lead-inbox");
  }

  const leadId = formData.get("leadId")?.toString();
  const activityId = formData.get("activityId")?.toString();

  if (!leadId || !activityId) {
    redirect("/admin?leadActivityStatus=error#lead-inbox");
  }

  const { error } = await adminSupabase
    .from("lead_activities")
    .delete()
    .eq("id", activityId)
    .eq("lead_id", leadId);

  if (error) {
    redirect(`/admin?leadActivityStatus=error#lead-${leadId}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?leadActivityStatus=deleted&leadId=${leadId}#lead-${leadId}`);
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
  let photoUrl = asOptionalString(formData.get("photoUrl"));

  try {
    photoUrl = (await uploadTeamPhoto(adminSupabase, formData.get("photoFile"), baseSlug)) || photoUrl;
  } catch {
    redirect("/admin?teamStatus=error#new-team-member");
  }

  const { data, error } = await adminSupabase
    .from("team_members")
    .insert({
      slug: baseSlug,
      full_name: fullName,
      title,
      phone: asOptionalString(formData.get("phone")),
      email: asOptionalString(formData.get("email")),
      bio: asOptionalString(formData.get("bio")),
      photo_url: photoUrl,
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
  const memberSlug = formData.get("memberSlug")?.toString() || memberId || "team-member";
  const fullName = formData.get("fullName")?.toString().trim();
  const title = formData.get("title")?.toString().trim();

  if (!memberId || !fullName || !title) {
    redirect("/admin?teamStatus=error#team-members");
  }

  const displayOrderValue = Number.parseInt(formData.get("displayOrder")?.toString() || "100", 10);
  let photoUrl = asOptionalString(formData.get("photoUrl"));

  try {
    photoUrl = (await uploadTeamPhoto(adminSupabase, formData.get("photoFile"), memberSlug)) || photoUrl;
  } catch {
    redirect("/admin?teamStatus=error#team-members");
  }

  const { error } = await adminSupabase
    .from("team_members")
    .update({
      full_name: fullName,
      title,
      phone: asOptionalString(formData.get("phone")),
      email: asOptionalString(formData.get("email")),
      bio: asOptionalString(formData.get("bio")),
      photo_url: photoUrl,
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

async function getAdminData(leadFilters: LeadFilters, pages: AdminPages, focusedLeadId = "") {
  const siteSettings = await getSiteSettings();
  const activeBanner = await getActiveSiteBanner(siteSettings.slug, siteSettings);
  const supabase = createClient();
  const adminSupabase = createAdminClient();
  const adminDataClient = adminSupabase || supabase;
  const cleanLeadSearch = sanitizeLeadSearch(leadFilters.search);
  const leadRangeStart = pages.leads.pageSize === 0 ? 0 : (pages.leads.page - 1) * pages.leads.pageSize;
  const teamRangeStart = pages.teamMembers.pageSize === 0 ? 0 : (pages.teamMembers.page - 1) * pages.teamMembers.pageSize;
  const testimonialRangeStart = pages.testimonials.pageSize === 0 ? 0 : (pages.testimonials.page - 1) * pages.testimonials.pageSize;
  const leadRangeEnd = getRangeEnd(leadRangeStart, pages.leads.pageSize);
  const teamRangeEnd = getRangeEnd(teamRangeStart, pages.teamMembers.pageSize);
  const testimonialRangeEnd = getRangeEnd(testimonialRangeStart, pages.testimonials.pageSize);
  const now = new Date();
  const todayInSiteTime = getDateTimeLocalValue(now, siteSettings.timeZone).slice(0, 10);
  const startOfTodayIso = dateTimeLocalToIso(`${todayInSiteTime}T00:00`, siteSettings.timeZone);
  const startOfTomorrowIso = dateTimeLocalToIso(`${addDaysToDateInput(todayInSiteTime, 1)}T00:00`, siteSettings.timeZone);

  const [
    bannersResult,
    teamMembersResult,
    teamMemberOptionsResult,
    testimonialsResult
  ] = await Promise.all([
    adminDataClient
      .from("site_banners")
      .select("id, campaign_name, eyebrow, headline, body, theme, start_date, end_date, is_active, priority")
      .eq("site_slug", siteSettings.slug)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(10),
    adminDataClient
      .from("team_members")
      .select("id, slug, full_name, title, phone, email, bio, photo_url, specialties, display_order, is_active", { count: "exact" })
      .order("display_order", { ascending: true })
      .range(teamRangeStart, teamRangeEnd ?? 9999),
    adminDataClient
      .from("team_members")
      .select("id, slug, full_name, title, phone, email, bio, photo_url, specialties, display_order, is_active")
      .order("display_order", { ascending: true })
      .limit(200),
    adminDataClient
      .from("testimonials")
      .select("id, team_member_id, scope, client_name, context, quote, rating, is_featured, is_published", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(testimonialRangeStart, testimonialRangeEnd ?? 9999)
  ]);

  const leadsResult = adminSupabase
    ? await (async () => {
        let leadsQuery = adminSupabase
          .from("lead_submissions")
          .select(adminLeadSelect, { count: "exact" });

        if (leadFilters.type) {
          leadsQuery = leadsQuery.eq("lead_type", leadFilters.type);
        }

        if (leadFilters.status) {
          leadsQuery = leadsQuery.eq("contact_status", leadFilters.status);
        }

        if (leadFilters.assigned === "unassigned") {
          leadsQuery = leadsQuery.is("assigned_team_member_id", null);
        } else if (leadFilters.assigned) {
          leadsQuery = leadsQuery.eq("assigned_team_member_id", leadFilters.assigned);
        }

        if (leadFilters.priority) {
          leadsQuery = leadsQuery.eq("lead_priority", leadFilters.priority);
        }

        if (leadFilters.source) {
          leadsQuery = leadsQuery.eq("lead_source_category", leadFilters.source);
        }

        if (leadFilters.followUp === "none") {
          leadsQuery = leadsQuery.is("next_follow_up_at", null);
        } else if (leadFilters.followUp === "overdue") {
          leadsQuery = leadsQuery.lt("next_follow_up_at", now.toISOString());
        } else if (leadFilters.followUp === "today") {
          leadsQuery = leadsQuery
            .gte("next_follow_up_at", startOfTodayIso)
            .lt("next_follow_up_at", startOfTomorrowIso);
        } else if (leadFilters.followUp === "upcoming") {
          leadsQuery = leadsQuery.gte("next_follow_up_at", now.toISOString());
        }

        if (cleanLeadSearch) {
          leadsQuery = leadsQuery.or(
            `full_name.ilike.%${cleanLeadSearch}%,email.ilike.%${cleanLeadSearch}%,phone.ilike.%${cleanLeadSearch}%,property_address.ilike.%${cleanLeadSearch}%`
          );
        }

        return leadsQuery
          .order("created_at", { ascending: false })
          .range(leadRangeStart, leadRangeEnd ?? 9999);
      })()
    : {
        data: [],
        count: 0,
        error: { message: "Add SUPABASE_SERVICE_ROLE_KEY in Vercel to unlock private lead inbox data." }
      };

  const leadWorkQueueResult = adminSupabase
    ? await adminSupabase
        .from("lead_submissions")
        .select("id, lead_type, full_name, email, phone, property_address, assigned_team_member_id, contact_status, lead_priority, next_follow_up_at, created_at, team_members(full_name)")
        .order("created_at", { ascending: false })
        .limit(250)
    : { data: [], error: null };

  let leads = (leadsResult.data || []) as AdminLead[];
  const focusedLeadResult = adminSupabase && focusedLeadId && !leads.some((lead) => lead.id === focusedLeadId)
    ? await adminSupabase
        .from("lead_submissions")
        .select(adminLeadSelect)
        .eq("id", focusedLeadId)
        .maybeSingle()
    : { data: null, error: null };

  if (focusedLeadResult.data) {
    leads = [focusedLeadResult.data as AdminLead, ...leads];
  }

  const leadWorkQueueItems = (leadWorkQueueResult.data || []) as AdminLeadWorkQueueItem[];
  const byFollowUpTime = (first: AdminLeadWorkQueueItem, second: AdminLeadWorkQueueItem) =>
    new Date(first.next_follow_up_at || first.created_at).getTime() - new Date(second.next_follow_up_at || second.created_at).getTime();
  const overdueLeads = leadWorkQueueItems
    .filter((lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at) < now)
    .sort(byFollowUpTime)
    .slice(0, 5);
  const todaysFollowUps = leadWorkQueueItems
    .filter((lead) => lead.next_follow_up_at && lead.next_follow_up_at >= startOfTodayIso && lead.next_follow_up_at < startOfTomorrowIso)
    .sort(byFollowUpTime)
    .slice(0, 5);
  const highPriorityLeads = leadWorkQueueItems
    .filter((lead) => lead.lead_priority === "high")
    .slice(0, 5);
  const leadIds = leads.map((lead) => lead.id);
  const leadActivitiesResult = adminSupabase && leadIds.length
    ? await adminSupabase
        .from("lead_activities")
        .select("id, lead_id, activity_type, activity_at, summary, outcome, created_by_name, follow_up_at, updated_by_name, updated_at, created_at")
        .in("lead_id", leadIds)
        .order("activity_at", { ascending: false })
        .limit(60)
    : { data: [], error: null };
  const leadActivities = (leadActivitiesResult.data || []) as AdminLeadActivity[];
  const leadActivitiesByLeadId = leadActivities.reduce<Record<string, AdminLeadActivity[]>>((activityMap, activity) => {
    activityMap[activity.lead_id] = [...(activityMap[activity.lead_id] || []), activity];
    return activityMap;
  }, {});
  const banners = (bannersResult.data || []) as AdminBanner[];
  const teamMembers = (teamMembersResult.data || []) as AdminTeamMember[];
  const teamMemberOptions = (teamMemberOptionsResult.data || teamMembers) as AdminTeamMember[];
  const testimonials = (testimonialsResult.data || []) as AdminTestimonial[];

  return {
    siteSettings,
    activeBanner,
    leads,
    leadWorkQueue: {
      overdue: overdueLeads,
      today: todaysFollowUps,
      highPriority: highPriorityLeads
    },
    leadActivitiesByLeadId,
    banners,
    teamMembers,
    teamMemberOptions,
    testimonials,
    pagination: {
      leads: getPagination(pages.leads.page, pages.leads.pageSize, leadsResult.count || 0, "leadPage", "leadPageSize", "lead-inbox"),
      teamMembers: getPagination(pages.teamMembers.page, pages.teamMembers.pageSize, teamMembersResult.count || 0, "teamPage", "teamPageSize", "team-members"),
      testimonials: getPagination(pages.testimonials.page, pages.testimonials.pageSize, testimonialsResult.count || 0, "testimonialPage", "testimonialPageSize", "testimonials")
    },
    errors: {
      leads: leadsResult.error?.message || focusedLeadResult.error?.message || leadActivitiesResult.error?.message || leadWorkQueueResult.error?.message,
      banners: bannersResult.error?.message,
      teamMembers: teamMembersResult.error?.message || teamMemberOptionsResult.error?.message,
      testimonials: testimonialsResult.error?.message
    }
  };
}

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams?: {
    [key: string]: string | undefined;
    siteStatus?: string;
    siteError?: string;
    bannerStatus?: string;
    bannerId?: string;
    leadStatus?: string;
    leadId?: string;
    leadActivityStatus?: string;
    teamStatus?: string;
    teamMemberId?: string;
    testimonialStatus?: string;
    testimonialId?: string;
    leadSearch?: string;
    leadFilterType?: string;
    leadFilterStatus?: string;
    leadFilterAssigned?: string;
    leadFilterPriority?: string;
    leadFilterSource?: string;
    leadFilterFollowUp?: string;
    leadPage?: string;
    leadPageSize?: string;
    teamPage?: string;
    teamPageSize?: string;
    testimonialPage?: string;
    testimonialPageSize?: string;
  };
}) {
  const savedLeadId = getSearchParamValue(searchParams, "leadId");
  const leadFilters: LeadFilters = {
    search: getSearchParamValue(searchParams, "leadSearch"),
    type: normalizeLeadFilter(getSearchParamValue(searchParams, "leadFilterType"), leadTypeOptions.map((option) => option.value)),
    status: normalizeLeadFilter(getSearchParamValue(searchParams, "leadFilterStatus"), leadStatusOptions.map((option) => option.value)),
    assigned: normalizeLeadAssignedFilter(getSearchParamValue(searchParams, "leadFilterAssigned")),
    priority: normalizeLeadFilter(getSearchParamValue(searchParams, "leadFilterPriority"), leadPriorityOptions.map((option) => option.value)),
    source: normalizeLeadFilter(getSearchParamValue(searchParams, "leadFilterSource"), leadSourceCategoryOptions.map((option) => option.value)),
    followUp: normalizeLeadFilter(getSearchParamValue(searchParams, "leadFilterFollowUp"), followUpFilterOptions.map((option) => option.value))
  };
  const adminPages: AdminPages = {
    leads: {
      page: normalizePageParam(getSearchParamValue(searchParams, "leadPage")),
      pageSize: normalizePageSizeParam(getSearchParamValue(searchParams, "leadPageSize"))
    },
    teamMembers: {
      page: normalizePageParam(getSearchParamValue(searchParams, "teamPage")),
      pageSize: normalizePageSizeParam(getSearchParamValue(searchParams, "teamPageSize"))
    },
    testimonials: {
      page: normalizePageParam(getSearchParamValue(searchParams, "testimonialPage")),
      pageSize: normalizePageSizeParam(getSearchParamValue(searchParams, "testimonialPageSize"))
    }
  };
  const hasLeadFilters = Boolean(leadFilters.search || leadFilters.type || leadFilters.status || leadFilters.assigned || leadFilters.priority || leadFilters.source || leadFilters.followUp);
  const { siteSettings, activeBanner, leads, leadWorkQueue, leadActivitiesByLeadId, banners, teamMembers, teamMemberOptions, testimonials, pagination, errors } = await getAdminData(leadFilters, adminPages, savedLeadId);
  const visibleErrors = Object.values(errors).filter(Boolean);
  const siteStatus = getSearchParamValue(searchParams, "siteStatus");
  const siteError = getSearchParamValue(searchParams, "siteError");
  const savedSiteSection = getSearchParamValue(searchParams, "siteSection");
  const bannerStatus = getSearchParamValue(searchParams, "bannerStatus");
  const savedBannerId = getSearchParamValue(searchParams, "bannerId");
  const leadStatus = getSearchParamValue(searchParams, "leadStatus");
  const leadActivityStatus = getSearchParamValue(searchParams, "leadActivityStatus");
  const teamStatus = getSearchParamValue(searchParams, "teamStatus");
  const savedTeamMemberId = getSearchParamValue(searchParams, "teamMemberId");
  const testimonialStatus = getSearchParamValue(searchParams, "testimonialStatus");
  const savedTestimonialId = getSearchParamValue(searchParams, "testimonialId");
  const hasTransientStatus = siteStatus === "saved" || siteStatus === "error" || bannerStatus === "saved" || bannerStatus === "error" || leadStatus === "saved" || leadStatus === "error" || leadActivityStatus === "saved" || leadActivityStatus === "updated" || leadActivityStatus === "completed" || leadActivityStatus === "deleted" || leadActivityStatus === "error" || teamStatus === "saved" || teamStatus === "error" || testimonialStatus === "saved" || testimonialStatus === "error";

  return (
    <main className="admin-shell">
      <AdminDataFreshness />
      <AdminStatusCleanup active={hasTransientStatus} />
      <AdminLeadFormReset
        activitySaved={leadActivityStatus === "saved"}
        activityUpdated={leadActivityStatus === "updated" || leadActivityStatus === "completed"}
        savedLeadId={savedLeadId}
      />
      <header className="admin-hero">
        <div>
          <p className="admin-kicker">Admin Dashboard</p>
          <h1>{siteSettings.siteName}</h1>
          <p>Manage the pieces that make this real estate site reusable: settings, banners, team, feedback, and leads.</p>
        </div>
        <Link className="admin-button" href="/" target="_blank" rel="noopener noreferrer">View website</Link>
      </header>

      <nav className="admin-section-nav" aria-label="Admin dashboard sections">
        <a href="#admin-overview">
          <span>Overview</span>
          <small>Counts and follow-ups</small>
        </a>
        <a href="#site-settings">
          <span>Site settings</span>
          <small>Branding and homepage</small>
        </a>
        <a href="#lead-inbox">
          <span>Leads</span>
          <small>CRM workspace</small>
        </a>
        <a href="#team-members">
          <span>Team</span>
          <small>Agent profiles</small>
        </a>
        <a href="#testimonials">
          <span>Testimonials</span>
          <small>Client feedback</small>
        </a>
      </nav>

      {visibleErrors.length ? (
        <section className="admin-alert" data-admin-status="error">
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
        <section className="admin-alert" data-admin-status="error">
          <strong>Banner campaign could not be saved yet.</strong>
          <p>This usually means the Supabase admin update permission still needs to be applied.</p>
        </section>
      ) : null}

      {siteStatus === "error" ? (
        <section className="admin-alert">
          <strong>Site settings could not be saved yet.</strong>
          <p>{siteError || "This usually means the Supabase admin update permission still needs to be applied."}</p>
        </section>
      ) : null}

      <section className="admin-stats" id="admin-overview" aria-label="Dashboard summary">
        <article>
          <span>Recent leads</span>
          <strong>{pagination.leads.totalCount}</strong>
        </article>
        <article>
          <span>Team members</span>
          <strong>{pagination.teamMembers.totalCount}</strong>
        </article>
        <article>
          <span>Banners</span>
          <strong>{banners.length}</strong>
        </article>
        <article>
          <span>Testimonials</span>
          <strong>{pagination.testimonials.totalCount}</strong>
        </article>
      </section>

      <section className="admin-work-queue" aria-label="Lead follow-up work queue">
        <AdminLeadQueueList
          title="Overdue follow-ups"
          emptyText="Nothing overdue. Nice and clean."
          leads={leadWorkQueue.overdue}
          timeZone={siteSettings.timeZone}
        />
        <AdminLeadQueueList
          title="Today"
          emptyText="No follow-ups scheduled for today."
          leads={leadWorkQueue.today}
          timeZone={siteSettings.timeZone}
        />
        <AdminLeadQueueList
          title="High priority"
          emptyText="No high-priority leads right now."
          leads={leadWorkQueue.highPriority}
          timeZone={siteSettings.timeZone}
        />
      </section>

      <section className="admin-grid">
        <article className="admin-card admin-card-wide" id="site-settings">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Site Settings</p>
              <h2>Brand, contact, and homepage copy</h2>
            </div>
            <span>{siteSettings.primaryDomain}</span>
          </div>
          {siteStatus === "saved" ? (
            <div className="admin-inline-success" data-admin-status="saved" role="status">
              <strong>Site settings saved.</strong>
              <span>The website settings have been updated.</span>
            </div>
          ) : null}
          <details className="admin-edit-panel">
            <summary className="admin-summary-row">
              <span>
                <strong>{siteSettings.siteName}</strong>
                <small>{siteSettings.brokerageName} - {siteSettings.contactEmail}</small>
              </span>
              <span>{siteSettings.primaryDomain}</span>
              <span>{siteSettings.brandPrimary}</span>
              <span>{siteSettings.brandAccent}</span>
            </summary>
            <form className="admin-form-card" action={updateSiteSettings} encType="multipart/form-data">
              <input name="siteSlug" type="hidden" value={siteSettings.slug} />
              <input name="siteSection" type="hidden" value="branding" />
              <section className="admin-settings-section">
                <div className="admin-settings-section-heading">
                  <p className="admin-kicker">Branding</p>
                  <h3>Names, logos, and colors</h3>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Site name
                    <input name="siteName" type="text" defaultValue={siteSettings.siteName} required />
                  </label>
                  <label>
                    Brokerage name
                    <input name="brokerageName" type="text" defaultValue={siteSettings.brokerageName} />
                  </label>
                  <label>
                    Primary domain
                    <input name="primaryDomain" type="text" defaultValue={siteSettings.primaryDomain} />
                  </label>
                  <BrandColorField label="Primary brand color" name="brandPrimary" defaultValue={siteSettings.brandPrimary} />
                  <BrandColorField label="Accent brand color" name="brandAccent" defaultValue={siteSettings.brandAccent} />
                  <BrandColorField label="Header/footer color" name="brandHeaderFooter" defaultValue={siteSettings.brandHeaderFooter} />
                  <BrandColorField label="Section/card background color" name="brandSectionBackground" defaultValue={siteSettings.brandSectionBackground} />
                </div>
                <div className="admin-property-image-grid admin-branding-media-grid">
                  <div className="admin-property-image-preview admin-branding-preview">
                    <span>Current Broker Logo</span>
                    {siteSettings.brokerLogoUrl ? (
                      <img className="admin-brand-logo-image" src={siteSettings.brokerLogoUrl} alt={`${siteSettings.brokerageName} broker logo`} />
                    ) : (
                      <small>No broker logo is currently set.</small>
                    )}
                    <span>Current Team Logo</span>
                    {siteSettings.teamLogoUrl ? (
                      <img className="admin-brand-logo-image" src={siteSettings.teamLogoUrl} alt={`${siteSettings.siteName} team logo`} />
                    ) : (
                      <small>No team logo is currently set.</small>
                    )}
                    <span>Current Equal Housing Footer Logo</span>
                    {siteSettings.fairHousingLogoUrl ? (
                      <div className="admin-compliance-logo-preview-tile">
                        <img className="admin-fair-housing-preview" src={siteSettings.fairHousingLogoUrl} alt={siteSettings.fairHousingText} />
                      </div>
                    ) : (
                      <small>No Equal Housing logo is currently set.</small>
                    )}
                    <span>Current Realtor Footer Logo</span>
                    {siteSettings.realtorLogoUrl ? (
                      <div className="admin-compliance-logo-preview-tile">
                        <img className="admin-realtor-preview" src={siteSettings.realtorLogoUrl} alt="Realtor logo" />
                      </div>
                    ) : (
                      <small>No Realtor logo is currently set.</small>
                    )}
                  </div>
                  <div className="admin-property-image-editor">
                    <span>Edit Brand Logos</span>
                    <label>
                      Broker logo URL
                      <input name="brokerLogoUrl" type="text" defaultValue={siteSettings.brokerLogoUrl} />
                    </label>
                    <label>
                      Upload broker logo
                      <input name="brokerLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                    </label>
                    <label>
                      Team logo URL
                      <input name="teamLogoUrl" type="text" defaultValue={siteSettings.teamLogoUrl} />
                    </label>
                    <label>
                      Upload team logo
                      <input name="teamLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                    </label>
                    <label>
                      Top broker logo height
                      <input name="headerBrokerLogoHeight" type="number" min="32" max="90" defaultValue={siteSettings.headerBrokerLogoHeight} />
                    </label>
                    <label>
                      Top team logo height
                      <input name="headerTeamLogoHeight" type="number" min="56" max="140" defaultValue={siteSettings.headerTeamLogoHeight} />
                    </label>
                    <label>
                      Footer logo display
                      <select name="footerLogoDisplay" defaultValue={siteSettings.footerLogoDisplay}>
                        <option value="broker">Broker logo only</option>
                        <option value="team">Team logo only</option>
                        <option value="both">Broker and team logos</option>
                      </select>
                    </label>
                    <label>
                      Footer broker/team logo height
                      <input name="footerBrandLogoHeight" type="number" min="36" max="140" defaultValue={siteSettings.footerBrandLogoHeight} />
                    </label>
                    <label>
                      Equal Housing logo URL
                      <input name="fairHousingLogoUrl" type="text" defaultValue={siteSettings.fairHousingLogoUrl} />
                    </label>
                    <label>
                      Upload Equal Housing logo
                      <input name="fairHousingLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                    </label>
                    <label className="admin-checkbox">
                      <input name="fairHousingShowText" type="checkbox" defaultChecked={siteSettings.fairHousingShowText} />
                      Show Equal Housing text next to the logo
                    </label>
                    <label>
                      Equal Housing footer text
                      <input name="fairHousingText" type="text" defaultValue={siteSettings.fairHousingText} />
                    </label>
                    <label>
                      Realtor logo URL
                      <input name="realtorLogoUrl" type="text" defaultValue={siteSettings.realtorLogoUrl} />
                    </label>
                    <label>
                      Upload Realtor logo
                      <input name="realtorLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                    </label>
                    <label>
                      Equal Housing/Realtor logo height
                      <input name="footerComplianceLogoHeight" type="number" min="14" max="48" defaultValue={siteSettings.footerComplianceLogoHeight} />
                    </label>
                    <small>Transparent PNG or clean white-background logo files will usually look best in the public header.</small>
                  </div>
                </div>
              </section>
              <div className="admin-form-footer">
                <small>These branding settings control the reusable website identity.</small>
                {siteStatus === "saved" && savedSiteSection === "branding" ? (
                  <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                ) : null}
                <button className="admin-save-button" type="submit">Save branding</button>
              </div>
            </form>

            <section className="admin-form-card" id="banner-campaigns">
              <section className="admin-settings-section">
                <div className="admin-settings-section-heading">
                  <div>
                    <p className="admin-kicker">Homepage Banner</p>
                    <h3>Active banner and campaigns</h3>
                  </div>
                  <span>{activeBanner?.headline || "No active banner"}</span>
                </div>
                <div className="admin-property-image-grid">
                  <div>
                    <p className="admin-kicker">Active Banner</p>
                    {activeBanner ? (
                      <div className={`admin-banner-preview banner-theme-${activeBanner.theme}`}>
                        <p>{activeBanner.eyebrow}</p>
                        <h3>{activeBanner.headline}</h3>
                        <span>{activeBanner.body}</span>
                      </div>
                    ) : null}
                    <p>{activeBanner ? "This is the banner currently displayed beneath the team logo on the website." : "The site will use fallback banner settings or hide the banner when no active campaign is available."}</p>
                  </div>
                  <div>
                    <p className="admin-kicker">Campaigns</p>
                    <h3>Edit banner campaigns</h3>
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
                        <details className="admin-edit-panel" id={`banner-${banner.id}`} key={banner.id} open={bannerStatus === "saved" && savedBannerId === banner.id}>
                          <summary className="admin-summary-row">
                            <span>
                              <strong>{banner.campaign_name}</strong>
                              <small>{banner.headline}</small>
                            </span>
                            <span>{banner.is_active ? "Active" : "Inactive"}</span>
                            <span>{banner.theme}</span>
                            <span>{formatDate(banner.start_date)}</span>
                          </summary>
                          <form className="admin-form-card" action={updateBannerCampaign}>
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
                        </details>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </section>

            <form className="admin-form-card" action={updateSiteSettings} encType="multipart/form-data">
              <input name="siteSlug" type="hidden" value={siteSettings.slug} />
              <input name="siteSection" type="hidden" value="homepage-photo" />
              <section className="admin-settings-section">
                <div className="admin-settings-section-heading">
                  <p className="admin-kicker">Home Page Property</p>
                  <h3>Active hero photo</h3>
                </div>
                <div className="admin-property-image-grid">
                  <div className="admin-property-image-preview">
                    <span>Active Home Page Property</span>
                    <img src={siteSettings.heroImageUrl} alt={`${siteSettings.siteName} homepage property`} />
                    <small>This image displays behind the main search panel on the public homepage.</small>
                  </div>
                  <div className="admin-property-image-editor">
                    <span>Edit Home Page Property Photo</span>
                    <label>
                      Property image URL
                      <input name="heroImageUrl" type="text" defaultValue={siteSettings.heroImageUrl} />
                    </label>
                    <label>
                      Upload property image
                      <input name="heroImageFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                    </label>
                    <small>Wide landscape photos work best here because the image fills the top hero area.</small>
                  </div>
                </div>
              </section>
              <div className="admin-form-footer">
                <small>Controls the main image behind the homepage search panel.</small>
                {siteStatus === "saved" && savedSiteSection === "homepage-photo" ? (
                  <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                ) : null}
                <button className="admin-save-button" type="submit">Save homepage photo</button>
              </div>
            </form>

            <form className="admin-form-card" action={updateSiteSettings}>
              <input name="siteSlug" type="hidden" value={siteSettings.slug} />
              <input name="siteSection" type="hidden" value="idx-search" />
              <section className="admin-settings-section">
                <div className="admin-settings-section-heading">
                  <div>
                    <p className="admin-kicker">IDX Search</p>
                    <h3>Provider-flexible property search</h3>
                  </div>
                  <span>{siteSettings.idxEnabled ? siteSettings.idxProviderName : "Not active yet"}</span>
                </div>
                <div className="admin-idx-grid">
                  <div className="admin-idx-preview">
                    <span>Search Homes Page</span>
                    <h4>{siteSettings.idxEnabled ? "IDX search is active" : "IDX search is staged"}</h4>
                    <p>
                      {siteSettings.idxEnabled && siteSettings.idxEmbedUrl
                        ? `${siteSettings.idxProviderName} will load inside the public Search Homes page.`
                        : siteSettings.idxFallbackMessage}
                    </p>
                    <a className="admin-text-link" href="/search" target="_blank" rel="noreferrer">Preview Search Homes page</a>
                  </div>
                  <div className="admin-property-image-editor">
                    <span>Edit IDX Search</span>
                    <label className="admin-checkbox">
                      <input name="idxEnabled" type="checkbox" defaultChecked={siteSettings.idxEnabled} />
                      Enable IDX search page
                    </label>
                    <label>
                      IDX provider name
                      <input name="idxProviderName" type="text" defaultValue={siteSettings.idxProviderName} placeholder="FlexMLS SmartFrame, IDX Broker, Spark API..." />
                    </label>
                    <label>
                      IDX iframe / SmartFrame URL
                      <input name="idxEmbedUrl" type="url" defaultValue={siteSettings.idxEmbedUrl} placeholder="https://..." />
                      <small>This is the safest first connection point for FlexMLS SmartFrame or other iframe-based IDX tools.</small>
                    </label>
                    <label>
                      External search URL
                      <input name="idxSearchUrl" type="url" defaultValue={siteSettings.idxSearchUrl} placeholder="https://..." />
                      <small>Used as a fallback button if the provider gives you a hosted search page instead of an iframe.</small>
                    </label>
                    <label>
                      Provider embed code notes
                      <textarea name="idxEmbedCode" rows={4} defaultValue={siteSettings.idxEmbedCode} placeholder="Optional: paste provider embed code here for reference."></textarea>
                      <small>We store this for reference, but render the iframe URL above first to keep the site safer and provider-flexible.</small>
                    </label>
                    <label>
                      Fallback message
                      <textarea name="idxFallbackMessage" rows={3} defaultValue={siteSettings.idxFallbackMessage}></textarea>
                    </label>
                  </div>
                </div>
              </section>
              <div className="admin-form-footer">
                <small>Controls the public Search Homes page while keeping FlexMLS, IDX Broker, and Spark API options open.</small>
                {siteStatus === "saved" && savedSiteSection === "idx-search" ? (
                  <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                ) : null}
                <button className="admin-save-button" type="submit">Save IDX search</button>
              </div>
            </form>

            <form className="admin-form-card" action={updateSiteSettings}>
              <input name="siteSlug" type="hidden" value={siteSettings.slug} />
              <input name="siteSection" type="hidden" value="hero-promo" />
              <section className="admin-settings-section">
                <div className="admin-settings-section-heading">
                  <p className="admin-kicker">Hero & Promo</p>
                  <h3>Top-of-page copy</h3>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Hero eyebrow
                    <input name="heroEyebrow" type="text" defaultValue={siteSettings.heroEyebrow} />
                  </label>
                  <label>
                    Hero subheadline
                    <input name="heroSubheadline" type="text" defaultValue={siteSettings.heroSubheadline} />
                  </label>
                </div>
                <label>
                  Hero headline
                  <textarea name="heroHeadline" rows={2} defaultValue={siteSettings.heroHeadline}></textarea>
                </label>
                <div className="admin-checkbox-row">
                  <label className="admin-checkbox">
                    <input name="promoEnabled" type="checkbox" defaultChecked={siteSettings.promoEnabled} />
                    Enable fallback promo banner
                  </label>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Fallback promo eyebrow
                    <input name="promoEyebrow" type="text" defaultValue={siteSettings.promoEyebrow} />
                  </label>
                  <label>
                    Fallback promo headline
                    <input name="promoHeadline" type="text" defaultValue={siteSettings.promoHeadline} />
                  </label>
                </div>
                <label>
                  Fallback promo body
                  <textarea name="promoBody" rows={2} defaultValue={siteSettings.promoBody}></textarea>
                </label>
              </section>
              <div className="admin-form-footer">
                <small>Controls the homepage opening message and fallback promo banner.</small>
                {siteStatus === "saved" && savedSiteSection === "hero-promo" ? (
                  <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                ) : null}
                <button className="admin-save-button" type="submit">Save hero & promo</button>
              </div>
            </form>

            <form className="admin-form-card" action={updateSiteSettings}>
              <input name="siteSlug" type="hidden" value={siteSettings.slug} />
              <input name="siteSection" type="hidden" value="contact" />
              <section className="admin-settings-section">
                <div className="admin-settings-section-heading">
                  <p className="admin-kicker">Contact</p>
                  <h3>Email, phone, and notifications</h3>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Contact phone
                    <input name="contactPhone" type="tel" defaultValue={siteSettings.contactPhone} />
                  </label>
                  <label>
                    Contact email
                    <input name="contactEmail" type="email" defaultValue={siteSettings.contactEmail} />
                  </label>
                  <label>
                    Reply-to email
                    <input name="leadReplyToEmail" type="email" defaultValue={siteSettings.leadReplyToEmail} />
                  </label>
                  <label>
                    Resend sender email
                    <input name="resendFromEmail" type="text" defaultValue={siteSettings.resendFromEmail} />
                  </label>
                  <label>
                    Admin time zone
                    <select name="timeZone" defaultValue={siteSettings.timeZone}>
                      {timeZoneOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <small>Used for lead follow-up dates and activity timeline entries.</small>
                  </label>
                </div>
                <label>
                  Lead notification emails
                  <textarea name="leadNotificationEmails" rows={2} defaultValue={siteSettings.leadNotificationEmails.join(", ")}></textarea>
                </label>
                <label>
                  Valuation notification emails
                  <textarea name="valuationNotificationEmails" rows={2} defaultValue={siteSettings.leadRouting.valuationNotificationEmails.join(", ")}></textarea>
                </label>
              </section>
              <div className="admin-form-footer">
                <small>Controls public contact details and email notification behavior.</small>
                {siteStatus === "saved" && savedSiteSection === "contact" ? (
                  <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                ) : null}
                <button className="admin-save-button" type="submit">Save contact</button>
              </div>
            </form>

            <form className="admin-form-card" action={updateSiteSettings}>
              <input name="siteSlug" type="hidden" value={siteSettings.slug} />
              <input name="siteSection" type="hidden" value="homepage-copy" />
              <section className="admin-settings-section">
                <div className="admin-settings-section-heading">
                  <p className="admin-kicker">Homepage Copy</p>
                  <h3>Section headlines and supporting text</h3>
                </div>
                <div className="admin-form-grid">
                  <label>
                    Properties eyebrow
                    <input name="propertiesEyebrow" type="text" defaultValue={siteSettings.homepageSections.propertiesEyebrow} />
                  </label>
                  <label>
                    Properties headline
                    <input name="propertiesHeadline" type="text" defaultValue={siteSettings.homepageSections.propertiesHeadline} />
                  </label>
                  <label>
                    Mortgage eyebrow
                    <input name="ratesEyebrow" type="text" defaultValue={siteSettings.homepageSections.ratesEyebrow} />
                  </label>
                  <label>
                    Mortgage headline
                    <input name="ratesHeadline" type="text" defaultValue={siteSettings.homepageSections.ratesHeadline} />
                  </label>
                  <label>
                    Mortgage status
                    <input name="ratesStatus" type="text" defaultValue={siteSettings.homepageSections.ratesStatus} />
                  </label>
                  <label>
                    Team eyebrow
                    <input name="teamEyebrow" type="text" defaultValue={siteSettings.homepageSections.teamEyebrow} />
                  </label>
                  <label>
                    Team headline
                    <input name="teamHeadline" type="text" defaultValue={siteSettings.homepageSections.teamHeadline} />
                  </label>
                  <label>
                    Testimonials eyebrow
                    <input name="testimonialsEyebrow" type="text" defaultValue={siteSettings.homepageSections.testimonialsEyebrow} />
                  </label>
                  <label>
                    Testimonials headline
                    <input name="testimonialsHeadline" type="text" defaultValue={siteSettings.homepageSections.testimonialsHeadline} />
                  </label>
                  <label>
                    Insights eyebrow
                    <input name="insightsEyebrow" type="text" defaultValue={siteSettings.homepageSections.insightsEyebrow} />
                  </label>
                  <label>
                    Insights headline
                    <input name="insightsHeadline" type="text" defaultValue={siteSettings.homepageSections.insightsHeadline} />
                  </label>
                  <label>
                    Saved search eyebrow
                    <input name="savedSearchEyebrow" type="text" defaultValue={siteSettings.homepageSections.savedSearchEyebrow} />
                  </label>
                  <label>
                    Sell eyebrow
                    <input name="sellEyebrow" type="text" defaultValue={siteSettings.homepageSections.sellEyebrow} />
                  </label>
                  <label>
                    Sell button text
                    <input name="sellButtonText" type="text" defaultValue={siteSettings.homepageSections.sellButtonText} />
                  </label>
                </div>
                <label>
                  Mortgage body
                  <textarea name="ratesBody" rows={3} defaultValue={siteSettings.homepageSections.ratesBody}></textarea>
                </label>
                <label>
                  Team body
                  <textarea name="teamBody" rows={3} defaultValue={siteSettings.homepageSections.teamBody}></textarea>
                </label>
                <label>
                  Saved search headline
                  <textarea name="savedSearchHeadline" rows={2} defaultValue={siteSettings.homepageSections.savedSearchHeadline}></textarea>
                </label>
                <label>
                  Saved search body
                  <textarea name="savedSearchBody" rows={3} defaultValue={siteSettings.homepageSections.savedSearchBody}></textarea>
                </label>
                <label>
                  Sell headline
                  <textarea name="sellHeadline" rows={2} defaultValue={siteSettings.homepageSections.sellHeadline}></textarea>
                </label>
                <label>
                  Sell body
                  <textarea name="sellBody" rows={3} defaultValue={siteSettings.homepageSections.sellBody}></textarea>
                </label>
              </section>
              <div className="admin-form-footer">
                <small>Controls the reusable homepage section wording.</small>
                {siteStatus === "saved" && savedSiteSection === "homepage-copy" ? (
                  <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                ) : null}
                <button className="admin-save-button" type="submit">Save homepage copy</button>
              </div>
            </form>

            <form className="admin-form-card" action={updateSiteSettings}>
              <input name="siteSlug" type="hidden" value={siteSettings.slug} />
              <input name="siteSection" type="hidden" value="lead-routing" />
              <section className="admin-settings-section">
                <div className="admin-settings-section-heading">
                  <p className="admin-kicker">Lead Routing</p>
                  <h3>Assignments and email behavior</h3>
                </div>
                <div className="admin-routing-grid">
                  <div className="admin-routing-stack">
                    <label>
                      Default assigned team member
                      <select name="defaultAssignedTeamMemberSlug" defaultValue={siteSettings.leadRouting.defaultAssignedTeamMemberSlug}>
                        <option value="">No default assignment</option>
                        {teamMemberOptions.map((member) => (
                          <option key={member.id} value={member.slug}>{member.full_name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Default notification team members
                      <select
                        name="defaultNotificationTeamMemberSlugs"
                        multiple
                        defaultValue={siteSettings.leadRouting.defaultNotificationTeamMemberSlugs}
                      >
                        {teamMemberOptions.map((member) => (
                          <option key={member.id} value={member.slug}>{member.full_name}</option>
                        ))}
                      </select>
                      <small>Hold Ctrl while clicking to select more than one.</small>
                    </label>
                  </div>
                  <div className="admin-routing-stack">
                    <label>
                      Valuation assigned team member
                      <select name="valuationAssignedTeamMemberSlug" defaultValue={siteSettings.leadRouting.valuationAssignedTeamMemberSlug}>
                        <option value="">Use default assignment</option>
                        {teamMemberOptions.map((member) => (
                          <option key={member.id} value={member.slug}>{member.full_name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Valuation notification team members
                      <select
                        name="valuationNotificationTeamMemberSlugs"
                        multiple
                        defaultValue={siteSettings.leadRouting.valuationNotificationTeamMemberSlugs}
                      >
                        {teamMemberOptions.map((member) => (
                          <option key={member.id} value={member.slug}>{member.full_name}</option>
                        ))}
                      </select>
                      <small>Leave blank to use the default notification team.</small>
                    </label>
                  </div>
                </div>
                <div className="admin-checkbox-row">
                  <label className="admin-checkbox">
                    <input name="sendClientConfirmation" type="checkbox" defaultChecked={siteSettings.leadRouting.sendClientConfirmation} />
                    Send client confirmation emails
                  </label>
                  <label className="admin-checkbox">
                    <input name="sendInternalNotification" type="checkbox" defaultChecked={siteSettings.leadRouting.sendInternalNotification} />
                    Send internal lead notifications
                  </label>
                </div>
              </section>
              <div className="admin-form-footer">
                <small>Controls who gets assigned and notified when new leads arrive.</small>
                {siteStatus === "saved" && savedSiteSection === "lead-routing" ? (
                  <span className="admin-save-confirmation" data-admin-status="saved" role="status">Saved successfully</span>
                ) : null}
                <button className="admin-save-button" type="submit">Save lead routing</button>
              </div>
            </form>
          </details>
        </article>

        <article className="admin-card admin-card-wide" id="lead-inbox">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Lead Workspace</p>
              <h2>Track buyer, seller, and valuation leads</h2>
            </div>
            <span>{hasLeadFilters ? `${pagination.leads.totalCount} matching` : pagination.leads.totalCount ? "Live data" : "No leads visible"}</span>
          </div>

          {leadStatus === "error" ? (
            <div className="admin-inline-alert" role="alert">
              <strong>Lead could not be saved.</strong>
              <span>Please make sure there is a property address and at least one contact method.</span>
            </div>
          ) : null}

          <form className="admin-filter-bar" action="/admin#lead-inbox">
            <label>
              Search leads
              <input name="leadSearch" type="search" defaultValue={leadFilters.search} placeholder="Name, email, phone, or address" />
            </label>
            <label>
              Lead type
              <select name="leadFilterType" defaultValue={leadFilters.type}>
                <option value="">All types</option>
                {leadTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="leadFilterStatus" defaultValue={leadFilters.status}>
                <option value="">All statuses</option>
                {leadStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Assigned to
              <select name="leadFilterAssigned" defaultValue={leadFilters.assigned}>
                <option value="">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {teamMemberOptions.map((member) => (
                  <option key={member.id} value={member.id}>{member.full_name}</option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select name="leadFilterPriority" defaultValue={leadFilters.priority}>
                <option value="">All priorities</option>
                {leadPriorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Source
              <select name="leadFilterSource" defaultValue={leadFilters.source}>
                <option value="">All sources</option>
                {leadSourceCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Follow-up
              <select name="leadFilterFollowUp" defaultValue={leadFilters.followUp}>
                {followUpFilterOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="admin-filter-actions">
              <button className="admin-save-button" type="submit">Apply filters</button>
              {hasLeadFilters ? (
                <Link className="admin-reset-link" href="/admin#lead-inbox">Clear</Link>
              ) : null}
            </div>
          </form>

          <AdminPaginationControls pagination={pagination.leads} searchParams={searchParams} />

          <details className="admin-create-panel" id="new-lead">
            <summary>Add lead from phone, text, email, or website follow-up</summary>
            <form className="admin-form-card" action={createLead}>
              <div className="admin-form-grid">
                <label>
                  Lead type
                  <select name="leadType" defaultValue="seller">
                    {leadTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
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
                    {teamMemberOptions.map((member) => (
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
                  Priority
                  <select name="leadPriority" defaultValue="normal">
                    {leadPriorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Last contacted
                  <input name="lastContactedAt" type="datetime-local" />
                </label>
                <label>
                  Next follow-up
                  <input name="nextFollowUpAt" type="datetime-local" />
                </label>
                <label>
                  Source category
                  <select name="leadSourceCategory" defaultValue="manual">
                    {leadSourceCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Source detail
                  <input name="leadSourceDetail" type="text" placeholder="Phone call, sign call, referral, open house" />
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
                <button className="admin-save-button" type="submit">Add lead</button>
              </div>
            </form>
          </details>

          <div className="admin-form-list">
            {leads.map((lead) => {
              const leadActivities = leadActivitiesByLeadId[lead.id] || [];
              const openActivityTasks = getOpenActivityTasks(leadActivities);
              const nextActivityTask = openActivityTasks[0];
              const searchLeadSummary = getSearchLeadSummary(lead);
              const latestActivity = leadActivities[0];
              const crmFocus = getLeadCrmFocus(lead, openActivityTasks, searchLeadSummary, siteSettings.timeZone);
              const displayedLeadActivities = [
                ...leadActivities.slice(0, 6),
                ...openActivityTasks
              ].filter((activity, index, activities) => activities.findIndex((item) => item.id === activity.id) === index);

              return (
              <details
                className="admin-edit-panel"
                id={`lead-${lead.id}`}
                key={lead.id}
                open={savedLeadId === lead.id}
                data-reset-on-close="true"
              >
                <summary className="admin-summary-row">
                  <span>
                    <strong>{lead.property_address || "No property address"}</strong>
                    <small>{lead.full_name || "No name"} - {lead.email || lead.phone || "No contact listed"}</small>
                  </span>
                  <span>{getLeadTypeLabel(lead.lead_type)}</span>
                  <span>{getAssignedName(lead)}</span>
                  <span>
                    <strong className={`admin-mini-status admin-status-${getStatusTone(lead.contact_status)}`}>{getLeadStatusLabel(lead.contact_status)}</strong>
                    <small className={`admin-mini-status admin-priority-${getPriorityTone(lead.lead_priority)}`}>{getLeadPriorityLabel(lead.lead_priority)}</small>
                  </span>
                  <span className={`admin-summary-followup admin-followup-${getFollowUpTone(lead.next_follow_up_at, siteSettings.timeZone)}`}>{getLeadFollowUpLabel(lead, siteSettings.timeZone)}</span>
                </summary>
              <form className="admin-form-card admin-lead-detail-card" action={updateLead}>
                <input name="leadId" type="hidden" value={lead.id} />
                <div className="admin-lead-detail-hero">
                  <div className="admin-lead-title">
                    <p className="admin-kicker">{getLeadStatusLabel(lead.contact_status)} {getLeadTypeLabel(lead.lead_type)}</p>
                    <h3>{lead.property_address || "No property address"}</h3>
                    <div className="admin-lead-badges" aria-label="Lead summary">
                      <span className={`admin-priority-${getPriorityTone(lead.lead_priority)}`}>{getLeadPriorityLabel(lead.lead_priority)}</span>
                      <span className={`admin-status-${getStatusTone(lead.contact_status)}`}>{getLeadStatusLabel(lead.contact_status)}</span>
                      <span>{getAssignedName(lead)}</span>
                      <span className={`admin-followup-${getFollowUpTone(lead.next_follow_up_at, siteSettings.timeZone)}`}>{getLeadFollowUpLabel(lead, siteSettings.timeZone)}</span>
                    </div>
                  </div>
                  <span className="admin-lead-created">Created {formatDate(lead.created_at, siteSettings.timeZone)}</span>
                </div>

                <div className="admin-lead-command-strip" aria-label="Lead contact summary">
                  <div>
                    <span>Client</span>
                    <strong>{lead.full_name || "No name yet"}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    {lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : <strong>Not provided</strong>}
                  </div>
                  <div>
                    <span>Phone</span>
                    {lead.phone ? <a href={`tel:${lead.phone.replace(/[^0-9]/g, "")}`}>{lead.phone}</a> : <strong>Not provided</strong>}
                  </div>
                  <div>
                    <span>Preferred</span>
                    <strong>{contactMethodOptions.find((option) => option.value === lead.preferred_contact_method)?.label || "Not specified"}</strong>
                  </div>
                </div>

                <div className="admin-crm-focus-grid" aria-label="CRM lead focus">
                  <div className={`admin-crm-focus-card admin-crm-focus-primary admin-followup-${crmFocus.tone}`}>
                    <span>Next best action</span>
                    <strong>{crmFocus.title}</strong>
                    <small>{crmFocus.body}</small>
                  </div>
                  <div className="admin-crm-focus-card">
                    <span>Lead path</span>
                    <strong>{getLeadTypeLabel(lead.lead_type)}</strong>
                    <small>{getLeadSourceLabel(lead)}</small>
                  </div>
                  <div className="admin-crm-focus-card">
                    <span>Activity load</span>
                    <strong>{openActivityTasks.length ? `${openActivityTasks.length} open task${openActivityTasks.length === 1 ? "" : "s"}` : "No open tasks"}</strong>
                    <small>{latestActivity ? `Last: ${getLeadActivityTypeLabel(latestActivity.activity_type)} on ${formatDate(latestActivity.activity_at, siteSettings.timeZone)}` : "No timeline entries yet"}</small>
                  </div>
                </div>

                <div className="admin-quick-actions" aria-label="Quick lead actions">
                  <span className="admin-quick-actions-label">Quick actions</span>
                  <button form={`lead-quick-contacted-${lead.id}`} type="submit">Mark contacted</button>
                  <button form={`lead-quick-followup-today-${lead.id}`} type="submit">Follow up today</button>
                  <button form={`lead-quick-followup-tomorrow-${lead.id}`} type="submit">Follow up tomorrow</button>
                  <button form={`lead-quick-priority-${lead.id}`} type="submit">Mark high priority</button>
                  <button form={`lead-quick-clear-followup-${lead.id}`} type="submit">Clear follow-up</button>
                  {teamMemberOptions.length <= 2 ? (
                    teamMemberOptions.map((member) => (
                      <button form={`lead-quick-assign-${lead.id}-${member.id}`} key={member.id} type="submit">Assign to {member.full_name.split(" ")[0]}</button>
                    ))
                  ) : (
                    <div className="admin-quick-assign-control">
                      <label>
                        <span>Assign to</span>
                        <select form={`lead-quick-assign-${lead.id}`} name="assignedTeamMemberId" defaultValue={lead.assigned_team_member_id || ""} required>
                          <option value="">Select agent</option>
                          {teamMemberOptions.map((member) => (
                            <option key={member.id} value={member.id}>{member.full_name}</option>
                          ))}
                        </select>
                      </label>
                      <button form={`lead-quick-assign-${lead.id}`} type="submit">Apply</button>
                    </div>
                  )}
                </div>

                <div className="admin-lead-snapshot-grid" aria-label="Lead status snapshot">
                  <div className={`admin-snapshot-status admin-status-${getStatusTone(lead.contact_status)}`}>
                    <span>Status</span>
                    <strong>{getLeadStatusLabel(lead.contact_status)}</strong>
                  </div>
                  <div className={`admin-snapshot-status admin-priority-${getPriorityTone(lead.lead_priority)}`}>
                    <span>Priority</span>
                    <strong>{getLeadPriorityLabel(lead.lead_priority)}</strong>
                  </div>
                  <div>
                    <span>Assigned</span>
                    <strong>{getAssignedName(lead)}</strong>
                  </div>
                  <div className={`admin-snapshot-status admin-followup-${getFollowUpTone(lead.next_follow_up_at, siteSettings.timeZone)}`}>
                    <span>Next follow-up</span>
                    <strong>{formatDateTime(lead.next_follow_up_at, siteSettings.timeZone) || "Not scheduled"}</strong>
                  </div>
                  <div>
                    <span>Last contacted</span>
                    <strong>{formatDateTime(lead.last_contacted_at, siteSettings.timeZone) || "Not recorded"}</strong>
                  </div>
                  <div>
                    <span>Source</span>
                    <strong>{getLeadSourceLabel(lead)}</strong>
                  </div>
                </div>

                <div className="admin-lead-workspace-grid">
                  <section className="admin-lead-section">
                    <div className="admin-lead-section-heading">
                      <p className="admin-kicker">Contact</p>
                      <h4>Client contact card</h4>
                    </div>
                    <div className="admin-contact-actions">
                      {lead.email ? <a href={`mailto:${lead.email}`}>Email client</a> : <span>No email</span>}
                      {lead.phone ? <a href={`tel:${lead.phone.replace(/[^0-9]/g, "")}`}>Call client</a> : <span>No phone</span>}
                    </div>
                    <div className="admin-form-grid admin-form-grid-compact">
                      <label>
                        Client name
                        <input name="fullName" type="text" defaultValue={lead.full_name || ""} />
                      </label>
                      <label>
                        Preferred method
                        <select name="preferredContactMethod" defaultValue={lead.preferred_contact_method || ""}>
                          {contactMethodOptions.map((option) => (
                            <option key={option.value || "none"} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Email
                        <input name="email" type="email" defaultValue={lead.email || ""} />
                      </label>
                      <label>
                        Phone
                        <input name="phone" type="tel" defaultValue={lead.phone || ""} />
                      </label>
                    </div>
                  </section>

                  <section className="admin-lead-section">
                    <div className="admin-lead-section-heading">
                      <p className="admin-kicker">Follow-up</p>
                      <h4>Pipeline and timing</h4>
                    </div>
                    <div className="admin-form-grid admin-form-grid-compact">
                      <label>
                        Status
                        <select name="contactStatus" defaultValue={lead.contact_status || "new"}>
                          {leadStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Priority
                        <select name="leadPriority" defaultValue={lead.lead_priority || "normal"}>
                          {leadPriorityOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Last contacted
                        <input name="lastContactedAt" type="datetime-local" defaultValue={formatDateTimeLocal(lead.last_contacted_at, siteSettings.timeZone)} />
                      </label>
                      <label>
                        Next follow-up
                        <input name="nextFollowUpAt" type="datetime-local" defaultValue={formatDateTimeLocal(lead.next_follow_up_at, siteSettings.timeZone)} />
                      </label>
                    </div>
                  </section>
                </div>

                <section className="admin-lead-section">
                  <div className="admin-lead-section-heading">
                    <p className="admin-kicker">Lead details</p>
                    <h4>{getLeadTypeLabel(lead.lead_type)} request</h4>
                  </div>
                  {searchLeadSummary ? (
                    <div className="admin-search-lead-summary">
                      <div>
                        <span>Search notes</span>
                        <strong>{searchLeadSummary.notes || "No notes provided"}</strong>
                      </div>
                      <div>
                        <span>Listing alerts</span>
                        <strong>{searchLeadSummary.alerts || "Not specified"}</strong>
                      </div>
                    </div>
                  ) : null}
                  <div className="admin-form-grid">
                    <label>
                      Lead type
                      <select name="leadType" defaultValue={lead.lead_type || "seller"}>
                        {leadTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Assigned team member
                      <select name="assignedTeamMemberId" defaultValue={lead.assigned_team_member_id || ""}>
                        <option value="">Unassigned</option>
                        {teamMemberOptions.map((member) => (
                          <option key={member.id} value={member.id}>{member.full_name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Property address
                      <input name="propertyAddress" type="text" defaultValue={lead.property_address || ""} required />
                    </label>
                    <label>
                      Source category
                      <select name="leadSourceCategory" defaultValue={lead.lead_source_category || "website"}>
                        {leadSourceCategoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Source detail
                      <input name="leadSourceDetail" type="text" defaultValue={lead.lead_source_detail || ""} placeholder="Phone call, referral, sign call, open house" />
                    </label>
                  </div>
                </section>

                <section className="admin-lead-section admin-lead-notes-section">
                  <div className="admin-lead-section-heading">
                    <p className="admin-kicker">Notes</p>
                    <h4>Request and follow-up context</h4>
                  </div>
                  <label>
                    Request details
                    <textarea name="message" rows={3} defaultValue={lead.message || ""}></textarea>
                  </label>
                  <label>
                    Contact notes
                    <textarea name="contactNotes" rows={3} defaultValue={lead.contact_notes || ""}></textarea>
                  </label>
                </section>
                <div className="admin-form-footer">
                  <small>Assigned to {getAssignedName(lead)} - Priority: {getLeadPriorityLabel(lead.lead_priority)} - Next follow-up: {formatDateTime(lead.next_follow_up_at, siteSettings.timeZone)} - Source: {getLeadSourceLabel(lead)}</small>
                  {leadStatus === "saved" && savedLeadId === lead.id ? (
                    <span className="admin-save-confirmation" data-admin-status="saved">Saved successfully</span>
                  ) : null}
                  <button className="admin-secondary-button" type="reset">Reset changes</button>
                  <button className="admin-save-button" type="submit">Save lead</button>
                </div>
              </form>
              <form id={`lead-quick-contacted-${lead.id}`} className="admin-hidden-action-form" action={updateLeadQuickAction}>
                <input name="leadId" type="hidden" value={lead.id} />
                <input name="quickAction" type="hidden" value="mark-contacted" />
              </form>
              <form id={`lead-quick-followup-today-${lead.id}`} className="admin-hidden-action-form" action={updateLeadQuickAction}>
                <input name="leadId" type="hidden" value={lead.id} />
                <input name="quickAction" type="hidden" value="follow-up-today" />
              </form>
              <form id={`lead-quick-followup-tomorrow-${lead.id}`} className="admin-hidden-action-form" action={updateLeadQuickAction}>
                <input name="leadId" type="hidden" value={lead.id} />
                <input name="quickAction" type="hidden" value="follow-up-tomorrow" />
              </form>
              <form id={`lead-quick-priority-${lead.id}`} className="admin-hidden-action-form" action={updateLeadQuickAction}>
                <input name="leadId" type="hidden" value={lead.id} />
                <input name="quickAction" type="hidden" value="high-priority" />
              </form>
              <form id={`lead-quick-clear-followup-${lead.id}`} className="admin-hidden-action-form" action={updateLeadQuickAction}>
                <input name="leadId" type="hidden" value={lead.id} />
                <input name="quickAction" type="hidden" value="clear-follow-up" />
              </form>
              {teamMemberOptions.length <= 2 ? (
                teamMemberOptions.map((member) => (
                  <form id={`lead-quick-assign-${lead.id}-${member.id}`} className="admin-hidden-action-form" action={updateLeadQuickAction} key={member.id}>
                    <input name="leadId" type="hidden" value={lead.id} />
                    <input name="quickAction" type="hidden" value="assign" />
                    <input name="assignedTeamMemberId" type="hidden" value={member.id} />
                  </form>
                ))
              ) : (
                <form id={`lead-quick-assign-${lead.id}`} className="admin-hidden-action-form" action={updateLeadQuickAction}>
                  <input name="leadId" type="hidden" value={lead.id} />
                  <input name="quickAction" type="hidden" value="assign" />
                </form>
              )}
              <section className="admin-timeline-panel">
                <div className="admin-card-header admin-form-title">
                  <div>
                    <p className="admin-kicker">Activity Timeline</p>
                    <h3>Follow-up history and tasks</h3>
                  </div>
                  <span>{leadActivities.length} items</span>
                </div>
                <div className="admin-timeline-toolbar">
                  <div className="admin-timeline-toolbar-card">
                    <strong>{leadActivities[0]?.outcome || "No recent outcome yet"}</strong>
                    <span>Most recent outcome</span>
                  </div>
                  <div className={`admin-timeline-toolbar-card admin-task-card admin-followup-${getFollowUpTone(nextActivityTask?.follow_up_at, siteSettings.timeZone)}`}>
                    <strong>{nextActivityTask ? getActivityTaskLabel(nextActivityTask, siteSettings.timeZone) : "No open activity task"}</strong>
                    <span>{nextActivityTask ? `${getLeadActivityTypeLabel(nextActivityTask.activity_type)} - ${nextActivityTask.outcome || "No outcome noted"}` : "Next activity follow-up"}</span>
                  </div>
                </div>
                {openActivityTasks.length ? (
                  <div className="admin-open-task-list" aria-label="Open activity tasks">
                    <div className="admin-open-task-heading">
                      <span>Open activity tasks</span>
                      <strong>{openActivityTasks.length}</strong>
                    </div>
                    {openActivityTasks.slice(0, 3).map((activity) => (
                      <div className={`admin-open-task-row admin-followup-${getFollowUpTone(activity.follow_up_at, siteSettings.timeZone)}`} key={`task-${activity.id}`}>
                        <a href={`#activity-${activity.id}`} data-open-activity-panel="true">
                          <span>
                            <strong>{getActivityTaskLabel(activity, siteSettings.timeZone)}</strong>
                            <small>{getLeadActivityTypeLabel(activity.activity_type)} - {activity.outcome || activity.summary}</small>
                          </span>
                          <small>{activity.created_by_name || "No owner noted"}</small>
                        </a>
                        <form action={completeLeadActivityTask}>
                          <input name="leadId" type="hidden" value={lead.id} />
                          <input name="activityId" type="hidden" value={activity.id} />
                          <input name="completedByTeamMemberId" type="hidden" value={lead.assigned_team_member_id || ""} />
                          <button type="submit">Mark complete</button>
                        </form>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="admin-timeline-list">
                  {displayedLeadActivities.map((activity) => (
                    <details className={`admin-timeline-item admin-timeline-type-${activity.activity_type}`} id={`activity-${activity.id}`} key={activity.id} data-activity-edit-panel="true">
                      <summary className="admin-timeline-summary">
                        <span>
                          <strong>{getLeadActivityTypeLabel(activity.activity_type)}</strong>
                          <small>{activity.outcome || "No outcome noted"}{activity.created_by_name ? ` - ${activity.created_by_name}` : ""}</small>
                        </span>
                        <span>
                          <time>{formatDateTime(activity.activity_at, siteSettings.timeZone)}</time>
                          {activity.updated_at ? (
                            <small>Updated {formatDateTime(activity.updated_at, siteSettings.timeZone)}{activity.updated_by_name ? ` by ${activity.updated_by_name}` : ""}</small>
                          ) : null}
                        </span>
                      </summary>
                      <p>{activity.summary}</p>
                      <div className="admin-timeline-task-status">
                        {activity.follow_up_at ? (
                          <>
                            <small className={`admin-timeline-followup admin-followup-${getFollowUpTone(activity.follow_up_at, siteSettings.timeZone)}`}>Open task: {formatDateTime(activity.follow_up_at, siteSettings.timeZone)}</small>
                            <form action={completeLeadActivityTask}>
                              <input name="leadId" type="hidden" value={lead.id} />
                              <input name="activityId" type="hidden" value={activity.id} />
                              <input name="completedByTeamMemberId" type="hidden" value={lead.assigned_team_member_id || ""} />
                              <button type="submit">Mark task complete</button>
                            </form>
                          </>
                        ) : (
                          <small className="admin-timeline-followup admin-followup-complete">No open task</small>
                        )}
                      </div>
                      <form className="admin-form-card admin-activity-edit-form" action={updateLeadActivity}>
                        <input name="leadId" type="hidden" value={lead.id} />
                        <input name="activityId" type="hidden" value={activity.id} />
                        <div className="admin-form-grid">
                          <label>
                            Activity type
                            <select name="activityType" defaultValue={activity.activity_type}>
                              {leadActivityTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Activity date
                            <input name="activityAt" type="datetime-local" defaultValue={formatDateTimeLocal(activity.activity_at, siteSettings.timeZone)} />
                          </label>
                          <label>
                            Activity follow-up
                            <input name="activityFollowUpAt" type="datetime-local" defaultValue={formatDateTimeLocal(activity.follow_up_at, siteSettings.timeZone)} />
                          </label>
                          <label>
                            Updated by
                            <select name="updatedByTeamMemberIds" defaultValue="">
                              <option value="">Select team member</option>
                              {teamMemberOptions.map((member) => (
                                <option key={member.id} value={member.id}>{member.full_name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label>
                          Other updated by
                          <input name="updatedByName" type="text" defaultValue={activity.updated_by_name || ""} placeholder="Manual name if needed" />
                        </label>
                        <label>
                          Activity note
                          <textarea name="activitySummary" rows={3} defaultValue={activity.summary} required></textarea>
                        </label>
                        <label>
                          Outcome
                          <input name="activityOutcome" type="text" defaultValue={activity.outcome || ""} required />
                        </label>
                        <div className="admin-form-footer">
                          <small>Saving records the current update date and time.</small>
                          <button className="admin-secondary-button" type="reset">Reset activity</button>
                          <button className="admin-save-button" type="submit">Save activity</button>
                        </div>
                      </form>
                      <form action={deleteLeadActivity}>
                        <input name="leadId" type="hidden" value={lead.id} />
                        <input name="activityId" type="hidden" value={activity.id} />
                        <button className="admin-danger-link" type="submit">Delete entry</button>
                      </form>
                    </details>
                  ))}
                  {!leadActivities.length ? (
                    <p className="admin-empty">No timeline activity has been added for this lead yet.</p>
                  ) : null}
                </div>
                {leadActivityStatus === "saved" && savedLeadId === lead.id ? (
                  <span className="admin-save-confirmation admin-timeline-confirmation" data-admin-status="saved" role="status">Activity added</span>
                ) : null}
                {leadActivityStatus === "updated" && savedLeadId === lead.id ? (
                  <span className="admin-save-confirmation admin-timeline-confirmation" data-admin-status="saved" role="status">Activity updated</span>
                ) : null}
                {leadActivityStatus === "completed" && savedLeadId === lead.id ? (
                  <span className="admin-save-confirmation admin-timeline-confirmation" data-admin-status="saved" role="status">Task completed</span>
                ) : null}
                {leadActivityStatus === "deleted" && savedLeadId === lead.id ? (
                  <span className="admin-save-confirmation admin-timeline-confirmation" data-admin-status="saved" role="status">Activity deleted</span>
                ) : null}
                <details className="admin-create-panel admin-activity-create-panel" data-activity-create-panel="true">
                  <summary>Add New Activity</summary>
                  <form className="admin-form-card admin-activity-form" action={createLeadActivity} data-activity-form={lead.id}>
                    <input name="leadId" type="hidden" value={lead.id} />
                    <div className="admin-form-grid">
                      <label>
                        Activity type
                        <select name="activityType" defaultValue="note">
                          {leadActivityTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Activity date
                        <input name="activityAt" type="datetime-local" />
                      </label>
                    </div>
                    <div className="admin-form-grid admin-activity-added-by-grid">
                      <label>
                        Added by
                        <select name="createdByTeamMemberIds" multiple>
                          {teamMemberOptions.map((member) => (
                            <option key={member.id} value={member.id}>{member.full_name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Other added by
                        <input name="createdByName" type="text" placeholder="Manual name if needed" />
                      </label>
                      <small className="admin-grid-help">Hold Ctrl while clicking to select more than one team member.</small>
                    </div>
                    <label>
                      Activity note
                      <textarea name="activitySummary" rows={3} placeholder="Called client, sent CMA, left voicemail, scheduled showing..." required></textarea>
                    </label>
                    <label>
                      Outcome
                      <input name="activityOutcome" type="text" placeholder="Left voicemail, meeting set, waiting for reply" required />
                    </label>
                    <label>
                      Activity follow-up
                      <input name="activityFollowUpAt" type="datetime-local" />
                    </label>
                    <div className="admin-form-footer">
                      <small>Leave activity date blank to use the current time. Use activity follow-up for a task tied to this note only.</small>
                      <button className="admin-secondary-button" type="reset">Clear entry</button>
                      <button className="admin-save-button" type="submit">Add activity</button>
                    </div>
                  </form>
                </details>
              </section>
              </details>
              );
            })}
            {!leads.length ? (
              <p className="admin-empty">
                {hasLeadFilters ? "No leads match these filters yet." : "No leads are available to this dashboard yet."}
              </p>
            ) : null}
          </div>

          <AdminPaginationControls pagination={pagination.leads} searchParams={searchParams} />
        </article>

        <article className="admin-card admin-card-wide" id="team-members">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Team</p>
              <h2>Edit agent profiles</h2>
            </div>
            <span>{pagination.teamMembers.totalCount} profiles</span>
          </div>
          {teamStatus === "error" ? (
            <div className="admin-inline-alert" role="alert">
              <strong>Team profile could not be saved.</strong>
              <span>Please check the required name and title fields or Supabase update permission.</span>
            </div>
          ) : null}
          <details className="admin-create-panel" id="new-team-member">
            <summary>Add new team member</summary>
            <form className="admin-form-card" action={createTeamMember} encType="multipart/form-data">
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
                <label>
                  Upload photo
                  <input name="photoFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
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
          <AdminPaginationControls pagination={pagination.teamMembers} searchParams={searchParams} />
          <div className="admin-form-list">
            {teamMembers.map((member) => (
              <details className="admin-edit-panel" id={`team-member-${member.id}`} key={member.id} open={teamStatus === "saved" && savedTeamMemberId === member.id}>
                <summary className="admin-summary-row">
                  <span>
                    <strong>{member.full_name}</strong>
                    <small>{member.title}</small>
                  </span>
                  <span>{member.is_active ? "Visible" : "Hidden"}</span>
                  <span>{member.phone || "No phone"}</span>
                  <span>{member.email || "No email"}</span>
                </summary>
              <form className="admin-form-card" action={updateTeamMember} encType="multipart/form-data">
                <input name="memberId" type="hidden" value={member.id} />
                <input name="memberSlug" type="hidden" value={member.slug} />
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
                  <label>
                    Upload replacement photo
                    <input name="photoFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                  </label>
                </div>
                {member.photo_url ? (
                  <div className="admin-photo-preview">
                    <img src={member.photo_url} alt="" />
                    <span>Current profile photo</span>
                  </div>
                ) : null}
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
              </details>
            ))}
          </div>
          <AdminPaginationControls pagination={pagination.teamMembers} searchParams={searchParams} />
        </article>

        <article className="admin-card admin-card-wide" id="testimonials">
          <div className="admin-card-header">
            <div>
              <p className="admin-kicker">Feedback</p>
              <h2>Edit testimonials</h2>
            </div>
            <span>{pagination.testimonials.totalCount} testimonials</span>
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
                    {teamMemberOptions.map((member) => (
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
          <AdminPaginationControls pagination={pagination.testimonials} searchParams={searchParams} />
          <div className="admin-form-list">
            {testimonials.map((testimonial) => (
              <details className="admin-edit-panel" id={`testimonial-${testimonial.id}`} key={testimonial.id} open={testimonialStatus === "saved" && savedTestimonialId === testimonial.id}>
                <summary className="admin-summary-row">
                  <span>
                    <strong>{testimonial.client_name}</strong>
                    <small>{truncateText(testimonial.quote)}</small>
                  </span>
                  <span>{testimonial.is_published ? "Published" : "Draft"}</span>
                  <span>{getTeamMemberNameById(teamMemberOptions, testimonial.team_member_id)}</span>
                  <span>{testimonial.rating ? `${testimonial.rating}/5` : "No rating"}</span>
                </summary>
              <form className="admin-form-card" action={updateTestimonial}>
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
                      {teamMemberOptions.map((member) => (
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
              </details>
            ))}
          </div>
          <AdminPaginationControls pagination={pagination.testimonials} searchParams={searchParams} />
        </article>
      </section>
    </main>
  );
}
