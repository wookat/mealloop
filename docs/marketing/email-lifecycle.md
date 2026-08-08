# MealLoop — email lifecycle (Resend)

Hard rules: only send to `email_intents` rows with `confirmed = 1 AND unsubscribed_at IS NULL`; every non-transactional email carries the recipient's unsubscribe link + `List-Unsubscribe` / one-click headers; sender is always `MealLoop <mealloop@zalize.com>`.

## Live in product
1. **Login code** (transactional, `sendMagicCode` in src/auth.js) — no unsubscribe needed.
2. **Subscription confirm** (double opt-in, `sendSubscribeConfirm`) — rate-limited 2/hr per address.
3. **Welcome** (`sendWelcome`, sent once on first confirmation via `/subscribe/confirm`) — one-minute quickstart (add recipe → plan → list), share-link tip, open-beta note, unsubscribe link.

## Templates ready to send manually (product-update / re-engagement)

### New-feature announcement (send after a flagship ships)
Subject: `New in MealLoop: {feature name}`

```
Hi —

{One sentence: what shipped and why it helps.} For example: MealLoop can now
draft your whole week with AI — grounded in your own recipe box, so it
suggests dinners your family actually eats.

Try it: open your planner and click "✨ Plan my week with AI".
{site}/app

Also new: {1–2 bullet secondary items}.

Everything stays free during the open beta.

— MealLoop (Zalize)

Unsubscribe any time: {site}/unsubscribe?t={unsub_token}
```

### Re-engagement / "come back" (send ≥30 days after signup, max once)
Subject: `Still deciding dinner every night?`

```
Hi —

A while back you signed up for MealLoop updates. If dinner is still a nightly
negotiation, here's the one-minute loop that fixes it:

1. Add a recipe — paste any recipe URL: {site}/app/recipes
2. Drop it on a day this week.
3. Click "Add week's ingredients" — the grocery list writes itself, sorted by
   aisle, and syncs live with your household.

All features are free during the open beta: {site}

— MealLoop (Zalize)

Unsubscribe any time: {site}/unsubscribe?t={unsub_token}
```

## Sending procedure (manual, until an automated digest exists)
1. `SELECT email, unsub_token FROM email_intents WHERE confirmed = 1 AND unsubscribed_at IS NULL;`
2. Send via Resend API one-by-one with the recipient's own `unsub_token`, `List-Unsubscribe: <{site}/unsubscribe?t={token}>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
3. Log the campaign (date, subject, count) at the bottom of this file.

## Campaign log
(none yet — confirmed list is currently 0)
