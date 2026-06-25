# Alu Realty Group Website

Production-ready starting point for the Alu Realty Group / Fathom Realty Elite website.

The original static prototype remains in `outputs/real-estate-site`. The new deployable app lives at the project root and is prepared for GitHub, Vercel, and Supabase.

## What is included now

- Next.js app structure for Vercel
- Existing branding assets copied into `public/assets`
- Mortgage News Daily widgets preserved on the homepage
- Demo property search and saved-home interactions
- Team section for Phil Alu and Denise Alu
- Client feedback section that supports both team reviews and individual agent reviews
- Supabase schema for team members, testimonials, leads, manual listings, saved searches, and favorites

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add Supabase keys when the Supabase project is ready.

3. Run the app:

   ```bash
   npm run dev
   ```

4. Open:

   ```text
   http://localhost:3000
   ```

## Supabase setup

Create a new Supabase project, then run:

```text
supabase/schema.sql
```

The schema is intentionally MLS-ready but does not require MLS access yet. Manual listings can be used first, and Spark/ARMLS can be added later through secure server-side API routes.

## Suggested next build order

1. Push this project to a new GitHub repository.
2. Connect the repository to Vercel.
3. Create the Supabase project and run the schema.
4. Add the Supabase environment variables in Vercel.
5. Connect the account, valuation, saved-search, and favorite-home flows to Supabase.
6. Add a simple admin-friendly process for team members, testimonials, and manual featured listings.
7. Return to Spark/ARMLS after approvals, credentials, and display rules are clear.

## MLS note

Do not place Spark, ARMLS, MLS, or brokerage API credentials in browser code. MLS access should run through server-side routes or scheduled jobs only.
