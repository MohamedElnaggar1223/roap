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

const programSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    branchId: z.string().min(1, "Branch is required"),
    sportId: z.string().min(1, "Sport is required"),
    startDateOfBirth: z.number().min(1, "Start age is required").max(100),
    endDateOfBirth: z.number().min(1, "End age is required").max(100),
    numberOfSeats: z.string().min(1, "Number of slots is required"),
    type: z.enum(["TEAM", "PRIVATE"]),
})

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
            startDateOfBirth: existingProgram?.startDateOfBirth ?
                dateToAge(new Date(existingProgram?.startDateOfBirth)) : undefined,
            endDateOfBirth: existingProgram?.endDateOfBirth ?
                dateToAge(new Date(existingProgram?.endDateOfBirth)) : undefined,
        }
    })

    useEffect(() => {
        updateRequirements('academy-details', {
            name: !!academyDetails.name,
            description: !!academyDetails.description,
            sports: !!academyDetails.sports && academyDetails.sports.length > 0,
            logo: !!academyDetails.logo
        })
        updateRequirements('gallery', { hasGallery: (academyDetails.gallery ?? []).length > 0 })
        updateRequirements('policy', { hasPolicy: !!academyDetails.policy })
        updateRequirements('location', {
            name: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].name,
            branchId: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].id,
            nameInGoogleMap: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].nameInGoogleMap,
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
        const currentRequirements = {
            name: !!values.name && values.name.length > 0,
            description: !!values.description && values.description.length > 0,
            type: !!values.type,
            numberOfSeats: !!values.numberOfSeats,
            sportId: !!values.sportId,
            branchId: !!values.branchId,
            startDateOfBirth: !!values.startDateOfBirth,
            endDateOfBirth: !!values.endDateOfBirth,
            packages: (createdPackages ?? [])?.length > 0,
            gender: selectedGenders.length > 0,
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
        form.getValues('startDateOfBirth'),
        form.getValues('endDateOfBirth'),
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

                    const startDate = new Date()
                    startDate.setFullYear(startDate.getFullYear() - values.startDateOfBirth)

                    const endDate = new Date()
                    endDate.setFullYear(endDate.getFullYear() - values.endDateOfBirth)

                    const programData = {
                        name: values.name,
                        description: values.description,
                        type: values.type,
                        numberOfSeats: parseInt(values.numberOfSeats),
                        startDateOfBirth: startDate,
                        endDateOfBirth: endDate,
                        branchId: existingLocation.id,
                        sportId: academyDetails.sports?.[0] || 0,
                        coaches: selectedCoaches,
                        packagesData: createdPackages!,
                        gender: selectedGenders.length > 0 ? selectedGenders.join(',') : 'mix'
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

                <div className="flex gap-4">
                    <FormField
                        control={form.control}
                        name="startDateOfBirth"
                        render={({ field }) => (
                            <FormItem className="flex flex-col flex-1">
                                <FormLabel>Start Age</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={e => field.onChange(Number(e.target.value))}
                                        min={1}
                                        max={100}
                                        className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endDateOfBirth"
                        render={({ field }) => (
                            <FormItem className="flex flex-col flex-1">
                                <FormLabel>End Age</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        min={1}
                                        max={100}
                                        onChange={e => field.onChange(Number(e.target.value))}
                                        className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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