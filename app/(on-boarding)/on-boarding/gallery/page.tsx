// app/(on-boarding)/on-boarding/gallery/page.tsx
import { getAcademyDetails, getAllSports } from "@/lib/actions/academics.actions"
import { getImageUrl } from "@/lib/supabase-images"
// import OnboardingGalleryForm from "./gallery-form"
import { getCoaches } from "@/lib/actions/coaches.actions"
import { getLocations } from "@/lib/actions/locations.actions"
import { getPrograms } from "@/lib/actions/programs.actions"

export default async function GalleryStep() {
    // const [
    //     { data: academyDetails, error: academyDetailsError },
    //     { data: coaches, error: coachesError },
    //     { data: locations, error: locationsError },
    //     { data: programs, error: programsError },
    // ] = await Promise.all([
    //     getAcademyDetails(),
    //     getCoaches(),
    //     getLocations(),
    //     getPrograms(),
    // ])

    // if (academyDetailsError) return null

    // const [logo, gallery] = await Promise.all([
    //     getImageUrl(academyDetails?.logo!),
    //     Promise.all(academyDetails?.gallery?.map(async (image) => {
    //         const imageUrl = await getImageUrl(image)
    //         return imageUrl
    //     })!)
    // ])

    // const finalAcademyDetails = {
    //     ...academyDetails,
    //     coaches,
    //     locations,
    //     programs,
    //     logo,
    //     gallery: gallery as unknown as string[],
    // }

    // return (
    //     <section className='flex flex-col gap-4 bg-[#F1F2E9] rounded-b-[20px] p-8'>
    //         <OnboardingGalleryForm academyDetails={finalAcademyDetails!} />
    //     </section>
    // )
    return <></>
}