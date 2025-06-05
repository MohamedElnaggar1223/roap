-- Performance Testing Script for ROAP Database
-- Run this in Supabase SQL Editor to test query performance

-- Enable timing for all queries
\timing on

-- =================================================================
-- PERFORMANCE TEST SUITE
-- =================================================================

-- Replace 'YOUR_ACADEMY_ID' with your actual academy ID
-- You can find it with: SELECT id FROM academics LIMIT 5;

\echo 'Starting Performance Tests...'
\echo ''

-- =================================================================
-- TEST 1: Academy Athletic Queries (Athletes)
-- =================================================================
\echo 'TEST 1: Athletes Query Performance'

-- Simple count query
EXPLAIN (ANALYZE, BUFFERS, TIMING, FORMAT TEXT)
SELECT COUNT(*) as athlete_count
FROM academic_athletic 
WHERE academic_id = 1; -- Replace with your academy ID

\echo ''

-- Complex athletes query with joins  
EXPLAIN (ANALYZE, BUFFERS, TIMING, FORMAT TEXT)
SELECT 
    aa.id,
    aa.user_id, 
    aa.profile_id,
    u.email,
    p.name,
    p.gender,
    p.birthday
FROM academic_athletic aa
LEFT JOIN users u ON aa.user_id = u.id
LEFT JOIN profiles p ON aa.profile_id = p.id  
WHERE aa.academic_id = 1 -- Replace with your academy ID
LIMIT 20;

\echo ''

-- =================================================================
-- TEST 2: Programs and Packages Queries
-- =================================================================
\echo 'TEST 2: Programs Query Performance'

EXPLAIN (ANALYZE, BUFFERS, TIMING, FORMAT TEXT)
SELECT 
    p.id,
    p.name,
    p.description,
    COUNT(pk.id) as package_count
FROM programs p
LEFT JOIN packages pk ON p.id = pk.program_id
WHERE p.academic_id = 1 -- Replace with your academy ID
GROUP BY p.id, p.name, p.description;

\echo ''

-- =================================================================  
-- TEST 3: Bookings Performance (Most Complex)
-- =================================================================
\echo 'TEST 3: Bookings Query Performance'

EXPLAIN (ANALYZE, BUFFERS, TIMING, FORMAT TEXT)
SELECT 
    b.id,
    b.price,
    bs.date,
    bs.from as start_time,
    bs.to as end_time,
    pk.name as package_name,
    pr.name as program_name,
    bt.name as branch_name,
    st.name as sport_name
FROM bookings b
JOIN booking_sessions bs ON b.id = bs.booking_id
JOIN packages pk ON b.package_id = pk.id
JOIN programs pr ON pk.program_id = pr.id  
JOIN branches br ON pr.branch_id = br.id
JOIN branch_translations bt ON br.id = bt.branch_id AND bt.locale = 'en'
JOIN sports sp ON pr.sport_id = sp.id
JOIN sport_translations st ON sp.id = st.sport_id AND st.locale = 'en'
WHERE pr.academic_id = 1 -- Replace with your academy ID
ORDER BY bs.date DESC
LIMIT 20;

\echo ''

-- =================================================================
-- TEST 4: Dashboard Statistics Query  
-- =================================================================
\echo 'TEST 4: Dashboard Stats Performance'

EXPLAIN (ANALYZE, BUFFERS, TIMING, FORMAT TEXT)
SELECT 
    COUNT(DISTINCT pr.id) as total_programs,
    COUNT(DISTINCT br.id) as total_branches, 
    COUNT(DISTINCT aa.id) as total_athletes,
    COUNT(DISTINCT b.id) as total_bookings
FROM academics a
LEFT JOIN programs pr ON a.id = pr.academic_id
LEFT JOIN branches br ON a.id = br.academic_id
LEFT JOIN academic_athletic aa ON a.id = aa.academic_id  
LEFT JOIN packages pk ON pr.id = pk.program_id
LEFT JOIN bookings b ON pk.id = b.package_id
WHERE a.id = 1; -- Replace with your academy ID

\echo ''

-- =================================================================
-- TEST 5: Translation Queries Performance
-- =================================================================  
\echo 'TEST 5: Translation Queries Performance'

EXPLAIN (ANALYZE, BUFFERS, TIMING, FORMAT TEXT)
SELECT 
    s.id,
    st.name as sport_name,
    COUNT(pr.id) as program_count
FROM sports s
JOIN sport_translations st ON s.id = st.sport_id AND st.locale = 'en'
LEFT JOIN programs pr ON s.id = pr.sport_id AND pr.academic_id = 1 -- Replace with your academy ID
GROUP BY s.id, st.name;

\echo ''

-- =================================================================
-- SUMMARY: Check Index Usage
-- =================================================================
\echo 'INDEX USAGE SUMMARY:'
\echo 'Look for these in the results above:'
\echo '✅ GOOD: "Index Scan using idx_*" or "Index Only Scan"'  
\echo '❌ BAD: "Seq Scan" (means no index used)'
\echo '🚀 BEST: Low "actual time" values (under 10ms for most queries)'
\echo ''

-- Show which indexes exist
SELECT 
    schemaname,
    tablename, 
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname; 