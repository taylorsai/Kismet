# kismet.
A chance encounter. A mobile-first randomized discovery feed for public Are.na blocks.

## Features
- Vertical snap-scroll through discoveries
- **New path** creates a fresh seeded random order
- Bookmarks persist locally in the browser
- Source links open the original Are.na block
- Sample mode works without an API key
- Serverless endpoint keeps the Are.na token out of the browser

## Run locally
```bash
npm install
npm run dev
```
Open the URL printed by Vite. The app initially shows sample mode, since Vite's dev server does not execute Vercel serverless functions. For the live API locally, use `npx vercel dev` after linking a Vercel project and configuring the environment variable.

## Deploy to Vercel
1. Upload this folder to a GitHub repository.
2. Import the repository into Vercel (framework: Vite).
3. In Vercel → Project Settings → Environment Variables, set `ARENA_API_TOKEN` to a **read-only personal access token from an Are.na Premium account**.
4. Redeploy. The `/api/discover` function will retrieve random public blocks via `GET https://api.are.na/v3/search`.

Are.na API reference: https://www.are.na/developers/explore/search/search

## Notes
The Are.na v3 search endpoint requires Premium. If no token is configured or the API fails, the interface falls back to clearly labeled sample content. Public production deployments should add shared caching, usage safeguards and possibly OAuth/user-specific authentication so visitors don't exhaust the account's API quota. Do not systematically harvest Are.na content. Images and other media remain owned by their respective creators.
