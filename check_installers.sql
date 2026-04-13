-- Check available installers for auto-allocation
SELECT 
    id,
    name,
    phone,
    available,
    current_load,
    max_load,
    town_id,
    created_at
FROM installers 
WHERE available = true 
ORDER BY current_load ASC, created_at ASC;

-- Check if any installers exist at all
SELECT COUNT(*) as total_installers FROM installers;

-- Check the allocate_installer RPC function
SELECT 
    proname,
    pronargs,
    proargtypes::text[]
FROM pg_proc 
WHERE proname = 'allocate_installer';

-- Check recent jobs that failed allocation
SELECT 
    id,
    sr_number,
    status,
    installer_id,
    created_at
FROM jobs 
WHERE status = 'pending' AND installer_id IS NULL
ORDER BY created_at DESC
LIMIT 5;
