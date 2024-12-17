import EditSport from "@/components/admin/sports/EditSport"
import { getSport } from "@/lib/actions/sports.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function EditSportPage({ params }: Props) {
    const { id } = await params

    const sport = await getSport(id)

    return <EditSport sport={sport} sportId={id} key={JSON.stringify(sport)} />
}