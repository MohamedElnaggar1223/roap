import { getCoaches } from '@/lib/actions/coaches.actions'
import { CoachesDataTable } from './coaches-table'
import { getAllSports } from '@/lib/actions/academics.actions'
import { getAllSpokenLanguages } from '@/lib/actions/spoken-languages.actions'
import { getImageUrl } from '@/lib/supabase-images'

export default async function CoachesPage() {
    const { data: coaches, error } = await getCoaches()
    const sports = await getAllSports('sports')
    const languages = await getAllSpokenLanguages()

    if (error) return null

    const finalCoaches = coaches?.length ? await Promise.all(coaches?.map(async (coach) => {
        const image = await getImageUrl(coach.image!)
        return {
            ...coach,
            image
        }
    })) : []

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <CoachesDataTable
                data={finalCoaches!}
                sports={sports!}
                languages={languages!}
                key={JSON.stringify(coaches)}
            />
        </section>
    )
}