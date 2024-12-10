'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateAssessment } from '@/lib/actions/assessments.actions';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { getAllCoaches } from '@/lib/actions/coaches.actions';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Fragment } from 'react';
import AddPackage from './new-add-package';
import EditPackage from './new-edit-package';
import { TrashIcon } from 'lucide-react';
import { getProgramPackages } from '@/lib/actions/packages.actions';
import AutoGrowingTextarea from '@/components/ui/autogrowing-textarea';
import useSWR from 'swr';
import { Input } from '@/components/ui/input';

const editAssessmentSchema = z.object({
    description: z.string().min(1, "Description is required"),
    branchId: z.string().min(1, "Branch is required"),
    sportId: z.string().min(1, "Sport is required"),
    startDateOfBirth: z.date({
        required_error: "Start age is required",
    }),
    endDateOfBirth: z.date({
        required_error: "End age is required",
    }),
    numberOfSeats: z.string().min(1, "Number of slots is required"),
})

interface Branch {
    id: number
    name: string
    nameInGoogleMap: string | null
    url: string | null
    isDefault: boolean
    rate: number | null
    sports: string[]
    amenities: string[]
    locale: string
}

interface Sport {
    id: number
    name: string
    image: string | null
    locale: string
}

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

type Props = {
    branches: Branch[]
    sports: Sport[]
    assessment: Assessment
}

export default function EditAssessment({ branches, sports, assessment }: Props) {
    const router = useRouter()

    const [editAssessmentOpen, setEditAssessmentOpen] = useState(false)
    const { data: coachesData } = useSWR(editAssessmentOpen ? 'coaches' : null, getAllCoaches)
    const { data: packagesData, isLoading, isValidating, mutate } = useSWR(editAssessmentOpen ? 'packages' : null, (url: string | null) => getProgramPackages(url, assessment.id), {
        refreshWhenHidden: true
    })

    const [selectedCoaches, setSelectedCoaches] = useState<number[]>(assessment.coaches.map(coach => parseInt(coach)))
    const [selectedGenders, setSelectedGenders] = useState<string[]>(assessment.gender?.split(',') ?? [])
    const [loading, setLoading] = useState(false)
    const [coachesOpen, setCoachesOpen] = useState(false)
    const [packagesOpen, setPackagesOpen] = useState(false);
    const [createdPackages, setCreatedPackages] = useState<Package[]>([]);
    const [gendersOpen, setGendersOpen] = useState(false);
    const [editPackageOpen, setEditPackageOpen] = useState(false);
    const [editedPackage, setEditedPackage] = useState<{ editedPackage: Package, index?: number } | null>(null);

    useEffect(() => {
        if (isLoading || isValidating) return
        setCreatedPackages(packagesData?.data?.map(packageData => ({ ...packageData, startDate: new Date(packageData.startDate), endDate: new Date(packageData.endDate), entryFeesExplanation: packageData.entryFeesExplanation ?? undefined, entryFeesAppliedUntil: packageData.entryFeesAppliedUntil ? packageData.entryFeesAppliedUntil : undefined })) ?? [])
    }, [isLoading, isValidating, packagesData])

    const form = useForm<z.infer<typeof editAssessmentSchema>>({
        resolver: zodResolver(editAssessmentSchema),
        defaultValues: {
            description: assessment.description ?? '',
            branchId: assessment.branchId?.toString() ?? '',
            sportId: assessment.sportId?.toString() ?? '',
            numberOfSeats: assessment.numberOfSeats?.toString() ?? '',
            endDateOfBirth: new Date(assessment.endDateOfBirth!) ?? '',
            startDateOfBirth: new Date(assessment.startDateOfBirth!) ?? '',
        }
    })

    const onSubmit = async (values: z.infer<typeof editAssessmentSchema>) => {
        try {
            setLoading(true)

            if (!selectedGenders.length) return form.setError('root', {
                type: 'custom',
                message: 'Please select at least one gender'
            })

            const result = await updateAssessment(assessment.id, {
                description: values.description,
                branchId: parseInt(values.branchId),
                sportId: parseInt(values.sportId),
                gender: selectedGenders.join(','),
                startDateOfBirth: values.startDateOfBirth,
                endDateOfBirth: values.endDateOfBirth,
                numberOfSeats: parseInt(values.numberOfSeats),
                coaches: selectedCoaches,
                packagesData: createdPackages,
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

            setEditAssessmentOpen(false)
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

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setEditAssessmentOpen(true)}>
                <Image
                    src='/images/edit.svg'
                    alt='Edit'
                    width={20}
                    height={20}
                />
            </Button>
            <Dialog open={editAssessmentOpen} onOpenChange={setEditAssessmentOpen}>
                <DialogContent className='bg-main-white min-w-[1536px]'>
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
                                                    <AutoGrowingTextarea disabled={isLoading || isValidating || loading} field={{ ...field }} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex w-full gap-4 items-start justify-between">
                                        {/* <FormField
                                            control={form.control}
                                            name="branchId"
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Branch</FormLabel>
                                                    <Select disabled={isLoading || isValidating || loading} onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                                <SelectValue placeholder="Select a branch" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {branches.map((branch) => (
                                                                <SelectItem key={branch.id} value={branch.id.toString()}>
                                                                    {branch.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        /> */}

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
                                                            <button disabled={isLoading || isValidating || loading}
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
                                                            variant="default" disabled={isLoading || isValidating || loading}
                                                            className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                                        >
                                                            Select genders
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-56 p-0" align="start">
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
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex w-full gap-4 items-start justify-between">
                                        <FormField
                                            control={form.control}
                                            name='startDateOfBirth'
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col flex-1">
                                                    <FormLabel>Start Age</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"} disabled={isLoading || isValidating || loading}
                                                                    className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter w-full bg-transparent'
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name='endDateOfBirth'
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col flex-1">
                                                    <FormLabel>End Age</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"} disabled={isLoading || isValidating || loading}
                                                                    className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter w-full bg-transparent'
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
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
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name='numberOfSeats'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Number of Slots</FormLabel>
                                                <FormControl>
                                                    <Input disabled={isLoading || isValidating || loading} {...field} type="number" min="1" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="w-full max-w-screen-2xl overflow-x-auto mx-auto">
                                        <div className="min-w-full grid grid-cols-[0.75fr,auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
                                            {/* Header */}
                                            <div className="contents">
                                                <div />
                                                <div />
                                                <div />
                                                <div />
                                                <div />
                                                <div className="py-4 flex items-center justify-center">
                                                    <button type='button' disabled={isLoading || isValidating || loading} onClick={() => setPackagesOpen(true)} className='flex text-main-yellow text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm'>
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

                                            {/* Package Rows */}
                                            {createdPackages.map((packageData, index) => (
                                                <Fragment key={index}>
                                                    <div className="py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-start font-bold font-inter">{packageData.name}</div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{packageData.price}</div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{packageData.startDate.toLocaleDateString()}</div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{packageData.endDate.toLocaleDateString()}</div>
                                                    <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{packageData.schedules.length}</div>
                                                    <div className="py-4 px-4 bg-main-white gap-4 rounded-r-[20px] flex items-center justify-end font-bold font-inter">
                                                        <Button disabled={isLoading || isValidating || loading} type='button' variant="ghost" size="icon" onClick={() => { setEditedPackage({ editedPackage: packageData, index }); setEditPackageOpen(true); }}>
                                                            <Image
                                                                src='/images/edit.svg'
                                                                alt='Edit'
                                                                width={20}
                                                                height={20}
                                                            />
                                                        </Button>
                                                        <TrashIcon className="h-4 w-4 cursor-pointer" onClick={() => setCreatedPackages(createdPackages.filter((_, i) => i !== index))} />
                                                    </div>
                                                </Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <AddPackage onOpenChange={setPackagesOpen} open={packagesOpen} setCreatedPackages={setCreatedPackages} />
            {editedPackage?.editedPackage && (
                <EditPackage
                    packageEdited={editedPackage.editedPackage}
                    open={editPackageOpen}
                    onOpenChange={setEditPackageOpen}
                    setEditedPackage={setEditedPackage}
                    mutate={mutate}
                    index={editedPackage.index}
                    setCreatedPackages={setCreatedPackages}
                />
            )}
        </>
    )
}