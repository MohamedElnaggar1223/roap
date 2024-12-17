'use client'

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { getAcademyDetailsClient } from '@/lib/actions/academics.actions'
import { academyOnBoarded } from '@/lib/actions/onboarding.actions'

export type StepId = 'academy-details' | 'location' | 'coach' | 'program' | 'assessment'

interface Step {
    id: StepId
    title: string
    path: string
    isCompleted: boolean
}

interface StepRequirements {
    'academy-details': {
        name: boolean
        description: boolean
        sports: boolean
        logo: boolean
        hasGallery: boolean
        hasPolicy: boolean
    }
    'location': {
        name: boolean
        url: boolean
        sports: boolean
        facilities: boolean
    }
    'coach': {
        name: boolean
        title: boolean
        bio: boolean
        gender: boolean
        sports: boolean
        languages: boolean
    }
    'program': {
        name: boolean
        description: boolean
        branchId: boolean
        sportId: boolean
        startDateOfBirth: boolean
        endDateOfBirth: boolean
        type: boolean
        packages: boolean
        numberOfSeats: boolean
        gender: boolean
        color: boolean
    }
    'assessment': {
        description: boolean
        coaches: boolean
        packages: boolean
        branchId: boolean
        sportId: boolean
        startDateOfBirth: boolean
        endDateOfBirth: boolean
        gender: boolean
        numberOfSeats: boolean
    }
}

interface OnboardingContextType {
    currentStep: Step
    steps: Step[]
    completedSteps: number
    totalSteps: number
    requirements: StepRequirements
    isStepComplete: (stepId: StepId) => boolean
    markStepAsComplete: (stepId: StepId) => void
    goToNextStep: () => void
    goToPreviousStep: () => void
    updateRequirements: (stepId: StepId, requirements: Partial<StepRequirements[StepId]>) => void
    mutate: () => void
    onboarded: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const STEPS: Step[] = [
    {
        id: 'academy-details',
        title: 'Academy Details',
        path: '/on-boarding/academy-details',
        isCompleted: false
    },
    {
        id: 'location',
        title: 'Location',
        path: '/on-boarding/location',
        isCompleted: false
    },
    {
        id: 'coach',
        title: 'Coach',
        path: '/on-boarding/coach',
        isCompleted: false
    },
    {
        id: 'program',
        title: 'Program',
        path: '/on-boarding/program',
        isCompleted: false
    },
    {
        id: 'assessment',
        title: 'Assessment',
        path: '/on-boarding/assessment',
        isCompleted: false
    },
]

export function OnboardingProvider({ children, onboarded }: { children: React.ReactNode, onboarded: boolean }) {
    const router = useRouter()
    const pathname = usePathname()
    const [steps, setSteps] = useState<Step[]>(STEPS)
    const { data: finalAcademyDetails, mutate } = useSWR(!onboarded ? 'OnBoardingDetails' : null, getAcademyDetailsClient)
    const [requirements, setRequirements] = useState<StepRequirements>({
        'academy-details': {
            name: false,
            description: false,
            sports: false,
            logo: false,
            hasGallery: false,
            hasPolicy: false
        },
        'location': {
            name: false,
            url: false,
            sports: false,
            facilities: false
        },
        'coach': {
            name: false,
            title: false,
            bio: false,
            gender: false,
            sports: false,
            languages: false
        },
        'program': {
            name: false,
            description: false,
            branchId: false,
            sportId: false,
            startDateOfBirth: false,
            endDateOfBirth: false,
            type: false,
            packages: false,
            numberOfSeats: false,
            gender: false,
            color: false,
        },
        'assessment': {
            description: false,
            coaches: false,
            packages: false,
            branchId: false,
            sportId: false,
            startDateOfBirth: false,
            endDateOfBirth: false,
            gender: false,
            numberOfSeats: false,
        },
    })

    const currentStep = steps.find(step => step.path === pathname) || steps[0]
    const currentStepIndex = steps.findIndex(step => step.id === currentStep.id)
    const completedSteps = steps.filter(step => step.isCompleted).length

    const isStepComplete = (stepId: StepId) => {
        const stepRequirements = requirements[stepId]
        console.log("Step Requirements: ", stepRequirements)
        if (!stepRequirements) return false

        const allRequirementsMet = Object.values(stepRequirements).every(Boolean)

        if (allRequirementsMet && !steps.find(s => s.id === stepId)?.isCompleted) {
            setSteps(prevSteps =>
                prevSteps.map(step =>
                    step.id === stepId ? { ...step, isCompleted: true } : step
                )
            )
        } else if (!allRequirementsMet && steps.find(s => s.id === stepId)?.isCompleted) {
            setSteps(prevSteps =>
                prevSteps.map(step =>
                    step.id === stepId ? { ...step, isCompleted: false } : step
                )
            )
        }

        return allRequirementsMet
    }

    useEffect(() => {
        console.log({
            name: !!finalAcademyDetails?.name,
            description: !!finalAcademyDetails?.description,
            sports: !!(finalAcademyDetails?.sports?.length && finalAcademyDetails.sports.length > 0),
            logo: !!finalAcademyDetails?.logo,
            hasGallery: !!(finalAcademyDetails?.gallery?.length && finalAcademyDetails.gallery.length > 0),
            hasPolicy: finalAcademyDetails?.policy!?.length > 0
        })
        updateRequirements('academy-details', {
            name: !!finalAcademyDetails?.name,
            description: !!finalAcademyDetails?.description,
            sports: !!(finalAcademyDetails?.sports?.length && finalAcademyDetails.sports.length > 0),
            logo: !!finalAcademyDetails?.logo,
            hasGallery: !!(finalAcademyDetails?.gallery?.length && finalAcademyDetails.gallery.length > 0),
            hasPolicy: finalAcademyDetails?.policy!?.length > 0
        })
        // updateRequirements('gallery', { hasGallery: (finalAcademyDetails?.gallery ?? [])?.length > 0 })
        // updateRequirements('policy', { hasPolicy: !!finalAcademyDetails?.policy })
        updateRequirements('coach', {
            name: (finalAcademyDetails?.coaches ?? []).length > 0 && !!finalAcademyDetails?.coaches![0].name,
            title: (finalAcademyDetails?.coaches ?? []).length > 0 && !!finalAcademyDetails?.coaches![0].title,
            bio: (finalAcademyDetails?.coaches ?? []).length > 0 && !!finalAcademyDetails?.coaches![0].bio,
            gender: (finalAcademyDetails?.coaches ?? []).length > 0 && !!finalAcademyDetails?.coaches![0].gender,
            sports: (finalAcademyDetails?.coaches ?? []).length > 0 && finalAcademyDetails?.coaches![0].sports!?.length > 0,
            languages: (finalAcademyDetails?.coaches ?? []).length > 0 && finalAcademyDetails?.coaches![0]?.languages!?.length > 0,
        })
        updateRequirements('location', {
            name: (finalAcademyDetails?.locations ?? [])?.length > 0 && !!finalAcademyDetails?.locations![0].name,
            branchId: (finalAcademyDetails?.locations ?? [])?.length > 0 && !!finalAcademyDetails?.locations![0].id,
            url: (finalAcademyDetails?.locations ?? [])?.length > 0 && !!finalAcademyDetails?.locations![0].url,
            sports: (finalAcademyDetails?.locations ?? [])?.length > 0 && (finalAcademyDetails?.locations![0].sports!?.length > 0),
            facilities: (finalAcademyDetails?.locations ?? [])?.length > 0 && (finalAcademyDetails?.locations![0].facilities!?.length > 0),
        })
        // updateRequirements('program', { packages: ((finalAcademyDetails?.programs ?? []).length > 0 && finalAcademyDetails?.programs![0]?.packages.length > 0) })
        updateRequirements('program', {
            name: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].name,
            description: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].description,
            branchId: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].branchId,
            sportId: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].sportId,
            startDateOfBirth: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].startDateOfBirth,
            endDateOfBirth: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].endDateOfBirth,
            type: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].type,
            packages: (finalAcademyDetails?.programs ?? []).length > 0 && (finalAcademyDetails?.programs![0].packages!?.length > 0),
            numberOfSeats: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].numberOfSeats,
            gender: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].gender,
            color: (finalAcademyDetails?.programs ?? []).length > 0 && !!finalAcademyDetails?.programs![0].color,
        })
        updateRequirements('assessment', {
            description: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].description,
            coaches: (finalAcademyDetails?.assessments ?? []).length > 0 && (finalAcademyDetails?.assessments![0].coaches!?.length > 0),
            packages: (finalAcademyDetails?.assessments ?? []).length > 0 && (finalAcademyDetails?.assessments![0].packages!?.length > 0),
            branchId: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].branchId,
            sportId: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].sportId,
            startDateOfBirth: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].startDateOfBirth,
            endDateOfBirth: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].endDateOfBirth,
            gender: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].gender,
            numberOfSeats: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].numberOfSeats,
        })
        console.log({
            description: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].description,
            coaches: (finalAcademyDetails?.assessments ?? []).length > 0 && (finalAcademyDetails?.assessments![0].coaches!?.length > 0),
            packages: (finalAcademyDetails?.assessments ?? []).length > 0 && (finalAcademyDetails?.assessments![0].packages!?.length > 0),
            branchId: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].branchId,
            sportId: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].sportId,
            startDateOfBirth: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].startDateOfBirth,
            endDateOfBirth: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].endDateOfBirth,
            gender: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].gender,
            numberOfSeats: (finalAcademyDetails?.assessments ?? []).length > 0 && !!finalAcademyDetails?.assessments![0].numberOfSeats,
        })

        if (completedSteps === STEPS.length - 1) {
            const finishOnboarding = async () => {
                await academyOnBoarded()
                router.refresh()
            }

            finishOnboarding()
        }
    }, [finalAcademyDetails])

    // useEffect(() => {
    //     if (completedSteps === STEPS.length - 1) {
    //         const finishOnboarding = async () => {
    //             await academyOnBoarded()
    //             router.refresh()
    //         }

    //         finishOnboarding()
    //     }
    // }, [completedSteps])

    const markStepAsComplete = (stepId: StepId) => {
        setSteps(prevSteps =>
            prevSteps.map(step =>
                step.id === stepId ? { ...step, isCompleted: true } : step
            )
        )
    }

    const updateRequirements = (stepId: StepId, newRequirements: Partial<StepRequirements[StepId]>) => {
        setRequirements(prev => {
            const updatedRequirements = {
                ...prev,
                [stepId]: {
                    ...prev[stepId],
                    ...newRequirements
                }
            }

            isStepComplete(stepId)

            return updatedRequirements
        })
    }

    useEffect(() => {
        steps.forEach(step => {
            if (isStepComplete(step.id) && !step.isCompleted) {
                markStepAsComplete(step.id)
            }
        })
    }, [requirements])

    const goToNextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            router.push(steps[currentStepIndex + 1].path)
        }
    }

    const goToPreviousStep = () => {
        if (currentStepIndex > 0) {
            router.push(steps[currentStepIndex - 1].path)
        }
    }

    const value = {
        currentStep,
        steps,
        completedSteps,
        totalSteps: steps.length,
        requirements,
        isStepComplete,
        markStepAsComplete,
        goToNextStep,
        goToPreviousStep,
        updateRequirements,
        onboarded,
        mutate
    }

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    )
}

export const useOnboarding = () => {
    const context = useContext(OnboardingContext)
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider')
    }
    return context
}