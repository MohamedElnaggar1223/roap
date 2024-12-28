import { addSports as createSports, getAcademySportsStore, getAllSports } from '@/lib/actions/academics.actions';
import { createStore } from 'zustand/vanilla'

export type Sport = {
    id: number;
    image: string | null;
    name: string;
    locale: string;
}

export type SportsState = {
    fetched: boolean
    sports: Sport[]
    remainingSports: Sport[]
    remainingSportsFetched: boolean
}

export type SportsActions = {
    fetchSports: () => void
    addSports: (sports: number[]) => void
    deleteSports: (sport: Sport[]) => void
    fetchRemainingSports: () => void
}

export type SportsStore = SportsState & SportsActions

export const defaultInitState: SportsState = {
    fetched: false,
    sports: [],
    remainingSports: [],
    remainingSportsFetched: false,
}

export const initSportsStore = async (): Promise<SportsState> => {
    const data = await getAcademySportsStore()
    return {
        fetched: true,
        sports: data?.data || [],
        remainingSports: [],
        remainingSportsFetched: false,
    }
}

export const createSportsStore = (initialState: SportsState = defaultInitState) => {
    return createStore<SportsStore>()((set, get) => ({
        ...initialState,
        fetchSports: async () => {
            const data = await getAcademySportsStore()

            if (data?.error) return

            set({
                sports: data?.data,
                fetched: true
            })
        },
        fetchRemainingSports: async () => {
            const existingSports = get().sports

            const remainingSports = await getAllSports('sports')

            set({
                remainingSports: remainingSports?.filter(s => !existingSports.map(s => s.id).includes(s.id)),
                remainingSportsFetched: true
            })
        },
        addSports: async (sports: number[]) => {
            const remainingSports = get().remainingSports

            const oldSports = get().sports

            const addedSports = remainingSports.filter(s => sports.includes(s.id))
            const newRemainingSports = remainingSports.filter(s => !sports.includes(s.id))

            set({
                sports: [...oldSports, ...addedSports],
                remainingSports: newRemainingSports,
            })

            const result = await createSports(sports)

            if (result?.error) {
                set({
                    sports: oldSports,
                    remainingSports
                })

                return { error: result.error, field: result.field as any }
            }
        },
        deleteSports: (sports: Sport[]) => {
            set({
                sports: get().sports.filter(s => !sports.includes(s)),
                remainingSports: [...get().remainingSports, ...sports]
            })
        },
    }))
}