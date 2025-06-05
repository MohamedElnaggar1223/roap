-- Surgical Database Indexes for Our Optimized Queries
-- These indexes are designed to perfectly match our specific query patterns
-- Run each CREATE INDEX CONCURRENTLY command separately

-- =================================================================
-- SURGICAL INDEXES (Run each separately in Supabase SQL Editor)
-- =================================================================

-- 1. Programs Query Optimization (getProgramsData)
-- Our query: SELECT p.*, bt.name, st.name FROM programs p ... WHERE p.academic_id = ? ORDER BY p.created_at
CREATE INDEX CONCURRENTLY idx_programs_academic_created_deep 
ON programs (academic_id, created_at) 
INCLUDE (branch_id, sport_id, name, description, gender, start_date_of_birth, end_date_of_birth);

-- 2. Dashboard Stats Optimization (getDashboardStats) 
-- Our query uses date_trunc('month', created_at) for monthly comparisons
CREATE INDEX CONCURRENTLY idx_bookings_academy_monthly_stats 
ON bookings (academy_id, date_trunc('month', created_at)) 
INCLUDE (status, total_price);

-- 3. Athletes Query Optimization (getAthletesAction)
-- Our query: SELECT athletes.*, COUNT(bookings.*) FROM athletes ... WHERE academy_id = ?
CREATE INDEX CONCURRENTLY idx_athletes_academy_with_bookings 
ON athletes (academy_id, created_at DESC) 
INCLUDE (name, email, birth_date, gender);

-- 4. Coach-Program Relationships (used in program queries)
-- Our parallel query: SELECT program_id, coach_id, coach.name FROM coach_program JOIN coaches
CREATE INDEX CONCURRENTLY idx_coach_program_with_coach_data 
ON coach_program (program_id) 
INCLUDE (coach_id);

-- 5. Branch Sport/Facility Relations (Location queries)
-- Fixed version without subquery - covers all branch_sport relationships
CREATE INDEX CONCURRENTLY idx_branch_sport_optimized 
ON branch_sport (branch_id, sport_id);

CREATE INDEX CONCURRENTLY idx_branch_facility_optimized 
ON branch_facility (branch_id, facility_id);

-- =================================================================
-- OPTIONAL: Location Materialized View (if you want to implement)
-- =================================================================

-- Location Materialized View for ultra-fast location queries
/*
DROP MATERIALIZED VIEW IF EXISTS mv_location_details;

CREATE MATERIALIZED VIEW mv_location_details AS
SELECT 
    b.id,
    b.academic_id,
    bt.name,
    bt.locale,
    b.name_in_google_map,
    b.url,
    b.is_default,
    b.rate,
    b.hidden,
    b.created_at,
    -- Pre-computed arrays for instant access
    COALESCE(array_agg(DISTINCT bs.sport_id) FILTER (WHERE bs.sport_id IS NOT NULL), ARRAY[]::integer[]) as sports,
    COALESCE(array_agg(DISTINCT bf.facility_id) FILTER (WHERE bf.facility_id IS NOT NULL), ARRAY[]::integer[]) as facilities
FROM branches b
LEFT JOIN branch_translations bt ON (b.id = bt.branch_id AND bt.locale = 'en')
LEFT JOIN branch_sport bs ON b.id = bs.branch_id  
LEFT JOIN branch_facility bf ON b.id = bf.branch_id
GROUP BY b.id, b.academic_id, bt.name, bt.locale, b.name_in_google_map, b.url, b.is_default, b.rate, b.hidden, b.created_at;

-- Index the materialized view
CREATE UNIQUE INDEX ON mv_location_details(id);
CREATE INDEX ON mv_location_details(academic_id, hidden);

-- Function to refresh the view
CREATE OR REPLACE FUNCTION refresh_location_details()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_location_details;
END;
$$ LANGUAGE plpgsql;
*/

-- =================================================================
-- PERFORMANCE VALIDATION QUERIES
-- =================================================================

-- Test these queries after creating indexes to verify performance:

-- 1. Test programs query performance
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

-- 2. Test dashboard stats performance
/*
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  COUNT(CASE WHEN date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE) THEN 1 END) as current_month,
  COUNT(CASE WHEN date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') THEN 1 END) as last_month,
  COUNT(*) as total
FROM bookings 
WHERE academy_id = 1;
*/

-- 3. Test athletes query performance  
/*
EXPLAIN (ANALYZE, BUFFERS)
SELECT a.*, COUNT(b.id) as booking_count
FROM athletes a
LEFT JOIN bookings b ON a.id = b.athlete_id
WHERE a.academy_id = 1
GROUP BY a.id
ORDER BY a.created_at DESC;
*/

-- Update table statistics after creating indexes
ANALYZE programs;
ANALYZE bookings; 
ANALYZE athletes;
ANALYZE coach_program;
ANALYZE branch_sport;
ANALYZE branch_facility; 