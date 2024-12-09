import { getAcademyDetails, getAllSports } from "@/lib/actions/academics.actions"
import { getImageUrl } from "@/lib/supabase-images"
import OnboardingAcademyDetailsForm from "./academy-details-form"

export default async function AcademyDetailsStep() {
    const { data: academyDetails, error } = await getAcademyDetails()
    const sports = await getAllSports('sports')

    if (error) return null

    const [logo] = await Promise.all([
        getImageUrl(academyDetails?.logo!)
    ])

    const initialRequirements = {
        name: !!academyDetails?.name,
        description: !!academyDetails?.description,
        sports: !!(academyDetails?.sports?.length && academyDetails.sports.length > 0),
        logo: !!academyDetails?.logo
    }

    const finalAcademyDetails = {
        ...academyDetails,
        sports: academyDetails?.sports.filter(s => !isNaN(s)) ?? [],
        logo
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