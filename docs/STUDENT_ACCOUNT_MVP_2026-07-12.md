# Student Account MVP

## Product levels

The site now supports three student states:

- Visitor: no account. Progress remains in `localStorage`.
- Free account: email login. Key progress syncs to D1 and can be restored across devices.
- Internal student / paid user: a free account plus rows in `entitlements`.

Teacher-facing assignment tables are included in the D1 schema, but no teacher UI is exposed yet.

## Cloudflare requirements

Bind a D1 database as `DB` for Pages Functions.

Apply:

```bash
wrangler d1 execute <database-name> --file migrations/0001_student_accounts.sql
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
