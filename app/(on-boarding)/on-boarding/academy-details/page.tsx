import { getAcademyDetails, getAllSports } from "@/lib/actions/academics.actions"
import { getImageUrl } from "@/lib/supabase-images"
import OnboardingAcademyDetailsForm from "./academy-details-form"
import { getLocations } from "@/lib/actions/locations.actions"
import { getCoaches } from "@/lib/actions/coaches.actions"
import { getPrograms } from "@/lib/actions/programs.actions"

export default async function AcademyDetailsStep() {
    const [
        { data: academyDetails, error: academyDetailsError },
        { data: coaches, error: coachesError },
        { data: locations, error: locationsError },
        { data: programs, error: programsError },
        sports
    ] = await Promise.all([
        getAcademyDetails(),
        getCoaches(),
        getLocations(),
        getPrograms(),
        getAllSports('sports')
    ])

    if (academyDetailsError) return null

    const [logo, gallery] = await Promise.all([
        getImageUrl(academyDetails?.logo!),
        Promise.all(academyDetails?.gallery?.map(async (image) => {
            const imageUrl = await getImageUrl(image)
            return imageUrl
        })!)
    ])

    const initialRequirements = {
        name: !!academyDetails?.name,
        description: !!academyDetails?.description,
        sports: !!(academyDetails?.sports?.length && academyDetails.sports.length > 0),
        logo: !!academyDetails?.logo,
        hasGallery: !!(academyDetails?.gallery?.length && academyDetails.gallery.length > 0),
        hasPolicy: !!academyDetails?.policy
    }

    const finalAcademyDetails = {
        ...academyDetails,
        locations,
        programs,
        coaches,
        sports: academyDetails?.sports.filter(s => !isNaN(s)) ?? [],
        logo,
        gallery: gallery as unknown as string[]
    }

    return (
        <section className='flex flex-col gap-4 bg-[#F1F2E9] rounded-b-[20px] p-8'>
            <OnboardingAcademyDetailsForm
                academyDetails={finalAcademyDetails!}
                sports={sports!}
                initialRequirements={initialRequirements}
            />
        </section>
    )
}