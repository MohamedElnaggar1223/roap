import ViewState from "@/components/admin/states/ViewState"
import { getStateTranslations } from "@/lib/actions/states.actions"

type Params = Promise<{ id: string }>

type Props = {
    params: Params
}

export default async function ViewStatePage({ params }: Props) {
    const { id } = await params

    const stateTranslations = await getStateTranslations(id)

    return <ViewState stateTranslations={stateTranslations} stateId={id} key={JSON.stringify(stateTranslations)} />
}