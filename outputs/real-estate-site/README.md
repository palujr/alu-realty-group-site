# Haven & Key Realty Website

A responsive, zero-install real estate website prototype. Open `index.html` in a browser.

## Included

- Buy, lease, and recently sold search modes
- Location, price, and bedroom filters
- Sortable property cards and saved favorites
- Account and saved-search alert flow
- Mortgage-rate snapshot and payment calculator
- Real estate and finance news section
- Home valuation lead form
- Responsive desktop and mobile layouts

All listings, rates, and articles currently use demo data. Favorites and demo account details are stored only in the visitor's browser.

## Production integrations

### MLS listings and property search

Use an approved MLS data vendor or the MLS Grid/RESO Web API available through the agent's brokerage and local association. The server should normalize MLS data into the listing shape used near the top of `app.js`, cache media locally or through an image CDN, and follow the MLS display and attribution rules.

Recommended production flow:

`MLS / RESO Web API -> scheduled sync or webhooks -> database -> search index -> website API`

Do not place MLS credentials in browser code.

### Accounts and saved searches

Use a managed authentication provider such as Clerk, Auth0, Supabase Auth, or Firebase Authentication. Store saved criteria and favorite listing IDs in a database.

Recommended tables:

- `users`
- `saved_searches`
- `favorite_listings`
- `listing_events`
- `alert_deliveries`

Run a scheduled worker every 5–15 minutes to compare new or changed listings against active saved searches. Send matched alerts through Postmark, SendGrid, Amazon SES, or Resend, with unsubscribe and frequency controls.

### Mortgage rates and calculator widgets

The mortgage section now uses Mortgage News Daily widgets for live rate, news, and calculator content.

Installed widgets:

- Rates: Mortgage News Daily "Rates Expanded Horizontal"
- Calculator: Mortgage News Daily "Simple Mortgage Calculator"
- News: Mortgage News Daily "News List" or "News Scroller"

Do not alter the generated Mortgage News Daily widget code. Style the surrounding site containers instead. Mortgage News Daily rate widgets show national average index data, not a lender quote or commitment to lend.

### News

Use licensed publisher APIs or RSS feeds that permit commercial display. Store the canonical URL, source, publication date, summary, and image rights. A daily server-side refresh is generally enough for editorial articles.

### Suggested production stack

- Front end: Next.js or another server-rendered web framework
- API/database: PostgreSQL with Supabase or a managed cloud database
- Property search: PostgreSQL full-text/PostGIS initially; Algolia or Elasticsearch at larger scale
- Authentication: Clerk or Supabase Auth
- Email: Postmark or Resend
- Scheduled jobs: managed cron plus a queue
- Hosting: Vercel, Netlify, or Cloudflare

## Before launch

Replace the demo brokerage name, contact information, legal pages, Equal Housing and MLS attribution, privacy consent, analytics consent, and accessibility review. Confirm all MLS display rules and anti-scraping requirements with the brokerage and local MLS.
