-- Insert user as super admin in admin_users table
-- User ID: 9948aaa7-1746-465a-968a-3f8c5b3d5870

INSERT INTO admin_users (
    user_id,
    role,
    created_by,
    is_active,
    created_at,
    updated_at
) VALUES (
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    'super_admin',
    '9948aaa7-1746-465a-968a-3f8c5b3d5870', -- Self-created admin
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    updated_at = NOW();

-- Verify the admin user was added/updated
SELECT 
    user_id,
    role,
    created_by,
    is_active,
    created_at,
    updated_at
FROM admin_users 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870';
