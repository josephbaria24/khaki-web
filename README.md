# Khaki Web (Next.js)

Next.js App Router version of Khaki, the Palawan jobs & services marketplace.

## Run

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Auth and marketplace data come from Supabase. Create an account on **Register** — there are no demo logins.

`.env.local` (already used):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Also run `../supabase/rpcs.sql` in the SQL Editor so posting a task records the 2% posting fee.

Khaki does not hold the task payment. Poster and tasker settle that themselves. There is no in-app wallet or GCash withdraw — only the posting fee record.

If signup asks for a code, keep **Confirm email** on in Authentication → Providers.

In **Authentication → Email Templates → Confirm signup**, send a 6-digit OTP instead of a link:

```
<h2>Your Khaki code</h2>
<p>Enter this code to finish creating your account:</p>
<p><strong>{{ .Token }}</strong></p>
```

To make someone admin after they register:

```sql
update public.profiles
set role = 'admin'
where id = '<auth user uuid>';
```

PayMongo keys stay on the server only (Next.js Route Handlers). Never put `PAYMONGO_SECRET_KEY` in this frontend.
