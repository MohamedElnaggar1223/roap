import { getCoaches } from '@/lib/actions/coaches.actions'
import { getAcademySports, getAllSports } from '@/lib/actions/academics.actions'
import { getAllSpokenLanguages } from '@/lib/actions/spoken-languages.actions'
import { getImageUrl } from '@/lib/supabase-images-server'
import CoachesClient from './coaches-client'

export default async function CoachesPage() {
    const { data: coaches, error } = await getCoaches()
    const sports = await getAllSports('sports')
    const languages = await getAllSpokenLanguages()
    const { data: academySports, error: sportsError } = await getAcademySports()

    if (error || sportsError) return null

    const finalCoaches = coaches?.length ? await Promise.all(coaches?.map(async (coach) => {
        const image = await getImageUrl(coach.image!)
        return {
            ...coach,
            image
        }
    })) : []

    return (
        <CoachesClient
            initialCoaches={finalCoaches || []}
            sports={sports || []}
            languages={languages || []}
            academySports={academySports}
        />
    )
}