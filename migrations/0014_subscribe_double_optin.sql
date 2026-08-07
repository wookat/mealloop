ALTER TABLE email_intents ADD COLUMN confirmed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE email_intents ADD COLUMN confirm_token TEXT;
ALTER TABLE email_intents ADD COLUMN unsub_token TEXT;
ALTER TABLE email_intents ADD COLUMN confirmed_at TEXT;
ALTER TABLE email_intents ADD COLUMN unsubscribed_at TEXT;
CREATE INDEX IF NOT EXISTS idx_email_intents_confirm ON email_intents(confirm_token);
CREATE INDEX IF NOT EXISTS idx_email_intents_unsub ON email_intents(unsub_token);
