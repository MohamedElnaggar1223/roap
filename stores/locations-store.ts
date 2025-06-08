import { createStore } from 'zustand/vanilla'
import { createLocation, updateLocation, deleteLocations, toggleBranchVisibility, getLocations } from '@/lib/actions/locations.actions'

export type Location = {
    id: number
    name: string
    nameInGoogleMap: string | null
    url: string | null
    isDefault: boolean
    rate: number | null
    hidden: boolean
    createdAt: string | null
    sports: string[]
    facilities: number[]
    amenities: string[]
    locale: string
    pending?: boolean
    tempId?: number
}

export type LocationsState = {
    fetched: boolean
    locations: Location[]
}

export type LocationsActions = {
    fetchLocations: () => Promise<void>
    addLocation: (locationData: Omit<Location, 'id' | 'createdAt' | 'rate' | 'hidden'>, mutate?: () => void) => Promise<{ error: string | null, field: string | null }>
    editLocation: (location: Location, mutate?: () => void) => Promise<{ error: string | null, field: string | null }>
    deleteLocations: (ids: number[]) => Promise<{ error: string | null }>
    toggleLocationVisibility: (locationId: number) => Promise<{ error: string | null }>
    addTempLocation: (location: Location) => void
    removeTempLocations: () => void
    setLocations: (locations: Location[]) => void
}

export type LocationsStore = LocationsState & LocationsActions

const defaultInitState: LocationsState = {
    fetched: false,
    locations: []
}

export const initLocationsStore = async (): Promise<LocationsState> => {
    return defaultInitState
}

export const createLocationsStore = (initialState: LocationsState = defaultInitState) => {
    return createStore<LocationsStore>()((set, get) => ({
        ...initialState,

        fetchLocations: async () => {
            try {
                const result = await getLocations()
                if (result.error) {
                    console.error('Failed to fetch locations:', result.error)
                    return
                }

                set((state) => ({
                    ...state,
                    locations: result.data || [],
                    fetched: true
                }))
            } catch (error) {
                console.error('Error fetching locations:', error)
                set((state) => ({
                    ...state,
                    fetched: true // Still set fetched to prevent infinite loops
                }))
            }
        },

        setLocations: (locations: Location[]) => {
            set((state) => ({
                ...state,
                locations,
                fetched: true
            }))
        },

        addLocation: async (locationData, mutate) => {
            const tempId = Date.now()
            const tempLocation: Location = {
                ...locationData,
                id: tempId,
                rate: null,
                hidden: false,
                createdAt: new Date().toISOString(),
                pending: true,
                tempId
            }

            // Optimistic update
            set((state) => ({
                ...state,
                locations: [...state.locations, tempLocation]
            }))

            try {
                const result = await createLocation({
                    name: locationData.name,
                    nameInGoogleMap: locationData.nameInGoogleMap || '',
                    url: locationData.url || '',
                    isDefault: locationData.isDefault,
                    sports: locationData.sports.map(s => parseInt(s)),
                    facilities: locationData.facilities
                })

                if (result.error) {
                    // Rollback optimistic update
                    set((state) => ({
                        ...state,
                        locations: state.locations.filter(l => l.tempId !== tempId)
                    }))
                    return { error: result.error, field: result.field || null }
                }

                // Replace temp location with real data
                if (result.data && typeof result.data === 'object' && 'id' in result.data) {
                    const locationId = (result.data as { id: number }).id
                    set((state) => ({
                        ...state,
                        locations: state.locations.map(l =>
                            l.tempId === tempId
                                ? {
                                    ...locationData,
                                    id: locationId,
                                    rate: null,
                                    hidden: false,
                                    createdAt: new Date().toISOString(),
                                    pending: false,
                                    tempId: undefined
                                }
                                : l
                        )
                    }))
                }

                if (mutate) mutate()
                return { error: null, field: null }
            } catch (error) {
                // Rollback on error
                set((state) => ({
                    ...state,
                    locations: state.locations.filter(l => l.tempId !== tempId)
                }))
                return { error: 'Failed to create location', field: null }
            }
        },

        editLocation: async (location, mutate) => {
            const originalLocation = get().locations.find(l => l.id === location.id)
            if (!originalLocation) {
                return { error: 'Location not found', field: null }
            }

            // Optimistic update
            set((state) => ({
                ...state,
                locations: state.locations.map(l =>
                    l.id === location.id
                        ? { ...location, pending: true }
                        : l
                )
            }))

            try {
                const result = await updateLocation(location.id, {
                    name: location.name,
                    nameInGoogleMap: location.nameInGoogleMap || '',
                    url: location.url || '',
                    isDefault: location.isDefault,
                    sports: location.sports.map(s => parseInt(s)),
                    facilities: location.facilities
                })

                if (result.error) {
                    // Rollback optimistic update
                    set((state) => ({
                        ...state,
                        locations: state.locations.map(l =>
                            l.id === location.id ? originalLocation : l
                        )
                    }))
                    return { error: result.error, field: result.field || null }
                }

                // Update with success
                set((state) => ({
                    ...state,
                    locations: state.locations.map(l =>
                        l.id === location.id
                            ? { ...location, pending: false }
                            : l
                    )
                }))

                if (mutate) mutate()
                return { error: null, field: null }
            } catch (error) {
                // Rollback on error
                set((state) => ({
                    ...state,
                    locations: state.locations.map(l =>
                        l.id === location.id ? originalLocation : l
                    )
                }))
                return { error: 'Failed to update location', field: null }
            }
        },

        deleteLocations: async (ids) => {
            const originalLocations = get().locations.filter(l => ids.includes(l.id))

            // Optimistic update
            set((state) => ({
                ...state,
                locations: state.locations.filter(l => !ids.includes(l.id))
            }))

            try {
                const result = await deleteLocations(ids)

                if (result.error) {
                    // Rollback optimistic update
                    set((state) => ({
                        ...state,
                        locations: [...state.locations, ...originalLocations].sort((a, b) => a.id - b.id)
                    }))
                    return { error: result.error }
                }

                return { error: null }
            } catch (error) {
                // Rollback on error
                set((state) => ({
                    ...state,
                    locations: [...state.locations, ...originalLocations].sort((a, b) => a.id - b.id)
                }))
                return { error: 'Failed to delete locations' }
            }
        },

        toggleLocationVisibility: async (locationId) => {
            const originalLocation = get().locations.find(l => l.id === locationId)
            if (!originalLocation) {
                return { error: 'Location not found' }
            }

            // Optimistic update
            set((state) => ({
                ...state,
                locations: state.locations.map(l =>
                    l.id === locationId
                        ? { ...l, hidden: !l.hidden, pending: true }
                        : l
                )
            }))

            try {
                const result = await toggleBranchVisibility(locationId)

                if (result.error) {
                    // Rollback optimistic update
                    set((state) => ({
                        ...state,
                        locations: state.locations.map(l =>
                            l.id === locationId ? originalLocation : l
                        )
                    }))
                    return { error: result.error }
                }

                // Update with success
                set((state) => ({
                    ...state,
                    locations: state.locations.map(l =>
                        l.id === locationId
                            ? { ...l, pending: false }
                            : l
                    )
                }))

                return { error: null }
            } catch (error) {
                // Rollback on error
                set((state) => ({
                    ...state,
                    locations: state.locations.map(l =>
                        l.id === locationId ? originalLocation : l
                    )
                }))
                return { error: 'Failed to toggle location visibility' }
            }
        },

        addTempLocation: (location) => {
            set((state) => ({
                ...state,
                locations: [...state.locations, location]
            }))
        },

        removeTempLocations: () => {
            set((state) => ({
                ...state,
                locations: state.locations.filter(l => !l.tempId)
            }))
        }
    }))
} 