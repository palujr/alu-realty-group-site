import { createClient } from "@supabase/supabase-js";

export type SiteSettings = {
  slug: string;
  siteName: string;
  brokerageName: string;
  primaryDomain: string;
  brokerLogoUrl: string;
  teamLogoUrl: string;
  footerBrokerLogoUrl: string;
  footerTeamLogoUrl: string;
  footerLogoDisplay: "broker" | "team" | "both";
  fairHousingLogoUrl: string;
  fairHousingText: string;
  fairHousingShowText: boolean;
  realtorLogoUrl: string;
  headerBrokerLogoHeight: number;
  headerTeamLogoHeight: number;
  footerBrandLogoHeight: number;
  footerComplianceLogoHeight: number;
  contactEmail: string;
  contactPhone: string;
  timeZone: string;
  leadNotificationEmails: string[];
  resendFromEmail: string;
  leadReplyToEmail: string;
  heroImageUrl: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubheadline: string;
  promoEnabled: boolean;
  promoEyebrow: string;
  promoHeadline: string;
  promoBody: string;
  idxEnabled: boolean;
  idxProviderName: string;
  idxEmbedUrl: string;
  idxEmbedCode: string;
  idxSearchUrl: string;
  idxFallbackMessage: string;
  brandPrimary: string;
  brandAccent: string;
  brandHeaderFooter: string;
  brandSectionBackground: string;
  homepageSections: {
    propertiesEyebrow: string;
    propertiesHeadline: string;
    ratesEyebrow: string;
    ratesHeadline: string;
    ratesBody: string;
    ratesStatus: string;
    teamEyebrow: string;
    teamHeadline: string;
    teamBody: string;
    testimonialsEyebrow: string;
    testimonialsHeadline: string;
    testimonialsShowSaleDate: boolean;
    insightsEyebrow: string;
    insightsHeadline: string;
    savedSearchEyebrow: string;
    savedSearchHeadline: string;
    savedSearchBody: string;
    sellEyebrow: string;
    sellHeadline: string;
    sellBody: string;
    sellButtonText: string;
  };
  leadRouting: {
    defaultNotificationEmails: string[];
    valuationNotificationEmails: string[];
    defaultNotificationTeamMemberSlugs: string[];
    valuationNotificationTeamMemberSlugs: string[];
    defaultAssignedTeamMemberSlug: string;
    valuationAssignedTeamMemberSlug: string;
    sendClientConfirmation: boolean;
    sendInternalNotification: boolean;
  };
};

type SiteSettingsHomepageSections = SiteSettings["homepageSections"] & {
  footerLogoDisplay?: string;
  footerBrokerLogoUrl?: string;
  footerTeamLogoUrl?: string;
  fairHousingLogoUrl?: string;
  fairHousingText?: string;
  fairHousingShowText?: boolean;
  realtorLogoUrl?: string;
  headerBrokerLogoHeight?: number;
  headerTeamLogoHeight?: number;
  footerBrandLogoHeight?: number;
  footerComplianceLogoHeight?: number;
};

export type SiteBanner = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  theme: string;
};

export const defaultHomepageSections: SiteSettings["homepageSections"] = {
  propertiesEyebrow: "CURATED FOR YOU",
  propertiesHeadline: "Homes worth a closer look.",
  ratesEyebrow: "TODAY'S MORTGAGE SNAPSHOT",
  ratesHeadline: "Know your buying power.",
  ratesBody: "Rates move quickly. See national mortgage-market data from Mortgage News Daily and estimate a monthly payment before you tour.",
  ratesStatus: "Prepared for live Mortgage News Daily widget data",
  teamEyebrow: "MEET THE TEAM",
  teamHeadline: "Personal guidance, built to scale.",
  teamBody: "Start with Phil and Denise today, then add future agents with photos, contact details, bios, specialties, and reviews from the same database structure.",
  testimonialsEyebrow: "CLIENT FEEDBACK",
  testimonialsHeadline: "Stories from the people we serve.",
  testimonialsShowSaleDate: false,
  insightsEyebrow: "THE MARKET, MADE CLEAR",
  insightsHeadline: "News & local insight.",
  savedSearchEyebrow: "DON'T MISS THE RIGHT ONE",
  savedSearchHeadline: "Your search can keep working\nwhile you get on with your day.",
  savedSearchBody: "Save your criteria and get a personal email when a new listing matches, a favorite changes price, or a property comes back on market.",
  sellEyebrow: "THINKING OF SELLING?",
  sellHeadline: "Start with a clearer\npicture of your home.",
  sellBody: "Get a thoughtful market estimate informed by recent sales, current competition, and the details that make your property different.",
  sellButtonText: "Request a home valuation"
};

export const defaultLeadRouting: SiteSettings["leadRouting"] = {
  defaultNotificationEmails: ["phil@alurealtygroup.com"],
  valuationNotificationEmails: ["phil@alurealtygroup.com"],
  defaultNotificationTeamMemberSlugs: [],
  valuationNotificationTeamMemberSlugs: [],
  defaultAssignedTeamMemberSlug: "",
  valuationAssignedTeamMemberSlug: "",
  sendClientConfirmation: true,
  sendInternalNotification: true
};

export const defaultSiteSettings: SiteSettings = {
  slug: "alu-realty-group",
  siteName: "Alu Realty Group",
  brokerageName: "Fathom Realty Elite",
  primaryDomain: "alurealtygroup.com",
  brokerLogoUrl: "/assets/fathom-realty-elite-logo.png",
  teamLogoUrl: "/assets/alu-realty-group-logo.png",
  footerBrokerLogoUrl: "",
  footerTeamLogoUrl: "",
  footerLogoDisplay: "broker",
  fairHousingLogoUrl: "/assets/equal-housing-opportunity.gif",
  fairHousingText: "Equal Housing Opportunity",
  fairHousingShowText: true,
  realtorLogoUrl: "/assets/realtor-logo-black.jpg",
  headerBrokerLogoHeight: 48,
  headerTeamLogoHeight: 92,
  footerBrandLogoHeight: 82,
  footerComplianceLogoHeight: 24,
  contactEmail: "phil@alurealtygroup.com",
  contactPhone: "",
  timeZone: "America/Phoenix",
  leadNotificationEmails: ["phil@alurealtygroup.com"],
  resendFromEmail: "Alu Realty Group <noreply@contact.alurealtygroup.com>",
  leadReplyToEmail: "phil@alurealtygroup.com",
  heroImageUrl: "/assets/desert-home-hero.png",
  heroEyebrow: "SCOTTSDALE · PARADISE VALLEY · PHOENIX",
  heroHeadline: "Find the place\nthat feels like yours.",
  heroSubheadline: "Local insight, real-time listings, and smart guidance for your next move in the Valley.",
  promoEnabled: true,
  promoEyebrow: "Celebrating America's 250th",
  promoHeadline: "Home. Freedom. Future.",
  promoBody: "Honoring the spirit of July 4th and the communities we call home.",
  idxEnabled: false,
  idxProviderName: "FlexMLS SmartFrame",
  idxEmbedUrl: "",
  idxEmbedCode: "",
  idxSearchUrl: "",
  idxFallbackMessage: "IDX search is being connected. In the meantime, contact us and we will send live property matches directly to you.",
  brandPrimary: "#17221f",
  brandAccent: "#d9784f",
  brandHeaderFooter: "#1d2b27",
  brandSectionBackground: "#f5f1e8",
  homepageSections: defaultHomepageSections,
  leadRouting: defaultLeadRouting
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
  footer_logo_display?: string | null;
  fair_housing_logo_url?: string | null;
  fair_housing_text?: string | null;
  fair_housing_show_text?: boolean | null;
  realtor_logo_url?: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  time_zone: string | null;
  lead_notification_emails: string[] | null;
  resend_from_email: string | null;
  lead_reply_to_email: string | null;
  hero_image_url: string | null;
  hero_eyebrow: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  promo_enabled: boolean | null;
  promo_eyebrow: string | null;
  promo_headline: string | null;
  promo_body: string | null;
  idx_enabled?: boolean | null;
  idx_provider_name?: string | null;
  idx_embed_url?: string | null;
  idx_embed_code?: string | null;
  idx_search_url?: string | null;
  idx_fallback_message?: string | null;
  brand_primary: string | null;
  brand_accent: string | null;
  brand_header_footer?: string | null;
  brand_section_background?: string | null;
  homepage_sections: Partial<SiteSettingsHomepageSections> | null;
  lead_routing: Partial<SiteSettings["leadRouting"]> | null;
};

type SiteBannerRow = {
  id: string;
  eyebrow: string | null;
  headline: string | null;
  body: string | null;
  theme: string | null;
};

function mapHomepageSections(
  sections: Partial<SiteSettingsHomepageSections> | null
): SiteSettings["homepageSections"] {
  return {
    ...defaultHomepageSections,
    ...(sections || {})
  };
}

function mapLeadRouting(
  routing: Partial<SiteSettings["leadRouting"]> | null,
  legacyNotificationEmails: string[] | null
): SiteSettings["leadRouting"] {
  const fallbackEmails = legacyNotificationEmails?.length
    ? legacyNotificationEmails
    : defaultLeadRouting.defaultNotificationEmails;

  return {
    ...defaultLeadRouting,
    defaultNotificationEmails: fallbackEmails,
    valuationNotificationEmails: fallbackEmails,
    ...(routing || {})
  };
}

function mapBrokerSite(row: BrokerSiteRow): SiteSettings {
  const sectionSettings = row.homepage_sections || {};
  const footerLogoDisplay =
    sectionSettings.footerLogoDisplay === "team" || sectionSettings.footerLogoDisplay === "both"
      ? sectionSettings.footerLogoDisplay
      : row.footer_logo_display === "team" || row.footer_logo_display === "both"
        ? row.footer_logo_display
      : defaultSiteSettings.footerLogoDisplay;

  return {
    slug: row.slug || defaultSiteSettings.slug,
    siteName: row.site_name || defaultSiteSettings.siteName,
    brokerageName: row.brokerage_name || defaultSiteSettings.brokerageName,
    primaryDomain: row.primary_domain || defaultSiteSettings.primaryDomain,
    brokerLogoUrl: row.broker_logo_url || defaultSiteSettings.brokerLogoUrl,
    teamLogoUrl: row.team_logo_url || defaultSiteSettings.teamLogoUrl,
    footerBrokerLogoUrl: sectionSettings.footerBrokerLogoUrl || "",
    footerTeamLogoUrl: sectionSettings.footerTeamLogoUrl || "",
    footerLogoDisplay,
    fairHousingLogoUrl: sectionSettings.fairHousingLogoUrl || row.fair_housing_logo_url || defaultSiteSettings.fairHousingLogoUrl,
    fairHousingText: sectionSettings.fairHousingText || row.fair_housing_text || defaultSiteSettings.fairHousingText,
    fairHousingShowText: sectionSettings.fairHousingShowText ?? row.fair_housing_show_text ?? defaultSiteSettings.fairHousingShowText,
    realtorLogoUrl: sectionSettings.realtorLogoUrl || row.realtor_logo_url || defaultSiteSettings.realtorLogoUrl,
    headerBrokerLogoHeight: sectionSettings.headerBrokerLogoHeight || defaultSiteSettings.headerBrokerLogoHeight,
    headerTeamLogoHeight: sectionSettings.headerTeamLogoHeight || defaultSiteSettings.headerTeamLogoHeight,
    footerBrandLogoHeight: sectionSettings.footerBrandLogoHeight || defaultSiteSettings.footerBrandLogoHeight,
    footerComplianceLogoHeight: sectionSettings.footerComplianceLogoHeight || defaultSiteSettings.footerComplianceLogoHeight,
    contactEmail: row.contact_email || defaultSiteSettings.contactEmail,
    contactPhone: row.contact_phone || defaultSiteSettings.contactPhone,
    timeZone: row.time_zone || defaultSiteSettings.timeZone,
    leadNotificationEmails: row.lead_notification_emails?.length
      ? row.lead_notification_emails
      : defaultSiteSettings.leadNotificationEmails,
    resendFromEmail: row.resend_from_email || defaultSiteSettings.resendFromEmail,
    leadReplyToEmail: row.lead_reply_to_email || defaultSiteSettings.leadReplyToEmail,
    heroImageUrl: row.hero_image_url || defaultSiteSettings.heroImageUrl,
    heroEyebrow: row.hero_eyebrow || defaultSiteSettings.heroEyebrow,
    heroHeadline: row.hero_headline || defaultSiteSettings.heroHeadline,
    heroSubheadline: row.hero_subheadline || defaultSiteSettings.heroSubheadline,
    promoEnabled: row.promo_enabled ?? defaultSiteSettings.promoEnabled,
    promoEyebrow: row.promo_eyebrow || defaultSiteSettings.promoEyebrow,
    promoHeadline: row.promo_headline || defaultSiteSettings.promoHeadline,
    promoBody: row.promo_body || defaultSiteSettings.promoBody,
    idxEnabled: row.idx_enabled ?? defaultSiteSettings.idxEnabled,
    idxProviderName: row.idx_provider_name || defaultSiteSettings.idxProviderName,
    idxEmbedUrl: row.idx_embed_url || defaultSiteSettings.idxEmbedUrl,
    idxEmbedCode: row.idx_embed_code || defaultSiteSettings.idxEmbedCode,
    idxSearchUrl: row.idx_search_url || defaultSiteSettings.idxSearchUrl,
    idxFallbackMessage: row.idx_fallback_message || defaultSiteSettings.idxFallbackMessage,
    brandPrimary: row.brand_primary || defaultSiteSettings.brandPrimary,
    brandAccent: row.brand_accent || defaultSiteSettings.brandAccent,
    brandHeaderFooter: row.brand_header_footer || row.brand_primary || defaultSiteSettings.brandHeaderFooter,
    brandSectionBackground: row.brand_section_background || defaultSiteSettings.brandSectionBackground,
    homepageSections: mapHomepageSections(row.homepage_sections),
    leadRouting: mapLeadRouting(row.lead_routing, row.lead_notification_emails)
  };
}

export async function getSiteSettings(slug = "alu-realty-group"): Promise<SiteSettings> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return defaultSiteSettings;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const siteSettingsSelect = `
      slug,
      site_name,
      brokerage_name,
      primary_domain,
      broker_logo_url,
      team_logo_url,
      footer_logo_display,
      fair_housing_logo_url,
      fair_housing_text,
      fair_housing_show_text,
      realtor_logo_url,
      contact_email,
      contact_phone,
      time_zone,
      lead_notification_emails,
      resend_from_email,
      lead_reply_to_email,
      hero_image_url,
      hero_eyebrow,
      hero_headline,
      hero_subheadline,
      promo_enabled,
      promo_eyebrow,
      promo_headline,
      promo_body,
      idx_enabled,
      idx_provider_name,
      idx_embed_url,
      idx_embed_code,
      idx_search_url,
      idx_fallback_message,
      brand_primary,
      brand_accent,
      brand_header_footer,
      brand_section_background,
      homepage_sections,
      lead_routing
    `;
  const legacySiteSettingsSelect = `
      slug,
      site_name,
      brokerage_name,
      primary_domain,
      broker_logo_url,
      team_logo_url,
      contact_email,
      contact_phone,
      time_zone,
      lead_notification_emails,
      resend_from_email,
      lead_reply_to_email,
      hero_image_url,
      hero_eyebrow,
      hero_headline,
      hero_subheadline,
      promo_enabled,
      promo_eyebrow,
      promo_headline,
      promo_body,
      brand_primary,
      brand_accent,
      homepage_sections,
      lead_routing
    `;

  const { data, error } = await supabase
    .from("broker_sites")
    .select(siteSettingsSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("broker_sites")
      .select(legacySiteSettingsSelect)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (legacyError || !legacyData) {
      return defaultSiteSettings;
    }

    return mapBrokerSite(legacyData as BrokerSiteRow);
  }

  if (!data) {
    return defaultSiteSettings;
  }

  return mapBrokerSite(data as BrokerSiteRow);
}

export async function getActiveSiteBanner(
  siteSlug = "alu-realty-group",
  fallbackSettings?: SiteSettings
): Promise<SiteBanner | null> {
  const settings = fallbackSettings || defaultSiteSettings;

  if (!supabaseUrl || !supabaseAnonKey) {
    return settings.promoEnabled
      ? {
          id: "fallback",
          eyebrow: settings.promoEyebrow,
          headline: settings.promoHeadline,
          body: settings.promoBody,
          theme: "patriotic"
        }
      : null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("site_banners")
    .select("id, eyebrow, headline, body, theme")
    .eq("site_slug", siteSlug)
    .eq("is_active", true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return settings.promoEnabled
      ? {
          id: "fallback",
          eyebrow: settings.promoEyebrow,
          headline: settings.promoHeadline,
          body: settings.promoBody,
          theme: "patriotic"
        }
      : null;
  }

  const banner = data as SiteBannerRow;

  return {
    id: banner.id,
    eyebrow: banner.eyebrow || settings.promoEyebrow,
    headline: banner.headline || settings.promoHeadline,
    body: banner.body || settings.promoBody,
    theme: banner.theme || "patriotic"
  };
}
