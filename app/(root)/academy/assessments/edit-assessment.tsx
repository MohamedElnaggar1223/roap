'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { updateAssessment } from '@/lib/actions/assessments.actions'
import { Loader2, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AddPackage from './new-add-package'
import EditPackage from './new-edit-package'
import AutoGrowingTextarea from '@/components/ui/autogrowing-textarea'
import { formatDateForDB } from '@/lib/utils'
import useSWR from 'swr'
import { getProgramPackages } from '@/lib/actions/packages.actions'
import { getAllCoaches } from '@/lib/actions/coaches.actions'

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

const editAssessmentSchema = z.object({
    description: z.string().min(1, "Description is required"),
    startAge: z.number().min(0, "Start age must be 0 or greater").max(100, "Start age must be 100 or less").multipleOf(0.5, "Start age must be in increments of 0.5"),
    startAgeUnit: z.enum(["months", "years"]),
    endAge: z.number().min(0.5, "End age must be 0.5 or greater").max(100, "End age must be 100 or less").multipleOf(0.5, "End age must be in increments of 0.5").optional(),
    endAgeUnit: z.enum(["months", "years", "unlimited"]),
    numberOfSeats: z.string().min(1, "Number of slots is required"),
})

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

interface Props {
    assessment: {
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
    branches: {
        id: number;
        name: string;
        nameInGoogleMap: string | null;
        url: string | null;
        isDefault: boolean;
        rate: number | null;
        sports: string[];
        amenities: string[];
        locale: string;
    }[];
    sports: {
        id: number;
        name: string;
        locale: string;
    }[];
}

export default function EditAssessment({ assessment, sports, branches }: Props) {
    const router = useRouter()
    const { data: packagesData, isLoading, isValidating, mutate } = useSWR(
        'assessment-packages',
        () => getProgramPackages('packages', assessment.id),
        {
            refreshWhenHidden: true
        }
    )


    const [dialogOpen, setDialogOpen] = useState(false)
    const { data: coachesData } = useSWR(dialogOpen ? 'coaches' : null, getAllCoaches)
    const [selectedCoaches, setSelectedCoaches] = useState<number[]>(assessment.coaches.map(Number))
    const [loading, setLoading] = useState(false)
    const [coachesOpen, setCoachesOpen] = useState(false)
    const [selectedGenders, setSelectedGenders] = useState<string[]>(
        assessment.gender?.split(',').map(gender => gender.trim()) || []
    )
    const [gendersOpen, setGendersOpen] = useState(false)
    const [packagesOpen, setPackagesOpen] = useState(false)
    const [editPackageOpen, setEditPackageOpen] = useState(false)
    const [editedPackage, setEditedPackage] = useState<{ editedPackage: Package, index?: number } | null>(null)
    const [createdPackages, setCreatedPackages] = useState<Package[]>([])

    // Update packages when data is loaded
    useEffect(() => {
        if (isLoading || isValidating) return
        setCreatedPackages(packagesData?.data?.map(packageData => ({
            ...packageData,
            startDate: new Date(packageData.startDate),
            endDate: new Date(packageData.endDate),
            entryFeesExplanation: packageData.entryFeesExplanation ?? undefined,
            entryFeesAppliedUntil: packageData.entryFeesAppliedUntil || undefined,
            entryFeesStartDate: packageData.entryFeesStartDate ? new Date(packageData.entryFeesStartDate) : undefined,
            entryFeesEndDate: packageData.entryFeesEndDate ? new Date(packageData.entryFeesEndDate) : undefined
        })) ?? [])
    }, [isLoading, isValidating, packagesData])

    console.log(calculateAge(assessment.startDateOfBirth!))

    const form = useForm<z.infer<typeof editAssessmentSchema>>({
        resolver: zodResolver(editAssessmentSchema),
        defaultValues: {
            description: assessment.description ?? '',
            numberOfSeats: assessment.numberOfSeats?.toString() ?? '',
            startAge: assessment.startDateOfBirth ? calculateAge(assessment.startDateOfBirth) < 1 ? calculateAge(assessment.startDateOfBirth) * 12 : calculateAge(assessment.startDateOfBirth) : 0,
            startAgeUnit: assessment.startDateOfBirth ? calculateAge(assessment.startDateOfBirth) < 1 ? 'months' : 'years' : 'years',
            endAge: assessment.endDateOfBirth ? calculateAge(assessment.endDateOfBirth) < 0 ? undefined : calculateAge(assessment.endDateOfBirth) : 100,
            endAgeUnit: assessment.endDateOfBirth ? calculateAge(assessment.endDateOfBirth) < 0 ? 'unlimited' : 'years' : 'unlimited',
        }
    })

    const handleSelectCoach = (id: number) => {
        if (loading) return
        setSelectedCoaches(prev =>
            prev.includes(id) ? prev.filter(coachId => coachId !== id) : [...prev, id]
        )
    }

    const handleSelectGender = (gender: string) => {
        if (loading) return
        setSelectedGenders(prev =>
            prev.includes(gender) ? prev.filter(g => g !== gender) : [...prev, gender]
        )
    }

    const onSubmit = async (values: z.infer<typeof editAssessmentSchema>) => {
        try {
            setLoading(true)

            if (!selectedGenders.length) {
                form.setError('root', {
                    type: 'custom',
                    message: 'Please select at least one gender'
                })
                return
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
                    return form.setError('endAge', {
                        type: 'custom',
                        message: 'End age is required for limited duration'
                    });
                }
                else endDate = values.endAgeUnit === 'months' ?
                    calculateDateFromMonths(values.endAge!, values.endAgeUnit) :
                    calculateDateFromYears(values.endAge!, values.endAgeUnit);
            }

            const result = await updateAssessment(assessment.id, {
                description: values.description,
                branchId: assessment.branchId!,
                sportId: assessment.sportId!,
                gender: selectedGenders.join(','),
                startDateOfBirth: startDate,
                endDateOfBirth: endDate,
                numberOfSeats: parseInt(values.numberOfSeats),
                coaches: selectedCoaches,
                packagesData: createdPackages
            })

            if (result.error) {
                if (result?.field) {
                    form.setError(result.field as any, {
                        type: 'custom',
                        message: result.error
                    })
                    return
                }
                form.setError('root', {
                    type: 'custom',
                    message: result.error
                })
                return
            }

            setDialogOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Error updating assessment:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setDialogOpen(true)}>
                <Image
                    src='/images/edit.svg'
                    alt='Edit'
                    width={20}
                    height={20}
                />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className='bg-main-white min-w-[1280px] w-screen'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                            <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                                <DialogTitle className='font-normal text-base'>Edit Assessment</DialogTitle>
                                <div className='flex items-center gap-2'>
                                    <button disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                        {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                        Save
                                    </button>
                                </div>
                            </DialogHeader>

                            <div className="w-full max-h-[380px] overflow-y-auto">
                                <div className="flex flex-col gap-6 w-full px-2">
                                    <FormField
                                        control={form.control}
                                        name='description'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <AutoGrowingTextarea
                                                        field={field}
                                                        disabled={isLoading || isValidating || loading}
                                                        className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
                                                            disabled={loading}
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
                                                        disabled={loading}
                                                        className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                                    >
                                                        Select genders
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0" align="start">
                                                    <div className="p-2">
                                                        {['male', 'female', 'mix'].map(gender => (
                                                            <p
                                                                key={gender}
                                                                onClick={() => handleSelectGender(gender)}
                                                                className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                            >
                                                                {selectedGenders.includes(gender) && <X className="size-3" fill='#1f441f' />}
                                                                {gender}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

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
                                                        <span className="text-xs">{coachesData?.find(c => c.id === coach)?.name}</span>
                                                        <button disabled={isLoading || isValidating || loading}
                                                            onClick={() => handleSelectCoach(coach)}
                                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                                        >
                                                            <X className="size-3" fill='#1f441f' />
                                                            <span className="sr-only">Remove {coachesData?.find(c => c.id === coach)?.name}</span>
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                            <Popover open={coachesOpen} onOpenChange={setCoachesOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="default" disabled={isLoading || isValidating || loading}
                                                        className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                                    >
                                                        Select coaches
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
                                                            {coachesData?.map(coach => (
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
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

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
                                                                disabled={isLoading || isValidating || loading}
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
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || isValidating || loading}>
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
                                                                disabled={isLoading || isValidating || loading || form.watch('endAgeUnit') === 'unlimited'}
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
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || isValidating || loading}>
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

                                    <FormField
                                        control={form.control}
                                        name='numberOfSeats'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Number of Slots</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        disabled={loading}
                                                        {...field}
                                                        type="number"
                                                        min="1"
                                                        className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="w-full max-w-screen-2xl overflow-x-auto">
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
                                                        disabled={loading}
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

                                            {createdPackages.map((packageData, index) => (
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
                                                            disabled={loading}
                                                            onClick={() => {
                                                                setEditPackageOpen(true);
                                                                setEditedPackage({ editedPackage: packageData, index });
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
                                                            onClick={() => setCreatedPackages(prev => prev.filter((_, i) => i !== index))}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AddPackage
                open={packagesOpen}
                onOpenChange={setPackagesOpen}
                setCreatedPackages={setCreatedPackages}
            />

            {editedPackage && (
                <EditPackage
                    packageEdited={editedPackage.editedPackage}
                    open={editPackageOpen}
                    onOpenChange={setEditPackageOpen}
                    setEditedPackage={setEditedPackage}
                    index={editedPackage.index}
                    setCreatedPackages={setCreatedPackages}
                />
            )}
        </>
    )
}