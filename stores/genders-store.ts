import { getAllGenders } from "@/lib/actions/genders.actions";
import { createStore } from 'zustand/vanilla'

export type Gender = {
    id: number;
    name: string;
    locale: string;
}

export type GendersState = {
    fetched: boolean
    genders: Gender[]
}

export type GendersActions = {
    fetchGenders: () => void
}

export type GendersStore = GendersState & GendersActions

export const defaultInitState: GendersState = {
    fetched: false,
    genders: [],
}

export const initGendersStore = async (): Promise<GendersState> => {
    const data = await getAllGenders()
    return {
        fetched: true,
        genders: data || [],
    }
}

export const createGendersStore = (initialState: GendersState = defaultInitState) => {
    return createStore<GendersStore>()((set, get) => ({
        ...initialState,
        fetchGenders: async () => {
            const data = await getAllGenders()

            if (!data) return

            set({
                genders: data,
                fetched: true
            })
        },
    }))
}