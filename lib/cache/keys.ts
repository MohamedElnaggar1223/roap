// Cache key generators for consistent key naming
export const CACHE_KEYS = {
    // Global static data (Phase 1)
    ALL_SPORTS: 'sports:all',
    ALL_FACILITIES: 'facilities:all',
    ALL_COUNTRIES: 'countries:all',
    ALL_STATES: 'states:all',
    ALL_CITIES: 'cities:all',
    ALL_GENDERS: 'genders:all',
    ALL_SPOKEN_LANGUAGES: 'spoken_languages:all',

    // Translation data (Phase 1)
    SPORT_TRANSLATIONS: (locale: string) => `translations:sports:${locale}`,
    FACILITY_TRANSLATIONS: (locale: string) => `translations:facilities:${locale}`,
    COUNTRY_TRANSLATIONS: (locale: string) => `translations:countries:${locale}`,
    STATE_TRANSLATIONS: (locale: string) => `translations:states:${locale}`,
    CITY_TRANSLATIONS: (locale: string) => `translations:cities:${locale}`,
    GENDER_TRANSLATIONS: (locale: string) => `translations:genders:${locale}`,
    SPOKEN_LANGUAGE_TRANSLATIONS: (locale: string) => `translations:spoken_languages:${locale}`,

    // Academy-specific data (Phase 1)
    ACADEMY_DETAILS: (academyId: number) => `academy:${academyId}:details`,
    ACADEMY_SPORTS: (academyId: number) => `academy:${academyId}:sports`,
    ACADEMY_FACILITIES: (academyId: number) => `academy:${academyId}:facilities`,

    // Programs and packages (Phase 2)
    ACADEMY_PROGRAMS: (academyId: number) => `academy:${academyId}:programs`,
    PROGRAM_DETAILS: (programId: number) => `program:${programId}:details`,
    PROGRAM_PACKAGES: (programId: number) => `program:${programId}:packages`,
    PROGRAM_DISCOUNTS: (programId: number) => `program:${programId}:discounts`,

    // Coaches (Phase 2)
    ACADEMY_COACHES: (academyId: number) => `academy:${academyId}:coaches`,
    COACH_DETAILS: (coachId: number) => `coach:${coachId}:details`,

    // Locations/Branches (Phase 2)
    ACADEMY_LOCATIONS: (academyId: number) => `academy:${academyId}:locations`,
    LOCATION_DETAILS: (locationId: number) => `location:${locationId}:details`,

    // Paginated data
    PAGINATED_SPORTS: (page: number, pageSize: number, orderBy: string) =>
        `paginated:sports:${page}:${pageSize}:${orderBy}`,
    PAGINATED_FACILITIES: (page: number, pageSize: number, orderBy: string) =>
        `paginated:facilities:${page}:${pageSize}:${orderBy}`,
    PAGINATED_COUNTRIES: (page: number, pageSize: number, orderBy: string) =>
        `paginated:countries:${page}:${pageSize}:${orderBy}`,
    PAGINATED_STATES: (page: number, pageSize: number, orderBy: string) =>
        `paginated:states:${page}:${pageSize}:${orderBy}`,
    PAGINATED_CITIES: (page: number, pageSize: number, orderBy: string) =>
        `paginated:cities:${page}:${pageSize}:${orderBy}`,
    PAGINATED_GENDERS: (page: number, pageSize: number, orderBy: string) =>
        `paginated:genders:${page}:${pageSize}:${orderBy}`,
} as const

// Pattern generators for bulk invalidation
export const CACHE_PATTERNS = {
    ALL_SPORTS: 'sports:*',
    ALL_FACILITIES: 'facilities:*',
    ALL_COUNTRIES: 'countries:*',
    ALL_STATES: 'states:*',
    ALL_CITIES: 'cities:*',
    ALL_GENDERS: 'genders:*',
    ALL_SPOKEN_LANGUAGES: 'spoken_languages:*',

    // Translation patterns
    ALL_TRANSLATIONS: 'translations:*',
    SPORT_TRANSLATIONS: 'translations:sports:*',
    FACILITY_TRANSLATIONS: 'translations:facilities:*',
    COUNTRY_TRANSLATIONS: 'translations:countries:*',
    STATE_TRANSLATIONS: 'translations:states:*',
    CITY_TRANSLATIONS: 'translations:cities:*',
    GENDER_TRANSLATIONS: 'translations:genders:*',
    SPOKEN_LANGUAGE_TRANSLATIONS: 'translations:spoken_languages:*',

    // Academy patterns
    ACADEMY_ALL: (academyId: number) => `academy:${academyId}:*`,

    // Program patterns
    PROGRAM_ALL: (programId: number) => `program:${programId}:*`,

    // Coach patterns
    COACH_ALL: (coachId: number) => `coach:${coachId}:*`,

    // Location patterns
    LOCATION_ALL: (locationId: number) => `location:${locationId}:*`,

    // Paginated patterns
    PAGINATED_SPORTS: 'paginated:sports:*',
    PAGINATED_FACILITIES: 'paginated:facilities:*',
    PAGINATED_COUNTRIES: 'paginated:countries:*',
    PAGINATED_STATES: 'paginated:states:*',
    PAGINATED_CITIES: 'paginated:cities:*',
    PAGINATED_GENDERS: 'paginated:genders:*',
} as const

// TTL values (in seconds)
export const CACHE_TTL = {
    // Static data - long TTL (24 hours)
    STATIC_DATA: 24 * 60 * 60, // 86400 seconds

    // Academy data - medium TTL (4 hours)
    ACADEMY_DATA: 4 * 60 * 60, // 14400 seconds

    // Program/Coach data - shorter TTL (1 hour)
    DYNAMIC_DATA: 60 * 60, // 3600 seconds

    // Paginated data - short TTL (30 minutes)
    PAGINATED_DATA: 30 * 60, // 1800 seconds
} as const 