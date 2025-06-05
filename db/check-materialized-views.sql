-- ROAP Database Materialized Views Diagnostic
-- Run this to check if materialized views and triggers are properly set up

\echo '🔍 Checking materialized views status...'

-- Check if materialized views exist
SELECT 
    'Materialized Views Status' as check_type,
    schemaname,
    matviewname as name,
    definition,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size,
    CASE 
        WHEN matviewname = 'mv_location_details' THEN '✅ Location view found'
        WHEN matviewname = 'mv_athlete_details' THEN '✅ Athlete view found'
        ELSE '⚠️ Unknown view'
    END as status
FROM pg_matviews 
WHERE matviewname LIKE 'mv_%'
ORDER BY matviewname;

-- Check if materialized view indexes exist
\echo ''
\echo '📊 Checking materialized view indexes...'
SELECT 
    'Materialized View Indexes' as check_type,
    schemaname,
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE '%mv_location%' THEN '✅ Location index'
        WHEN indexname LIKE '%mv_athlete%' THEN '✅ Athlete index'
        ELSE '⚠️ Other index'
    END as status
FROM pg_indexes 
WHERE tablename LIKE 'mv_%'
ORDER BY tablename, indexname;

-- Check if refresh functions exist
\echo ''
\echo '🔧 Checking refresh functions...'
SELECT 
    'Refresh Functions' as check_type,
    proname as function_name,
    CASE 
        WHEN proname = 'refresh_location_details' THEN '✅ Location refresh function'
        WHEN proname = 'refresh_athlete_details' THEN '✅ Athlete refresh function'
        ELSE '⚠️ Other function'
    END as status
FROM pg_proc 
WHERE proname LIKE 'refresh_%details'
ORDER BY proname;

-- Check if triggers exist
\echo ''
\echo '⚡ Checking auto-refresh triggers...'
SELECT 
    'Auto-refresh Triggers' as check_type,
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    CASE 
        WHEN trigger_name LIKE '%location%' THEN '✅ Location trigger'
        WHEN trigger_name LIKE '%athlete%' THEN '✅ Athlete trigger'
        ELSE '⚠️ Other trigger'
    END as status
FROM information_schema.triggers 
WHERE trigger_name LIKE 'refresh_%'
ORDER BY event_object_table, trigger_name;

-- Test materialized view data
\echo ''
\echo '📈 Testing materialized view data...'
SELECT 
    'Location View Test' as test_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT academic_id) as academies_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE '❌ No data'
    END as status
FROM mv_location_details;

SELECT 
    'Athlete View Test' as test_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT academic_id) as academies_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE '❌ No data'
    END as status
FROM mv_athlete_details;

-- Performance test
\echo ''
\echo '⚡ Performance test...'
\timing on

SELECT 'Location View Performance' as test_type, COUNT(*) FROM mv_location_details;
SELECT 'Athlete View Performance' as test_type, COUNT(*) FROM mv_athlete_details;

\timing off

\echo ''
\echo '📋 Summary:'
\echo '   If you see ❌ or missing items above, run:'
\echo '   psql $SUPABASE_DATABASE_URL -f surgical-indexes-fixed.sql'
\echo ''
\echo '   If materialized views exist but have no data, run:'
\echo '   REFRESH MATERIALIZED VIEW mv_location_details;'
\echo '   REFRESH MATERIALIZED VIEW mv_athlete_details;'