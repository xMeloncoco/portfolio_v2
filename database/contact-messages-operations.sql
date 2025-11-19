-- ========================================
-- CONTACT MESSAGES - DATABASE OPERATIONS
-- ========================================
-- Helpful SQL queries for managing contact messages
-- Run these in your Supabase SQL Editor as needed
-- ========================================

-- ========================================
-- VIEW ALL MESSAGES
-- ========================================
-- View all messages ordered by newest first
SELECT
  id,
  name,
  email,
  category,
  subject,
  status,
  created_at
FROM contact_messages
ORDER BY created_at DESC;

-- ========================================
-- VIEW UNREAD MESSAGES ONLY
-- ========================================
SELECT
  id,
  name,
  email,
  category,
  subject,
  message,
  created_at
FROM contact_messages
WHERE status = 'unread'
ORDER BY created_at DESC;

-- ========================================
-- DELETE SPECIFIC MESSAGE
-- ========================================
-- Replace 'MESSAGE_ID_HERE' with the actual UUID
DELETE FROM contact_messages
WHERE id = 'MESSAGE_ID_HERE';

-- ========================================
-- DELETE ALL MESSAGES FROM A SPECIFIC EMAIL
-- ========================================
-- Replace 'email@example.com' with the actual email
DELETE FROM contact_messages
WHERE email = 'email@example.com';

-- ========================================
-- DELETE ALL TEST MESSAGES
-- ========================================
-- Delete messages from common test email patterns
DELETE FROM contact_messages
WHERE email LIKE '%test%@%'
   OR email LIKE '%demo%@%'
   OR email LIKE '%example.com';

-- ========================================
-- DELETE ALL MESSAGES (CAREFUL!)
-- ========================================
-- This will delete ALL messages - use with caution!
-- DELETE FROM contact_messages;

-- ========================================
-- DELETE MESSAGES OLDER THAN X DAYS
-- ========================================
-- Delete messages older than 30 days
DELETE FROM contact_messages
WHERE created_at < NOW() - INTERVAL '30 days';

-- ========================================
-- DELETE SPAM/UNWANTED MESSAGES
-- ========================================
-- Delete messages by category (e.g., if getting spam in one category)
DELETE FROM contact_messages
WHERE category = 'report_bug'
  AND status = 'read'
  AND created_at < NOW() - INTERVAL '7 days';

-- ========================================
-- BULK UPDATE STATUS
-- ========================================
-- Mark all unread messages as read
UPDATE contact_messages
SET status = 'read'
WHERE status = 'unread';

-- Mark all read messages as replied
UPDATE contact_messages
SET status = 'replied'
WHERE status = 'read';

-- ========================================
-- COUNT MESSAGES BY STATUS
-- ========================================
SELECT
  status,
  COUNT(*) as count
FROM contact_messages
GROUP BY status
ORDER BY count DESC;

-- ========================================
-- COUNT MESSAGES BY CATEGORY
-- ========================================
SELECT
  category,
  COUNT(*) as count
FROM contact_messages
GROUP BY category
ORDER BY count DESC;

-- ========================================
-- FIND MESSAGES BY KEYWORD IN SUBJECT OR MESSAGE
-- ========================================
-- Replace 'keyword' with your search term
SELECT
  id,
  name,
  email,
  subject,
  category,
  status,
  created_at
FROM contact_messages
WHERE subject ILIKE '%keyword%'
   OR message ILIKE '%keyword%'
ORDER BY created_at DESC;

-- ========================================
-- EXPORT MESSAGES TO CSV FORMAT
-- ========================================
-- Copy the results and paste into a CSV file
SELECT
  name,
  email,
  category,
  subject,
  message,
  status,
  created_at
FROM contact_messages
ORDER BY created_at DESC;
