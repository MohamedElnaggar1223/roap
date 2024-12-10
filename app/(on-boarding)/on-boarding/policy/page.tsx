import { getAcademyDetails } from "@/lib/actions/academics.actions"
import OnboardingPolicyForm from "./policy-form"
import { getImageUrl } from "@/lib/supabase-images"
import { getCoaches } from "@/lib/actions/coaches.actions"
import { getLocations } from "@/lib/actions/locations.actions"
import { getPrograms } from "@/lib/actions/programs.actions"
import { error } from "console"

export default async function PolicyStep() {
    const [
        { data: academyDetails, error: academyDetailsError },
        { data: coaches, error: coachesError },
        { data: locations, error: locationsError },
        { data: programs, error: programsError },
    ] = await Promise.all([
        getAcademyDetails(),
        getCoaches(),
        getLocations(),
        getPrograms(),
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
        logo,
        coaches,
        locations,
        programs,
        gallery: gallery as unknown as string[]
    }

    return (
        <section className='flex flex-col gap-4 bg-[#F1F2E9] rounded-b-[20px] p-8'>
            <OnboardingPolicyForm academyDetails={finalAcademyDetails!} />
        </section>
    )
}