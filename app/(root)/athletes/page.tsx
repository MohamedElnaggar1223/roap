import { getAthletes } from '@/lib/actions/athletes.actions'
import { AthletesClient } from './athletes-client'
import { getImageUrl } from '@/lib/supabase-images-server'
import { checkAcademyStatus } from '@/lib/actions/check-academy-status'
import { redirect } from 'next/navigation'
import type { Athlete } from '@/stores/athletes-store'

export default async function AthletesPage() {
    const status = await checkAcademyStatus()

    if (!status.isOnboarded) {
        return redirect('/academy')
    }

    const { data: athletes, error } = await getAthletes()

    console.log(athletes, error)

    if (error) return null

    const finalAthletes: Athlete[] = athletes?.length ? await Promise.all(athletes?.map(async (athlete) => {
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
            firstGuardianEmail: athlete.firstGuardianEmail,
            firstGuardianRelationship: athlete.firstGuardianRelationship,
            secondGuardianName: athlete.secondGuardianName,
            secondGuardianEmail: athlete.secondGuardianEmail,
            secondGuardianRelationship: athlete.secondGuardianRelationship,
            firstGuardianPhone: athlete.firstGuardianPhone,
            secondGuardianPhone: athlete.secondGuardianPhone,
            bookings: athlete.bookings,
            profile: {
                name: athlete.profile?.name ?? '',
                gender: athlete.profile?.gender ?? '',
                birthday: athlete.profile?.birthday ?? '',
                image,
                country: athlete.profile?.country ?? null,
                nationality: athlete.profile?.nationality ?? null,
                city: athlete.profile?.city ?? null,
                streetAddress: athlete.profile?.streetAddress ?? null,
            },
        }
    })) : []

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <AthletesClient
                initialAthletes={finalAthletes}
            />
        </section>
    )
}