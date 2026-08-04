# NormCore Supabase Auth setup

The application code is ready for hosted Supabase Auth. Secrets must be entered
by the project owner and must never be committed to Git.

## 1. Application environment

Copy `.env.example` to `.env.local` and add the values shown in Supabase under
Project Settings > API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

The publishable key is intended for browser use. Never use the `service_role`
key in a client component or a `NEXT_PUBLIC_` variable.

## 2. Email/password and OTP

In Authentication > Sign In / Providers > Email:

1. Enable Email authentication.
2. Keep Confirm email enabled.
3. Set the OTP length to 8 digits for the current project. NormCore accepts any
   Supabase-supported email OTP length from 6 to 10 digits.
4. Set OTP expiry to 600 seconds for this project.
5. Keep the resend interval at 60 seconds.

In Authentication > Email Templates:

- Replace the Confirm signup body with `supabase/templates/confirmation.html`.
- Replace the Reset password body with `supabase/templates/recovery.html`.
- Use subjects such as `Your NormCore verification code` and
  `Reset your NormCore password`.

These templates deliberately use `{{ .Token }}` and contain no activation link.

## 3. Gmail SMTP for development only

The test receiving address is `capiso83@gmail.com`. If the same Gmail account is
also used temporarily as the sender, configure it directly in Supabase under
Authentication > SMTP Settings:

```text
Host: smtp.gmail.com
Port: 587
Username: capiso83@gmail.com
Password: a Google App Password (never the normal Gmail password)
Sender email: capiso83@gmail.com
Sender name: NormCore
```

Enable Google 2-Step Verification first, then create a dedicated 16-character
App Password for Supabase SMTP. Enter that password only in the Supabase
Dashboard. Do not put it in `.env.local`, source code, screenshots, chat or Git.

Personal Gmail SMTP is acceptable for private development tests, not for a
commercial production launch. Replace it with a transactional email provider
and a verified NormCore sending domain before inviting external users.

## 4. URLs

In Authentication > URL Configuration set:

```text
Site URL (local): http://127.0.0.1:3103
Additional redirect URL: http://127.0.0.1:3103/**
```

Add the final HTTPS production domain before deployment. Even though NormCore
uses typed OTPs rather than activation links, correct URLs are still required
for future providers and safe Auth configuration.

## 5. Test order

1. Create an account with `capiso83@gmail.com` and a unique test password.
2. Receive and enter the six-digit signup code.
3. Sign in with the confirmed account.
4. Request a password reset code.
5. Enter the recovery code and set a new password.
6. Verify that the old password fails and the new password succeeds.
7. Repeat once in English and once in French.

Do not reuse a password from Gmail or any other real account.
