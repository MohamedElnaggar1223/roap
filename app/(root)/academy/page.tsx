import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query'
import AcademyDetails from "./academy-details"
import { Suspense } from "react"
import { AcademyFormLoading } from "./academy-details-loader"
import { getAcademyDetailsPage } from '@/lib/actions/academics.actions'
import { getQueryClient } from '../get-query-client'

function AcademyDetailsPage() {
    const queryClient = getQueryClient()

    queryClient.prefetchQuery({
        queryKey: ['academyDetails'],
        queryFn: getAcademyDetailsPage,
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <section className='flex flex-col gap-4 bg-[#F1F2E9] rounded-t-[20px] pt-8 px-5 mx-4 flex-1'>
                {/* <AcademyDetails academyDetails={finalAcademyDetails!} sports={sports!} key={JSON.stringify(finalAcademyDetails)} /> */}
                <AcademyDetails />
            </section>
        </HydrationBoundary>
    )
}

export default function AcademyDetailsPageLoader() {
    return (
        <Suspense fallback={<AcademyFormLoading />}>
            <AcademyDetailsPage />
        </Suspense>
    )
}