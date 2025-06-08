'use client'

import { type ReactNode, createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'

import {
    type ProgramsStore,
    createProgramsStore,
} from '@/stores/programs-store'

import {
    type SportsStore,
    createSportsStore,
} from '@/stores/sports-store'
import { type GendersStore, createGendersStore } from '@/stores/genders-store'
import {
    type LocationsStore,
    createLocationsStore,
} from '@/stores/locations-store'
import {
    type CoachesStore,
    createCoachesStore,
} from '@/stores/coaches-store'
import {
    type AssessmentsStore,
    createAssessmentsStore,
} from '@/stores/assessments-store'
import {
    type AthletesStore,
    createAthletesStore,
} from '@/stores/athletes-store'
import { usePromoCodesStore } from '@/stores/promo-codes-store'

export type StoreApi = {
    programsStore: ReturnType<typeof createProgramsStore>
    sportsStore: ReturnType<typeof createSportsStore>
    gendersStore: ReturnType<typeof createGendersStore>
    locationsStore: ReturnType<typeof createLocationsStore>
    coachesStore: ReturnType<typeof createCoachesStore>
    assessmentsStore: ReturnType<typeof createAssessmentsStore>
    athletesStore: ReturnType<typeof createAthletesStore>
}

export const StoreContext = createContext<StoreApi | undefined>(undefined)

export interface StoreProviderProps {
    children: ReactNode
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const storeRef = useRef<StoreApi>()

    if (!storeRef.current) {
        storeRef.current = {
            programsStore: createProgramsStore(),
            sportsStore: createSportsStore(),
            gendersStore: createGendersStore(),
            locationsStore: createLocationsStore(),
            coachesStore: createCoachesStore(),
            assessmentsStore: createAssessmentsStore(),
            athletesStore: createAthletesStore(),
        }
    }

    return (
        <StoreContext.Provider value={storeRef.current}>
            {children}
        </StoreContext.Provider>
    )
}

export const useProgramsStore = <T,>(
    selector: (store: ProgramsStore) => T
): T => {
    const storeContext = useContext(StoreContext)

    if (!storeContext) {
        throw new Error(`useProgramsStore must be used within StoreProvider`)
    }

    return useStore(storeContext.programsStore, selector)
}

export const useSportsStore = <T,>(
    selector: (store: SportsStore) => T
): T => {
    const storeContext = useContext(StoreContext)

    if (!storeContext) {
        throw new Error(`useSportsStore must be used within StoreProvider`)
    }

    return useStore(storeContext.sportsStore, selector)
}

export const useGendersStore = <T,>(
    selector: (store: GendersStore) => T
): T => {
    const storeContext = useContext(StoreContext)

    if (!storeContext) {
        throw new Error(`useGendersStore must be used within StoreProvider`)
    }

    return useStore(storeContext.gendersStore, selector)
}

export const useLocationsStore = <T,>(
    selector: (store: LocationsStore) => T
): T => {
    const storeContext = useContext(StoreContext)

    if (!storeContext) {
        throw new Error(`useLocationsStore must be used within StoreProvider`)
    }

    return useStore(storeContext.locationsStore, selector)
}

export const useCoachesStore = <T,>(
    selector: (store: CoachesStore) => T
): T => {
    const storeContext = useContext(StoreContext)

    if (!storeContext) {
        throw new Error(`useCoachesStore must be used within StoreProvider`)
    }

    return useStore(storeContext.coachesStore, selector)
}

export const useAssessmentsStore = <T,>(
    selector: (store: AssessmentsStore) => T
): T => {
    const storeContext = useContext(StoreContext)

    if (!storeContext) {
        throw new Error(`useAssessmentsStore must be used within StoreProvider`)
    }

    return useStore(storeContext.assessmentsStore, selector)
}

export const useAthletesStore = <T,>(
    selector: (store: AthletesStore) => T
): T => {
    const storeContext = useContext(StoreContext)

    if (!storeContext) {
        throw new Error(`useAthletesStore must be used within StoreProvider`)
    }

    return useStore(storeContext.athletesStore, selector)
}

// Export the promo codes store hook directly since it uses a different pattern
export { usePromoCodesStore }