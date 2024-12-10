import { getAcademyDetails, getAllSports } from "@/lib/actions/academics.actions"
import { getImageUrl } from "@/lib/supabase-images"
import Image from "next/image"
import AcademyDetails from "./academy-details"

export default async function AcademyDetailsPage() {
    const { data: academyDetails, error } = await getAcademyDetails()
    const sports = await getAllSports('sports')

    if (error) return null

    const [gallery, logo] = await Promise.all([
        Promise.all(academyDetails?.gallery?.map(async (image) => {
            console.log(image)
            const imageUrl = await getImageUrl(image)
            return imageUrl
        })!),
        getImageUrl(academyDetails?.logo!)
    ])

    const finalAcademyDetails = {
        ...academyDetails,
        gallery: gallery as unknown as string[],
        logo
    }

    return (
        <section className='flex flex-col gap-4 bg-[#F1F2E9] rounded-t-[20px] pt-8 px-5 mx-4 flex-1'>
            <AcademyDetails academyDetails={finalAcademyDetails!} sports={sports!} />
        </section>
    )
}