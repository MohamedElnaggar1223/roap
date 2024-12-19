import EditFacility from "@/components/admin/amenities/EditFacility"
import { getFacility } from "@/lib/actions/amenities.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function EditFacilityPage({ params }: Props) {
    const { id } = await params

    const facility = await getFacility(id)

    return <EditFacility facility={facility} facilityId={id} key={JSON.stringify(facility)} />
}