import { deleteCachedData, deleteCachedPattern } from './redis'
import { CACHE_PATTERNS, CACHE_KEYS } from './keys'

// Invalidation functions for different entity types

// Sports invalidation (affects many entities)
export async function invalidateSportsCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_SPORTS),
        deleteCachedPattern(CACHE_PATTERNS.SPORT_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_SPORTS),
    ])
}

// Facilities invalidation
export async function invalidateFacilitiesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_FACILITIES),
        deleteCachedPattern(CACHE_PATTERNS.FACILITY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_FACILITIES),
    ])
}

// Countries invalidation (affects states and cities)
export async function invalidateCountriesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_COUNTRIES),
        deleteCachedPattern(CACHE_PATTERNS.COUNTRY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_COUNTRIES),
        // Also invalidate states and cities since they depend on countries
        deleteCachedPattern(CACHE_PATTERNS.ALL_STATES),
        deleteCachedPattern(CACHE_PATTERNS.STATE_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_STATES),
        deleteCachedPattern(CACHE_PATTERNS.ALL_CITIES),
        deleteCachedPattern(CACHE_PATTERNS.CITY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_CITIES),
    ])
}

// States invalidation (affects cities)
export async function invalidateStatesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_STATES),
        deleteCachedPattern(CACHE_PATTERNS.STATE_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_STATES),
        // Also invalidate cities since they depend on states
        deleteCachedPattern(CACHE_PATTERNS.ALL_CITIES),
        deleteCachedPattern(CACHE_PATTERNS.CITY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_CITIES),
    ])
}

// Cities invalidation
export async function invalidateCitiesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_CITIES),
        deleteCachedPattern(CACHE_PATTERNS.CITY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_CITIES),
    ])
}

// Genders invalidation
export async function invalidateGendersCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_GENDERS),
        deleteCachedPattern(CACHE_PATTERNS.GENDER_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_GENDERS),
    ])
}

// Spoken languages invalidation
export async function invalidateSpokenLanguagesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_SPOKEN_LANGUAGES),
        deleteCachedPattern(CACHE_PATTERNS.SPOKEN_LANGUAGE_TRANSLATIONS),
    ])
}

// Academy-specific invalidation
export async function invalidateAcademyCache(academyId: number) {
    await deleteCachedPattern(CACHE_PATTERNS.ACADEMY_ALL(academyId))
}

export async function invalidateAcademyDetails(academyId: number) {
    await deleteCachedData(CACHE_KEYS.ACADEMY_DETAILS(academyId))
}

export async function invalidateAcademySports(academyId: number) {
    await deleteCachedData(CACHE_KEYS.ACADEMY_SPORTS(academyId))
}

export async function invalidateAcademyFacilities(academyId: number) {
    await deleteCachedData(CACHE_KEYS.ACADEMY_FACILITIES(academyId))
}

// Program-specific invalidation
export async function invalidateProgramCache(programId: number, academyId?: number) {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.PROGRAM_ALL(programId)),
        // Also invalidate academy programs list if academyId provided
        academyId ? deleteCachedData(CACHE_KEYS.ACADEMY_PROGRAMS(academyId)) : Promise.resolve(),
    ])
}

export async function invalidateProgramPackages(programId: number) {
    await deleteCachedData(CACHE_KEYS.PROGRAM_PACKAGES(programId))
}

export async function invalidateProgramDiscounts(programId: number) {
    await deleteCachedData(CACHE_KEYS.PROGRAM_DISCOUNTS(programId))
}

// Coach-specific invalidation
export async function invalidateCoachCache(coachId: number, academyId?: number) {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.COACH_ALL(coachId)),
        // Also invalidate academy coaches list if academyId provided
        academyId ? deleteCachedData(CACHE_KEYS.ACADEMY_COACHES(academyId)) : Promise.resolve(),
    ])
}

// Location-specific invalidation
export async function invalidateLocationCache(locationId: number, academyId?: number) {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.LOCATION_ALL(locationId)),
        // Also invalidate academy locations list if academyId provided
        academyId ? deleteCachedData(CACHE_KEYS.ACADEMY_LOCATIONS(academyId)) : Promise.resolve(),
    ])
}

// Complex invalidation scenarios

// When a sport is updated, invalidate all related data
export async function invalidateAllSportRelatedData() {
    await Promise.all([
        invalidateSportsCache(),
        // Invalidate all academy sports (since sports list changed)
        deleteCachedPattern('academy:*:sports'),
        // Programs are sport-specific, so invalidate academy programs
        deleteCachedPattern('academy:*:programs'),
        deleteCachedPattern('program:*'),
    ])
}

// When a facility is updated, invalidate all related data
export async function invalidateAllFacilityRelatedData() {
    await Promise.all([
        invalidateFacilitiesCache(),
        // Invalidate all academy facilities
        deleteCachedPattern('academy:*:facilities'),
        // Locations have facilities, so invalidate academy locations
        deleteCachedPattern('academy:*:locations'),
        deleteCachedPattern('location:*'),
    ])
}

// When an academy is updated, invalidate all its related data
export async function invalidateAllAcademyRelatedData(academyId: number) {
    await Promise.all([
        invalidateAcademyCache(academyId),
        // Also invalidate programs, coaches, locations for this academy
        deleteCachedPattern(`program:*`), // We'll need to be more specific in real implementation
        deleteCachedPattern(`coach:*`),   // We'll need to be more specific in real implementation
        deleteCachedPattern(`location:*`), // We'll need to be more specific in real implementation
    ])
}

// Translation-specific invalidation
export async function invalidateTranslationsCache(entityType: string, locale?: string) {
    if (locale) {
        // Invalidate specific locale translations
        switch (entityType.toLowerCase()) {
            case 'sport':
                await deleteCachedData(CACHE_KEYS.SPORT_TRANSLATIONS(locale))
                break
            case 'facility':
                await deleteCachedData(CACHE_KEYS.FACILITY_TRANSLATIONS(locale))
                break
            case 'country':
                await deleteCachedData(CACHE_KEYS.COUNTRY_TRANSLATIONS(locale))
                break
            case 'state':
                await deleteCachedData(CACHE_KEYS.STATE_TRANSLATIONS(locale))
                break
            case 'city':
                await deleteCachedData(CACHE_KEYS.CITY_TRANSLATIONS(locale))
                break
            case 'gender':
                await deleteCachedData(CACHE_KEYS.GENDER_TRANSLATIONS(locale))
                break
            case 'spoken_language':
                await deleteCachedData(CACHE_KEYS.SPOKEN_LANGUAGE_TRANSLATIONS(locale))
                break
        }
    } else {
        // Invalidate all translations for this entity type
        switch (entityType.toLowerCase()) {
            case 'sport':
                await deleteCachedPattern(CACHE_PATTERNS.SPORT_TRANSLATIONS)
                break
            case 'facility':
                await deleteCachedPattern(CACHE_PATTERNS.FACILITY_TRANSLATIONS)
                break
            case 'country':
                await deleteCachedPattern(CACHE_PATTERNS.COUNTRY_TRANSLATIONS)
                break
            case 'state':
                await deleteCachedPattern(CACHE_PATTERNS.STATE_TRANSLATIONS)
                break
            case 'city':
                await deleteCachedPattern(CACHE_PATTERNS.CITY_TRANSLATIONS)
                break
            case 'gender':
                await deleteCachedPattern(CACHE_PATTERNS.GENDER_TRANSLATIONS)
                break
            case 'spoken_language':
                await deleteCachedPattern(CACHE_PATTERNS.SPOKEN_LANGUAGE_TRANSLATIONS)
                break
        }
    }
} 