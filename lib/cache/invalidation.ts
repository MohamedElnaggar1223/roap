import { deleteCachedData, deleteCachedPattern, updateCachedData, updateMultipleCachedData, invalidateAndRefresh } from './redis'
import { CACHE_PATTERNS, CACHE_KEYS, CACHE_TTL } from './keys'

// Import database query functions for cache updates
// Note: You'll need to import the actual database query functions here
// import { getAllSports, getSport, etc. } from '../actions/sports.actions'

// Smart invalidation functions that update cache instead of deleting

// Sports invalidation with cache refresh
export async function invalidateAndRefreshSport(sportId: number, fetcher?: () => Promise<any>) {
    if (fetcher) {
        // Update specific sport cache with fresh data
        await updateCachedData(
            CACHE_KEYS.SPORT_DETAILS(sportId),
            fetcher,
            CACHE_TTL.DYNAMIC_DATA
        )
    } else {
        // Fallback to deletion if no fetcher provided
        await deleteCachedData(CACHE_KEYS.SPORT_DETAILS(sportId))
    }
}

export async function invalidateAndRefreshAllSports(fetcher?: () => Promise<any>) {
    if (fetcher) {
        // Update all sports cache with fresh data
        await updateCachedData(
            CACHE_KEYS.ALL_SPORTS,
            fetcher,
            CACHE_TTL.STATIC_DATA
        )
    } else {
        // Fallback to deletion
        await deleteCachedData(CACHE_KEYS.ALL_SPORTS)
    }

    // Also invalidate paginated sports (these need to be deleted as we can't easily refresh all variations)
    await deleteCachedPattern(CACHE_PATTERNS.PAGINATED_SPORTS)
}

export async function invalidateAndRefreshSportsTranslations(locale: string, fetcher?: () => Promise<any>) {
    if (fetcher) {
        await updateCachedData(
            CACHE_KEYS.SPORT_TRANSLATIONS(locale),
            fetcher,
            CACHE_TTL.STATIC_DATA
        )
    } else {
        await deleteCachedData(CACHE_KEYS.SPORT_TRANSLATIONS(locale))
    }
}

// Facilities invalidation with cache refresh
export async function invalidateAndRefreshAllFacilities(fetcher?: () => Promise<any>) {
    if (fetcher) {
        await updateCachedData(
            CACHE_KEYS.ALL_FACILITIES,
            fetcher,
            CACHE_TTL.STATIC_DATA
        )
    } else {
        await deleteCachedData(CACHE_KEYS.ALL_FACILITIES)
    }

    await deleteCachedPattern(CACHE_PATTERNS.PAGINATED_FACILITIES)
}

// Academy-specific invalidation with smart refresh
export async function invalidateAndRefreshAcademyData(
    academyId: number,
    updates: {
        details?: () => Promise<any>
        sports?: () => Promise<any>
        facilities?: () => Promise<any>
        programs?: () => Promise<any>
        coaches?: () => Promise<any>
        locations?: () => Promise<any>
    }
) {
    const cacheUpdates = []

    if (updates.details) {
        cacheUpdates.push({
            key: CACHE_KEYS.ACADEMY_DETAILS(academyId),
            fetcher: updates.details,
            ttl: CACHE_TTL.ACADEMY_DATA
        })
    }

    if (updates.sports) {
        cacheUpdates.push({
            key: CACHE_KEYS.ACADEMY_SPORTS(academyId),
            fetcher: updates.sports,
            ttl: CACHE_TTL.ACADEMY_DATA
        })
    }

    if (updates.facilities) {
        cacheUpdates.push({
            key: CACHE_KEYS.ACADEMY_FACILITIES(academyId),
            fetcher: updates.facilities,
            ttl: CACHE_TTL.ACADEMY_DATA
        })
    }

    if (updates.programs) {
        cacheUpdates.push({
            key: CACHE_KEYS.ACADEMY_PROGRAMS(academyId),
            fetcher: updates.programs,
            ttl: CACHE_TTL.DYNAMIC_DATA
        })
    }

    if (updates.coaches) {
        cacheUpdates.push({
            key: CACHE_KEYS.ACADEMY_COACHES(academyId),
            fetcher: updates.coaches,
            ttl: CACHE_TTL.DYNAMIC_DATA
        })
    }

    if (updates.locations) {
        cacheUpdates.push({
            key: CACHE_KEYS.ACADEMY_LOCATIONS(academyId),
            fetcher: updates.locations,
            ttl: CACHE_TTL.ACADEMY_DATA
        })
    }

    // Update all specified caches in parallel
    if (cacheUpdates.length > 0) {
        await updateMultipleCachedData(cacheUpdates)
    }
}

// Program-specific invalidation with smart refresh
export async function invalidateAndRefreshProgram(
    programId: number,
    academyId: number,
    updates: {
        details?: () => Promise<any>
        packages?: () => Promise<any>
        discounts?: () => Promise<any>
    }
) {
    const cacheUpdates = []

    if (updates.details && CACHE_KEYS.PROGRAM_DETAILS) {
        cacheUpdates.push({
            key: CACHE_KEYS.PROGRAM_DETAILS(programId),
            fetcher: updates.details,
            ttl: CACHE_TTL.DYNAMIC_DATA
        })
    }

    if (updates.packages) {
        cacheUpdates.push({
            key: CACHE_KEYS.PROGRAM_PACKAGES(programId),
            fetcher: updates.packages,
            ttl: CACHE_TTL.DYNAMIC_DATA
        })
    }

    if (updates.discounts) {
        cacheUpdates.push({
            key: CACHE_KEYS.PROGRAM_DISCOUNTS(programId),
            fetcher: updates.discounts,
            ttl: CACHE_TTL.DYNAMIC_DATA
        })
    }

    // Also refresh academy programs list (since it includes this program)
    if (updates.details) {
        cacheUpdates.push({
            key: CACHE_KEYS.ACADEMY_PROGRAMS(academyId),
            fetcher: updates.details, // You'd need to pass academy programs fetcher here
            ttl: CACHE_TTL.DYNAMIC_DATA
        })
    }

    if (cacheUpdates.length > 0) {
        await updateMultipleCachedData(cacheUpdates)
    }
}

// Hybrid approach: Delete complex caches, update simple ones
export async function smartInvalidateSports(
    sportData?: any,
    translationData?: { [locale: string]: any }
) {
    const updates = []

    // Update simple caches with fresh data
    if (sportData) {
        updates.push({
            key: CACHE_KEYS.ALL_SPORTS,
            fetcher: async () => sportData,
            ttl: CACHE_TTL.STATIC_DATA
        })
    }

    // Update translation caches
    if (translationData) {
        Object.entries(translationData).forEach(([locale, data]) => {
            updates.push({
                key: CACHE_KEYS.SPORT_TRANSLATIONS(locale),
                fetcher: async () => data,
                ttl: CACHE_TTL.STATIC_DATA
            })
        })
    }

    // Update caches in parallel
    if (updates.length > 0) {
        await updateMultipleCachedData(updates)
    }

    // Delete complex caches that are hard to refresh
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_SPORTS),
        deleteCachedPattern('academy:*:sports'), // All academy sports lists
        deleteCachedPattern('academy:*:programs'), // All academy programs (since they reference sports)
    ])
}

// Legacy functions (kept for backward compatibility)
// These still use the old delete-only approach
export async function invalidateSportsCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_SPORTS),
        deleteCachedPattern(CACHE_PATTERNS.SPORT_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_SPORTS),
    ])
}

export async function invalidateFacilitiesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_FACILITIES),
        deleteCachedPattern(CACHE_PATTERNS.FACILITY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_FACILITIES),
    ])
}

export async function invalidateCountriesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_COUNTRIES),
        deleteCachedPattern(CACHE_PATTERNS.COUNTRY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_COUNTRIES),
        deleteCachedPattern(CACHE_PATTERNS.ALL_STATES),
        deleteCachedPattern(CACHE_PATTERNS.STATE_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_STATES),
        deleteCachedPattern(CACHE_PATTERNS.ALL_CITIES),
        deleteCachedPattern(CACHE_PATTERNS.CITY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_CITIES),
    ])
}

export async function invalidateStatesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_STATES),
        deleteCachedPattern(CACHE_PATTERNS.STATE_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_STATES),
        deleteCachedPattern(CACHE_PATTERNS.ALL_CITIES),
        deleteCachedPattern(CACHE_PATTERNS.CITY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_CITIES),
    ])
}

export async function invalidateCitiesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_CITIES),
        deleteCachedPattern(CACHE_PATTERNS.CITY_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_CITIES),
    ])
}

export async function invalidateGendersCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_GENDERS),
        deleteCachedPattern(CACHE_PATTERNS.GENDER_TRANSLATIONS),
        deleteCachedPattern(CACHE_PATTERNS.PAGINATED_GENDERS),
    ])
}

export async function invalidateSpokenLanguagesCache() {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.ALL_SPOKEN_LANGUAGES),
        deleteCachedPattern(CACHE_PATTERNS.SPOKEN_LANGUAGE_TRANSLATIONS),
    ])
}

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

export async function invalidateProgramCache(programId: number, academyId?: number) {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.PROGRAM_ALL(programId)),
        academyId ? deleteCachedData(CACHE_KEYS.ACADEMY_PROGRAMS(academyId)) : Promise.resolve(),
    ])
}

export async function invalidateProgramPackages(programId: number) {
    await deleteCachedData(CACHE_KEYS.PROGRAM_PACKAGES(programId))
}

export async function invalidateProgramDiscounts(programId: number) {
    await deleteCachedData(CACHE_KEYS.PROGRAM_DISCOUNTS(programId))
}

export async function invalidateCoachCache(coachId: number, academyId?: number) {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.COACH_ALL(coachId)),
        academyId ? deleteCachedData(CACHE_KEYS.ACADEMY_COACHES(academyId)) : Promise.resolve(),
    ])
}

export async function invalidateLocationCache(locationId: number, academyId?: number) {
    await Promise.all([
        deleteCachedPattern(CACHE_PATTERNS.LOCATION_ALL(locationId)),
        academyId ? deleteCachedData(CACHE_KEYS.ACADEMY_LOCATIONS(academyId)) : Promise.resolve(),
    ])
}

export async function invalidateAllSportRelatedData() {
    console.log('Invalidating and refreshing all sport-related cache data...')

    try {
        // Import the sports actions to get fresh data
        const { getAllSports } = await import('@/lib/actions/sports.actions')

        // Use smart invalidation that refreshes cache with fresh data
        await smartInvalidateSports(await getAllSports())

        // Also delete complex caches that are harder to refresh
        await Promise.all([
            deleteCachedPattern(CACHE_PATTERNS.PAGINATED_SPORTS),
            deleteCachedPattern('academy:*:sports'), // All academy sports lists
            deleteCachedPattern('academy:*:programs'), // All academy programs (since they reference sports)
        ])

        console.log('Sports cache invalidation and refresh completed successfully')
    } catch (error) {
        console.error('Error in invalidateAllSportRelatedData:', error)

        // Fallback to traditional deletion if refresh fails
        await Promise.all([
            deleteCachedPattern(CACHE_PATTERNS.ALL_SPORTS),
            deleteCachedPattern(CACHE_PATTERNS.SPORT_TRANSLATIONS),
            deleteCachedPattern(CACHE_PATTERNS.PAGINATED_SPORTS),
            deleteCachedPattern('academy:*:sports'),
            deleteCachedPattern('academy:*:programs'),
        ])
    }
}

export async function invalidateAllFacilityRelatedData() {
    await Promise.all([
        invalidateFacilitiesCache(),
        deleteCachedPattern('academy:*:facilities'),
        deleteCachedPattern('academy:*:locations'),
        deleteCachedPattern('location:*'),
    ])
}

export async function invalidateAllAcademyRelatedData(academyId: number) {
    await Promise.all([
        invalidateAcademyCache(academyId),
        deleteCachedPattern(`program:*`),
        deleteCachedPattern(`coach:*`),
        deleteCachedPattern(`location:*`),
    ])
}

export async function invalidateTranslationsCache(entityType: string, locale?: string) {
    if (locale) {
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