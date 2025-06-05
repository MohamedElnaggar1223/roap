-- Critical Database Indexes for Performance Optimization
-- IMPORTANT: Run the concurrent indexes separately from other commands

-- =================================================================
-- PART 1: CONCURRENT INDEXES (Run each command separately in psql)
-- =================================================================
-- Copy and run each line individually:

-- 1. Academy-related queries (most common access pattern)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academics_user_id_status ON academics(user_id, status) WHERE status IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_academics_status_onboarded ON academics(status, onboarded);

-- 2. Programs and related data (heavily queried)
-- CREATE INDEX IF NOT EXISTS idx_programs_academic_id_name ON programs(academic_id, name);
-- CREATE INDEX IF NOT EXISTS idx_programs_academic_branch_sport ON programs(academic_id, branch_id, sport_id);
-- CREATE INDEX IF NOT EXISTS idx_programs_academic_id_created_at ON programs(academic_id, created_at DESC);

-- 3. Packages and schedules
-- CREATE INDEX IF NOT EXISTS idx_packages_program_id_created_at ON packages(program_id, created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_schedules_package_id_day_from ON schedules(package_id, day, "from");

-- 4. Bookings optimization (critical for performance)
-- CREATE INDEX IF NOT EXISTS idx_bookings_profile_package_created ON bookings(profile_id, package_id, created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_booking_sessions_booking_date ON booking_sessions(booking_id, date DESC);
-- CREATE INDEX IF NOT EXISTS idx_booking_sessions_date_status ON booking_sessions(date, status);

-- 5. Translation tables optimization
-- CREATE INDEX IF NOT EXISTS idx_branch_translations_branch_locale ON branch_translations(branch_id, locale) WHERE locale = 'en';
-- CREATE INDEX IF NOT EXISTS idx_sport_translations_sport_locale ON sport_translations(sport_id, locale) WHERE locale = 'en';
-- CREATE INDEX IF NOT EXISTS idx_academic_translations_academic_locale ON academic_translations(academic_id, locale) WHERE locale = 'en';

-- 6. Academic Athletic (athletes) optimization
-- CREATE INDEX IF NOT EXISTS idx_academic_athletic_academic_id ON academic_athletic(academic_id);
-- CREATE INDEX IF NOT EXISTS idx_academic_athletic_profile_user ON academic_athletic(profile_id, user_id);

-- 7. Coach relationships
-- CREATE INDEX IF NOT EXISTS idx_coach_program_program_coach ON coach_program(program_id, coach_id);
-- CREATE INDEX IF NOT EXISTS idx_coaches_academic_id ON coaches(academic_id);

-- 8. Entry fees optimization
-- CREATE INDEX IF NOT EXISTS idx_entry_fees_history_profile_sport_program ON entry_fees_history(profile_id, sport_id, program_id);

-- 9. Media attachments
-- CREATE INDEX IF NOT EXISTS idx_media_referable_type_id ON media(referable_type, referable_id);

-- 10. Partial indexes for common filters
-- CREATE INDEX IF NOT EXISTS idx_programs_active_assessments ON programs(academic_id, branch_id, sport_id) WHERE name = 'Assessment';
-- CREATE INDEX IF NOT EXISTS idx_programs_active_non_assessments ON programs(academic_id, created_at DESC) WHERE name != 'Assessment';

-- 11. Composite indexes for dashboard queries
-- CREATE INDEX IF NOT EXISTS idx_dashboard_bookings_composite ON booking_sessions(date, status) INCLUDE (booking_id, "from", "to");

-- 12. Branch and sport relationship optimization
-- CREATE INDEX IF NOT EXISTS idx_branch_sport_academic_branch ON branch_sport(branch_id) INCLUDE (sport_id);
-- CREATE INDEX IF NOT EXISTS idx_academic_sport_academic_sport ON academic_sport(academic_id, sport_id);

-- 13. Optimize frequently accessed user data
-- CREATE INDEX IF NOT EXISTS idx_profiles_user_id_relationship ON profiles(user_id, relationship);

-- =================================================================
-- PART 2: NON-CONCURRENT OPERATIONS (Can run as a script)
-- =================================================================

-- Materialized views for complex queries
DROP MATERIALIZED VIEW IF EXISTS mv_academy_stats;
CREATE MATERIALIZED VIEW mv_academy_stats AS
SELECT 
    a.id as academy_id,
    a.user_id,
    COUNT(DISTINCT p.id) as total_programs,
    COUNT(DISTINCT b.id) as total_branches,
    COUNT(DISTINCT aa.id) as total_athletes,
    COUNT(DISTINCT bk.id) as total_bookings,
    MAX(a.updated_at) as last_updated
FROM academics a
LEFT JOIN programs p ON a.id = p.academic_id
LEFT JOIN branches b ON a.id = b.academic_id  
LEFT JOIN academic_athletic aa ON a.id = aa.academic_id
LEFT JOIN bookings bk ON bk.package_id IN (
    SELECT pk.id FROM packages pk 
    JOIN programs pr ON pk.program_id = pr.id 
    WHERE pr.academic_id = a.id
)
GROUP BY a.id, a.user_id;

-- Create indexes on materialized view
CREATE UNIQUE INDEX ON mv_academy_stats(academy_id);
CREATE INDEX ON mv_academy_stats(user_id);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_academy_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_academy_stats;
END;
$$ LANGUAGE plpgsql;

-- Statistics update for better query planning
ANALYZE academics;
ANALYZE programs;
ANALYZE packages;
ANALYZE bookings;
ANALYZE booking_sessions;
ANALYZE academic_athletic; 