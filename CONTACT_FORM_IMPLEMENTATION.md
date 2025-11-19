# Contact Form & Inbox Implementation

## Overview
This document describes the implementation of the contact form and inbox system for the portfolio website.

## Features Implemented

### 1. **Contact Form**
- Full form validation (email, name, category, subject, message)
- Email format validation
- RPG-themed category selection
- Success/error feedback
- Accessible with keyboard navigation
- Mobile-responsive design

### 2. **Message Categories (RPG-themed)**
The following categories are available for users to select:

- **⚔️ New Quest** - Work or project opportunities
- **🎉 Invite to Party** - Collaboration requests
- **📚 Seeking Knowledge** - Questions about portfolio or me
- **🐛 Report a Bug** - Feedback or issues with the site
- **💎 Trade Offer** - Exchange ideas or resources
- **🛡️ Request Backup** - Need help with something
- **👥 Guild Recruitment** - Team or partnership opportunities

### 3. **Admin Inbox**
- View all contact form submissions
- Filter by status (unread/read/replied)
- Filter by category
- Mark messages as read/replied
- Delete messages with confirmation
- View message details in modal
- Unread count badge
- Real-time status updates

### 4. **Message Statuses**
- **Unread** - New messages not yet viewed
- **Read** - Messages that have been viewed
- **Replied** - Messages that have been responded to (replying done outside the website)

## Files Created

### Database
- `database/supabase-contact-messages.sql` - Database migration for contact_messages table

### Services
- `src/services/contactService.js` - Service for managing contact messages
- Updated `src/services/index.js` - Added contact service exports

### Components
- `src/components/ContactForm.jsx` - Contact form modal component
- `src/components/ContactForm.css` - Contact form styles

### Pages
- `src/pages/Inbox.jsx` - Admin inbox page
- `src/pages/Inbox.css` - Admin inbox styles

## Files Modified

### Routes & Navigation
- `src/App.jsx` - Added Inbox route
- `src/layouts/AdminLayout.jsx` - Added Inbox navigation item

### Public Pages
- `src/pages/public/Home.jsx` - Integrated ContactForm component
- `src/pages/public/Home.css` - Added success toast styles
- `src/pages/public/CharacterStats.jsx` - Integrated ContactForm component
- `src/pages/public/CharacterStats.css` - Added success toast styles

## Setup Instructions

### 1. Run Database Migration

You need to run the SQL migration to create the `contact_messages` table in Supabase:

```bash
# Navigate to the database folder
cd database

# Open Supabase SQL Editor and run:
cat supabase-contact-messages.sql
```

Or manually:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `database/supabase-contact-messages.sql`
4. Paste and run the SQL

### 2. Database Schema

The migration creates the following table:

```sql
contact_messages (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### 3. Row Level Security (RLS)

The migration sets up RLS policies:
- **Anonymous users** can INSERT (submit messages)
- **Authenticated users** (admin) can SELECT, UPDATE, and DELETE

### 4. Test the Implementation

#### Testing the Contact Form:
1. Navigate to the home page (`/`)
2. Click the "Contact Me" button at the top or bottom of the page
3. Fill out the form with valid data:
   - Email: test@example.com
   - Name: Test User
   - Category: Select any category
   - Subject: Test message
   - Message: This is a test message
4. Click "Send Message"
5. You should see a success message

Alternative testing location:
- Navigate to `/character` page
- Click the "Send Message" button
- Test the form there as well

#### Testing the Admin Inbox:
1. Log in to the admin panel (`/admin/login`)
2. Navigate to the Inbox page (`/admin/inbox`)
3. You should see the test message you submitted
4. Test the following features:
   - View message details by clicking on it
   - Mark as read
   - Mark as replied
   - Filter by status
   - Filter by category
   - Delete a message

### 5. Usage Flow

#### For Visitors:
1. Visitor fills out contact form on home page or character stats page
2. Message is validated and submitted to Supabase
3. Success notification is shown
4. Form closes automatically after 2 seconds

#### For Admin:
1. Admin logs in to admin panel
2. Admin navigates to Inbox
3. Admin sees unread count badge
4. Admin can:
   - View all messages
   - Filter by status or category
   - Click message to view details
   - Mark as read/replied
   - Delete messages

## Technical Details

### Form Validation
- Email: Regex validation for valid email format
- Name: Minimum 2 characters
- Category: Required selection
- Subject: Minimum 5 characters
- Message: Minimum 10 characters

### Security
- Email validation on frontend and database
- RLS policies prevent unauthorized access
- Anonymous users can only submit messages
- Admin authentication required for inbox access

### Accessibility
- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader friendly

### Responsive Design
- Mobile-first approach
- Touch-friendly buttons
- Adaptive layouts for all screen sizes

## Future Enhancements

Potential improvements for later phases:

1. **Email Integration**
   - Connect to actual email service (SendGrid, Mailgun, etc.)
   - Send email notifications to admin when new message arrives
   - Send confirmation email to visitor

2. **Reply Functionality**
   - Add reply form in admin inbox
   - Send replies directly from the website
   - Track conversation threads

3. **Spam Protection**
   - Add reCAPTCHA or hCaptcha
   - Rate limiting
   - Honeypot fields

4. **Analytics**
   - Track message categories
   - Response time metrics
   - Conversion tracking

5. **Templates**
   - Quick reply templates
   - Auto-responses for common inquiries

## Troubleshooting

### Issue: Form submission fails
**Solution:** Check Supabase connection and RLS policies. Ensure anonymous access is enabled for INSERT operations.

### Issue: Inbox shows empty
**Solution:** Verify admin authentication and ensure SELECT policy is set for authenticated users.

### Issue: Messages not appearing
**Solution:** Check browser console for errors. Verify database table exists and migration ran successfully.

### Issue: Email validation too strict
**Solution:** Modify the regex in `src/services/contactService.js` line 91 if needed.

## Database Cleanup

To remove test messages:

```sql
-- Delete all messages
DELETE FROM contact_messages;

-- Or delete specific messages
DELETE FROM contact_messages WHERE email = 'test@example.com';
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase connection
3. Review RLS policies
4. Check service logs using the logger utility

---

**Implementation Date:** 2025-11-19
**Author:** Claude (AI Assistant)
**Status:** ✅ Complete and Ready for Testing
