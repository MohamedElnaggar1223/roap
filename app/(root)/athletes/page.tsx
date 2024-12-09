import { getAthletes } from '@/lib/actions/athletes.actions'
import { AthletesDataTable } from './athletes-table'
import { getImageUrl } from '@/lib/supabase-images'

export default async function AthletesPage() {
    const { data: athletes, error } = await getAthletes()

    console.log(athletes, error)

    if (error) return null

    const finalAthletes = athletes?.length ? await Promise.all(athletes?.map(async (athlete) => {
        const image = athlete.profile?.image ? await getImageUrl(athlete.profile.image) : null
        const certificate = athlete.certificate ? await getImageUrl(athlete.certificate) : null
        return {
            id: athlete.id,
            userId: athlete.userId,
            profileId: athlete.profileId,
            email: athlete?.user?.email ?? '',
            phoneNumber: athlete?.user?.phoneNumber ?? '',
            certificate,
            type: athlete.type ?? 'primary',
            firstGuardianName: athlete.firstGuardianName,
            firstGuardianRelationship: athlete.firstGuardianRelationship,
            secondGuardianName: athlete.secondGuardianName,
            secondGuardianRelationship: athlete.secondGuardianRelationship,
            bookings: athlete.bookings,
            profile: {
                ...athlete.profile,
                name: athlete.profile?.name ?? '',
                gender: athlete.profile?.gender ?? '',
                birthday: athlete.profile?.birthday ?? '',
                image
            },
        }
    })) : []

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <AthletesDataTable
                data={finalAthletes!}
                key={JSON.stringify(athletes)}
            />
        </section>
    )
}