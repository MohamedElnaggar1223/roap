-- CORRECTED Surgical Database Indexes + Location Materialized View
-- Fixed schema column names and added location view implementation

-- =================================================================
-- CORRECTED SURGICAL INDEXES (Run each separately in Supabase SQL Editor)
-- =================================================================

-- 1. Programs Query Optimization (getProgramsData) - CORRECT
CREATE INDEX CONCURRENTLY idx_programs_academic_created_deep 
ON programs (academic_id, created_at) 
INCLUDE (branch_id, sport_id, name, description, gender, start_date_of_birth, end_date_of_birth);

-- 2. Dashboard Stats Optimization - CORRECTED (bookings doesn't have academy_id directly)
-- We need to index for the JOIN path: bookings -> packages -> programs -> academic_id
CREATE INDEX CONCURRENTLY idx_bookings_package_monthly_stats 
ON bookings (package_id, date_trunc('month', created_at)) 
INCLUDE (status, price, package_price);

-- Alternative: Index packages for the dashboard join
CREATE INDEX CONCURRENTLY idx_packages_program_for_dashboard 
ON packages (program_id) 
INCLUDE (id);

-- 3. Athletes Query Optimization - CORRECTED (should be academy_id not academic_id)
CREATE INDEX CONCURRENTLY idx_athletes_academy_with_bookings 
ON athletes (academy_id, created_at DESC) 
INCLUDE (name, email, birth_date, gender);

-- 4. Coach-Program Relationships - CORRECT
CREATE INDEX CONCURRENTLY idx_coach_program_with_coach_data 
ON coach_program (program_id) 
INCLUDE (coach_id);

-- 5. Branch Sport/Facility Relations - CORRECT
CREATE INDEX CONCURRENTLY idx_branch_sport_optimized 
ON branch_sport (branch_id, sport_id);

CREATE INDEX CONCURRENTLY idx_branch_facility_optimized 
ON branch_facility (branch_id, facility_id);

-- =================================================================
-- LOCATION MATERIALIZED VIEW IMPLEMENTATION
-- =================================================================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS mv_location_details CASCADE;

-- Create the materialized view for ultra-fast location queries
CREATE MATERIALIZED VIEW mv_location_details AS
SELECT 
    b.id,
    b.academic_id,
    COALESCE(bt.name, 'Unnamed Location') as name,
    COALESCE(bt.locale, 'en') as locale,
    b.name_in_google_map,
    b.url,
    b.is_default,
    b.rate,
    b.hidden,
    b.created_at,
    -- Pre-computed arrays for instant access (no more JavaScript hash map assembly!)
    COALESCE(
        array_agg(DISTINCT bs.sport_id) FILTER (WHERE bs.sport_id IS NOT NULL), 
        ARRAY[]::integer[]
    ) as sports,
    COALESCE(
        array_agg(DISTINCT bf.facility_id) FILTER (WHERE bf.facility_id IS NOT NULL), 
        ARRAY[]::integer[]
    ) as facilities,
    -- For backward compatibility with UI components
    COALESCE(
        array_agg(DISTINCT bs.sport_id::text) FILTER (WHERE bs.sport_id IS NOT NULL), 
        ARRAY[]::text[]
    ) as sports_str,
    COALESCE(
        array_agg(DISTINCT bf.facility_id::text) FILTER (WHERE bf.facility_id IS NOT NULL), 
        ARRAY[]::text[]
    ) as amenities
FROM branches b
LEFT JOIN branch_translations bt ON (b.id = bt.branch_id AND bt.locale = 'en')
LEFT JOIN branch_sport bs ON b.id = bs.branch_id  
LEFT JOIN branch_facility bf ON b.id = bf.branch_id
GROUP BY b.id, b.academic_id, bt.name, bt.locale, b.name_in_google_map, b.url, b.is_default, b.rate, b.hidden, b.created_at;

-- Create indexes on the materialized view for fast queries
CREATE UNIQUE INDEX idx_mv_location_details_id ON mv_location_details(id);
CREATE INDEX idx_mv_location_details_academy ON mv_location_details(academic_id);
CREATE INDEX idx_mv_location_details_academy_hidden ON mv_location_details(academic_id, hidden);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_location_details()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_location_details;
    NOTIFY location_view_refreshed;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-refresh when location data changes
CREATE OR REPLACE FUNCTION trigger_refresh_location_details()
RETURNS trigger AS $$
BEGIN
    -- Refresh in background (non-blocking)
    PERFORM pg_notify('refresh_location_view', '');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic refresh
DROP TRIGGER IF EXISTS trig_refresh_locations_branches ON branches;
CREATE TRIGGER trig_refresh_locations_branches
    AFTER INSERT OR UPDATE OR DELETE ON branches
    FOR EACH STATEMENT 
    EXECUTE FUNCTION trigger_refresh_location_details();

DROP TRIGGER IF EXISTS trig_refresh_locations_sports ON branch_sport;
CREATE TRIGGER trig_refresh_locations_sports
    AFTER INSERT OR UPDATE OR DELETE ON branch_sport
    FOR EACH STATEMENT 
    EXECUTE FUNCTION trigger_refresh_location_details();

DROP TRIGGER IF EXISTS trig_refresh_locations_facilities ON branch_facility;
CREATE TRIGGER trig_refresh_locations_facilities
    AFTER INSERT OR UPDATE OR DELETE ON branch_facility
    FOR EACH STATEMENT 
    EXECUTE FUNCTION trigger_refresh_location_details();

DROP TRIGGER IF EXISTS trig_refresh_locations_translations ON branch_translations;
CREATE TRIGGER trig_refresh_locations_translations
    AFTER INSERT OR UPDATE OR DELETE ON branch_translations
    FOR EACH STATEMENT 
    EXECUTE FUNCTION trigger_refresh_location_details();

-- =================================================================
-- PERFORMANCE VALIDATION QUERIES
-- =================================================================

-- 1. Test the corrected dashboard stats query
/*
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  COUNT(CASE WHEN date_trunc('month', b.created_at) = date_trunc('month', CURRENT_DATE) THEN 1 END) as current_month,
  COUNT(CASE WHEN date_trunc('month', b.created_at) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') THEN 1 END) as last_month,
  COUNT(*) as total
FROM bookings b
JOIN packages pkg ON b.package_id = pkg.id
JOIN programs p ON pkg.program_id = p.id
WHERE p.academic_id = 1;
*/

-- 2. Test the location materialized view performance
/*
-- Before (our current optimized 3 parallel queries):
EXPLAIN (ANALYZE, BUFFERS)
SELECT b.id, b.name_in_google_map, bt.name
FROM branches b
LEFT JOIN branch_translations bt ON (b.id = bt.branch_id AND bt.locale = 'en')
WHERE b.academic_id = 1;

-- After (single materialized view query):
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM mv_location_details WHERE academic_id = 1;
*/

-- 3. Test programs query with deep index
/*
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, bt.name as branch_name, st.name as sport_name
FROM programs p
INNER JOIN branches b ON p.branch_id = b.id
INNER JOIN branch_translations bt ON (b.id = bt.branch_id AND bt.locale = 'en')
INNER JOIN sports s ON p.sport_id = s.id  
INNER JOIN sport_translations st ON (s.id = st.sport_id AND st.locale = 'en')
WHERE p.academic_id = 1
ORDER BY p.created_at ASC;
*/

-- Update table statistics after creating indexes
ANALYZE programs;
ANALYZE bookings; 
ANALYZE packages;
ANALYZE athletes;
ANALYZE coach_program;
ANALYZE branch_sport;
ANALYZE branch_facility;
ANALYZE branches;
ANALYZE branch_translations;

-- Initial refresh of the materialized view
SELECT refresh_location_details(); 

-- 1. Athletes performance optimization (corrected table name)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_athletes_lookup 
ON academic_athletic (academic_id, created_at DESC) 
INCLUDE (user_id, profile_id, type);

-- 2. Dashboard stats (corrected for bookings schema)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_package_monthly_stats 
ON bookings (package_id, date_trunc('month', created_at)) 
INCLUDE (status, price, package_price);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_program_for_dashboard 
ON packages (program_id) 
INCLUDE (id);

-- 3. Coach-program relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_program_with_coach_data 
ON coach_program (program_id) 
INCLUDE (coach_id);

-- 4. Location relationships (branch operations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branch_sport_optimized 
ON branch_sport (branch_id, sport_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branch_facility_optimized 
ON branch_facility (branch_id, facility_id);

-- 5. MATERIALIZED VIEW: Ultra-fast athlete data access
-- This replaces the complex athlete joins with pre-computed data
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_athlete_details AS
SELECT 
    aa.id as athlete_id,
    aa.academic_id,
    aa.user_id,
    aa.profile_id,
    aa.type as athlete_type,
    aa.certificate,
    aa.created_at as registered_at,
    -- User data (for contact info)
    u.email,
    u.phone_number,
    u.email_verified_at,
    -- Profile data (for personal info)
    pr.name,
    pr.gender,
    pr.birthday,
    pr.image,
    pr.country,
    pr.nationality,
    pr.city,
    -- Sport data
    s.id as sport_id,
    st.name as sport_name,
    s.image as sport_image,
    -- Booking statistics (pre-computed)
    COALESCE(bk_stats.total_bookings, 0) as total_bookings,
    COALESCE(bk_stats.total_spent, 0) as total_spent,
    bk_stats.last_booking_date,
    -- Guardian information for easy access
    aa.first_guardian_name,
    aa.first_guardian_email,
    aa.first_guardian_phone,
    aa.second_guardian_name,
    aa.second_guardian_email,
    aa.second_guardian_phone
FROM academic_athletic aa
LEFT JOIN users u ON aa.user_id = u.id
LEFT JOIN profiles pr ON aa.profile_id = pr.id
LEFT JOIN sports s ON aa.sport_id = s.id
LEFT JOIN sport_translations st ON s.id = st.sport_id AND st.locale = 'en'
LEFT JOIN (
    SELECT 
        pr_sub.id as profile_id,
        COUNT(bk_sub.id) as total_bookings,
        SUM(bk_sub.price) as total_spent,
        MAX(bs_sub.date) as last_booking_date
    FROM profiles pr_sub
    LEFT JOIN bookings bk_sub ON pr_sub.id = bk_sub.profile_id
    LEFT JOIN booking_sessions bs_sub ON bk_sub.id = bs_sub.booking_id
    GROUP BY pr_sub.id
) bk_stats ON pr.id = bk_stats.profile_id;

-- Index for the materialized view for ultra-fast access
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_athlete_details_primary 
ON mv_athlete_details (athlete_id);

CREATE INDEX IF NOT EXISTS idx_mv_athlete_details_academy_lookup 
ON mv_athlete_details (academic_id, registered_at DESC) 
INCLUDE (name, email, sport_name, total_bookings);

-- Auto-refresh trigger for the materialized view
-- This ensures the view stays updated when data changes
CREATE OR REPLACE FUNCTION refresh_athlete_details()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_athlete_details;
    RETURN NULL;  
END;
$$ LANGUAGE plpgsql;

-- Trigger on key tables to auto-refresh the view
DROP TRIGGER IF EXISTS refresh_athlete_details_on_academic_athletic ON academic_athletic;
CREATE TRIGGER refresh_athlete_details_on_academic_athletic
    AFTER INSERT OR UPDATE OR DELETE ON academic_athletic
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_athlete_details();

DROP TRIGGER IF EXISTS refresh_athlete_details_on_bookings ON bookings;
CREATE TRIGGER refresh_athlete_details_on_bookings
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_athlete_details();

-- Additional indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academic_athletic_sport_lookup 
ON academic_athletic (academic_id, sport_id) 
INCLUDE (user_id, profile_id, type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_profile_stats 
ON bookings (profile_id, created_at DESC) 
INCLUDE (price, status);

-- Performance monitoring query (run this after creating indexes)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE indexname LIKE 'idx_%' 
-- ORDER BY idx_scan DESC; 