import { getAcademyDetails, getAllSports } from "@/lib/actions/academics.actions"
import { getImageUrl } from "@/lib/supabase-images"
import { getCoaches } from "@/lib/actions/coaches.actions"
import { getLocations } from "@/lib/actions/locations.actions"
import { getPrograms } from "@/lib/actions/programs.actions"
import { getAllFacilities } from "@/lib/actions/facilities.actions"
import OnboardingLocationForm from "./location-form"

export default async function LocationStep() {
    const [
        { data: academyDetails, error: academyDetailsError },
        { data: coaches, error: coachesError },
        { data: locations, error: locationsError },
        { data: programs, error: programsError },
        sports,
        facilities
    ] = await Promise.all([
        getAcademyDetails(),
        getCoaches(),
        getLocations(),
        getPrograms(),
        getAllSports('sports'),
        getAllFacilities('facilities')
    ])

    if (academyDetailsError) return null

    const [logo, gallery] = await Promise.all([
        getImageUrl(academyDetails?.logo!),
        Promise.all(academyDetails?.gallery?.map(async (image) => {
            const imageUrl = await getImageUrl(image)
            return imageUrl
        })!)
    ])

    const finalAcademyDetails = {
        ...academyDetails,
        locations,
        programs,
        coaches,
        logo,
        gallery: gallery as unknown as string[],
    }

    return (
        <section className='flex flex-col gap-4 bg-[#F1F2E9] rounded-b-[20px] p-8'>
            <OnboardingLocationForm
                academyDetails={finalAcademyDetails!}
                sports={sports!}
                facilities={facilities!}
                key={JSON.stringify(finalAcademyDetails)}
            />
        </section>
    )
}