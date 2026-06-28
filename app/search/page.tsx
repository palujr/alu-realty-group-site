import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 60;

function normalizeSearchType(value?: string | string[]) {
  const searchType = Array.isArray(value) ? value[0] : value;

  if (searchType === "rent") {
    return "Lease";
  }

  if (searchType === "sold") {
    return "Recently Sold";
  }

  return "Buy";
}

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

type SearchHomesPageProps = {
  searchParams?: {
    type?: string | string[];
  };
};

export default async function SearchHomesPage({ searchParams }: SearchHomesPageProps) {
  const siteSettings = await getSiteSettings();
  const searchType = normalizeSearchType(searchParams?.type);
  const hasLiveEmbed = siteSettings.idxEnabled && isSafeEmbedUrl(siteSettings.idxEmbedUrl);
  const hasExternalSearch = siteSettings.idxEnabled && isSafeEmbedUrl(siteSettings.idxSearchUrl);

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
              <h2>{searchType} homes</h2>
            </div>
            <div className="idx-mode-links" aria-label="Search categories">
              <a className={searchType === "Buy" ? "active" : ""} href="/search">Buy</a>
              <a className={searchType === "Lease" ? "active" : ""} href="/search?type=rent">Rent / Lease</a>
              <a className={searchType === "Recently Sold" ? "active" : ""} href="/search?type=sold">Recently Sold</a>
            </div>
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
                <a className="button button-accent" href="/#sell">
                  Request a custom property search
                </a>
              )}
            </div>
          )}
        </section>

        <section className="idx-next-steps">
          <div>
            <p className="admin-kicker">Provider Flexible</p>
            <h3>What this supports now</h3>
            <p>Paste a SmartFrame or iframe URL in the admin dashboard and this page can display it without redesign work.</p>
          </div>
          <div>
            <p className="admin-kicker">Future Ready</p>
            <h3>What this supports later</h3>
            <p>When you are ready for Spark API, this page can evolve from embedded search into a custom MLS search interface.</p>
          </div>
        </section>
      </main>
    </>
  );
}
