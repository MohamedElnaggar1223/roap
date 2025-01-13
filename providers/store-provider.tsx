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

export type StoreApi = {
    programsStore: ReturnType<typeof createProgramsStore>
    sportsStore: ReturnType<typeof createSportsStore>
    gendersStore: ReturnType<typeof createGendersStore>
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