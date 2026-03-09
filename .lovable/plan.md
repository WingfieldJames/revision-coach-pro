

## Email Automation: Feedback Emails at 14 Days

### Overview

Send automated feedback emails:
1. **14 days after signup** — asks free users for feedback
2. **14 days after Deluxe upgrade** — asks Deluxe users for feedback

Each email links to the existing `/feedback` page with the appropriate `?type=` parameter.

### Prerequisites: Resend API Key

You need a **Resend** account to send these transactional emails:

1. Go to [resend.com](https://resend.com) and create a free account
2. In the Resend dashboard, go to **API Keys** and create a new key
3. Come back here and I'll securely store it as a Supabase secret

The free tier gives you 100 emails/day which is plenty for this use case. You'll also want to verify a sending domain in Resend for production (e.g. `noreply@yourdomain.com`), otherwise emails come from `onboarding@resend.dev` during testing.

### Architecture

**Data sources for timing accuracy:**
- **Free signup date**: `auth.users.created_at` (the actual moment the user registered)
- **Deluxe upgrade date**: `user_subscriptions.created_at` (set when the Stripe webhook fires on checkout)

**New database table: `feedback_emails_sent`**
- Tracks which emails have been sent to prevent duplicates
- Columns: `user_id`, `email_type` (`free_14d` or `deluxe_14d`), `sent_at`

**New edge function: `send-feedback-emails`**
- Runs via `pg_cron` once daily
- Queries `auth.users` for users who signed up exactly 14+ days ago and haven't received a `free_14d` email
- Queries `user_subscriptions` for users who upgraded 14+ days ago and haven't received a `deluxe_14d` email
- Sends email via Resend API with a link to `/feedback` or `/feedback?type=deluxe`
- Records each send in `feedback_emails_sent`

**pg_cron schedule**: Runs daily at midnight UTC

### Changes Summary

| Component | Action |
|---|---|
| `feedback_emails_sent` table | Create via migration |
| `send-feedback-emails` edge function | Create |
| `supabase/config.toml` | Add function entry |
| `pg_cron` SQL | Schedule daily invocation |
| `RESEND_API_KEY` secret | Add after you provide the key |

### Next Step

Once you have your Resend API key ready, let me know and I'll store it securely and build everything out.

