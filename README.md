# VOTREM Fresh Website

## What this build includes
- Complete multi-page VOTREM website
- Teachings, programmes and books automatically load from Supabase
- Prayer request submission
- Membership, worker and volunteer submissions
- Admin dashboard for teachings, programmes and books
- Usher / Protocol included as a department option
- Existing VOTREM images, Constitution and forms included in assets

## Supabase setup
1. Create a Supabase project.
2. Open SQL Editor and run `supabase-schema.sql`.
3. In Authentication, create an admin user with email/password.
4. Open `config.js` and enter your Project URL and public anon key.
5. Upload the contents of this folder to GitHub Pages.

Never put the Supabase `service_role` key in `config.js` or any browser file.
