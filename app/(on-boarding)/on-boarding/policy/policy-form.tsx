// app/(on-boarding)/on-boarding/policy/policy-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useOnboarding } from '@/providers/onboarding-provider'
import { useSave } from '@/providers/onboarding-save-provider'
import { updateAcademyDetails } from '@/lib/actions/academics.actions'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import TipTapEditor from '@/components/academy/academy-details/Editor'

const policySchema = z.object({
    policy: z.string().min(1, "Policy is required"),
})

interface Props {
    academyDetails: {
        policy?: string | null
        name?: string | null
        description?: string | null
        sports?: number[] | null
        logo?: string | null
        gallery?: string[] | null
        entryFees?: number | null
        extra?: string | null
        coaches: {
            sports: number[];
            languages: number[];
            packages: number[];
            id: number;
            name: string;
            title: string | null;
            image: string | null;
            bio: string | null;
            gender: string | null;
            dateOfBirth: string | null;
            privateSessionPercentage: string | null;
        }[] | null
        programs: {
            coaches: string[];
            packages: string[];
            id: number;
            name: string | null;
            description: string | null;
            type: string | null;
            numberOfSeats: number | null;
            branchId: number | null;
            sportId: number | null;
            sportName: string | null;
            startDateOfBirth: string | null;
            endDateOfBirth: string | null;
            branchName: string | null;
        }[] | undefined
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
}

export default function OnboardingPolicyForm({ academyDetails }: Props) {
    const { updateRequirements } = useOnboarding()
    const { registerSaveHandler, unregisterSaveHandler } = useSave()

    const form = useForm<z.infer<typeof policySchema>>({
        resolver: zodResolver(policySchema),
        defaultValues: {
            policy: academyDetails.policy ?? '',
        }
    })

    useEffect(() => {
        updateRequirements('policy', {
            hasPolicy: !!academyDetails.policy
        })
        updateRequirements('academy-details', { name: !!academyDetails.name, description: !!academyDetails.description, sports: !!academyDetails.sports, logo: !!academyDetails.logo })
        updateRequirements('gallery', { hasGallery: (academyDetails.gallery ?? [])?.length > 0 })
        updateRequirements('coach', {
            name: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].name,
            title: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].title,
            bio: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].bio,
            gender: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].gender,
            sports: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].sports.length > 0,
            languages: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].languages.length > 0,
        })
        updateRequirements('location', {
            name: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].name,
            branchId: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].id,
            nameInGoogleMap: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].nameInGoogleMap,
            url: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].url,
            sports: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].sports.length > 0),
            facilities: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].facilities.length > 0),
        })
        updateRequirements('program', { packages: ((academyDetails.programs ?? []).length > 0 && academyDetails?.programs![0]?.packages.length > 0) })
    }, [])

    useEffect(() => {
        const values = form.getValues()
        console.log("Academy Details Policy Values: ", values.policy.length)
        const currentRequirements = {
            hasPolicy: values.policy.length > 0
        }
        updateRequirements('policy', currentRequirements)
    }, [form.getValues('policy')])

    useEffect(() => {
        registerSaveHandler('policy', {
            handleSave: async () => {
                try {
                    const values = form.getValues()

                    if (!values.policy.length) {
                        return {
                            success: false,
                            error: 'Please provide a valid policy'
                        }
                    }

                    const result = await updateAcademyDetails({
                        ...academyDetails,
                        name: academyDetails.name ?? '',
                        description: academyDetails.description ?? '',
                        sports: academyDetails.sports ?? [],
                        logo: academyDetails.logo ?? '',
                        gallery: academyDetails.gallery ?? [],
                        entryFees: academyDetails.entryFees ?? 0,
                        extra: academyDetails.extra ?? '',
                        policy: values.policy,
                    })

                    if (result.error) {
                        return { success: false, error: result.error }
                    }

                    return { success: true }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to save policy'
                    }
                }
            }
        })

        return () => unregisterSaveHandler('policy')
    }, [registerSaveHandler, unregisterSaveHandler, form.getValues('policy'), academyDetails])

    return (
        <Form {...form}>
            <form className='flex flex-col gap-6 w-full'>
                <FormField
                    control={form.control}
                    name="policy"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Academy Policy</FormLabel>
                            <FormControl>
                                <TipTapEditor
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    className="min-h-[400px] listDisplay !font-inter !antialiased"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}