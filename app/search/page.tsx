import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 60;

function isSafeEmbedUrl(value: string) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function SearchHomesPage() {
  const siteSettings = await getSiteSettings();
  const hasLiveEmbed = siteSettings.idxEnabled && isSafeEmbedUrl(siteSettings.idxEmbedUrl);
  const hasExternalSearch = siteSettings.idxEnabled && isSafeEmbedUrl(siteSettings.idxSearchUrl);
  const footerLogos = [
    ...(siteSettings.footerLogoDisplay === "broker" || siteSettings.footerLogoDisplay === "both"
      ? [{
          href: "/",
          imageUrl: siteSettings.footerBrokerLogoUrl || siteSettings.brokerLogoUrl,
          label: siteSettings.brokerageName
        }]
      : []),
    ...(siteSettings.footerLogoDisplay === "team" || siteSettings.footerLogoDisplay === "both"
      ? [{
          href: "/",
          imageUrl: siteSettings.footerTeamLogoUrl || siteSettings.teamLogoUrl,
          label: siteSettings.siteName
        }]
      : [])
  ];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --ink: ${siteSettings.brandPrimary};
              --accent: ${siteSettings.brandAccent};
              --header-footer: ${siteSettings.brandHeaderFooter};
              --section-background: ${siteSettings.brandSectionBackground};
              --footer-brand-logo-height: ${siteSettings.footerBrandLogoHeight}px;
              --footer-compliance-logo-height: ${siteSettings.footerComplianceLogoHeight}px;
            }
          `
        }}
      />
      <main className="idx-page">
        <section className="idx-hero">
          <a className="idx-logo-link" href="/" aria-label={`${siteSettings.siteName} home`}>
            <img src={siteSettings.teamLogoUrl} alt={siteSettings.siteName} />
          </a>
          <div>
            <p className="eyebrow light">{siteSettings.idxProviderName}</p>
            <h1>Search homes across the Valley.</h1>
            <p>
              Start with a flexible property search experience today, while keeping the site ready for
              FlexMLS SmartFrame, IDX Broker, or a deeper Spark API connection later.
            </p>
          </div>
          <a className="button button-light" href="/">Back to homepage</a>
        </section>

        <section className="idx-shell" aria-label="Search homes">
          <div className="idx-toolbar">
            <div>
              <p className="admin-kicker">Search Mode</p>
              <h2>Buy homes</h2>
            </div>
            <a className="idx-mode-link active" href="/search">Buy</a>
          </div>

          {hasLiveEmbed ? (
            <iframe
              className="idx-frame"
              src={siteSettings.idxEmbedUrl}
              title={`${siteSettings.idxProviderName} property search`}
              loading="lazy"
            />
          ) : (
            <div className="idx-fallback">
              <p className="eyebrow">{siteSettings.idxEnabled ? "IDX CONNECTION READY" : "IDX STAGED"}</p>
              <h2>{siteSettings.idxEnabled ? "Search provider is ready to connect." : "Live IDX search is almost ready."}</h2>
              <p>{siteSettings.idxFallbackMessage}</p>
              {hasExternalSearch ? (
                <a className="button button-dark" href={siteSettings.idxSearchUrl} target="_blank" rel="noreferrer">
                  Open {siteSettings.idxProviderName} search
                </a>
              ) : (
                <a className="button button-accent" href="/#saved-search">
                  Request a custom property search
                </a>
              )}
            </div>
          )}
        </section>
      </main>
      <footer>
        <div className="footer-brands" aria-label="Footer logos">
          {footerLogos.map((logo) => (
            <a className="brand fathom-brand footer-brand" href={logo.href} aria-label={`${logo.label} home`} key={logo.label}>
              <img src={logo.imageUrl} alt={logo.label} />
            </a>
          ))}
        </div>
        <p>A modern real estate experience for Arizona buyers, sellers, and investors.</p>
        <div className="footer-links"><a href="/search">Properties</a><a href="/#rates">Mortgage</a><a href="/#team">Team</a><a href="/#sell">Contact</a></div>
        <small className="footer-bottom-line">
          <span>Copyright 2026 Alu Realty Group | Fathom Realty Elite | Equal Housing Opportunity | MLS listing data provided through authorized IDX display</span>
          <span className="footer-compliance">
            <img src={siteSettings.fairHousingLogoUrl} alt="" aria-hidden="true" />
            {siteSettings.fairHousingShowText ? <span>{siteSettings.fairHousingText}</span> : null}
            <img src={siteSettings.realtorLogoUrl} alt="Realtor logo" />
          </span>
        </small>
      </footer>
    </>
  );
}
