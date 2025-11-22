-- ========================================
-- PORTFOLIO V2 - CONTACT MESSAGES TABLE
-- ========================================
-- Contact Form & Inbox System
-- Run this in your Supabase SQL Editor
-- ========================================

-- ========================================
-- TABLE: contact_messages
-- Stores messages from the contact form
-- ========================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- COMMENTS
-- ========================================
COMMENT ON TABLE contact_messages IS 'Stores contact form messages with inbox status tracking';
COMMENT ON COLUMN contact_messages.email IS 'Sender email address (validated)';
COMMENT ON COLUMN contact_messages.name IS 'Sender name';
COMMENT ON COLUMN contact_messages.category IS 'Message category (new_quest, invite_to_party, etc.)';
COMMENT ON COLUMN contact_messages.subject IS 'Message subject line';
COMMENT ON COLUMN contact_messages.message IS 'Message content/body';
COMMENT ON COLUMN contact_messages.status IS 'Status: unread, read, replied';

-- ========================================
-- TRIGGER: Auto-update updated_at timestamp
-- ========================================
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_messages_updated_at();

-- ========================================
-- INDEXES: Improve query performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_category ON contact_messages(category);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert messages (contact form submissions)
-- Using TO public to ensure both anonymous and authenticated users can submit
CREATE POLICY "contact_messages_insert_policy"
  ON contact_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow authenticated users (admin) to view all messages
CREATE POLICY "contact_messages_select_policy"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users (admin) to update messages
CREATE POLICY "contact_messages_update_policy"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users (admin) to delete messages
CREATE POLICY "contact_messages_delete_policy"
  ON contact_messages
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- VALIDATION CONSTRAINTS
-- ========================================
-- Ensure email format is valid
ALTER TABLE contact_messages
  ADD CONSTRAINT contact_messages_email_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure status is one of the valid values
ALTER TABLE contact_messages
  ADD CONSTRAINT contact_messages_status_check
  CHECK (status IN ('unread', 'read', 'replied'));

-- Ensure category is one of the valid values
ALTER TABLE contact_messages
  ADD CONSTRAINT contact_messages_category_check
  CHECK (category IN (
    'new_quest',
    'invite_to_party',
    'seeking_knowledge',
    'report_bug',
    'guild_recruitment',
    'general'
  ));

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Contact messages table created successfully!';
  RAISE NOTICE '📧 Contact form can now save messages to the database';
  RAISE NOTICE '📥 Admin inbox can view and manage messages';
END $$;
