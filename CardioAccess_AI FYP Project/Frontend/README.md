# CardioAccess AI

## Run the frontend

Install dependencies and configure Supabase:

```powershell
npm install
Copy-Item .env.example .env.local
```

In `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project URL and publishable/anon key from your Supabase project. Never put a `service_role` key in this frontend.

In the Supabase SQL Editor, run these migrations in order: [`202611110001_auth_profiles.sql`](supabase/migrations/202611110001_auth_profiles.sql), [`202611120001_profile_approval.sql`](supabase/migrations/202611120001_profile_approval.sql), then [`202611120002_case_intake_storage.sql`](supabase/migrations/202611120002_case_intake_storage.sql). They create user profiles/settings, approval status, owner-scoped case/file tables, a private `case-inputs` Storage bucket, RLS policies, and Realtime publication for case updates. Then, in Supabase Authentication URL Configuration, set the local site URL to `http://localhost:5176` for the current dev server and add it to the allowed redirect URLs. If you later run Vite on a different port, update the URL accordingly. Add your production domain when deploying.

Email/password registration, email verification, sign-in, Google OAuth, password recovery, profile edits, and user preferences use Supabase. To enable Google OAuth, configure Google as a provider in Supabase and set its callback URL in the Google Cloud project. Public registrations receive the Clinician role; grant Nurse or Admin roles only through a trusted administrator/backend process.

Current frontend role access is: Admin can open all application routes; Clinician can access screening, cases, referrals, and analytics; Nurse can access screening and cases but not referrals, analytics, or user administration. Public sign-ups are Clinician accounts and start pending approval. The role-based route and navigation checks improve the UI experience, but they are not a security boundary: protected data and operations must also be authorized by backend endpoints and Supabase RLS. Admin user approval and management are not functional until the protected admin API is implemented.

For the first Admin account, register and verify the account, then approve and assign its role from the Supabase SQL Editor using that account's exact email:

```sql
update public.user_profiles as profile
set role = 'admin', approval_status = 'approved', is_active = true
from auth.users as auth_user
where profile.id = auth_user.id
	and lower(auth_user.email) = lower('admin@example.com');
```

To approve subsequent Clinician or Nurse accounts, an authorized administrator/backend must set `approval_status` to `approved` and assign the intended role. Do not expose database credentials or a service-role key in the frontend.

Start the app:

```powershell
npm run dev
```

## Current integration boundary

This workspace contains the React frontend only. After applying all migrations, an approved user can create a case, upload its ECG/Echo files to private Supabase Storage, and view their persisted cases with Realtime updates. New cases remain `awaiting_inference`; the UI does not fabricate predictions. The SRS/SDS inference pipeline still requires the separate FastAPI backend and deployed ONNX models. Admin account approvals/role changes and referral-summary generation also require protected backend operations that are not present in this repository.