'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'
import { StepId, useOnboarding } from './onboarding-provider'

interface SaveHandler {
    handleSave: () => Promise<{ success: boolean, error?: string }>
}

interface SaveContextType {
    registerSaveHandler: (stepId: StepId, handler: SaveHandler) => void
    unregisterSaveHandler: (stepId: StepId) => void
    save: () => Promise<{ success: boolean, error?: string }>
    isSaving: boolean
}

const SaveContext = createContext<SaveContextType | undefined>(undefined)

export function OnboardingSaveProvider({ children }: { children: React.ReactNode }) {
    const [saveHandlers] = useState<Map<StepId, SaveHandler>>(new Map())
    const [isSaving, setIsSaving] = useState(false)
    const { currentStep } = useOnboarding()

    const registerSaveHandler = useCallback((stepId: StepId, handler: SaveHandler) => {
        saveHandlers.set(stepId, handler)
    }, [saveHandlers])

    const unregisterSaveHandler = useCallback((stepId: StepId) => {
        saveHandlers.delete(stepId)
    }, [saveHandlers])

    const save = useCallback(async () => {
        const handler = saveHandlers.get(currentStep.id)

        if (!handler) {
            return { success: false, error: 'No save handler registered for this step' }
        }

        setIsSaving(true)
        try {
            const result = await handler.handleSave()
            return result
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An error occurred while saving'
            }
        } finally {
            setIsSaving(false)
        }
    }, [saveHandlers, currentStep.id])

    return (
        <SaveContext.Provider
            value={{
                registerSaveHandler,
                unregisterSaveHandler,
                save,
                isSaving
            }}
        >
            {children}
        </SaveContext.Provider>
    )
}

export const useSave = () => {
    const context = useContext(SaveContext)
    if (!context) {
        throw new Error('useSave must be used within an OnboardingSaveProvider')
    }
    return context
}