// app/(on-boarding)/on-boarding/program/program-form.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOnboarding } from '@/providers/onboarding-provider'
import { useSave } from '@/providers/onboarding-save-provider'
import { createOnboardingProgram, updateOnboardingProgram } from '@/lib/actions/onboarding.actions'
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import AddPackage from './new-add-package'
import EditPackage from './new-edit-package'
import useSWR from 'swr'
import { getProgramPackages } from '@/lib/actions/packages.actions'
import Image from 'next/image'

interface Package {
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
}

interface Schedule {
    day: string
    from: string
    to: string
    memo: string | undefined
}

const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    // Adjust years and months if the current date is before the birth date in the current year
    if (days < 0) {
        months--;
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    // Calculate total months with fractional part
    const totalMonths = years * 12 + months + (days / 30); // Average days in a month.
    console.log(totalMonths)

    return (totalMonths / 12);
};

const programSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    branchId: z.string().min(1, "Branch is required"),
    sportId: z.string().min(1, "Sport is required"),
    startAge: z.number().min(0, "Start age must be 0 or greater").max(100, "Start age must be 100 or less").multipleOf(0.5, "Start age must be in increments of 0.5"),
    startAgeUnit: z.enum(["months", "years"]),
    endAge: z.number().min(0.5, "End age must be 0.5 or greater").max(100, "End age must be 100 or less").multipleOf(0.5, "End age must be in increments of 0.5").optional(),
    endAgeUnit: z.enum(["months", "years", "unlimited"]),
    numberOfSeats: z.string().min(1, "Number of slots is required"),
    type: z.enum(["TEAM", "PRIVATE"]),
    color: z.string().min(1),
})

const ColorSelector = ({ form, disabled = false }: { form: any; disabled?: boolean }) => {
    return (
        <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
                <FormItem className='flex-1'>
                    <FormLabel>Color</FormLabel>
                    <div className="flex items-center gap-2">
                        <Select
                            disabled={disabled}
                            onValueChange={field.onChange}
                            defaultValue={field.value || calendarColors[0].value}
                        >
                            <FormControl>
                                <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter flex-1'>
                                    <SelectValue placeholder="Select a color" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {calendarColors.map((color) => (
                                    <SelectItem
                                        key={color.value}
                                        value={color.value}
                                        className="flex items-center gap-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: color.value }}
                                            />
                                            {color.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {field.value && (
                            <div
                                className="w-10 h-10 rounded-full border border-gray-300"
                                style={{ backgroundColor: field.value }}
                            />
                        )}
                    </div>
                </FormItem>
            )}
        />
    );
};

const calendarColors = [
    { name: 'Olive Green', value: '#DCE5AE', textColor: '#000000' },
    { name: 'Lavender', value: '#E6E6FA', textColor: '#000000' },
    { name: 'Sky Blue', value: '#87CEEB', textColor: '#000000' },
    { name: 'Mint Green', value: '#98FF98', textColor: '#000000' },
    { name: 'Light Coral', value: '#F08080', textColor: '#000000' },
    { name: 'Peach', value: '#FFDAB9', textColor: '#000000' },
    { name: 'Light Yellow', value: '#FFFFE0', textColor: '#000000' },
    { name: 'Thistle', value: '#D8BFD8', textColor: '#000000' },
    { name: 'Powder Blue', value: '#B0E0E6', textColor: '#000000' },
    { name: 'Pale Green', value: '#98FB98', textColor: '#000000' },
    { name: 'Light Pink', value: '#FFB6C1', textColor: '#000000' }
];

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
            gender: string | null;
            startDateOfBirth: string | null;
            endDateOfBirth: string | null;
            branchName: string | null;
            sportName: string | null;
            color: string | null;
        }[] | undefined
        locations: {
            id: number;
            name: string;
            nameInGoogleMap: string | null;
            url: string | null;
            sports: string[];
            facilities: string[];
            isDefault: boolean;
        }[] | null
    }
    sports: {
        id: number;
        name: string;
        locale: string;
    }[];
}

export default function OnboardingProgramForm({ academyDetails, sports }: Props) {
    const router = useRouter()
    const { updateRequirements } = useOnboarding()
    const { registerSaveHandler, unregisterSaveHandler } = useSave()

    const existingProgram = useMemo(() => academyDetails.programs?.[0], [academyDetails.programs])
    const existingLocation = useMemo(() => academyDetails.locations?.[0], [academyDetails.locations])

    const { data: packagesData, isLoading, isValidating, mutate } = useSWR(existingProgram?.id ? 'packages' : null, (url: string | null) => getProgramPackages(url, existingProgram?.id!), {
        refreshWhenHidden: true
    })

    const [selectedCoaches, setSelectedCoaches] = useState<number[]>(
        existingProgram?.coaches.map(Number) || []
    )
    const [createdPackages, setCreatedPackages] = useState<Package[]>([]);

    const [packagesOpen, setPackagesOpen] = useState(false)
    const [editPackageOpen, setEditPackageOpen] = useState(false)
    const [editedPackage, setEditedPackage] = useState<{ editedPackage: Package, index?: number } | null>(null)
    const [coachesOpen, setCoachesOpen] = useState(false)
    const [selectedGenders, setSelectedGenders] = useState<string[]>(academyDetails.programs?.[0]?.gender?.split(',').map(gender => gender.trim()) || [])
    const [gendersOpen, setGendersOpen] = useState(false);

    const dateToAge = (date: Date) => {
        const today = new Date()
        const age = today.getFullYear() - date.getFullYear()
        return age
    }

    useEffect(() => {
        if (isLoading || isValidating) return
        setCreatedPackages(packagesData?.data?.map(packageData => ({ ...packageData, startDate: new Date(packageData.startDate), endDate: new Date(packageData.endDate), entryFeesExplanation: packageData.entryFeesExplanation ?? undefined, entryFeesAppliedUntil: packageData.entryFeesAppliedUntil ? packageData.entryFeesAppliedUntil : undefined })) as Package[] ?? [] as Package[])
    }, [isLoading, isValidating, packagesData])

    const form = useForm<z.infer<typeof programSchema>>({
        resolver: zodResolver(programSchema),
        defaultValues: {
            name: existingProgram?.name ?? '',
            description: existingProgram?.description ?? '',
            branchId: existingProgram?.branchId?.toString() ?? '',
            sportId: existingProgram?.sportId?.toString() ?? '',
            numberOfSeats: existingProgram?.numberOfSeats?.toString() ?? '',
            type: existingProgram?.type as 'TEAM' | 'PRIVATE' ?? 'TEAM',
            startAge: existingProgram?.startDateOfBirth ? calculateAge(existingProgram?.startDateOfBirth) < 1 ? calculateAge(existingProgram?.startDateOfBirth) * 12 : calculateAge(existingProgram?.startDateOfBirth) : 0,
            startAgeUnit: existingProgram?.startDateOfBirth ? calculateAge(existingProgram?.startDateOfBirth) < 1 ? 'months' : 'years' : 'years',
            endAge: existingProgram?.endDateOfBirth ? calculateAge(existingProgram?.endDateOfBirth) < 0 ? undefined : calculateAge(existingProgram?.endDateOfBirth) : 100,
            endAgeUnit: existingProgram?.endDateOfBirth ? calculateAge(existingProgram?.endDateOfBirth) < 0 ? 'unlimited' : 'years' : 'unlimited',
            color: existingProgram?.color ?? '#DCE5AE',
        }
    })

    useEffect(() => {
        updateRequirements('academy-details', {
            name: !!academyDetails.name,
            description: !!academyDetails.description,
            sports: !!academyDetails.sports && academyDetails.sports.length > 0,
            logo: !!academyDetails.logo,
            hasGallery: !!academyDetails.gallery && academyDetails.gallery.length > 0,
            hasPolicy: !!academyDetails.policy
        })
        // updateRequirements('gallery', { hasGallery: (academyDetails.gallery ?? []).length > 0 })
        // updateRequirements('policy', { hasPolicy: !!academyDetails.policy })
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

    useEffect(() => {
        const values = form.getValues()

        const getAgeInYears = (age: number, unit: string) => {
            return unit === 'months' ? age / 12 : age;
        };

        const calculateDateFromYears = (age: number, unit: string) => {
            const ageInYears = getAgeInYears(age, unit);
            const date = new Date();
            const years = Math.floor(ageInYears);
            const months = (ageInYears - years) * 12;

            date.setFullYear(date.getFullYear() - years);
            date.setMonth(date.getMonth() - months);
            return date;
        };

        const getAgeInMonths = (age: number, unit: string): number => {
            return unit === 'months' ? age : age * 12;
        };

        const calculateDateFromMonths = (age: number, unit: string): Date => {
            const ageInMonths = getAgeInMonths(age, unit);
            const date = new Date();
            const totalMonths = date.getMonth() - Math.floor(ageInMonths);
            const years = Math.floor(totalMonths / 12);
            const months = totalMonths % 12;

            date.setFullYear(date.getFullYear() - years);
            date.setMonth(months);

            // Adjust for fractional months
            const fractionalMonth = ageInMonths % 1;
            if (fractionalMonth > 0) {
                const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                const daysToSubtract = Math.round(daysInMonth * fractionalMonth);
                date.setDate(date.getDate() - daysToSubtract);
            }

            return date;
        };

        const startDate = values.startAgeUnit === 'months' ?
            calculateDateFromMonths(values.startAge!, values.startAgeUnit) :
            calculateDateFromYears(values.startAge!, values.startAgeUnit);

        let endDate: Date;
        if (values.endAgeUnit === 'unlimited') {
            // Set a very large date for "unlimited" (e.g., 100 years from now)
            endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 100);
        } else {
            if (values.endAge === null) {
                return form.setError('endAge', {
                    type: 'custom',
                    message: 'End age is required for limited duration'
                });
            }
            else endDate = values.endAgeUnit === 'months' ?
                calculateDateFromMonths(values.endAge!, values.endAgeUnit) :
                calculateDateFromYears(values.endAge!, values.endAgeUnit);
        }

        const currentRequirements = {
            name: !!values.name && values.name.length > 0,
            description: !!values.description && values.description.length > 0,
            type: !!values.type,
            numberOfSeats: !!values.numberOfSeats,
            sportId: !!values.sportId,
            branchId: !!values.branchId,
            startDateOfBirth: startDate,
            endDateOfBirth: endDate,
            packages: (createdPackages ?? [])?.length > 0,
            gender: selectedGenders.length > 0,
            color: !!values.color,
        }
        updateRequirements('program', currentRequirements)
    }, [
        selectedCoaches,
        createdPackages,
        selectedGenders,
        form.getValues('name'),
        form.getValues('description'),
        form.getValues('type'),
        form.getValues('numberOfSeats'),
        form.getValues('sportId'),
        form.getValues('branchId'),
        form.getValues('startAge'),
        form.getValues('startAgeUnit'),
        form.getValues('endAge'),
        form.getValues('endAgeUnit'),
        form.getValues('color'),
    ])

    useEffect(() => {
        registerSaveHandler('program', {
            handleSave: async () => {
                try {
                    const values = form.getValues()

                    if (!existingLocation) {
                        return {
                            success: false,
                            error: 'Location is required before creating a program'
                        }
                    }

                    const getAgeInYears = (age: number, unit: string) => {
                        return unit === 'months' ? age / 12 : age;
                    };

                    const calculateDateFromYears = (age: number, unit: string) => {
                        const ageInYears = getAgeInYears(age, unit);
                        const date = new Date();
                        const years = Math.floor(ageInYears);
                        const months = (ageInYears - years) * 12;

                        date.setFullYear(date.getFullYear() - years);
                        date.setMonth(date.getMonth() - months);
                        return date;
                    };

                    const getAgeInMonths = (age: number, unit: string): number => {
                        return unit === 'months' ? age : age * 12;
                    };

                    const calculateDateFromMonths = (age: number, unit: string): Date => {
                        const ageInMonths = getAgeInMonths(age, unit);
                        const date = new Date();
                        const totalMonths = date.getMonth() - Math.floor(ageInMonths);
                        const years = Math.floor(totalMonths / 12);
                        const months = totalMonths % 12;

                        date.setFullYear(date.getFullYear() - years);
                        date.setMonth(months);

                        // Adjust for fractional months
                        const fractionalMonth = ageInMonths % 1;
                        if (fractionalMonth > 0) {
                            const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                            const daysToSubtract = Math.round(daysInMonth * fractionalMonth);
                            date.setDate(date.getDate() - daysToSubtract);
                        }

                        return date;
                    };

                    const startDate = values.startAgeUnit === 'months' ?
                        calculateDateFromMonths(values.startAge!, values.startAgeUnit) :
                        calculateDateFromYears(values.startAge!, values.startAgeUnit);

                    let endDate: Date;
                    if (values.endAgeUnit === 'unlimited') {
                        // Set a very large date for "unlimited" (e.g., 100 years from now)
                        endDate = new Date();
                        endDate.setFullYear(endDate.getFullYear() + 100);
                    } else {
                        if (values.endAge === null) {
                            return {
                                success: false,
                                error: 'End age is required for limited duration'
                            };
                        }
                        else endDate = values.endAgeUnit === 'months' ?
                            calculateDateFromMonths(values.endAge!, values.endAgeUnit) :
                            calculateDateFromYears(values.endAge!, values.endAgeUnit);
                    }

                    const programData = {
                        name: values.name,
                        description: values.description,
                        type: values.type,
                        numberOfSeats: parseInt(values.numberOfSeats),
                        startDateOfBirth: startDate,
                        endDateOfBirth: endDate,
                        branchId: existingLocation.id,
                        sportId: parseInt(values.sportId),
                        coaches: selectedCoaches,
                        packagesData: createdPackages!,
                        gender: selectedGenders.length > 0 ? selectedGenders.join(',') : 'mix',
                        color: values.color
                    }

                    const result = existingProgram
                        ? await updateOnboardingProgram(existingProgram.id, programData)
                        : await createOnboardingProgram(programData)

                    if (result.error) {
                        return { success: false, error: result.error }
                    }

                    router.refresh()
                    return { success: true }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to save program'
                    }
                }
            }
        })

        return () => unregisterSaveHandler('program')
    }, [registerSaveHandler, unregisterSaveHandler, form, selectedCoaches, createdPackages, existingProgram, existingLocation, selectedGenders])

    const handleSelectCoach = (id: number) => {
        setSelectedCoaches(prev =>
            prev.includes(id) ? prev.filter(coachId => coachId !== id) : [...prev, id]
        )
    }

    const handleSelectGender = (gender: string) => {
        setSelectedGenders(prev =>
            prev.includes(gender) ? prev.filter(g => g !== gender) : [...prev, gender]
        )
    }

    console.log(selectedGenders)

    return (
        <Form {...form}>
            <form className='flex flex-col gap-6 w-full'>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea {...field} className='px-2 py-3 rounded-[10px] border border-gray-500 font-inter' />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex w-full gap-4 items-start justify-between">
                    <div className="flex flex-1 gap-2">
                        <FormField
                            control={form.control}
                            name='startAge'
                            render={({ field }) => (
                                <FormItem className="flex flex-col flex-1">
                                    <FormLabel>Start Age</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={e => field.onChange(Number(e.target.value))}
                                            step={0.5}
                                            min={0}
                                            max={100}
                                            disabled={isLoading || isValidating}
                                            className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="startAgeUnit"
                            render={({ field }) => (
                                <FormItem className="flex flex-col flex-1">
                                    <FormLabel>Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || isValidating}>
                                        <FormControl>
                                            <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="months">Months</SelectItem>
                                            <SelectItem value="years">Years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex flex-1 gap-2">
                        <FormField
                            control={form.control}
                            name='endAge'
                            render={({ field }) => (
                                <FormItem className="flex flex-col flex-1">
                                    <FormLabel>End Age</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={e => field.onChange(Number(e.target.value))}
                                            step={0.5}
                                            min={0.5}
                                            max={100}
                                            disabled={isLoading || isValidating || form.watch('endAgeUnit') === 'unlimited'}
                                            className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endAgeUnit"
                            render={({ field }) => (
                                <FormItem className="flex flex-col flex-1">
                                    <FormLabel>Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || isValidating}>
                                        <FormControl>
                                            <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="months">Months</SelectItem>
                                            <SelectItem value="years">Years</SelectItem>
                                            <SelectItem value="unlimited">Unlimited</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex w-full gap-4 items-start justify-between">
                    <ColorSelector form={form} />
                </div>

                <div className="flex flex-col gap-4 flex-1">
                    <p className='text-xs'>Genders</p>
                    <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                            {selectedGenders.map((gender) => (
                                <Badge
                                    key={gender}
                                    variant="default"
                                    className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                >
                                    <span className="text-xs">{gender}</span>
                                    <button
                                        onClick={() => handleSelectGender(gender)}
                                        className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                    >
                                        <X className="size-3" fill='#1f441f' />
                                        <span className="sr-only">Remove {gender}</span>
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Popover open={gendersOpen} onOpenChange={setGendersOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="default"
                                    className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                >
                                    Select genders
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0 overflow-hidden" align="start">
                                <div
                                    className="max-h-64 overflow-y-scroll overscroll-contain"
                                    style={{
                                        scrollbarWidth: 'thin',
                                        WebkitOverflowScrolling: 'touch',
                                        willChange: 'scroll-position'
                                    }}
                                    onWheel={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <div className="p-2">
                                        <p
                                            key={'male'}
                                            onClick={() => handleSelectGender('male')}
                                            className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                        >
                                            {selectedGenders.includes('male') && <X className="size-3" fill='#1f441f' />}
                                            {'male'}
                                        </p>
                                        <p
                                            key={'female'}
                                            onClick={() => handleSelectGender('female')}
                                            className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                        >
                                            {selectedGenders.includes('female') && <X className="size-3" fill='#1f441f' />}
                                            {'female'}
                                        </p>
                                        <p
                                            key={'mix'}
                                            onClick={() => handleSelectGender('mix')}
                                            className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                        >
                                            {selectedGenders.includes('mix') && <X className="size-3" fill='#1f441f' />}
                                            {'mix'}
                                        </p>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="sportId"
                    render={({ field }) => (
                        <FormItem className='flex-1'>
                            <FormLabel>Sport</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                        <SelectValue placeholder="Select a sport" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {academyDetails.sports?.map((sport) => (
                                        <SelectItem key={sport} value={sport.toString()}>
                                            {sports?.find(s => s.id === sport)?.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">

                    <FormField
                        control={form.control}
                        name="numberOfSeats"
                        render={({ field }) => (
                            <FormItem className='flex-1'>
                                <FormLabel>Number of Slots</FormLabel>
                                <FormControl>
                                    <Input {...field} type="number" min="1" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className='flex-1'>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="TEAM">Team</SelectItem>
                                    <SelectItem value="PRIVATE">Private</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col gap-4 w-full">
                    <p className='text-xs'>Coaches</p>
                    <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                            {selectedCoaches.map((coach) => (
                                <Badge
                                    key={coach}
                                    variant="default"
                                    className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                >
                                    <span className="text-xs">{academyDetails.coaches?.find(c => c.id === coach)?.name}</span>
                                    <button
                                        onClick={() => handleSelectCoach(coach)}
                                        className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                    >
                                        <X className="size-3" fill='#1f441f' />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Popover open={coachesOpen} onOpenChange={setCoachesOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="default"
                                    className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                >
                                    Select coaches
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="start">
                                <div className="p-2">
                                    {academyDetails.coaches?.map(coach => (
                                        <p
                                            key={coach.id}
                                            onClick={() => handleSelectCoach(coach.id)}
                                            className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                        >
                                            {selectedCoaches.includes(coach.id) && <X className="size-3" fill='#1f441f' />}
                                            {coach.name}
                                        </p>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="w-full max-w-screen-2xl overflow-x-auto mx-auto">
                    <div className="min-w-full grid grid-cols-[0.75fr,auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
                        <div className="contents">
                            <div />
                            <div />
                            <div />
                            <div />
                            <div />
                            <div className="py-4 flex items-center justify-center">
                                <button
                                    type='button'
                                    onClick={() => setPackagesOpen(true)}
                                    className='flex text-main-yellow text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm'
                                >
                                    Add New Package
                                </button>
                            </div>
                        </div>
                        <div className="contents">
                            <div className="py-4 px-4 rounded-l-[20px] bg-[#E0E4D9]">Name</div>
                            <div className="py-4 px-4 bg-[#E0E4D9]">Price</div>
                            <div className="py-4 px-4 bg-[#E0E4D9]">Start Date</div>
                            <div className="py-4 px-4 bg-[#E0E4D9]">End Date</div>
                            <div className="py-4 px-4 bg-[#E0E4D9]">Session</div>
                            <div className="py-4 px-4 rounded-r-[20px] bg-[#E0E4D9]"></div>
                        </div>

                        {createdPackages?.map((packageData, index) => (
                            <div className="contents" key={index}>
                                <div className="py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-start font-bold font-inter">
                                    {packageData.name}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {packageData.price}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {packageData.startDate.toLocaleDateString()}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {packageData.endDate.toLocaleDateString()}
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">
                                    {packageData.schedules.length}
                                </div>
                                <div className="py-4 px-4 bg-main-white gap-4 rounded-r-[20px] flex items-center justify-end font-bold font-inter">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setEditPackageOpen(true)
                                            setEditedPackage({ editedPackage: packageData, index })
                                        }}
                                    >
                                        <Image
                                            src='/images/edit.svg'
                                            alt='Edit'
                                            width={20}
                                            height={20}
                                        />
                                    </Button>
                                    <X
                                        className="h-4 w-4 cursor-pointer"
                                        onClick={() => setCreatedPackages(prev => prev?.filter((_, i) => i !== index))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </form>

            <AddPackage
                onOpenChange={setPackagesOpen}
                open={packagesOpen}
                setCreatedPackages={setCreatedPackages}
            />

            {
                editedPackage && (
                    <EditPackage
                        packageEdited={editedPackage.editedPackage}
                        index={editedPackage.index}
                        open={editPackageOpen}
                        onOpenChange={setEditPackageOpen}
                        setCreatedPackages={setCreatedPackages}
                        setEditedPackage={setEditedPackage}
                    />
                )
            }
        </Form >
    )
}