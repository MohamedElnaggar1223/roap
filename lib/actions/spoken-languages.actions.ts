'use server'

import { db } from '@/db'
import { spokenLanguages, spokenLanguageTranslations } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function getAllSpokenLanguages() {
    try {
        const languages = await db
            .select({
                id: spokenLanguages.id,
                name: sql<string>`t.name`,
                locale: sql<string>`t.locale`,
            })
            .from(spokenLanguages)
            .innerJoin(
                sql`(
                    SELECT slt.spoken_language_id, slt.name, slt.locale
                    FROM ${spokenLanguageTranslations} slt
                    WHERE slt.locale = 'en'
                    UNION
                    SELECT slt2.spoken_language_id, slt2.name, slt2.locale
                    FROM ${spokenLanguageTranslations} slt2
                    INNER JOIN (
                        SELECT spoken_language_id, MIN(locale) as first_locale
                        FROM ${spokenLanguageTranslations}
                        WHERE spoken_language_id NOT IN (
                            SELECT spoken_language_id 
                            FROM ${spokenLanguageTranslations} 
                            WHERE locale = 'en'
                        )
                        GROUP BY spoken_language_id
                    ) first_trans ON slt2.spoken_language_id = first_trans.spoken_language_id 
                    AND slt2.locale = first_trans.first_locale
                ) t`,
                sql`t.spoken_language_id = ${spokenLanguages.id}`
            )

        return languages

    } catch (error) {
        console.error('Error fetching spoken languages:', error)
        return null
    }
}