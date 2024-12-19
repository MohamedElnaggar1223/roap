import EditGender from "@/components/admin/genders/EditGender"
import { getGender } from "@/lib/actions/genders.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function EditGenderPage({ params }: Props) {
    const { id } = await params

    const gender = await getGender(id)

    return <EditGender gender={gender} genderId={id} key={JSON.stringify(gender)} />
}