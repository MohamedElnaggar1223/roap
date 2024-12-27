'use client'

import { type ReactNode, createContext, useRef, useContext, useState, useEffect } from 'react'
import { useStore } from 'zustand'

import {
    type ProgramsStore,
    createProgramsStore,
    initProgramsStore,
} from '@/stores/programs-store'

export type ProgramsStoreApi = ReturnType<typeof createProgramsStore>

export const ProgramsStoreContext = createContext<ProgramsStoreApi | undefined>(
    undefined,
)

export interface ProgramsStoreProviderProps {
    children: ReactNode
}

export const ProgramsStoreProvider = ({
    children,
}: ProgramsStoreProviderProps) => {
    const storeRef = useRef<ProgramsStoreApi>()
    if (!storeRef.current) {
        storeRef.current = createProgramsStore()
    }

    return (
        <ProgramsStoreContext.Provider value={storeRef.current}>
            {children}
        </ProgramsStoreContext.Provider>
    )
}

export const useProgramsStore = <T,>(
    selector: (store: ProgramsStore) => T,
): T => {
    const programsStoreContext = useContext(ProgramsStoreContext)

    if (!programsStoreContext) {
        throw new Error(`useProgramsStore must be used within ProgramsStoreProvider`)
    }

    return useStore(programsStoreContext, selector)
}
