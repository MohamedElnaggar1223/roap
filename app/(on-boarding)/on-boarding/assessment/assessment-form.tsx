// app/(on-boarding)/on-boarding/assessment/assessment-form.tsx
'use client'

import { useEffect, useState } from 'react'
import { useOnboarding } from '@/providers/onboarding-provider'
import { useSave } from '@/providers/onboarding-save-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import useSWR from 'swr'
import EditAssessment from './edit-assessment'
import { getProgramPackages } from '@/lib/actions/packages.actions'

export interface Package {
    type: "Term" | "Monthly" | "Full Season"
    termNumber?: number
    name: string
    price: number
    startDate: Date
    endDate: Date
    schedules: Schedule[]
    memo: string | null
    id?: number
    entryFees: number
    entryFeesExplanation?: string
    entryFeesAppliedUntil?: string[]
    entryFeesStartDate?: Date
    entryFeesEndDate?: Date
}

interface Schedule {
    day: string
    from: string
    to: string
    memo: string | undefined
    id?: number
}

interface Assessment {
    coaches: string[];
    packages: string[];
    id: number;
    description: string | null;
    type: string | null;
    numberOfSeats: number | null;
    branchId: number | null;
    sportId: number | null;
    gender: string | null;
    startDateOfBirth: string | null;
    endDateOfBirth: string | null;
    branchName: string;
    sportName: string;
}

interface Props {
    academyDetails: {
        gallery: string[]
        name?: string | null
        description?: string | null
        sports?: number[] | null
        logo?: string | null
        policy?: string | null
        entryFees?: number | null
        extra?: string | null
        coaches: {
            sports: number[];
            languages: number[];
            id: number;
            name: string;
            title: string | null;
            image: string | null;
            bio: string | null;
            gender: string | null;
            dateOfBirth: string | null;
            privateSessionPercentage: string | null;
        }[] | null
        assessments: Assessment[] | undefined
        locations: {
            sports: string[];
            facilities: string[];
            id: number;
            name: string;
            locale: string;
            nameInGoogleMap: string | null;
            url: string | null;
            isDefault: boolean;
            rate: number | null;
            amenities: string[];
        }[] | null
    }
    sports: {
        id: number;
        name: string;
        locale: string;
    }[];
    languages: {
        id: number;
        name: string;
        locale: string;
    }[];
}

interface Branch {
    id: number;
    name: string;
    nameInGoogleMap: string | null;
    url: string | null;
    isDefault: boolean;
    rate: number | null;
    sports: string[];
    amenities: string[];
    locale: string;
}

export default function OnboardingAssessmentForm({ academyDetails, sports, languages }: Props) {
    const router = useRouter()
    const { updateRequirements } = useOnboarding()
    const { registerSaveHandler, unregisterSaveHandler } = useSave()

    const [assessmentPackages, setAssessmentPackages] = useState<Map<number, Package[]>>(new Map())

    useEffect(() => {
        const fetchPackages = async () => {
            if (!academyDetails.assessments || academyDetails.assessments.length === 0) return
            await Promise.all(academyDetails.assessments?.map(async assessment => {
                const { data: packagesData, error: packagesError } = await getProgramPackages('packages', assessment.id)
                if (packagesError || !packagesData) return
                setAssessmentPackages(prev => {
                    const newMap = new Map(prev)
                    newMap.set(assessment.id, packagesData?.map(packageData => ({
                        ...packageData,
                        startDate: new Date(packageData.startDate),
                        endDate: new Date(packageData.endDate),
                        entryFeesExplanation: packageData.entryFeesExplanation ?? undefined,
                        entryFeesAppliedUntil: packageData.entryFeesAppliedUntil || undefined,
                        entryFeesStartDate: packageData.entryFeesStartDate ? new Date(packageData.entryFeesStartDate) : undefined,
                        entryFeesEndDate: packageData.entryFeesEndDate ? new Date(packageData.entryFeesEndDate) : undefined
                    })))
                    return newMap
                })
            }))
        }
        fetchPackages()
    }, [])

    // Initial requirements check
    useEffect(() => {
        updateRequirements('academy-details', {
            name: !!academyDetails.name,
            description: !!academyDetails.description,
            sports: !!academyDetails.sports && academyDetails.sports.length > 0,
            logo: !!academyDetails.logo,
            hasGallery: !!academyDetails.gallery && academyDetails.gallery.length > 0,
            hasPolicy: !!academyDetails.policy
        })

        updateRequirements('location', {
            name: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].name,
            branchId: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].id,
            url: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].url,
            sports: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].sports.length > 0),
            facilities: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].facilities.length > 0),
        })

        updateRequirements('coach', {
            name: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].name,
            title: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].title,
            bio: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].bio,
            gender: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].gender,
            sports: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].sports.length > 0,
            languages: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].languages.length > 0,
        })
    }, [])

    // Register save handler
    useEffect(() => {
        registerSaveHandler('assessment', {
            handleSave: async () => {
                try {
                    return { success: true }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to save assessment'
                    }
                }
            }
        })

        return () => unregisterSaveHandler('assessment')
    }, [registerSaveHandler, unregisterSaveHandler])

    // Update packages for an assessment
    const handlePackagesUpdate = (assessmentId: number, packages: Package[]) => {
        setAssessmentPackages(prev => {
            const newMap = new Map(prev)
            newMap.set(assessmentId, packages)
            return newMap
        })
    }

    // No assessments state
    if (!academyDetails.assessments || academyDetails.assessments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-lg font-medium">No assessments found</p>
                <p className="text-sm text-gray-500">Please complete the previous steps first</p>
            </div>
        )
    }

    useEffect(() => {
        updateRequirements('assessment', {
            description: academyDetails?.assessments?.every(assessment => !!assessment.description),
            coaches: academyDetails?.assessments?.every(assessment => assessment.coaches.length > 0),
            packages: academyDetails?.assessments?.every(assessment => {
                const packages = assessmentPackages.get(assessment.id)
                return packages && packages.length > 0
            }),
            branchId: academyDetails?.assessments?.every(assessment => !!assessment.branchId),
            sportId: academyDetails?.assessments?.every(assessment => !!assessment.sportId),
            startDateOfBirth: academyDetails?.assessments?.every(assessment => !!assessment.startDateOfBirth),
            endDateOfBirth: academyDetails?.assessments?.every(assessment => !!assessment.endDateOfBirth),
            gender: academyDetails?.assessments?.every(assessment => !!assessment.gender),
            numberOfSeats: academyDetails?.assessments?.every(assessment => !!assessment.numberOfSeats)
        })
    }, [assessmentPackages, academyDetails.assessments])

    console.log(assessmentPackages)

    return (
        <div className="w-full space-y-8">
            {academyDetails.assessments.map(assessment => (
                <div key={assessment.id} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Assessment Program - {assessment.branchName}</h2>
                        <EditAssessment
                            assessment={assessment}
                            branches={academyDetails.locations!.map(b => ({
                                ...b,
                                id: b.id,
                                name: b.name,
                                amenities: b.facilities
                            }))}
                            sports={sports}
                            packages={assessmentPackages.get(assessment.id) || []}
                            onUpdatePackages={(packages) => handlePackagesUpdate(assessment.id, packages)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div>
                            <h3 className="font-medium mb-2">Description</h3>
                            <p className="text-sm">{assessment.description || 'No description provided'}</p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2">Gender</h3>
                            <p className="text-sm">{assessment.gender || 'Not specified'}</p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2">Age Range</h3>
                            <p className="text-sm">
                                {assessment.startDateOfBirth && assessment.endDateOfBirth
                                    ? `${new Date(assessment.startDateOfBirth).toLocaleDateString()} - ${new Date(assessment.endDateOfBirth).toLocaleDateString()}`
                                    : 'Not specified'
                                }
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2">Number of Slots</h3>
                            <p className="text-sm">{assessment.numberOfSeats || 'Not specified'}</p>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium">Packages</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-full grid grid-cols-[0.75fr,auto,auto,auto,auto] gap-y-2">
                                <div className="contents">
                                    <div className="py-4 px-4 rounded-l-[20px] bg-[#E0E4D9]">Name</div>
                                    <div className="py-4 px-4 bg-[#E0E4D9]">Price</div>
                                    <div className="py-4 px-4 bg-[#E0E4D9]">Start Date</div>
                                    <div className="py-4 px-4 bg-[#E0E4D9]">End Date</div>
                                    <div className="py-4 px-4 rounded-r-[20px] bg-[#E0E4D9]">Sessions</div>
                                </div>

                                {(assessmentPackages.get(assessment.id) || []).map((packageData, index) => (
                                    <div key={index} className="contents">
                                        <div className="py-4 px-4 bg-white rounded-l-[20px]">{packageData.name}</div>
                                        <div className="py-4 px-4 bg-white">{packageData.price}</div>
                                        <div className="py-4 px-4 bg-white">
                                            {packageData.startDate.toLocaleDateString()}
                                        </div>
                                        <div className="py-4 px-4 bg-white">
                                            {packageData.endDate.toLocaleDateString()}
                                        </div>
                                        <div className="py-4 px-4 bg-white rounded-r-[20px]">
                                            {packageData.schedules.length}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}