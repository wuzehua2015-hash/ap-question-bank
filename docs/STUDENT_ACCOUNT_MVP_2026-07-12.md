# Student Account MVP

## Product levels

The site now supports three student states:

- Visitor: no account. Progress remains in `localStorage`.
- Registered member (`注册会员`): email/password login with email-code fallback. Key progress syncs to D1 and can be restored across devices.
- Lynk student (`翎英学员`): a registered member plus rows in `entitlements`.

Teacher-facing assignment tables are included in the D1 schema, but no teacher UI is exposed yet.

## Cloudflare requirements

Bind a D1 database as `DB` for Pages Functions.

Apply:

```bash
wrangler d1 execute <database-name> --file migrations/0001_student_accounts.sql
wrangler d1 execute <database-name> --file migrations/0002_password_auth.sql
```

Required environment variables:

- `AUTH_CODE_SECRET`: private salt for login code hashes.

Optional email delivery variables:

- `RESEND_API_KEY`
- `LOGIN_EMAIL_FROM`

Local or staging-only helper:

- `DEV_LOGIN_CODE_ENABLED=true`

When email delivery is not configured and `DEV_LOGIN_CODE_ENABLED` is not true, the API stores a login code but does not expose it. Production should configure email delivery before publishing the login entry as a user-facing feature.

## Data model

- `users`: student account identity and account level.
- `auth_identities`: supports future phone or WeChat identity binding.
- `auth_codes`: short-lived email login codes.
- `sessions`: 30-day login sessions.
- `password_credentials`: PBKDF2 password hashes.
- `email_verifications`: registration email verification codes.
- `password_reset_tokens`: forgot-password verification codes.
- `membership_invites`: optional invite codes for `翎英学员` access.
- `account_audit_logs`: account security and profile events.
- `entitlements`: subject or feature access for internal students and paid users.
- `progress_snapshots`: merged local progress snapshot.
- `assignments`, `assignment_items`, `assignment_submissions`: reserved for the teacher assignment MVP.

## Progress behavior

Existing storage keys are unchanged:

- `<subject>_doneQuestions`
- `<subject>_wrongQuestions`
- `<subject>_questionHistory`
- `<subject>_quizHistory`
- `mySubjects`
- `currentSubject`
- `defaultSubject`

After login, local and account snapshots are merged. Later changes trigger a debounced sync to `/api/progress`.

## Current account flow

- `/register`: email, password, display name, optional invite code.
- `/login`: password login by default, email-code login as fallback for legacy users and recovery.
- `/reset-password`: email reset code plus new password.
- `/account`: profile editing, email verification, password setup/change, progress sync, logout other devices.

Password login is the primary flow. Email codes are retained for email verification, password recovery, and legacy accounts that do not yet have a password.

## Admin console and entitlement operations

The admin console is a separate Cloudflare Pages project from the student site.

- Student site: `lynkedu-ap-question-bank`, domains `lynkedu.com` and `www.lynkedu.com`.
- Admin site: `lynkedu-admin`, intended domain `admin.lynkedu.com`.
- Both sites use the same D1 database binding name: `DB`.
- Admin frontend build command: `npm run build:admin`.
- Admin deployment directory: `dist-admin`.
- `scripts/prepare_admin_dist.cjs` converts the admin build entry to `dist-admin/index.html` so `admin.lynkedu.com/` opens the console directly.

Admin access rules:

- A user can access admin APIs only when `users.account_level = 'admin'`.
- `翎英学员` must be represented by active rows in `entitlements`; do not encode it as `account_level = 'internal'`.
- Direct grants, extensions, cancellations, invitation-code creation, and invitation-code deactivation must write `admin_audit_logs`.
- Invitation-code use must write `invite_redemptions` and should create an entitlement with `expires_at` when `redemption_days` is set.

Required migration before deploying admin-aware Functions:

```bash
wrangler d1 execute lynkedu-question-bank --remote --file migrations/0003_admin_entitlements.sql
```

Required Pages project setup for `lynkedu-admin`:

- D1 binding `DB` -> `lynkedu-question-bank`.
- Compatibility date aligned with the student project.
- Custom domain `admin.lynkedu.com`.
- DNS record: CNAME `admin` -> `lynkedu-admin.pages.dev`, proxied.
