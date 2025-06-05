-- Database Views for Performance Optimization
-- These views pre-compute complex queries to reduce runtime complexity

-- 1. Academy overview with basic stats
CREATE OR REPLACE VIEW v_academy_overview AS
SELECT 
    a.id as academy_id,
    a.user_id,
    a.slug,
    a.status,
    a.onboarded,
    at.name as academy_name,
    at.description,
    COUNT(DISTINCT p.id) as total_programs,
    COUNT(DISTINCT b.id) as total_branches,
    COUNT(DISTINCT aa.id) as total_athletes,
    COUNT(DISTINCT s.id) as total_sports,
    a.created_at,
    a.updated_at
FROM academics a
LEFT JOIN academic_translations at ON a.id = at.academic_id AND at.locale = 'en'
LEFT JOIN programs p ON a.id = p.academic_id
LEFT JOIN branches b ON a.id = b.academic_id
LEFT JOIN academic_athletic aa ON a.id = aa.academic_id
LEFT JOIN academic_sport aspt ON a.id = aspt.academic_id
LEFT JOIN sports s ON aspt.sport_id = s.id
GROUP BY a.id, a.user_id, a.slug, a.status, a.onboarded, at.name, at.description, a.created_at, a.updated_at;

-- 2. Program details with translated names
CREATE OR REPLACE VIEW v_program_details AS
SELECT 
    p.id as program_id,
    p.academic_id,
    p.name as program_name,
    p.description,
    p.type,
    p.gender,
    p.number_of_seats,
    p.color,
    p.start_date_of_birth,
    p.end_date_of_birth,
    b.id as branch_id,
    bt.name as branch_name,
    s.id as sport_id,
    st.name as sport_name,
    s.image as sport_image,
    COUNT(DISTINCT pkg.id) as total_packages,
    COUNT(DISTINCT cp.coach_id) as total_coaches,
    MIN(pkg.price) as min_price,
    MAX(pkg.price) as max_price,
    p.created_at,
    p.updated_at
FROM programs p
LEFT JOIN branches b ON p.branch_id = b.id
LEFT JOIN branch_translations bt ON b.id = bt.branch_id AND bt.locale = 'en'
LEFT JOIN sports s ON p.sport_id = s.id
LEFT JOIN sport_translations st ON s.id = st.sport_id AND st.locale = 'en'
LEFT JOIN packages pkg ON p.id = pkg.program_id
LEFT JOIN coach_program cp ON p.id = cp.program_id
GROUP BY p.id, p.academic_id, p.name, p.description, p.type, p.gender, 
         p.number_of_seats, p.color, p.start_date_of_birth, p.end_date_of_birth,
         b.id, bt.name, s.id, st.name, s.image, p.created_at, p.updated_at;

-- 3. Athlete summary view
CREATE OR REPLACE VIEW v_athlete_summary AS
SELECT 
    aa.id as athlete_id,
    aa.academic_id,
    aa.user_id,
    aa.profile_id,
    aa.type as athlete_type,
    aa.certificate,
    u.email as user_email,
    u.phone_number as user_phone,
    pr.name as athlete_name,
    pr.gender,
    pr.birthday,
    pr.image,
    pr.country,
    pr.nationality,
    pr.city,
    COUNT(DISTINCT bk.id) as total_bookings,
    SUM(bk.price) as total_spent,
    MAX(bs.date) as last_booking_date,
    aa.created_at as registered_at
FROM academic_athletic aa
LEFT JOIN users u ON aa.user_id = u.id
LEFT JOIN profiles pr ON aa.profile_id = pr.id
LEFT JOIN bookings bk ON pr.id = bk.profile_id
LEFT JOIN booking_sessions bs ON bk.id = bs.booking_id
GROUP BY aa.id, aa.academic_id, aa.user_id, aa.profile_id, aa.type, aa.certificate,
         u.email, u.phone_number, pr.name, pr.gender, pr.birthday, pr.image,
         pr.country, pr.nationality, pr.city, aa.created_at;

-- 4. Booking details with all related information
CREATE OR REPLACE VIEW v_booking_details AS
SELECT 
    bk.id as booking_id,
    bk.profile_id,
    bk.package_id,
    bk.coach_id,
    bk.price as booking_price,
    bk.package_price,
    bk.status as booking_status,
    bk.created_at as booking_date,
    
    -- Package details
    pkg.name as package_name,
    pkg.price as package_base_price,
    pkg.session_per_week,
    pkg.capacity as package_capacity,
    
    -- Program details
    prog.id as program_id,
    prog.name as program_name,
    prog.type as program_type,
    prog.gender as program_gender,
    
    -- Branch details
    br.id as branch_id,
    bt.name as branch_name,
    
    -- Sport details
    sp.id as sport_id,
    st.name as sport_name,
    
    -- Coach details
    c.name as coach_name,
    
    -- Academy details
    prog.academic_id,
    
    -- Session details
    bs.date as session_date,
    bs.from as session_start,
    bs.to as session_end,
    bs.status as session_status
    
FROM bookings bk
JOIN packages pkg ON bk.package_id = pkg.id
JOIN programs prog ON pkg.program_id = prog.id
JOIN branches br ON prog.branch_id = br.id
JOIN branch_translations bt ON br.id = bt.branch_id AND bt.locale = 'en'
JOIN sports sp ON prog.sport_id = sp.id
JOIN sport_translations st ON sp.id = st.sport_id AND st.locale = 'en'
LEFT JOIN coaches c ON bk.coach_id = c.id
LEFT JOIN booking_sessions bs ON bk.id = bs.booking_id;

-- 5. Dashboard statistics view
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
    prog.academic_id,
    
    -- Current month stats
    COUNT(DISTINCT CASE 
        WHEN bs.date >= DATE_TRUNC('month', CURRENT_DATE) 
        THEN bs.id 
    END) as current_month_sessions,
    
    -- Last month stats
    COUNT(DISTINCT CASE 
        WHEN bs.date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
        AND bs.date < DATE_TRUNC('month', CURRENT_DATE)
        THEN bs.id 
    END) as last_month_sessions,
    
    -- Total bookings
    COUNT(DISTINCT bk.id) as total_bookings,
    
    -- Revenue
    SUM(bk.price) as total_revenue,
    
    -- Current month revenue
    SUM(CASE 
        WHEN bk.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
        THEN bk.price 
        ELSE 0 
    END) as current_month_revenue,
    
    -- Average booking value
    AVG(bk.price) as avg_booking_value,
    
    -- Most popular sport
    MODE() WITHIN GROUP (ORDER BY st.name) as most_popular_sport,
    
    -- Most popular branch
    MODE() WITHIN GROUP (ORDER BY bt.name) as most_popular_branch,
    
    -- Date of latest activity
    MAX(bs.date) as latest_activity_date
    
FROM programs prog
LEFT JOIN packages pkg ON prog.id = pkg.program_id
LEFT JOIN bookings bk ON pkg.id = bk.package_id
LEFT JOIN booking_sessions bs ON bk.id = bs.booking_id
LEFT JOIN branches br ON prog.branch_id = br.id
LEFT JOIN branch_translations bt ON br.id = bt.branch_id AND bt.locale = 'en'
LEFT JOIN sports sp ON prog.sport_id = sp.id
LEFT JOIN sport_translations st ON sp.id = st.sport_id AND st.locale = 'en'
GROUP BY prog.academic_id;

-- 6. Package utilization view
CREATE OR REPLACE VIEW v_package_utilization AS
SELECT 
    pkg.id as package_id,
    pkg.name as package_name,
    pkg.price,
    pkg.capacity,
    pkg.session_per_week,
    pkg.start_date,
    pkg.end_date,
    prog.academic_id,
    prog.name as program_name,
    bt.name as branch_name,
    st.name as sport_name,
    
    -- Utilization metrics
    COUNT(DISTINCT bk.id) as total_bookings,
    COUNT(DISTINCT bs.id) as total_sessions_booked,
    COUNT(DISTINCT bk.profile_id) as unique_athletes,
    
    -- Capacity utilization
    ROUND(
        (COUNT(DISTINCT bk.id)::decimal / NULLIF(pkg.capacity, 0)) * 100, 2
    ) as capacity_utilization_percent,
    
    -- Revenue metrics
    SUM(bk.price) as total_revenue,
    AVG(bk.price) as avg_booking_price,
    
    -- Time-based metrics
    MIN(bk.created_at) as first_booking_date,
    MAX(bk.created_at) as latest_booking_date
    
FROM packages pkg
JOIN programs prog ON pkg.program_id = prog.id
JOIN branches br ON prog.branch_id = br.id
JOIN branch_translations bt ON br.id = bt.branch_id AND bt.locale = 'en'
JOIN sports sp ON prog.sport_id = sp.id
JOIN sport_translations st ON sp.id = st.sport_id AND st.locale = 'en'
LEFT JOIN bookings bk ON pkg.id = bk.package_id
LEFT JOIN booking_sessions bs ON bk.id = bs.booking_id
GROUP BY pkg.id, pkg.name, pkg.price, pkg.capacity, pkg.session_per_week,
         pkg.start_date, pkg.end_date, prog.academic_id, prog.name,
         bt.name, st.name;

-- Create indexes on views for better performance
CREATE INDEX IF NOT EXISTS idx_v_academy_overview_user_id ON v_academy_overview(user_id);
CREATE INDEX IF NOT EXISTS idx_v_program_details_academic_id ON v_program_details(academic_id);
CREATE INDEX IF NOT EXISTS idx_v_athlete_summary_academic_id ON v_athlete_summary(academic_id);
CREATE INDEX IF NOT EXISTS idx_v_booking_details_academic_id ON v_booking_details(academic_id);
CREATE INDEX IF NOT EXISTS idx_v_booking_details_session_date ON v_booking_details(session_date);
CREATE INDEX IF NOT EXISTS idx_v_dashboard_stats_academic_id ON v_dashboard_stats(academic_id);
CREATE INDEX IF NOT EXISTS idx_v_package_utilization_academic_id ON v_package_utilization(academic_id); 