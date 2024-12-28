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

export type StoreApi = {
    programsStore: ReturnType<typeof createProgramsStore>
    sportsStore: ReturnType<typeof createSportsStore>
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