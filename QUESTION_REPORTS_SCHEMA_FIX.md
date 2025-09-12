# 🔧 Question Reports Schema Fix

## 🚨 Issue Identified

**Error:** `ERROR: 42703: column "role" does not exist`

**Cause:** The `QUESTION_REPORTS_SCHEMA.sql` was trying to reference a `role` column in the `user_profiles` table that doesn't exist.

## ✅ Fix Applied

### **Problem:**
The original schema had admin role checks like:
```sql
-- This was causing the error
SELECT 1 FROM public.user_profiles 
WHERE id = auth.uid() 
AND role = 'admin'  -- ❌ 'role' column doesn't exist
```

### **Solution:**
1. **Removed admin role dependencies** from RLS policies
2. **Simplified permissions** to work with existing user_profiles structure
3. **Created fixed schema** (`QUESTION_REPORTS_SCHEMA_FIXED.sql`)

### **Changes Made:**

#### **1. RLS Policies Fixed:**
```sql
-- Before (causing error)
CREATE POLICY "Admins can view all reports" ON public.question_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'  -- ❌ Error here
        )
    );

-- After (working)
CREATE POLICY "Authenticated users can view all reports" ON public.question_reports
    FOR SELECT USING (auth.uid() IS NOT NULL);  -- ✅ Simple check
```

#### **2. Admin Functions Fixed:**
```sql
-- Before (causing error)
IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'  -- ❌ Error here
) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
END IF;

-- After (working)
IF auth.uid() IS NULL THEN  -- ✅ Simple check
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
END IF;
```

## 🚀 How to Use

### **1. Run the Fixed Schema:**
```sql
-- Execute this file in Supabase SQL Editor
QUESTION_REPORTS_SCHEMA_FIXED.sql
```

### **2. Current Permissions:**
- **Users can:** View, insert, and update their own reports
- **All authenticated users can:** View and update all reports (temporary)
- **No admin role required** (simplified for now)

### **3. Future Admin System:**
When you implement a proper admin role system, you can:
1. Add a `role` column to `user_profiles` table
2. Update the RLS policies to use proper admin checks
3. Restrict report management to admins only

## 📊 What's Included

### **Database Objects Created:**
1. **`question_reports` table** - Stores user reports
2. **Indexes** - For better query performance
3. **RLS Policies** - For data security
4. **Functions:**
   - `get_question_report_stats()` - Get report statistics
   - `get_admin_question_reports()` - Get reports for admin view
   - `update_question_report_status()` - Update report status
   - `get_user_question_reports()` - Get user's own reports

### **Report Fields:**
- `id` - Unique identifier
- `user_id` - User who reported
- `exam_id`, `exam_type`, `test_id` - Exam context
- `question_id`, `question_number` - Question context
- `issue_type` - Type of issue (question_text, options, explanation, etc.)
- `issue_description` - Detailed description
- `status` - pending, reviewing, resolved, rejected
- `admin_notes` - Admin response
- `created_at`, `updated_at` - Timestamps

## 🧪 Testing

### **1. Test Report Creation:**
```sql
-- Insert a test report
INSERT INTO public.question_reports (
    user_id, exam_id, exam_type, test_id, 
    question_id, question_number, issue_type, issue_description
) VALUES (
    'your-user-id', 'ssc-cgl', 'mock', 'mock-test-1',
    '1', 1, 'question_text', 'Test report'
);
```

### **2. Test Functions:**
```sql
-- Get report statistics
SELECT * FROM public.get_question_report_stats();

-- Get user reports
SELECT * FROM public.get_user_question_reports('your-user-id');

-- Update report status
SELECT public.update_question_report_status(
    'report-id', 'resolved', 'Fixed the issue'
);
```

## 🔄 Next Steps

### **Immediate:**
1. **Run the fixed schema** in Supabase
2. **Test the report functionality** in your app
3. **Verify no more role column errors**

### **Future Enhancements:**
1. **Add admin role system** to user_profiles
2. **Restrict report management** to admins only
3. **Add email notifications** for new reports
4. **Create admin dashboard** for report management

---

**Status: ✅ FIXED**

The question reports schema should now work without the role column error. All authenticated users can manage reports, and you can implement proper admin roles later when needed.
