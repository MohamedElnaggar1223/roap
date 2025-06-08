import { createStore } from 'zustand/vanilla'
import { toast } from '@/hooks/use-toast'
import { getAssessments, updateAssessment } from '@/lib/actions/assessments.actions'

export interface Assessment {
    id: number
    description: string | null
    type: string | null
    numberOfSeats: number | null
    branchId: number | null
    sportId: number | null
    gender: string | null
    startDateOfBirth: string | null
    endDateOfBirth: string | null
    branchName: string
    sportName: string
    firstPackagePrice: number | null
    assessmentDeductedFromProgram: boolean
    coaches: string[]
    packages: string[]
    // Optimistic update fields
    pending?: boolean
    tempId?: string
}

export interface AssessmentsState {
    assessments: Assessment[]
    fetched: boolean
    pending: boolean
}

export interface AssessmentsActions {
    fetchAssessments: () => Promise<void>
    editAssessment: (id: number, data: {
        description: string
        branchId: number
        sportId: number
        numberOfSeats: number
        coaches: number[]
        packagesData: any[]
        assessmentDeductedFromProgram: boolean
    }) => Promise<void>
    setAssessments: (assessments: Assessment[]) => void
    addTempAssessment: (assessment: Assessment) => void
    removeTempAssessments: () => void
}

export type AssessmentsStore = AssessmentsState & AssessmentsActions

export const createAssessmentsStore = () => {
    return createStore<AssessmentsStore>((set, get) => ({
        assessments: [],
        fetched: false,
        pending: false,

        fetchAssessments: async () => {
            try {
                const { data, error } = await getAssessments()
                if (error) {
                    toast({
                        title: "Error",
                        description: error,
                        variant: "destructive",
                    })
                    return
                }

                set({ assessments: data || [], fetched: true })
            } catch (error) {
                console.error('Error fetching assessments:', error)
                toast({
                    title: "Error",
                    description: "Failed to fetch assessments",
                    variant: "destructive",
                })
            }
        },

        editAssessment: async (id, data) => {
            const { assessments } = get()
            const originalAssessment = assessments.find(a => a.id === id)

            if (!originalAssessment) return

            // Optimistic update
            const optimisticAssessment = {
                ...originalAssessment,
                description: data.description,
                assessmentDeductedFromProgram: data.assessmentDeductedFromProgram,
                pending: true
            }

            set({
                assessments: assessments.map(a =>
                    a.id === id ? optimisticAssessment : a
                )
            })

            try {
                const result = await updateAssessment(id, data)

                if (result.error) {
                    // Rollback on error
                    set({
                        assessments: assessments.map(a =>
                            a.id === id ? { ...originalAssessment, pending: false } : a
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
                    assessments: assessments.map(a =>
                        a.id === id ? { ...optimisticAssessment, pending: false } : a
                    )
                })

                toast({
                    title: "Success",
                    description: "Assessment updated successfully",
                })

            } catch (error) {
                // Rollback on error
                set({
                    assessments: assessments.map(a =>
                        a.id === id ? { ...originalAssessment, pending: false } : a
                    )
                })

                console.error('Error updating assessment:', error)
                toast({
                    title: "Error",
                    description: "Failed to update assessment",
                    variant: "destructive",
                })
            }
        },

        setAssessments: (assessments) => {
            set({ assessments })
        },

        addTempAssessment: (assessment) => {
            set(state => ({
                assessments: [...state.assessments, assessment]
            }))
        },

        removeTempAssessments: () => {
            set(state => ({
                assessments: state.assessments.filter(assessment => !assessment.tempId)
            }))
        }
    }))
} 