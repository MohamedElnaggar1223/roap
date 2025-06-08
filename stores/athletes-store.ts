import { createStore } from 'zustand/vanilla'
import { toast } from '@/hooks/use-toast'
import { getAthletes, createAthlete, updateAthlete, deleteAthletes, type Booking, type Athlete as ServerAthlete } from '@/lib/actions/athletes.actions'

export interface Athlete {
    id: number
    userId: number
    email: string
    phoneNumber: string | null
    profileId: number | null
    certificate: string | null
    type: 'primary' | 'fellow'
    firstGuardianName: string | null
    firstGuardianRelationship: string | null
    secondGuardianName: string | null
    secondGuardianRelationship: string | null
    firstGuardianEmail: string | null
    secondGuardianEmail: string | null
    firstGuardianPhone: string | null
    secondGuardianPhone: string | null
    bookings: Booking[]
    profile?: {
        name: string
        gender: string | null
        birthday: string | null
        image: string | null
        country: string | null
        nationality: string | null
        city: string | null
        streetAddress: string | null
    }
    // Optimistic update fields
    pending?: boolean
    tempId?: string
}

export interface AthletesState {
    athletes: Athlete[]
    fetched: boolean
    pending: boolean
}

export interface AthletesActions {
    fetchAthletes: () => Promise<void>
    addAthlete: (data: {
        email: string
        phoneNumber?: string
        name: string
        gender: string
        birthday: Date
        image: string
        certificate: string
        type: 'primary' | 'fellow'
        firstGuardianName?: string
        firstGuardianRelationship?: string
        firstGuardianEmail?: string
        firstGuardianPhone?: string
        secondGuardianName?: string
        secondGuardianRelationship?: string
        secondGuardianEmail?: string
        secondGuardianPhone?: string
        country?: string
        nationality?: string
        city?: string
        streetAddress?: string
    }) => Promise<void>
    editAthlete: (id: number, data: {
        email: string
        phoneNumber?: string
        name: string
        gender: string
        birthday: Date
        image: string
        certificate: string
        type: 'primary' | 'fellow'
        firstGuardianName?: string
        firstGuardianRelationship?: string
        firstGuardianEmail?: string
        firstGuardianPhone?: string
        secondGuardianName?: string
        secondGuardianRelationship?: string
        secondGuardianEmail?: string
        secondGuardianPhone?: string
        country?: string
        nationality?: string
        city?: string
        streetAddress?: string
    }) => Promise<void>
    deleteAthletes: (ids: number[]) => Promise<void>
    setAthletes: (athletes: Athlete[]) => void
    addTempAthlete: (athlete: Athlete) => void
    removeTempAthletes: () => void
}

export type AthletesStore = AthletesState & AthletesActions

export const createAthletesStore = () => {
    return createStore<AthletesStore>((set, get) => ({
        athletes: [],
        fetched: false,
        pending: false,

        fetchAthletes: async () => {
            try {
                const { data, error } = await getAthletes()
                if (error) {
                    toast({
                        title: "Error",
                        description: error,
                        variant: "destructive",
                    })
                    return
                }

                // Transform server data to match store interface
                const transformedAthletes: Athlete[] = (data || []).map(athlete => ({
                    id: athlete.id,
                    userId: athlete.userId,
                    email: athlete.user?.email || '',
                    phoneNumber: athlete.user?.phoneNumber || null,
                    profileId: athlete.profileId,
                    certificate: athlete.certificate,
                    type: athlete.type,
                    firstGuardianName: athlete.firstGuardianName,
                    firstGuardianRelationship: athlete.firstGuardianRelationship,
                    secondGuardianName: athlete.secondGuardianName,
                    secondGuardianRelationship: athlete.secondGuardianRelationship,
                    firstGuardianEmail: athlete.firstGuardianEmail,
                    secondGuardianEmail: athlete.secondGuardianEmail,
                    firstGuardianPhone: athlete.firstGuardianPhone,
                    secondGuardianPhone: athlete.secondGuardianPhone,
                    bookings: athlete.bookings,
                    profile: {
                        ...athlete.profile,
                        name: athlete.profile?.name || ''
                    }
                }))

                set({ athletes: transformedAthletes, fetched: true })
            } catch (error) {
                console.error('Error fetching athletes:', error)
                toast({
                    title: "Error",
                    description: "Failed to fetch athletes",
                    variant: "destructive",
                })
            }
        },

        addAthlete: async (data) => {
            const tempId = `temp-${Date.now()}`

            // Optimistic update
            const optimisticAthlete: Athlete = {
                id: 0,
                userId: 0,
                email: data.email,
                phoneNumber: data.phoneNumber || null,
                profileId: null,
                certificate: data.certificate || null,
                type: data.type,
                firstGuardianName: data.firstGuardianName || null,
                firstGuardianRelationship: data.firstGuardianRelationship || null,
                secondGuardianName: data.secondGuardianName || null,
                secondGuardianRelationship: data.secondGuardianRelationship || null,
                firstGuardianEmail: data.firstGuardianEmail || null,
                secondGuardianEmail: data.secondGuardianEmail || null,
                firstGuardianPhone: data.firstGuardianPhone || null,
                secondGuardianPhone: data.secondGuardianPhone || null,
                bookings: [],
                profile: {
                    name: data.name,
                    gender: data.gender,
                    birthday: data.birthday.toISOString(),
                    image: data.image ? (data.image.startsWith('blob:') || data.image.startsWith('http') || data.image.startsWith('/') ? data.image : `/images/${data.image}`) : null,
                    country: data.country || null,
                    nationality: data.nationality || null,
                    city: data.city || null,
                    streetAddress: data.streetAddress || null,
                },
                tempId,
                pending: true
            }

            set(state => ({
                athletes: [...state.athletes, optimisticAthlete]
            }))

            try {
                const result = await createAthlete(data)

                if (result.error) {
                    // Remove optimistic item on error
                    set(state => ({
                        athletes: state.athletes.filter(athlete => athlete.tempId !== tempId)
                    }))

                    toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive",
                    })
                    return
                }

                // Replace optimistic item with real data
                set(state => ({
                    athletes: state.athletes.map(athlete =>
                        athlete.tempId === tempId
                            ? { ...optimisticAthlete, id: result.data?.id || 0, tempId: undefined, pending: false }
                            : athlete
                    )
                }))

                toast({
                    title: "Success",
                    description: "Athlete added successfully",
                })

            } catch (error) {
                // Remove optimistic item on error
                set(state => ({
                    athletes: state.athletes.filter(athlete => athlete.tempId !== tempId)
                }))

                console.error('Error adding athlete:', error)
                toast({
                    title: "Error",
                    description: "Failed to add athlete",
                    variant: "destructive",
                })
            }
        },

        editAthlete: async (id, data) => {
            const { athletes } = get()
            const originalAthlete = athletes.find(athlete => athlete.id === id)

            if (!originalAthlete) return

            // Optimistic update
            const optimisticAthlete = {
                ...originalAthlete,
                email: data.email,
                phoneNumber: data.phoneNumber || null,
                certificate: data.certificate || null,
                type: data.type,
                firstGuardianName: data.firstGuardianName || null,
                firstGuardianRelationship: data.firstGuardianRelationship || null,
                secondGuardianName: data.secondGuardianName || null,
                secondGuardianRelationship: data.secondGuardianRelationship || null,
                firstGuardianEmail: data.firstGuardianEmail || null,
                secondGuardianEmail: data.secondGuardianEmail || null,
                firstGuardianPhone: data.firstGuardianPhone || null,
                secondGuardianPhone: data.secondGuardianPhone || null,
                profile: {
                    ...originalAthlete.profile,
                    name: data.name,
                    gender: data.gender,
                    birthday: data.birthday.toISOString(),
                    image: data.image ? (data.image.startsWith('blob:') || data.image.startsWith('http') || data.image.startsWith('/') ? data.image : `/images/${data.image}`) : originalAthlete.profile?.image || null,
                    country: data.country || null,
                    nationality: data.nationality || null,
                    city: data.city || null,
                    streetAddress: data.streetAddress || null,
                },
                pending: true
            }

            set({
                athletes: athletes.map(athlete =>
                    athlete.id === id ? optimisticAthlete : athlete
                )
            })

            try {
                const result = await updateAthlete(id, data)

                if (result.error) {
                    // Rollback on error
                    set({
                        athletes: athletes.map(athlete =>
                            athlete.id === id ? { ...originalAthlete, pending: false } : athlete
                        )
                    })

                    toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive",
                    })
                    return
                }

                // Update with success state
                set({
                    athletes: athletes.map(athlete =>
                        athlete.id === id ? { ...optimisticAthlete, pending: false } : athlete
                    )
                })

                toast({
                    title: "Success",
                    description: "Athlete updated successfully",
                })

            } catch (error) {
                // Rollback on error
                set({
                    athletes: athletes.map(athlete =>
                        athlete.id === id ? { ...originalAthlete, pending: false } : athlete
                    )
                })

                console.error('Error updating athlete:', error)
                toast({
                    title: "Error",
                    description: "Failed to update athlete",
                    variant: "destructive",
                })
            }
        },

        deleteAthletes: async (ids) => {
            const { athletes } = get()
            const originalAthletes = athletes

            // Optimistic update - mark as pending
            set({
                athletes: athletes.map(athlete =>
                    ids.includes(athlete.id)
                        ? { ...athlete, pending: true }
                        : athlete
                )
            })

            try {
                const result = await deleteAthletes(ids)

                if (result.error) {
                    // Rollback on error
                    set({
                        athletes: originalAthletes.map(athlete =>
                            ids.includes(athlete.id)
                                ? { ...athlete, pending: false }
                                : athlete
                        )
                    })

                    toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive",
                    })
                    return
                }

                // Remove deleted items
                set({
                    athletes: athletes.filter(athlete => !ids.includes(athlete.id))
                })

                toast({
                    title: "Success",
                    description: `${ids.length} athlete(s) deleted successfully`,
                })

            } catch (error) {
                // Rollback on error
                set({
                    athletes: originalAthletes.map(athlete =>
                        ids.includes(athlete.id)
                            ? { ...athlete, pending: false }
                            : athlete
                    )
                })

                console.error('Error deleting athletes:', error)
                toast({
                    title: "Error",
                    description: "Failed to delete athletes",
                    variant: "destructive",
                })
            }
        },

        setAthletes: (athletes) => {
            set({ athletes, fetched: true })
        },

        addTempAthlete: (athlete) => {
            set(state => ({
                athletes: [...state.athletes, athlete]
            }))
        },

        removeTempAthletes: () => {
            set(state => ({
                athletes: state.athletes.filter(athlete => !athlete.tempId)
            }))
        }
    }))
} 