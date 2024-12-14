import { getAcademyDetails, getAllSports } from "@/lib/actions/academics.actions"
import { getImageUrl } from "@/lib/supabase-images"
import { getCoaches } from "@/lib/actions/coaches.actions"
import { getLocations } from "@/lib/actions/locations.actions"
import { getAssessments } from "@/lib/actions/assessments.actions"
import OnboardingAssessmentForm from "./assessment-form"
import { getAllSpokenLanguages } from "@/lib/actions/spoken-languages.actions"
import { getPrograms } from "@/lib/actions/programs.actions"

export default async function AssessmentStep() {
    const [
        { data: academyDetails, error: academyDetailsError },
        { data: coaches, error: coachesError },
        { data: locations, error: locationsError },
        { data: assessments, error: assessmentsError },
        { data: programs, error: programsError },
        sports,
        languages
    ] = await Promise.all([
        getAcademyDetails(),
        getCoaches(),
        getLocations(),
        getAssessments(),
        getPrograms(),
        getAllSports('sports'),
        getAllSpokenLanguages()
    ])

    if (academyDetailsError) return null

    const [logo, gallery] = await Promise.all([
        getImageUrl(academyDetails?.logo!),
        Promise.all(academyDetails?.gallery?.map(async (image) => {
            const imageUrl = await getImageUrl(image)
            return imageUrl
        })!)
    ])

    const coachesWithImages = await Promise.all(coaches?.map(async (coach) => {
        const image = await getImageUrl(coach.image!)
        return {
            ...coach,
            image
        }
    }) ?? [])

    const finalAcademyDetails = {
        ...academyDetails,
        coaches: coachesWithImages,
        locations,
        programs,
        assessments,
        logo,
        gallery: gallery as unknown as string[],
    }

    return (
        <section className='flex flex-col gap-4 bg-[#F1F2E9] rounded-b-[20px] p-8'>
            <OnboardingAssessmentForm
                academyDetails={finalAcademyDetails!}
                sports={sports!}
                languages={languages!}
                key={JSON.stringify(finalAcademyDetails)}
            />
        </section>
    )
}