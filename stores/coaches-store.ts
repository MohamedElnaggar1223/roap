import { createStore } from 'zustand/vanilla'
import { createCoach, updateCoach, deleteCoaches, getCoaches } from '@/lib/actions/coaches.actions'

export type Coach = {
    id: number
    name: string
    title: string | null
    image: string | null
    bio: string | null
    gender: string | null
    dateOfBirth: string | null
    privateSessionPercentage: string | null
    sports: number[]
    languages: number[]
    packages: number[]
    createdAt: string | null
    pending?: boolean
    tempId?: number
}

export type CoachesState = {
    fetched: boolean
    coaches: Coach[]
}

export type CoachesActions = {
    fetchCoaches: () => Promise<void>
    addCoach: (coachData: Omit<Coach, 'id' | 'createdAt' | 'packages'>, mutate?: () => void) => Promise<{ error: string | null, field: string | null }>
    editCoach: (coach: Coach, mutate?: () => void) => Promise<{ error: string | null, field: string | null }>
    deleteCoaches: (ids: number[]) => Promise<{ error: string | null }>
    addTempCoach: (coach: Coach) => void
    removeTempCoaches: () => void
    setCoaches: (coaches: Coach[]) => void
}

export type CoachesStore = CoachesState & CoachesActions

const defaultInitState: CoachesState = {
    fetched: false,
    coaches: []
}

export const initCoachesStore = async (): Promise<CoachesState> => {
    return defaultInitState
}

export const createCoachesStore = (initialState: CoachesState = defaultInitState) => {
    return createStore<CoachesStore>()((set, get) => ({
        ...initialState,

        fetchCoaches: async () => {
            try {
                const result = await getCoaches()
                if (result.error) {
                    console.error('Failed to fetch coaches:', result.error)
                    return
                }

                set((state) => ({
                    ...state,
                    coaches: result.data || [],
                    fetched: true
                }))
            } catch (error) {
                console.error('Error fetching coaches:', error)
                set((state) => ({
                    ...state,
                    fetched: true // Still set fetched to prevent infinite loops
                }))
            }
        },

        setCoaches: (coaches: Coach[]) => {
            set((state) => ({
                ...state,
                coaches,
                fetched: true
            }))
        },

        addCoach: async (coachData, mutate) => {
            const tempId = Date.now()
            const tempCoach: Coach = {
                ...coachData,
                id: tempId,
                packages: [],
                createdAt: new Date().toISOString(),
                pending: true,
                tempId
            }

            // Optimistic update
            set((state) => ({
                ...state,
                coaches: [...state.coaches, tempCoach]
            }))

            try {
                const result = await createCoach({
                    name: coachData.name,
                    title: coachData.title || '',
                    image: coachData.image || '',
                    bio: coachData.bio || '',
                    gender: coachData.gender || '',
                    dateOfBirth: coachData.dateOfBirth ? new Date(coachData.dateOfBirth) : undefined,
                    privateSessionPercentage: coachData.privateSessionPercentage?.replaceAll('%', '') || '',
                    sports: coachData.sports,
                    languages: coachData.languages
                })

                if (result.error) {
                    // Rollback optimistic update
                    set((state) => ({
                        ...state,
                        coaches: state.coaches.filter(c => c.tempId !== tempId)
                    }))
                    return { error: result.error, field: result.field || null }
                }

                // Replace temp coach with real data
                if (result.data && typeof result.data === 'object' && 'id' in result.data) {
                    const coachId = (result.data as { id: number }).id
                    set((state) => ({
                        ...state,
                        coaches: state.coaches.map(c =>
                            c.tempId === tempId
                                ? {
                                    ...coachData,
                                    id: coachId,
                                    packages: [],
                                    createdAt: new Date().toISOString(),
                                    pending: false,
                                    tempId: undefined
                                }
                                : c
                        )
                    }))
                }

                if (mutate) mutate()
                return { error: null, field: null }
            } catch (error) {
                // Rollback on error
                set((state) => ({
                    ...state,
                    coaches: state.coaches.filter(c => c.tempId !== tempId)
                }))
                return { error: 'Failed to create coach', field: null }
            }
        },

        editCoach: async (coach, mutate) => {
            const originalCoach = get().coaches.find(c => c.id === coach.id)
            if (!originalCoach) {
                return { error: 'Coach not found', field: null }
            }

            // Optimistic update
            set((state) => ({
                ...state,
                coaches: state.coaches.map(c =>
                    c.id === coach.id
                        ? { ...coach, pending: true }
                        : c
                )
            }))

            try {
                const result = await updateCoach(coach.id, {
                    name: coach.name,
                    title: coach.title || '',
                    image: coach.image || '',
                    bio: coach.bio || '',
                    gender: coach.gender || '',
                    dateOfBirth: coach.dateOfBirth ? new Date(coach.dateOfBirth) : undefined,
                    privateSessionPercentage: coach.privateSessionPercentage?.replaceAll('%', '') || '',
                    sports: coach.sports,
                    languages: coach.languages
                })

                if (result.error) {
                    // Rollback optimistic update
                    set((state) => ({
                        ...state,
                        coaches: state.coaches.map(c =>
                            c.id === coach.id ? originalCoach : c
                        )
                    }))
                    return { error: result.error, field: result.field || null }
                }

                // Update with success
                set((state) => ({
                    ...state,
                    coaches: state.coaches.map(c =>
                        c.id === coach.id
                            ? { ...coach, pending: false }
                            : c
                    )
                }))

                if (mutate) mutate()
                return { error: null, field: null }
            } catch (error) {
                // Rollback on error
                set((state) => ({
                    ...state,
                    coaches: state.coaches.map(c =>
                        c.id === coach.id ? originalCoach : c
                    )
                }))
                return { error: 'Failed to update coach', field: null }
            }
        },

        deleteCoaches: async (ids) => {
            const originalCoaches = get().coaches.filter(c => ids.includes(c.id))

            // Optimistic update
            set((state) => ({
                ...state,
                coaches: state.coaches.filter(c => !ids.includes(c.id))
            }))

            try {
                const result = await deleteCoaches(ids)

                if (result.error) {
                    // Rollback optimistic update
                    set((state) => ({
                        ...state,
                        coaches: [...state.coaches, ...originalCoaches].sort((a, b) => a.id - b.id)
                    }))
                    return { error: result.error }
                }

                return { error: null }
            } catch (error) {
                // Rollback on error
                set((state) => ({
                    ...state,
                    coaches: [...state.coaches, ...originalCoaches].sort((a, b) => a.id - b.id)
                }))
                return { error: 'Failed to delete coaches' }
            }
        },

        addTempCoach: (coach) => {
            set((state) => ({
                ...state,
                coaches: [...state.coaches, coach]
            }))
        },

        removeTempCoaches: () => {
            set((state) => ({
                ...state,
                coaches: state.coaches.filter(c => !c.tempId)
            }))
        }
    }))
} 