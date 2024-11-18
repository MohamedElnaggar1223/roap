import { getAcademicsSports } from "@/lib/actions/academics.actions"
import AddNewSport from "./add-new-sport"
import SportCard from "./sport-card"

export default async function SportsPage() {
    const sports = await getAcademicsSports()

    if (sports.error || !sports.data) return

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <div className='flex items-center justify-start w-full'>
                <AddNewSport sports={sports.data} />
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                {sports.data.map(sport => (
                    <SportCard key={sport.id} sport={sport} />
                ))}
            </div>
        </section>
    )
}