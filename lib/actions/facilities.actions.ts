'use server'
import { db } from '@/db'
import { facilities, facilityTranslations } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { withCache } from '@/lib/cache/wrapper'
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache/keys'

export const getAllFacilities = async (url: string | null) => {
    if (!url) return

    return await withCache(
        CACHE_KEYS.ALL_FACILITIES,
        async () => {
            return await db
                .select({
                    id: facilities.id,
                    name: sql<string>`t.name`,
                    locale: sql<string>`t.locale`,
                })
                .from(facilities)
                .innerJoin(
                    sql`(
                        SELECT ft.facility_id, ft.name, ft.locale
                        FROM ${facilityTranslations} ft
                        WHERE ft.locale = 'en'
                        UNION
                        SELECT ft2.facility_id, ft2.name, ft2.locale
                        FROM ${facilityTranslations} ft2
                        INNER JOIN (
                            SELECT facility_id, MIN(locale) as first_locale
                            FROM ${facilityTranslations}
                            WHERE facility_id NOT IN (
                                SELECT facility_id 
                                FROM ${facilityTranslations} 
                                WHERE locale = 'en'
                            )
                            GROUP BY facility_id
                        ) first_trans ON ft2.facility_id = first_trans.facility_id 
                        AND ft2.locale = first_trans.first_locale
                    ) t`,
                    sql`t.facility_id = ${facilities.id}`
                )
        },
        CACHE_TTL.STATIC_DATA
    )
}