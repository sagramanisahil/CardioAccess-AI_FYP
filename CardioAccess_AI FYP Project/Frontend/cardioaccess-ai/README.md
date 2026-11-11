# CardioAccess AI

## Run the frontend

Install dependencies and configure Supabase:

```powershell
npm install
Copy-Item .env.example .env.local
```

In `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project URL and publishable/anon key from your Supabase project. Never put a `service_role` key in this frontend.

In the Supabase SQL Editor, run [`supabase/migrations/202611110001_auth_profiles.sql`](supabase/migrations/202611110001_auth_profiles.sql). Then, in Supabase Authentication URL Configuration, set the local site URL to `http://localhost:5175` for the current dev server and add it to the allowed redirect URLs. If you later run Vite on its default port, also allow `http://localhost:5173`. Add your production domain when deploying.

Email/password registration, email verification, sign-in, Google OAuth, password recovery, profile edits, and user preferences use Supabase. To enable Google OAuth, configure Google as a provider in Supabase and set its callback URL in the Google Cloud project. Public registrations receive the Clinician role; grant Nurse or Admin roles only through a trusted administrator/backend process.

For the first Admin account, register and verify the account, then assign its role from the Supabase SQL Editor using that account's exact email:

```sql
update public.user_profiles as profile
set role = 'admin'
from auth.users as auth_user
where profile.id = auth_user.id
	and lower(auth_user.email) = lower('admin@example.com');
```

Do not expose database credentials or a service-role key in the frontend.

Start the app:

```powershell
npm run dev
```

## Current integration boundary

This workspace contains the React frontend only. The SRS/SDS also require a FastAPI backend, protected case and admin APIs, Supabase case/file tables and Storage policies, and deployed ONNX models. Those services are not present in this repository. The frontend therefore starts with an empty workspace and does not fabricate case results; case submission and admin management remain unavailable until those backend services are implemented and configured with `VITE_API_BASE_URL`.