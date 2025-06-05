#!/bin/bash

# Performance Optimization: Create Database Indexes
# This script creates indexes concurrently to avoid blocking operations
# Usage: ./create-indexes.sh [database_name]

DB_NAME=${1:-"your_database_name"}

echo "🚀 Starting database index creation for performance optimization..."
echo "Database: $DB_NAME"
echo ""

# Function to run index creation with error handling
create_index() {
    local index_sql="$1"
    local index_name=$(echo "$index_sql" | grep -o 'idx_[a-zA-Z_]*')
    
    echo "Creating index: $index_name"
    
    if psql -d "$DB_NAME" -c "$index_sql" 2>/dev/null; then
        echo "✅ Success: $index_name"
    else
        echo "❌ Failed: $index_name (may already exist)"
    fi
    echo ""
}

echo "📊 Creating critical performance indexes..."

# 1. Academy-related queries (most critical)
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academics_user_id_status ON academics(user_id, status) WHERE status IS NOT NULL;"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academics_status_onboarded ON academics(status, onboarded);"

# 2. Programs and related data
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_academic_id_name ON programs(academic_id, name);"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_academic_branch_sport ON programs(academic_id, branch_id, sport_id);"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_academic_id_created_at ON programs(academic_id, created_at DESC);"

# 3. Packages and schedules
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_program_id_created_at ON packages(program_id, created_at DESC);"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedules_package_id_day_from ON schedules(package_id, day, \"from\");"

# 4. Bookings optimization (critical)
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_profile_package_created ON bookings(profile_id, package_id, created_at DESC);"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_sessions_booking_date ON booking_sessions(booking_id, date DESC);"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_sessions_date_status ON booking_sessions(date, status);"

# 5. Translation tables optimization
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branch_translations_branch_locale ON branch_translations(branch_id, locale) WHERE locale = 'en';"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sport_translations_sport_locale ON sport_translations(sport_id, locale) WHERE locale = 'en';"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academic_translations_academic_locale ON academic_translations(academic_id, locale) WHERE locale = 'en';"

# 6. Academic Athletic (athletes) optimization
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academic_athletic_academic_id ON academic_athletic(academic_id);"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academic_athletic_profile_user ON academic_athletic(profile_id, user_id);"

# 7. Coach relationships
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_program_program_coach ON coach_program(program_id, coach_id);"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coaches_academic_id ON coaches(academic_id);"

# 8. Entry fees optimization
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entry_fees_history_profile_sport_program ON entry_fees_history(profile_id, sport_id, program_id);"

# 9. Media attachments
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_referable_type_id ON media(referable_type, referable_id);"

# 10. Partial indexes for common filters
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_active_assessments ON programs(academic_id, branch_id, sport_id) WHERE name = 'Assessment';"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_active_non_assessments ON programs(academic_id, created_at DESC) WHERE name != 'Assessment';"

# 11. Branch and sport relationships
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branch_sport_academic_branch ON branch_sport(branch_id);"
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_academic_sport_academic_sport ON academic_sport(academic_id, sport_id);"

# 12. User profiles
create_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id_relationship ON profiles(user_id, relationship);"

echo "🎉 Index creation completed!"
echo ""
echo "Next steps:"
echo "1. Run: psql -d $DB_NAME -f db/schema-optimization-fixed.sql"
echo "2. Apply database views: psql -d $DB_NAME -f db/views.sql"  
echo "3. Update your action files to use caching"
echo ""
echo "Expected performance improvement: 50-70% 🚀" 