import Script from "next/script";
import { createClient } from "@supabase/supabase-js";
import { teamMembers as fallbackTeamMembers, testimonials as fallbackTestimonials } from "@/lib/site-data";
import type { TeamMember, Testimonial } from "@/lib/site-data";
import { getActiveSiteBanner, getSiteSettings } from "@/lib/site-settings";

export const revalidate = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getTeamMembers(): Promise<TeamMember[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return fallbackTeamMembers;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("team_members")
    .select("slug, full_name, title, phone, email, bio, photo_url, specialties")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data?.length) {
    return fallbackTeamMembers;
  }

  return data.map((member) => ({
    id: member.slug,
    name: member.full_name,
    title: member.title,
    phone: member.phone || "",
    email: member.email || "",
    bio: member.bio || "",
    specialties: member.specialties || [],
    imageUrl: member.photo_url || undefined
  }));
}

async function getTestimonials(): Promise<Testimonial[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return fallbackTestimonials;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, scope, client_name, context, quote, team_members(slug)")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return fallbackTestimonials;
  }

  return data.map((testimonial) => {
    const teamMember = Array.isArray(testimonial.team_members)
      ? testimonial.team_members[0]
      : testimonial.team_members;

    return {
      id: testimonial.id,
      quote: testimonial.quote || "",
      clientName: testimonial.client_name || "Client",
      context: testimonial.context || "Client experience",
      scope: testimonial.scope === "individual" ? "individual" : "team",
      teamMemberId: teamMember?.slug
    };
  });
}

export default async function HomePage() {
  const siteSettings = await getSiteSettings();
  const activeBanner = await getActiveSiteBanner(siteSettings.slug, siteSettings);
  const teamMembers = await getTeamMembers();
  const testimonials = await getTestimonials();
  const heroHeadlineLines = siteSettings.heroHeadline.split("\n");
  const homepageSections = siteSettings.homepageSections;
  const stickyAnchorOffset = siteSettings.headerBrokerLogoHeight + siteSettings.headerTeamLogoHeight + 96;
  const footerLogos = [
    ...(siteSettings.footerLogoDisplay === "broker" || siteSettings.footerLogoDisplay === "both"
      ? [{
          href: "#top",
          imageUrl: siteSettings.brokerLogoUrl,
          label: siteSettings.brokerageName
        }]
      : []),
    ...(siteSettings.footerLogoDisplay === "team" || siteSettings.footerLogoDisplay === "both"
      ? [{
          href: "#top",
          imageUrl: siteSettings.teamLogoUrl,
          label: siteSettings.siteName
        }]
      : [])
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
            :root {
             --ink: ${siteSettings.brandPrimary};
             --accent: ${siteSettings.brandAccent};
             --header-footer: ${siteSettings.brandHeaderFooter};
             --section-background: ${siteSettings.brandSectionBackground};
             --header-broker-logo-height: ${siteSettings.headerBrokerLogoHeight}px;
             --header-team-logo-height: ${siteSettings.headerTeamLogoHeight}px;
             --sticky-anchor-offset: ${stickyAnchorOffset}px;
             --footer-brand-logo-height: ${siteSettings.footerBrandLogoHeight}px;
             --footer-compliance-logo-height: ${siteSettings.footerComplianceLogoHeight}px;
            }
          `
        }} />
      <div className="announcement">
        <span>Market brief</span>
        Scottsdale inventory is up 8.4% month over month
        <a href="#insights">Read the update <span aria-hidden="true">→</span></a>
      </div>

      <div className="site-sticky-shell">
        <header className="site-header" id="top">
          <a className="brand fathom-brand" href="#top" aria-label={`${siteSettings.brokerageName} home`}>
            <img src={siteSettings.brokerLogoUrl} alt={siteSettings.brokerageName} />
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="/search">Buy</a>
            <a href="/search?type=rent">Rent</a>
            <a href="#sell">Sell</a>
            <a href="#rates">Mortgage</a>
            <a href="#team">Team</a>
            <a href="#insights">Insights</a>
          </nav>
          <div className="header-actions">
            <button className="text-button" data-open-modal="account">Sign in</button>
            <button className="button button-dark" data-open-modal="account">Create account</button>
            <button className="menu-button" id="menuButton" aria-label="Open menu" aria-expanded="false">
              <span></span><span></span><span></span>
            </button>
          </div>
        </header>

        <nav className="mobile-nav" id="mobileNav" aria-label="Mobile navigation">
          <a href="/search">Buy</a>
          <a href="/search?type=rent">Rent</a>
          <a href="#sell">Sell</a>
          <a href="#rates">Mortgage</a>
          <a href="#team">Team</a>
          <a href="#insights">Insights</a>
        </nav>

        <div className="alu-brand-banner" aria-label={`${siteSettings.siteName} featured message`}>
          <div className="alu-brand-lockup">
            <img className="alu-group-logo" src={siteSettings.teamLogoUrl} alt={siteSettings.siteName} />
            {activeBanner ? (
              <>
                <span className="brand-divider" aria-hidden="true"></span>
                <div className={`seasonal-banner banner-theme-${activeBanner.theme}`} aria-label={`${siteSettings.siteName} promotional message`}>
                  <p>{activeBanner.eyebrow}</p>
                  <h2>{activeBanner.headline}</h2>
                  <span>{activeBanner.body}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <main>
        <section className="hero" style={{ backgroundImage: `url("${siteSettings.heroImageUrl}")` }}>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <p className="eyebrow light">{siteSettings.heroEyebrow}</p>
            <h1>
              {heroHeadlineLines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h1>
            <p className="hero-copy">{siteSettings.heroSubheadline}</p>

            <div className="search-panel" aria-label="Property search">
              <div className="search-tabs" role="tablist">
                <button className="search-tab active" data-mode="buy" role="tab" aria-selected="true">Buy</button>
                <button className="search-tab" data-mode="rent" role="tab" aria-selected="false">Rent</button>
                <button className="search-tab" data-mode="sold" role="tab" aria-selected="false">Recently sold</button>
              </div>
              <form className="hero-search" id="heroSearch">
                <label className="search-field">
                  <span className="pin-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                  </span>
                  <span>
                    <small>LOCATION</small>
                    <input id="locationInput" type="search" placeholder="City, neighborhood, or ZIP" autoComplete="off" />
                  </span>
                </label>
                <label className="select-field">
                  <small>PRICE</small>
                  <select id="priceInput">
                    <option value="">Any price</option>
                    <option value="750000">Under $750k</option>
                    <option value="1000000">Under $1M</option>
                    <option value="1500000">Under $1.5M</option>
                    <option value="2500000">Under $2.5M</option>
                  </select>
                </label>
                <label className="select-field">
                  <small>BEDS &amp; BATHS</small>
                  <select id="bedsInput">
                    <option value="0">Any</option>
                    <option value="2">2+ beds</option>
                    <option value="3">3+ beds</option>
                    <option value="4">4+ beds</option>
                  </select>
                </label>
                <button className="button button-accent search-submit" type="submit">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
                  Search homes
                </button>
              </form>
              <div className="idx-search-cta">
                <a href="/search">Open full Search Homes page</a>
                <span>IDX-ready for FlexMLS SmartFrame, IDX Broker, or a future Spark API connection.</span>
              </div>
            </div>
            <div className="market-pulse">
              <div><strong>2,418</strong><span>homes for sale</span></div>
              <div><strong>31 days</strong><span>median time on market</span></div>
              <div><strong>$742K</strong><span>median list price</span></div>
              <small>Market data ready for live source connection</small>
            </div>
          </div>
        </section>

        <section className="section properties-section" id="properties">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">{homepageSections.propertiesEyebrow}</p>
              <h2>{homepageSections.propertiesHeadline}</h2>
            </div>
            <div className="section-controls">
              <label className="sort-control">Sort by
                <select id="sortListings">
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </label>
              <button className="round-control" id="prevListings" aria-label="Previous listings">←</button>
              <button className="round-control" id="nextListings" aria-label="Next listings">→</button>
            </div>
          </div>
          <div className="results-bar" id="resultsBar" hidden>
            <span id="resultsText">Showing matching homes</span>
            <button id="clearFilters">Clear filters</button>
          </div>
          <div className="property-grid" id="propertyGrid"></div>
          <div className="empty-state" id="emptyState" hidden>
            <h3>No exact matches yet.</h3>
            <p>Try expanding your location or price range.</p>
            <button className="button button-dark" id="resetSearch">Reset search</button>
          </div>
          <div className="center-action">
            <button className="button button-outline" id="viewAllButton">View demo properties <span>→</span></button>
            <a className="button button-dark" href="/search">Search all homes <span>→</span></a>
          </div>
        </section>

        <section className="rates-section" id="rates">
          <div className="rates-copy">
            <p className="eyebrow light">{homepageSections.ratesEyebrow}</p>
            <h2>{homepageSections.ratesHeadline}</h2>
            <p>{homepageSections.ratesBody}</p>
            <p className="rates-updated"><span></span> {homepageSections.ratesStatus}</p>
            <button className="button button-light" data-open-modal="calculator">Calculate a payment</button>
          </div>
          <div className="mnd-widget-panel mnd-widget-panel-dark" aria-label="Mortgage News Daily rate widget area">
            <div className="mnd-widget-slot">
              <div className="mnd-rates-widget" style={{ width: 600, height: 340, fontSize: 12 }}>
                <div className="w-header" style={{ textAlign: "center", padding: "4px 0", backgroundColor: "#0d4722", color: "#FFFFFF" }}> <a href="https://www.mortgagenewsdaily.com/mortgage-rates" target="_blank" style={{ color: "#FFFFFF", textDecoration: "none" }}>Home Mortgage Rates</a></div>
                <iframe src="//widgets.mortgagenewsdaily.com/widget/f/rates?t=large&sn=true&c=0d4722&u=&cbu=&w=598&h=290" width="600" height="290" frameBorder="0" scrolling="no" style={{ border: "solid 1px #0d4722", borderWidth: "0 1px", boxSizing: "border-box", width: 600, height: 290, display: "block" }}></iframe>
                <div className="w-footer" style={{ textAlign: "center", padding: "4px 0", backgroundColor: "#0d4722", color: "#FFFFFF" }}>View More <a href="https://www.mortgagenewsdaily.com/mortgage-rates" target="_blank" style={{ color: "#FFFFFF", textDecoration: "none" }}>Refinance Rates</a></div>
              </div>
            </div>
            <p className="rate-disclaimer">Mortgage News Daily rate widgets show national average index data, not a lender quote or commitment to lend.</p>
          </div>
        </section>

        <section className="section team-section" id="team">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">{homepageSections.teamEyebrow}</p>
              <h2>{homepageSections.teamHeadline}</h2>
            </div>
            <p className="section-lede">{homepageSections.teamBody}</p>
          </div>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <article className="team-card" key={member.id}>
                <div className="team-photo" aria-hidden="true">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt="" />
                  ) : (
                    <span>{member.name.split(" ").map((part) => part[0]).join("")}</span>
                  )}
                </div>
                <div className="team-card-content">
                  <p className="story-meta">{member.title}</p>
                  <h3>{member.name}</h3>
                  <p>{member.bio}</p>
                  <div className="team-contact">
                    {member.phone ? <a href={`tel:${member.phone.replace(/[^0-9]/g, "")}`}>{member.phone}</a> : null}
                    {member.email ? <a href={`mailto:${member.email}`}>{member.email}</a> : null}
                  </div>
                  <div className="team-specialties">
                    {member.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section testimonials-section" id="feedback">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">{homepageSections.testimonialsEyebrow}</p>
              <h2>{homepageSections.testimonialsHeadline}</h2>
            </div>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.id}>
                <p>“{testimonial.quote}”</p>
                <div>
                  <strong>{testimonial.clientName}</strong>
                  <span>{testimonial.context} · {testimonial.scope === "team" ? "Team review" : "Agent review"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section insights-section" id="insights">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">{homepageSections.insightsEyebrow}</p>
              <h2>{homepageSections.insightsHeadline}</h2>
            </div>
          </div>
          <div className="news-grid">
            <article className="featured-story">
              <div className="story-visual market-chart">
                <span className="story-tag">LOCAL MARKET</span>
                <svg viewBox="0 0 680 250" preserveAspectRatio="none" aria-hidden="true">
                  <path className="chart-fill" d="M0 210 C80 190 115 130 190 155 S315 115 390 105 S500 40 680 30 V250 H0Z" />
                  <path className="chart-line" d="M0 210 C80 190 115 130 190 155 S315 115 390 105 S500 40 680 30" />
                </svg>
                <div className="chart-stat"><strong>+4.2%</strong><span>year over year</span></div>
              </div>
              <div className="story-content">
                <p className="story-meta">5 MIN READ · MARKET UPDATE</p>
                <h3>What rising inventory means for Phoenix-area buyers this summer</h3>
                <p>More choices are returning to the market. Here is where buyers have negotiating room and where competition remains.</p>
              </div>
            </article>
            <div className="story-list">
              <article className="mnd-news-widget-card">
                <span className="story-number" aria-hidden="true">MND</span>
                <div>
                  <div className="mnd-news-widget" style={{ width: 300, height: 400, fontSize: 12 }}>
                    <div className="w-header" style={{ textAlign: "center", padding: "4px 0", backgroundColor: "#0d4722", color: "#FFFFFF" }}>Mortgage and <a href="https://www.mortgagenewsdaily.com" target="_blank" style={{ color: "#FFFFFF", textDecoration: "none" }}>Real Estate News</a></div>
                    <iframe src="//widgets.mortgagenewsdaily.com/widget/f/news?t=scrollup&ss=true&c=0d4722&u=&cbu=&w=298&h=350&fs=12&nh=5&gs=5&bgc=ffffff&hlc=110b6e&sc=000000" width="300" height="350" frameBorder="0" scrolling="no" style={{ border: "solid 1px #0d4722", borderWidth: "0 1px", boxSizing: "border-box", width: 300, height: 350, display: "block" }}></iframe>
                    <div className="w-footer" style={{ textAlign: "center", padding: "4px 0", backgroundColor: "#0d4722", color: "#FFFFFF" }}>View Current <a href="https://www.mortgagenewsdaily.com/mortgage-rates" target="_blank" style={{ color: "#FFFFFF", textDecoration: "none" }}>Interest Rates</a></div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="saved-search-section" id="saved-search">
          <div className="saved-search-card">
            <div className="saved-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64"><path d="M12 28 32 12l20 16v25H39V38H25v15H12V28Z" /><path d="M43 13v9" /></svg>
            </div>
            <div>
              <p className="eyebrow">{homepageSections.savedSearchEyebrow}</p>
              <h2>
                {homepageSections.savedSearchHeadline.split("\n").map((line, index) => (
                  <span key={`${line}-${index}`}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </h2>
              <p>{homepageSections.savedSearchBody}</p>
              <div className="benefits">
                <span>✓ Instant listing alerts</span>
                <span>✓ Price-change updates</span>
                <span>✓ Save &amp; compare homes</span>
              </div>
            </div>
            <button className="button button-dark" data-open-modal="account">Create a free account <span>→</span></button>
          </div>
        </section>

        <section className="section sell-section" id="sell">
          <div>
            <p className="eyebrow">{homepageSections.sellEyebrow}</p>
            <h2>
              {homepageSections.sellHeadline.split("\n").map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>
          </div>
          <div>
            <p>{homepageSections.sellBody}</p>
            <button className="button button-accent" data-open-modal="valuation">{homepageSections.sellButtonText}</button>
          </div>
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
        <div className="footer-links"><a href="/search">Properties</a><a href="#rates">Mortgage</a><a href="#team">Team</a><a href="#sell">Contact</a></div>
        <small className="footer-bottom-line">
          <span>© 2026 Alu Realty Group · Fathom Realty Elite · Equal Housing Opportunity · Demo listings shown</span>
          <span className="footer-compliance">
            <img src={siteSettings.fairHousingLogoUrl} alt="" aria-hidden="true" />
            {siteSettings.fairHousingShowText ? <span>{siteSettings.fairHousingText}</span> : null}
            <img src={siteSettings.realtorLogoUrl} alt="Realtor logo" />
          </span>
        </small>
      </footer>

      <div className="toast" id="toast" role="status" aria-live="polite"></div>
      <div className="modal-backdrop" id="modalBackdrop" hidden>
        <section className="modal" id="accountModal" role="dialog" aria-modal="true" aria-labelledby="accountTitle" hidden>
          <button className="modal-close" data-close-modal aria-label="Close">×</button>
          <p className="eyebrow">YOUR ALU REALTY GROUP ACCOUNT</p>
          <h2 id="accountTitle">Save homes. Stay ahead.</h2>
          <p className="modal-intro">Create a free account to save searches and receive matching-property alerts.</p>
          <form id="accountForm">
            <label>Full name<input name="name" type="text" placeholder="Your name" required /></label>
            <label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label>
            <label>Phone number<input name="phone" type="tel" placeholder="(480) 555-0124" /></label>
            <label>What are you looking for?<input name="message" type="text" placeholder="Areas, price range, beds, timeline, or must-haves" /></label>
            <label className="checkbox-label"><input name="wantsAlerts" type="checkbox" defaultChecked /> Email me new listings and price changes</label>
            <button className="button button-accent" type="submit">Create my account</button>
          </form>
          <small>By continuing, you agree to receive account-related email. You can unsubscribe from property alerts anytime.</small>
        </section>

        <section className="modal" id="calculatorModal" role="dialog" aria-modal="true" aria-labelledby="calculatorTitle" hidden>
          <button className="modal-close" data-close-modal aria-label="Close">×</button>
          <p className="eyebrow">PAYMENT ESTIMATOR</p>
          <h2 id="calculatorTitle">Estimate your monthly payment.</h2>
          <div className="mnd-calculator-slot">
            <div className="mnd-calc-widget" style={{ width: 250, height: 472, fontSize: 12 }}>
              <div className="w-header" style={{ textAlign: "center", padding: "4px 0", backgroundColor: "#0d4722", color: "#FFFFFF" }}> <a href="https://www.mortgagenewsdaily.com/mortgage-calculator" target="_blank" style={{ color: "#FFFFFF", textDecoration: "none" }}>Mortgage Calculator</a></div>
              <iframe src="//widgets.mortgagenewsdaily.com/widget/f/calculator?t=simple&c=0d4722&tc=333333&u=&cbu=&w=248&h=422&bgc=f8f8f8&sa=true&fs=12" width="250" height="422" frameBorder="0" scrolling="no" style={{ border: "solid 1px #0d4722", borderWidth: "0 1px", boxSizing: "border-box", width: 250, height: 422, display: "block" }}></iframe>
              <div className="w-footer" style={{ textAlign: "center", padding: "4px 0", backgroundColor: "#0d4722", color: "#FFFFFF" }}> <a href="https://www.mortgagenewsdaily.com/mortgage-rates" target="_blank" style={{ color: "#FFFFFF", textDecoration: "none" }}>Today&apos;s Mortgage Rates</a></div>
            </div>
          </div>
          <form id="calculatorForm" className="legacy-calculator-form"></form>
        </section>

        <section className="modal" id="valuationModal" role="dialog" aria-modal="true" aria-labelledby="valuationTitle" hidden>
          <button className="modal-close" data-close-modal aria-label="Close">×</button>
          <p className="eyebrow">HOME VALUATION</p>
          <h2 id="valuationTitle">Tell us where to begin.</h2>
          <p className="modal-intro">We will review nearby sales and current competition, then follow up with a personal estimate.</p>
          <form id="valuationForm">
            <label>Full name<input name="name" type="text" placeholder="Your name" required /></label>
            <label>Property address<input name="address" type="text" placeholder="123 Main Street, Scottsdale" required /></label>
            <label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label>
            <label>Phone number<input name="phone" type="tel" placeholder="(480) 555-0124" /></label>
            <label>Anything helpful to know?<input name="message" type="text" placeholder="Timing, upgrades, questions, or goals" /></label>
            <button className="button button-accent" type="submit">Request my valuation</button>
          </form>
          <small>By submitting, you agree that Alu Realty Group may contact you by email, phone, or text about your request.</small>
        </section>

        <section className="modal success-modal" id="valuationSuccessModal" role="dialog" aria-modal="true" aria-labelledby="valuationSuccessTitle" hidden>
          <button className="modal-close" data-close-modal aria-label="Close">Ã—</button>
          <p className="eyebrow">REQUEST RECEIVED</p>
          <h2 id="valuationSuccessTitle">Thank you. We&apos;re on it.</h2>
          <p className="modal-intro">Your home valuation request has been received. We will review the property details and follow up with a personal home value review.</p>
          <div className="success-next-steps">
            <span>What happens next</span>
            <p>Phil or Denise will reach out using the contact information you provided.</p>
          </div>
          <button className="button button-accent" type="button" data-close-modal>Done</button>
        </section>

        <section className="modal success-modal" id="accountSuccessModal" role="dialog" aria-modal="true" aria-labelledby="accountSuccessTitle" hidden>
          <button className="modal-close" data-close-modal aria-label="Close">Ã—</button>
          <p className="eyebrow">SEARCH REQUEST RECEIVED</p>
          <h2 id="accountSuccessTitle">Your search request is in.</h2>
          <p className="modal-intro">We received your custom property search request and will follow up with matching homes and next steps.</p>
          <div className="success-next-steps">
            <span>What happens next</span>
            <p>Phil or Denise will review your search details and reach out using the contact information you provided.</p>
          </div>
          <button className="button button-accent" type="button" data-close-modal>Done</button>
        </section>
      </div>

      <Script src="/site-interactions.js" strategy="afterInteractive" />
    </>
  );
}
