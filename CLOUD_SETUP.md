# wren. cloud archive — setup

This package is based on the full `Kismet-main.zip` uploaded November 1, 2026, not the earlier partial update ZIP. The discovery API and swipe handling are retained.

## 1. Create the table with security

In Supabase → SQL Editor → New query, paste the entire contents of `supabase/migrations/20261101_saved_discoveries.sql` and run it. Confirm the table appears in Table Editor and RLS is enabled. The policies only permit authenticated users to access their own rows.

## 2. Configure email sign-in

In Supabase → Authentication → Providers, enable Email and its email OTP/magic link functionality. Under Authentication → URL Configuration, set the Site URL to your stable production URL (`https://kismet-beta-lake.vercel.app` if still current) and add that URL and any other *specific* approved deployment origins as Redirect URLs. Don't add broad wildcards unnecessarily. Supabase's default mail service is for testing and has delivery limits; configure custom SMTP before inviting many users.

## 3. Configure Vercel

Vercel → Project → Settings → Environment Variables, add:

- `VITE_SUPABASE_URL` = `https://cnuinjmatvnjfcwipeov.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = the `wrencollections` publishable key you already copied

Use the **publishable** key, not secret/service_role. These VITE_ values are embedded in browser JS by design; row-level security is essential. Apply variables to Production (and Preview only if you explicitly want to test there), then redeploy. Keep your existing `ARENA_API_TOKEN` private and unchanged.

## 4. Deploy the code

Replace the repository files with the matching files from this ZIP, including the new `supabase/migrations` SQL file, `.env.example`, and updated `package.json`. Keep existing repository configuration and any secrets. Commit to GitHub and allow Vercel to redeploy. Vercel must run `npm install` to install `@supabase/supabase-js`.

## 5. Verify BEFORE relying on it

1. Open the stable production domain and tap the grid button.
2. Enter your email and follow the link to sign in on that same domain.
3. Check that any previous browser saves appear in the grid and the status says synced.
4. Save a NEW discovery. Wait until you see `Saved to cloud.`
5. In Supabase Table Editor, confirm the saved_discoveries row exists.
6. Reload and check the archive, then sign in from a different browser to verify cross-device sync.
7. Test a separate account: it must **not** see the first account's saves.

### Safety and limitations

- Old local browser saves are **not deleted**. On first successful sign-in, they are imported to Supabase, then the local snapshot is left alone. Import is associated with the first account to avoid leaking legacy saves to later accounts on the same browser.
- Cloud saves are written before the UI confirms them. Network errors display a failure and do not falsely mark a discovery saved.
- A stored Are.na reference does not preserve the underlying media if the external creator removes it. Database backups/export should be configured separately; the free plan is not a guarantee of permanent archival.
- This is a prepared integration, **not** a live-tested deployment. The JSX parsed successfully; npm install and the full Vite build could not run in the current environment due to dependency network timeout.
