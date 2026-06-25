import { createClient } from "@supabase/supabase-js";

export type SiteSettings = {
  slug: string;
  siteName: string;
  brokerageName: string;
  primaryDomain: string;
  brokerLogoUrl: string;
  teamLogoUrl: string;
  contactEmail: string;
  contactPhone: string;
  leadNotificationEmails: string[];
  resendFromEmail: string;
  leadReplyToEmail: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubheadline: string;
  promoEnabled: boolean;
  promoEyebrow: string;
  promoHeadline: string;
  promoBody: string;
  brandPrimary: string;
  brandAccent: string;
};

export const defaultSiteSettings: SiteSettings = {
  slug: "alu-realty-group",
  siteName: "Alu Realty Group",
  brokerageName: "Fathom Realty Elite",
  primaryDomain: "alurealtygroup.com",
  brokerLogoUrl: "/assets/fathom-realty-elite-logo.png",
  teamLogoUrl: "/assets/alu-realty-group-logo.png",
  contactEmail: "phil@alurealtygroup.com",
  contactPhone: "",
  leadNotificationEmails: ["phil@alurealtygroup.com"],
  resendFromEmail: "Alu Realty Group <noreply@contact.alurealtygroup.com>",
  leadReplyToEmail: "phil@alurealtygroup.com",
  heroEyebrow: "SCOTTSDALE · PARADISE VALLEY · PHOENIX",
  heroHeadline: "Find the place\nthat feels like yours.",
  heroSubheadline: "Local insight, real-time listings, and smart guidance for your next move in the Valley.",
  promoEnabled: true,
  promoEyebrow: "Celebrating America's 250th",
  promoHeadline: "Home. Freedom. Future.",
  promoBody: "Honoring the spirit of July 4th and the communities we call home.",
  brandPrimary: "#17221f",
  brandAccent: "#d9784f"
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type BrokerSiteRow = {
  slug: string;
  site_name: string | null;
  brokerage_name: string | null;
  primary_domain: string | null;
  broker_logo_url: string | null;
  team_logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  lead_notification_emails: string[] | null;
  resend_from_email: string | null;
  lead_reply_to_email: string | null;
  hero_eyebrow: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  promo_enabled: boolean | null;
  promo_eyebrow: string | null;
  promo_headline: string | null;
  promo_body: string | null;
  brand_primary: string | null;
  brand_accent: string | null;
};

function mapBrokerSite(row: BrokerSiteRow): SiteSettings {
  return {
    slug: row.slug || defaultSiteSettings.slug,
    siteName: row.site_name || defaultSiteSettings.siteName,
    brokerageName: row.brokerage_name || defaultSiteSettings.brokerageName,
    primaryDomain: row.primary_domain || defaultSiteSettings.primaryDomain,
    brokerLogoUrl: row.broker_logo_url || defaultSiteSettings.brokerLogoUrl,
    teamLogoUrl: row.team_logo_url || defaultSiteSettings.teamLogoUrl,
    contactEmail: row.contact_email || defaultSiteSettings.contactEmail,
    contactPhone: row.contact_phone || defaultSiteSettings.contactPhone,
    leadNotificationEmails: row.lead_notification_emails?.length
      ? row.lead_notification_emails
      : defaultSiteSettings.leadNotificationEmails,
    resendFromEmail: row.resend_from_email || defaultSiteSettings.resendFromEmail,
    leadReplyToEmail: row.lead_reply_to_email || defaultSiteSettings.leadReplyToEmail,
    heroEyebrow: row.hero_eyebrow || defaultSiteSettings.heroEyebrow,
    heroHeadline: row.hero_headline || defaultSiteSettings.heroHeadline,
    heroSubheadline: row.hero_subheadline || defaultSiteSettings.heroSubheadline,
    promoEnabled: row.promo_enabled ?? defaultSiteSettings.promoEnabled,
    promoEyebrow: row.promo_eyebrow || defaultSiteSettings.promoEyebrow,
    promoHeadline: row.promo_headline || defaultSiteSettings.promoHeadline,
    promoBody: row.promo_body || defaultSiteSettings.promoBody,
    brandPrimary: row.brand_primary || defaultSiteSettings.brandPrimary,
    brandAccent: row.brand_accent || defaultSiteSettings.brandAccent
  };
}

export async function getSiteSettings(slug = "alu-realty-group"): Promise<SiteSettings> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return defaultSiteSettings;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("broker_sites")
    .select(`
      slug,
      site_name,
      brokerage_name,
      primary_domain,
      broker_logo_url,
      team_logo_url,
      contact_email,
      contact_phone,
      lead_notification_emails,
      resend_from_email,
      lead_reply_to_email,
      hero_eyebrow,
      hero_headline,
      hero_subheadline,
      promo_enabled,
      promo_eyebrow,
      promo_headline,
      promo_body,
      brand_primary,
      brand_accent
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return defaultSiteSettings;
  }

  return mapBrokerSite(data as BrokerSiteRow);
}
