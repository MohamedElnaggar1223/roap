'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createPackage } from '@/lib/actions/packages.actions';
import { Download, Eye, EyeOff, Loader2, TrashIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useOnboarding } from '@/providers/onboarding-provider';
import { DateSelector } from '@/components/shared/date-selector';
import { useToast } from '@/hooks/use-toast';
import { useGendersStore, useProgramsStore } from '@/providers/store-provider';
import { Badge } from '@/components/ui/badge';
import ImportSchedulesDialog from './import-schedules-dialog';
import { cn } from '@/lib/utils';
import { monthsToAge, ageToMonths } from '@/lib/utils/age-calculations';
import {
    mapToBackendType,
    calculateEndDate,
    requiresAutoDateCalculation,
    getPackageTypeOptions,
    type FrontendPackageType
} from '@/lib/utils/package-types';

const packageSchema = z.object({
    type: z.enum(["Term", "Monthly", "Full Season", "Assessment", "3 Months", "6 Months", "Annual"]),
    termNumber: z.string().optional(),
    name: z.string().optional(),
    price: z.string().min(1, "Price is required"),
    startDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date({
        required_error: "End date is required",
    }),
    memo: z.string().optional().nullable(),
    entryFees: z.string().default("0"),
    entryFeesExplanation: z.string().optional(),
    entryFeesAppliedUntil: z.array(z.string()).default([]).optional(),
    entryFeesStartDate: z.date().optional(),
    entryFeesEndDate: z.date().optional(),
    schedules: z.array(z.object({
        day: z.string().min(1, "Day is required"),
        from: z.string().min(1, "Start time is required"),
        to: z.string().min(1, "End time is required"),
        memo: z.string().optional().nullable(),
        id: z.number().optional(),
        capacity: z.string(),
        capacityType: z.enum(["normal", "unlimited"]).default("normal"),
        startAge: z.number().min(0, "Start age must be 0 or greater").max(100, "Start age must be 100 or less").multipleOf(0.5, "Start age must be in increments of 0.5").nullable(),
        startAgeUnit: z.enum(["months", "years"]),
        endAge: z.number().min(0, "End age must be 0.5 or greater").max(100, "End age must be 100 or less").multipleOf(0.5, "End age must be in increments of 0.5").optional().nullable(),
        endAgeUnit: z.enum(["months", "years", "unlimited"]),
        gender: z.string().min(1, "Gender is required").nullable(),
        hidden: z.boolean().default(false),
        startAgeMonths: z.number().optional().nullable(),
        endAgeMonths: z.number().optional().nullable(),
        isEndAgeUnlimited: z.boolean().optional()
    }))
}).refine((data) => {
    if (parseFloat(data.entryFees) > 0 && !data.entryFeesExplanation) {
        return false;
    }
    if (data.type === "Monthly" && parseFloat(data.entryFees) > 0 && data.entryFeesAppliedUntil?.length === 0) {
        return false;
    }
    if (data.type !== "Monthly" && parseFloat(data.entryFees) > 0 && (!data.entryFeesStartDate || !data.entryFeesEndDate)) {
        return false;
    }
    return true;
}, {
    message: "Required fields missing for entry fees configuration",
    path: ["entryFeesExplanation"]
});

interface Package {
    type: "Term" | "Monthly" | "Full Season" | 'Assessment' | "3 Months" | "6 Months" | "Annual"
    termNumber?: number
    name: string
    price: number
    startDate: Date
    endDate: Date
    schedules: Schedule[]
    memo: string | null
    entryFees: number
    entryFeesExplanation?: string
    entryFeesAppliedUntil?: string[]
    entryFeesStartDate?: Date
    entryFeesEndDate?: Date
    id?: number
}

interface Schedule {
    day: string
    from: string
    to: string
    memo: string | undefined
    id?: number
    capacity: number | null
    startDateOfBirth: Date | null
    endDateOfBirth: Date | null
    gender: string | null
    hidden?: boolean // Add this field
    startAgeMonths?: number | null
    endAgeMonths?: number | null
    isEndAgeUnlimited?: boolean
}

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    programId?: number
    setCreatedPackages?: React.Dispatch<React.SetStateAction<Package[]>>
    packagesLength?: number
    branchId: number
}

const days = {
    sun: "Sunday",
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
}

const months = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 }
];

export const calculateAgeFromDate = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);

    // Calculate total months
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months += today.getMonth() - birth.getMonth();

    // Adjust for day of month
    if (today.getDate() < birth.getDate()) {
        months--;
    }

    // First check if it's cleanly divisible by 12
    if (Math.abs(Math.round(months) - 12 * Math.round(months / 12)) < 0.1) {
        return {
            age: Math.round(months / 12),
            unit: 'years'
        };
    }

    // If less than or equal to 18 months and not cleanly divisible by 12
    if (months <= 18) {
        return {
            age: Math.round(months),
            unit: 'months'
        };
    }

    // Convert to years
    const years = months / 12;
    const roundedToHalfYear = Math.round(years * 2) / 2;

    return {
        age: roundedToHalfYear,
        unit: 'years'
    };
};

const calculateDateFromAge = (age: number, unit: string): Date => {
    const date = new Date();

    if (unit === 'months') {
        // For months input, check if it can be converted to a clean year interval
        const years = age / 12;
        const roundedToHalfYear = Math.round(years * 2) / 2;

        if (Math.abs(years - roundedToHalfYear) < 0.01) {
            // If it can be represented as a clean half-year, convert to years
            const years = Math.floor(roundedToHalfYear);
            const monthsFraction = (roundedToHalfYear - years) * 12;
            date.setFullYear(date.getFullYear() - years);
            date.setMonth(date.getMonth() - Math.round(monthsFraction));
        } else {
            // Otherwise keep as months
            date.setMonth(date.getMonth() - age);
        }
    } else { // years
        const years = Math.floor(age);
        const monthsFraction = (age - years) * 12;
        date.setFullYear(date.getFullYear() - years);
        date.setMonth(date.getMonth() - Math.round(monthsFraction));
    }

    return date;
};

export default function AddPackage({ open, onOpenChange, programId, setCreatedPackages, packagesLength, branchId }: Props) {
    const router = useRouter()

    const { toast } = useToast()

    const { mutate } = useOnboarding()

    const genders = useGendersStore((state) => state.genders).map((g) => g.name)
    const fetched = useGendersStore((state) => state.fetched)
    const fetchGenders = useGendersStore((state) => state.fetchGenders)

    useEffect(() => {
        if (!fetched) {
            fetchGenders()
        }
    }, [fetched])

    const [loading, setLoading] = useState(false)
    const [scheduleGenders, setScheduleGenders] = useState<Record<number, string[]>>({})
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
    const [importSchedulesOpen, setImportSchedulesOpen] = useState(false);
    const [unifyGender, setUnifyGender] = useState(false);
    const [unifyAges, setUnifyAges] = useState(false);

    const form = useForm<z.infer<typeof packageSchema>>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            type: "Assessment",
            price: '',
            termNumber: packagesLength ? (packagesLength + 1).toString() : '1',
            memo: '',
            entryFees: '0',
            schedules: [{
                day: '', from: '', to: '', memo: '',
                startAge: 0, startAgeUnit: 'years',
                endAge: undefined, endAgeUnit: 'unlimited',
                gender: null, capacity: '9999', capacityType: 'unlimited', hidden: false,
                startAgeMonths: 0, endAgeMonths: null, isEndAgeUnlimited: true
            }],
            entryFeesStartDate: undefined,
            entryFeesEndDate: undefined
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "schedules"
    })

    const unifyAgesRef = useRef(unifyAges);
    const unifyGenderRef = useRef(unifyGender);

    const [ran, setRan] = useState(false)

    useEffect(() => {
        unifyAgesRef.current = unifyAges;
    }, [unifyAges]);

    useEffect(() => {
        unifyGenderRef.current = unifyGender;
    }, [unifyGender]);

    useEffect(() => {
        setRan(true)
    }, [])

    useEffect(() => {
        if (fields.length > 0) {
            if (unifyGender) {
                // Take the first non-empty gender array as reference, or the first one if all are empty
                const referenceIndex = Object.entries(scheduleGenders).find(([_, genders]) => genders.length > 0)?.[0] || '0';
                const referenceGenders = scheduleGenders[parseInt(referenceIndex)] || [];

                // Create unified genders object
                const unifiedGenders = Object.fromEntries(
                    fields.map((_, idx) => [idx, referenceGenders])
                );

                // Update all schedules
                setScheduleGenders(unifiedGenders);

                // Update all form fields
                fields.forEach((_, idx) => {
                    form.setValue(`schedules.${idx}.gender`, referenceGenders.join(','));
                });
            }
            // When turning off unification, ensure all form fields maintain their current values
            else {
                if (!ran) return
                fields.forEach((_, idx) => {
                    const currentGenders = scheduleGenders[idx] || [];
                    form.setValue(`schedules.${idx}.gender`, currentGenders.join(','));
                });
            }
        }
    }, [unifyGender]);

    const packageType = form.watch("type")
    const entryFees = parseFloat(form.watch("entryFees") || "0")
    const showEntryFeesFields = entryFees > 0

    const onSubmit = async (values: z.infer<typeof packageSchema>) => {
        try {
            const missingFields: string[] = handleToastValidation();

            const transformedSchedules = values.schedules.map((schedule, index) => {
                if (!schedule.startAge) {
                    missingFields.push('Start Age ' + (index + 1));
                    return {
                        ...schedule,
                        startDateOfBirth: null,
                        endDateOfBirth: null,
                        capacity: parseInt(schedule.capacity),
                        hidden: schedule.hidden,
                        // Add default values for age months fields
                        startAgeMonths: null,
                        endAgeMonths: null,
                        isEndAgeUnlimited: true
                    };
                };

                // Calculate date-based values (for backward compatibility)
                const startDate = calculateDateFromAge(schedule.startAge, schedule.startAgeUnit);

                // Calculate month-based values (new approach)
                const startAgeMonths = ageToMonths(schedule.startAge, schedule.startAgeUnit);

                let endDate;
                let endAgeMonths = null;
                const isEndAgeUnlimited = schedule.endAgeUnit === 'unlimited';

                if (isEndAgeUnlimited) {
                    // For unlimited, use a very old date (100 years)
                    endDate = new Date();
                    endDate.setFullYear(endDate.getFullYear() - 100);
                    // No need to set endAgeMonths for unlimited
                } else {
                    if (!schedule.endAge) {
                        missingFields.push('End Age ' + (index + 1));
                        return {
                            ...schedule,
                            startDateOfBirth: null,
                            endDateOfBirth: null,
                            capacity: parseInt(schedule.capacity),
                            hidden: schedule.hidden,
                            // Add default values for age months fields
                            startAgeMonths: null,
                            endAgeMonths: null,
                            isEndAgeUnlimited: true
                        };
                    }
                    endDate = calculateDateFromAge(schedule.endAge, schedule.endAgeUnit);
                    endAgeMonths = ageToMonths(schedule.endAge, schedule.endAgeUnit);
                }

                return {
                    ...schedule,
                    startDateOfBirth: startDate,
                    endDateOfBirth: endDate,
                    capacity: parseInt(schedule.capacity),
                    hidden: schedule.hidden,
                    // Add the new fields
                    startAgeMonths: startAgeMonths,
                    endAgeMonths: endAgeMonths,
                    isEndAgeUnlimited: isEndAgeUnlimited
                }
            })

            if (missingFields.length > 0) return

            if (programId) {
                setLoading(true)
                const backendType = mapToBackendType(values.type as FrontendPackageType);
                const packageName = values.type === "Assessment" ?
                    `Assessment ${values.termNumber}` :
                    backendType === "Monthly" ?
                        `Monthly ${values.name ?? ''}` :
                        backendType === "Term" ?
                            (values.type === "Term" ? `Term ${values.termNumber}` : `Term ${values.type}`) :
                            values.name

                let finalStartDate = values.startDate;
                let finalEndDate = values.endDate;

                if (values.type === "Monthly" && selectedMonths.length > 0) {
                    const sortedMonths = [...selectedMonths].sort((a, b) => a - b);
                    const currentYear = new Date().getFullYear();
                    finalStartDate = new Date(currentYear, sortedMonths[0] - 1, 1);
                    finalEndDate = new Date(currentYear, sortedMonths[sortedMonths.length - 1] - 1, 1);
                }

                const result = await createPackage({
                    name: packageName!,
                    price: parseFloat(values.price),
                    startDate: finalStartDate.toISOString(),
                    endDate: finalEndDate.toISOString(),
                    programId,
                    memo: values.memo,
                    entryFees: parseFloat(values.entryFees),
                    entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                    entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                        values.entryFeesAppliedUntil : undefined,
                    entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesStartDate?.toISOString() : undefined,
                    entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesEndDate?.toISOString() : undefined,
                    schedules: transformedSchedules.map(schedule => ({
                        day: schedule.day,
                        from: schedule.from,
                        to: schedule.to,
                        memo: schedule.memo ?? '',
                        startDateOfBirth: schedule.startDateOfBirth ? format(schedule.startDateOfBirth, 'yyyy-MM-dd 00:00:00') : undefined,
                        endDateOfBirth: schedule.endDateOfBirth ? format(schedule.endDateOfBirth, 'yyyy-MM-dd 00:00:00') : undefined,
                        gender: schedule.gender,
                        capacity: schedule.capacity,
                        hidden: schedule.hidden,
                        startAgeMonths: schedule.startAgeMonths,
                        endAgeMonths: schedule.endAgeMonths,
                        isEndAgeUnlimited: schedule.isEndAgeUnlimited
                    })),
                    capacity: 99999,
                    type: backendType
                })

                if (result?.error) {
                    form.setError('root', {
                        type: 'custom',
                        message: result.error
                    })
                    return
                }

                onOpenChange(false)
                mutate()
                router.refresh()
            }
            else if (setCreatedPackages) {
                const backendType = mapToBackendType(values.type as FrontendPackageType);
                const packageName = values.type === "Assessment" ?
                    `Assessment ${values.termNumber}` :
                    backendType === "Monthly" ?
                        `Monthly ${values.name ?? ''}` :
                        backendType === "Term" ?
                            (values.type === "Term" ? `Term ${values.termNumber}` : `Term ${values.type}`) :
                            values.name

                setCreatedPackages(prev => [...prev, {
                    name: packageName ?? '',
                    price: parseFloat(values.price),
                    startDate: values.startDate,
                    endDate: values.endDate,
                    schedules: transformedSchedules.map(schedule => ({
                        ...schedule,
                        memo: schedule.memo ?? '',
                        startDateOfBirth: schedule.startDateOfBirth ? new Date(schedule.startDateOfBirth) : null,
                        endDateOfBirth: schedule.endDateOfBirth ? new Date(schedule.endDateOfBirth) : null,
                        gender: schedule.gender,
                        capacity: schedule.capacity,
                        hidden: schedule.hidden,
                        startAgeMonths: schedule.startAgeMonths,
                        endAgeMonths: schedule.endAgeMonths,
                        isEndAgeUnlimited: schedule.isEndAgeUnlimited
                    })),
                    memo: values.memo ?? '',
                    entryFees: parseFloat(values.entryFees),
                    entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                    entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                        values.entryFeesAppliedUntil : undefined,
                    entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesStartDate : undefined,
                    entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesEndDate : undefined,
                    type: backendType
                }])
                onOpenChange(false)
            }
        } catch (error) {
            console.error('Error creating package:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleMonthSelect = (monthValue: number, isChecked: boolean) => {
        const currentYear = new Date().getFullYear();

        if (isChecked) {
            if (selectedMonths.length === 0) {
                setSelectedMonths([monthValue]);
                form.setValue("startDate", new Date(currentYear, monthValue - 1, 1));
                form.setValue("endDate", new Date(currentYear, monthValue - 1, 1));
                return;
            }

            const allMonths = [...selectedMonths, monthValue];
            const firstMonth = Math.min(...allMonths);
            const lastMonth = Math.max(...allMonths);

            const monthsInRange = Array.from(
                { length: lastMonth - firstMonth + 1 },
                (_, i) => firstMonth + i
            );
            setSelectedMonths(monthsInRange);

            form.setValue("startDate", new Date(currentYear, firstMonth - 1, 1));
            form.setValue("endDate", new Date(currentYear, lastMonth - 1, 1));
        } else {
            const newSelectedMonths = selectedMonths.filter(m => m < monthValue);
            setSelectedMonths(newSelectedMonths);

            if (newSelectedMonths.length > 0) {
                const firstMonth = Math.min(...newSelectedMonths);
                const lastMonth = Math.max(...newSelectedMonths);
                form.setValue("startDate", new Date(currentYear, firstMonth - 1, 1));
                form.setValue("endDate", new Date(currentYear, lastMonth - 1, 1));
            } else {
                const defaultDate = new Date(currentYear, 0, 1);
                form.setValue("startDate", defaultDate);
                form.setValue("endDate", defaultDate);
            }
        }
    };

    const handleToastValidation = () => {
        const values = form.getValues()
        const missingFields: string[] = [];

        // Check basic required fields
        if (!values.price) missingFields.push('Price');

        // Check dates based on package type
        if (values.type === "Monthly") {
            if (selectedMonths.length === 0) missingFields.push('Months');
        } else {
            if (!values.startDate) missingFields.push('Start Date');
            if (!values.endDate) missingFields.push('End Date');
        }

        // Check sessions
        if (!values.schedules || values.schedules.length === 0) {
            missingFields.push('At least one session');
        } else {
            values.schedules.forEach((schedule, index) => {
                if (!schedule.day) missingFields.push(`Session ${index + 1} Day`);
                if (!schedule.from) missingFields.push(`Session ${index + 1} Start Time`);
                if (!schedule.to) missingFields.push(`Session ${index + 1} End Time`);
                if (!schedule.startAge) missingFields.push(`Session ${index + 1} Start Age`);
                if (!schedule.endAge && schedule.endAgeUnit !== 'unlimited') missingFields.push(`Session ${index + 1} End Age`);
                if (!schedule.gender) missingFields.push(`Session ${index + 1} Gender`);
            });
        }

        // Check entry fees related fields if entry fees is set
        const entryFees = parseFloat(values.entryFees || "0");
        if (entryFees > 0) {
            if (!values.entryFeesExplanation) {
                missingFields.push('Entry Fees Explanation');
            }
            if (values.type === "Monthly" && (!values.entryFeesAppliedUntil || values.entryFeesAppliedUntil.length === 0)) {
                missingFields.push('Entry Fees Applied For');
            }
            if (values.type !== "Monthly") {
                if (!values.entryFeesStartDate) missingFields.push('Entry Fees Start Date');
                if (!values.entryFeesEndDate) missingFields.push('Entry Fees End Date');
            }
        }

        if (missingFields.length > 0) {
            toast({
                title: "Missing Required Fields",
                description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
                variant: "destructive",
            });
        }

        return missingFields;
    };

    const generateAgeOptions = () => {
        const options = [];
        for (let i = 1; i <= 64; i++) {
            options.push({
                label: `${i} year${i > 1 ? 's' : ''}`,
                value: i.toString()
            });
        }
        options.push({
            label: 'Unlimited',
            value: '100'
        })
        return options;
    }

    const getDateFromAge = (ageInYears: number) => {
        const date = new Date();
        date.setFullYear(date.getFullYear() - ageInYears);
        return date;
    }

    const getAgeFromDate = (date: Date) => {
        const today = new Date();
        const birthDate = new Date(date);
        let age = today.getFullYear() - birthDate.getFullYear();

        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='bg-main-white max-lg:max-w-[100vw] lg:min-w-[820px]'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full max-lg:max-w-[90vw]'>
                        <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                            <DialogTitle className='font-normal text-base'>New Package</DialogTitle>
                            <div className='flex items-center gap-2'>
                                <button onClick={handleToastValidation} disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                    {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                    Create
                                </button>
                            </div>
                        </DialogHeader>
                        <div className="w-full max-h-[380px] overflow-y-auto">
                            <div className="flex flex-col gap-6 w-full px-2">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem className='absolute hidden'>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className='!bg-[#F1F2E9]'>
                                                    <SelectItem value="Monthly">Monthly</SelectItem>
                                                    <SelectItem value="Term">Term</SelectItem>
                                                    <SelectItem value="Full Season">Full Season</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {packageType === "Term" ? (
                                    <FormField
                                        control={form.control}
                                        name="termNumber"
                                        render={({ field }) => (
                                            <FormItem className='absolute hidden'>
                                                <FormLabel>Term Number</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center">
                                                        <span className="px-2 py-3.5 text-sm bg-transparent border border-r-0 border-gray-500 rounded-l-[10px]">Term</span>
                                                        <Input {...field} type="number" min="1" className='px-2 py-6 rounded-l-none rounded-r-[10px] border border-gray-500 font-inter' />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : packageType === 'Full Season' ? (
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
                                ) : null}

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price <span className='text-xs text-red-500'>(All Prices Include VAT)</span></FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <span className="px-2 py-3.5 text-sm bg-transparent border border-r-0 border-gray-500 rounded-l-[10px]">AED</span>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className='px-2 py-6 rounded-l-none rounded-r-[10px] border border-gray-500 font-inter'
                                                        onChange={(event) => {
                                                            const value = event.target.value.replace(/[a-zA-Z]/g, '');
                                                            field.onChange(value);
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {packageType === "Monthly" ? (
                                    <div className="space-y-4">
                                        <FormLabel>Select Months</FormLabel>
                                        <div className="grid grid-cols-3 gap-4">
                                            {months.map((month) => (
                                                <label
                                                    key={month.value}
                                                    className="flex items-center space-x-2 cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={selectedMonths.includes(month.value)}
                                                        onCheckedChange={(checked) =>
                                                            handleMonthSelect(month.value, checked === true)
                                                        }
                                                        className='data-[state=checked]:!bg-main-green'
                                                    />
                                                    <span>{month.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ) : !requiresAutoDateCalculation(packageType as FrontendPackageType) ? (
                                    <div className="flex gap-4 max-lg:flex-col">
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>Start Date</FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>End Date</FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">
                                            Start Date: <span className="font-medium">{new Date().toLocaleDateString()}</span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            End Date: <span className="font-medium">
                                                {calculateEndDate(packageType as FrontendPackageType).toLocaleDateString()}
                                            </span>
                                        </p>
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="entryFees"
                                    render={({ field }) => (
                                        <FormItem className='hidden absolute'>
                                            <FormLabel>Entry Fees <span className='text-xs text-red-500'>(All Prices Include VAT)</span></FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <span className="px-2 py-3.5 text-sm bg-transparent border border-r-0 border-gray-500 rounded-l-[10px]">AED</span>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className='px-2 py-6 rounded-l-none rounded-r-[10px] border border-gray-500 font-inter'
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {showEntryFeesFields && (
                                    <FormField
                                        control={form.control}
                                        name="entryFeesExplanation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Entry Fees Explanation</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        className="min-h-[60px] rounded-[10px] border border-gray-500 font-inter"
                                                        placeholder="Explain the entry fees..."
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {showEntryFeesFields && packageType === "Monthly" && (
                                    <FormField
                                        control={form.control}
                                        name="entryFeesAppliedUntil"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Entry Fees Applied For</FormLabel>
                                                <div className="grid grid-cols-3 gap-4 border rounded-[10px] p-4">
                                                    {selectedMonths.map((monthNum) => {
                                                        const month = months.find(m => m.value === monthNum);
                                                        return month ? (
                                                            <label
                                                                key={month.value}
                                                                className="flex items-center space-x-2 cursor-pointer"
                                                            >
                                                                <Checkbox
                                                                    checked={field.value?.includes(month.label)}
                                                                    onCheckedChange={(checked) => {
                                                                        const updatedMonths = checked
                                                                            ? [...(field.value ?? []), month.label]
                                                                            : field.value?.filter((m: string) => m !== month.label);
                                                                        field.onChange(updatedMonths);
                                                                    }}
                                                                    className='data-[state=checked]:!bg-main-green'
                                                                />
                                                                <span>{month.label}</span>
                                                            </label>
                                                        ) : null;
                                                    })}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {showEntryFeesFields && packageType !== "Monthly" && (
                                    <div className="flex gap-4">
                                        <FormField
                                            control={form.control}
                                            name="entryFeesStartDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>Entry Fees Start Date</FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="entryFeesEndDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>Entry Fees End Date</FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                <>
                                    <div className="flex items-center justify-between">
                                        <div></div>
                                        <Button
                                            type="button"
                                            onClick={() => setImportSchedulesOpen(true)}
                                            variant="outline"
                                            className="gap-2 text-main-green border-main-green hover:bg-main-green/10"
                                        >
                                            <Download className="h-4 w-4" />
                                            Import Schedules
                                        </Button>
                                    </div>

                                    <ImportSchedulesDialog
                                        open={importSchedulesOpen}
                                        onOpenChange={setImportSchedulesOpen}
                                        branchId={branchId}
                                        onScheduleImport={(importedSchedules) => {


                                            const processedSchedules = importedSchedules.map(schedule => ({
                                                day: schedule.day,
                                                from: schedule.from,
                                                to: schedule.to,
                                                memo: schedule.memo ?? '',
                                                startAge: 0,
                                                startAgeUnit: 'years' as 'months' | 'years',
                                                endAge: undefined,
                                                endAgeUnit: 'unlimited' as 'months' | 'years' | 'unlimited',
                                                gender: schedule.gender,
                                                capacity: typeof schedule?.capacity === 'number' ? schedule?.capacity?.toString() : typeof schedule?.capacity === 'string' ? schedule?.capacity : '9999',
                                                capacityType: (typeof schedule?.capacity === 'number' ? schedule?.capacity?.toString() === '9999' ? 'unlimited' : 'normal' : typeof schedule?.capacity === 'string' ? schedule?.capacity === '9999' ? 'unlimited' : 'normal' : 'unlimited') as 'unlimited' | 'normal',
                                                hidden: schedule.hidden ?? false
                                            }));

                                            // Create initial genders tracking
                                            const newScheduleGenders: Record<number, string[]> = {};
                                            importedSchedules.forEach((schedule, index) => {
                                                if (schedule.gender) {
                                                    newScheduleGenders[index] = schedule.gender.split(',');
                                                } else {
                                                    newScheduleGenders[index] = [];
                                                }
                                            });

                                            // Apply unification if needed
                                            if (unifyGender) {
                                                // Find the first non-empty gender to use as reference
                                                const referenceGenders = Object.values(newScheduleGenders).find(g => g.length > 0) || [];

                                                // Apply to all schedules
                                                importedSchedules.forEach((_, index) => {
                                                    newScheduleGenders[index] = [...referenceGenders];
                                                    processedSchedules[index].gender = referenceGenders.join(',');
                                                });
                                            }

                                            if (unifyAges) {
                                                // Use the first schedule's ages as reference
                                                const referenceStartAge = processedSchedules[0].startAge;
                                                const referenceStartAgeUnit = processedSchedules[0].startAgeUnit;
                                                const referenceEndAge = processedSchedules[0].endAge;
                                                const referenceEndAgeUnit = processedSchedules[0].endAgeUnit;

                                                // Apply to all schedules
                                                processedSchedules.forEach((schedule, index) => {
                                                    if (index !== 0) { // Skip the first one as it's our reference
                                                        schedule.startAge = referenceStartAge;
                                                        schedule.startAgeUnit = referenceStartAgeUnit;
                                                        schedule.endAge = referenceEndAge;
                                                        schedule.endAgeUnit = referenceEndAgeUnit;
                                                    }
                                                });
                                            }

                                            setScheduleGenders(newScheduleGenders);
                                            form.setValue('schedules', processedSchedules);

                                        }}
                                    />
                                </>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Sessions</FormLabel>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="unifyGender"
                                                    checked={unifyGender}
                                                    onCheckedChange={(checked) => setUnifyGender(checked as boolean)}
                                                    className='data-[state=checked]:!bg-main-green'
                                                />
                                                <label htmlFor="unifyGender" className="text-sm cursor-pointer">
                                                    Unify Gender
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="unifyAges"
                                                    checked={unifyAges}
                                                    onCheckedChange={(checked) => {
                                                        setUnifyAges(checked as boolean);
                                                        if (checked) {
                                                            // When checking the box, sync all fields to the first schedule's values
                                                            const firstSchedule = form.getValues('schedules.0');
                                                            fields.forEach((_, idx) => {
                                                                if (idx !== 0) { // Skip the first one
                                                                    form.setValue(`schedules.${idx}.startAge`, firstSchedule.startAge);
                                                                    form.setValue(`schedules.${idx}.startAgeUnit`, firstSchedule.startAgeUnit);
                                                                    form.setValue(`schedules.${idx}.endAge`, firstSchedule.endAge);
                                                                    form.setValue(`schedules.${idx}.endAgeUnit`, firstSchedule.endAgeUnit);
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className='data-[state=checked]:!bg-main-green'
                                                />
                                                <label htmlFor="unifyAges" className="text-sm cursor-pointer">
                                                    Unify Ages
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {fields.map((field, index) => (
                                        <div key={field.id} className="space-y-4 p-4 border rounded-lg relative pt-8 bg-[#E0E4D9] overflow-hidden">
                                            <p className='text-xs'>Session {index + 1}</p>
                                            <div className="absolute right-2 top-2 flex items-center gap-2">
                                                {/* Add visibility toggle button */}
                                                <FormField
                                                    control={form.control}
                                                    name={`schedules.${index}.hidden`}
                                                    render={({ field }) => (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => field.onChange(!field.value)}
                                                            className="p-1"
                                                            title={field.value ? "Show schedule" : "Hide schedule"}
                                                        >
                                                            {field.value ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                />

                                                {/* Existing delete button */}
                                                {fields.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name={`schedules.${index}.day`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className='border border-gray-500 bg-transparent'>
                                                                    <SelectValue placeholder="Select day" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className='!bg-[#F1F2E9]'>
                                                                {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
                                                                    <SelectItem key={day} value={day}>
                                                                        {days[day as keyof typeof days]}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`schedules.${index}.from`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>From</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="time"
                                                                    step="60"
                                                                    className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`schedules.${index}.to`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>To</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="time"
                                                                    step="60"
                                                                    className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="flex w-full gap-4 items-start justify-between">
                                                <div className="flex flex-1 gap-2 max-lg:flex-col">
                                                    <FormField
                                                        control={form.control}
                                                        name={`schedules.${index}.startAge`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col flex-1">
                                                                <FormLabel>Start Age <span className='text-xs text-red-500'>*</span></FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        onChange={e => {
                                                                            const newValue = Number(e.target.value);
                                                                            // Just update the current field
                                                                            field.onChange(newValue);

                                                                            // Only sync others if unification is active
                                                                            if (unifyAgesRef.current) {
                                                                                fields.forEach((_, idx) => {
                                                                                    if (idx !== index) { // Skip the current field as it's already updated
                                                                                        form.setValue(`schedules.${idx}.startAge`, newValue);
                                                                                    }
                                                                                });
                                                                            }
                                                                        }}
                                                                        step={form.watch(`schedules.${index}.startAgeUnit`) === 'months' ? 1 : 0.5}
                                                                        min={0}
                                                                        max={100}
                                                                        disabled={loading}
                                                                        className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`schedules.${index}.startAgeUnit`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col flex-1">
                                                                <FormLabel>Unit</FormLabel>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        // Just update the current field
                                                                        field.onChange(value);

                                                                        // Only sync others if unification is active
                                                                        if (unifyAgesRef.current) {
                                                                            fields.forEach((_, idx) => {
                                                                                if (idx !== index) { // Skip the current field as it's already updated
                                                                                    form.setValue(`schedules.${idx}.startAgeUnit`, value as 'months' | 'years');
                                                                                }
                                                                            });
                                                                        }
                                                                    }}
                                                                    defaultValue={field.value}
                                                                    disabled={loading}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                                            <SelectValue placeholder="Select unit" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className='!bg-[#F1F2E9]'>
                                                                        <SelectItem value="months">Months</SelectItem>
                                                                        <SelectItem value="years">Years</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="flex flex-1 gap-2 max-lg:flex-col">
                                                    <FormField
                                                        control={form.control}
                                                        name={`schedules.${index}.endAge`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col flex-1">
                                                                <FormLabel>End Age <span className='text-xs text-red-500'>*</span></FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        onChange={e => {
                                                                            const newValue = Number(e.target.value);
                                                                            // Just update the current field
                                                                            field.onChange(newValue);

                                                                            // Only sync others if unification is active
                                                                            if (unifyAgesRef.current) {
                                                                                fields.forEach((_, idx) => {
                                                                                    if (idx !== index) { // Skip the current field as it's already updated
                                                                                        form.setValue(`schedules.${idx}.endAge`, newValue);
                                                                                    }
                                                                                });
                                                                            }
                                                                        }}
                                                                        step={form.watch(`schedules.${index}.endAgeUnit`) === 'months' ? 1 : 0.5}
                                                                        min={0}
                                                                        max={100}
                                                                        disabled={loading || form.watch(`schedules.${index}.endAgeUnit`) === 'unlimited'}
                                                                        className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`schedules.${index}.endAgeUnit`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col flex-1">
                                                                <FormLabel>Unit</FormLabel>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        // Just update the current field
                                                                        field.onChange(value);

                                                                        // Only sync others if unification is active
                                                                        if (unifyAgesRef.current) {
                                                                            fields.forEach((_, idx) => {
                                                                                if (idx !== index) { // Skip the current field as it's already updated
                                                                                    form.setValue(`schedules.${idx}.endAgeUnit`, value as 'months' | 'years' | 'unlimited');
                                                                                }
                                                                            });
                                                                        }
                                                                    }}
                                                                    defaultValue={field.value}
                                                                    disabled={loading}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                                            <SelectValue placeholder="Select unit" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className='!bg-[#F1F2E9]'>
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

                                            {/* Add gender selection */}
                                            <FormField
                                                control={form.control}
                                                name={`schedules.${index}.gender`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Gender</FormLabel>
                                                        <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                                                            <div className="flex flex-wrap gap-2">
                                                                {scheduleGenders[index]?.map((gender) => (
                                                                    <Badge
                                                                        key={gender}
                                                                        variant="default"
                                                                        className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                                                    >
                                                                        <span className="text-xs">{gender}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newGenders = scheduleGenders[index].filter(g => g !== gender);

                                                                                if (unifyGenderRef.current) {
                                                                                    // Update all schedules
                                                                                    const unifiedGenders = Object.fromEntries(
                                                                                        fields.map((_, idx) => [idx, newGenders])
                                                                                    );
                                                                                    setScheduleGenders(unifiedGenders);

                                                                                    // Update all form fields
                                                                                    fields.forEach((_, idx) => {
                                                                                        form.setValue(`schedules.${idx}.gender`, newGenders.join(','));
                                                                                    });
                                                                                } else {
                                                                                    // Update only current schedule
                                                                                    setScheduleGenders(prev => ({
                                                                                        ...prev,
                                                                                        [index]: newGenders
                                                                                    }));
                                                                                    field.onChange(newGenders.join(','));
                                                                                }
                                                                            }}
                                                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                                                        >
                                                                            <X className="size-3" fill='#1f441f' />
                                                                            <span className="sr-only">Remove {gender}</span>
                                                                        </button>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="default"
                                                                        className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                                                    >
                                                                        Select genders
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-56 p-0" align="start">
                                                                    <div className="p-2">
                                                                        {genders.map(gender => (
                                                                            <p
                                                                                key={gender}
                                                                                onClick={() => {
                                                                                    const currentGenders = scheduleGenders[index] || [];
                                                                                    const newGenders = currentGenders.includes(gender)
                                                                                        ? currentGenders.filter(g => g !== gender)
                                                                                        : [...currentGenders, gender];

                                                                                    if (unifyGenderRef.current) {
                                                                                        // Update all schedules
                                                                                        const unifiedGenders = Object.fromEntries(
                                                                                            fields.map((_, idx) => [idx, newGenders])
                                                                                        );
                                                                                        setScheduleGenders(unifiedGenders);

                                                                                        // Update all form fields
                                                                                        fields.forEach((_, idx) => {
                                                                                            form.setValue(`schedules.${idx}.gender`, newGenders.join(','));
                                                                                        });
                                                                                    } else {
                                                                                        // Update only current schedule
                                                                                        setScheduleGenders(prev => ({
                                                                                            ...prev,
                                                                                            [index]: newGenders
                                                                                        }));
                                                                                        field.onChange(newGenders.join(','));
                                                                                    }
                                                                                }}
                                                                                className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                                            >
                                                                                {(scheduleGenders[index] || []).includes(gender) &&
                                                                                    <X className="size-3" fill='#1f441f' />
                                                                                }
                                                                                {gender}
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`schedules.${index}.capacity`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Session Capacity <span className='text-xs text-red-500'>*</span></FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="number"
                                                                    min="1"
                                                                    disabled={form.watch(`schedules.${index}.capacityType`) === "unlimited"}
                                                                    className={cn("px-2 py-6 rounded-[10px] border border-gray-500 font-inter", form.watch(`schedules.${index}.capacityType`) === "unlimited" && 'text-transparent')}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`schedules.${index}.capacityType`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Capacity Type</FormLabel>
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    field.onChange(value);
                                                                    if (value === "unlimited") {
                                                                        form.setValue(`schedules.${index}.capacity`, "9999");
                                                                    }
                                                                }}
                                                                value={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter">
                                                                        <SelectValue placeholder="Select type" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="!bg-[#F1F2E9]">
                                                                    <SelectItem value="normal">Slots</SelectItem>
                                                                    <SelectItem value="unlimited">Unlimited</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name={`schedules.${index}.memo`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Memo</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                className="min-h-[60px] rounded-[10px] border border-gray-500 font-inter"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-3xl text-main-yellow bg-main-green px-4 py-5 hover:bg-main-green hover:text-main-yellow w-full text-sm"
                                        onClick={() => {
                                            const newSchedule = {
                                                day: '',
                                                from: '',
                                                to: '',
                                                memo: '',
                                                startAge: 0 as number | null,
                                                startAgeUnit: 'years' as 'months' | 'years',
                                                endAge: undefined as number | null | undefined,
                                                endAgeUnit: 'unlimited' as 'months' | 'years' | 'unlimited',
                                                gender: null as string | null,
                                                capacity: '9999',
                                                capacityType: 'unlimited' as 'unlimited' | 'normal',
                                                hidden: false
                                            };

                                            // If unification is enabled, apply the unified values from the first schedule
                                            if (fields.length > 0) {
                                                if (unifyGender) {
                                                    // Get the gender from the first schedule with a non-empty gender
                                                    const referenceIndex = Object.entries(scheduleGenders)
                                                        .find(([_, genders]) => genders.length > 0)?.[0] || '0';
                                                    const referenceGenders = scheduleGenders[parseInt(referenceIndex)] || [];
                                                    newSchedule.gender = referenceGenders.join(',');

                                                    // Update the scheduleGenders state after appending
                                                    setTimeout(() => {
                                                        const newIndex = fields.length; // This will be the index of the newly added schedule
                                                        setScheduleGenders(prev => ({
                                                            ...prev,
                                                            [newIndex]: referenceGenders
                                                        }));
                                                    }, 0);
                                                }

                                                if (unifyAges) {
                                                    // Apply ages from the first schedule
                                                    const firstSchedule = form.getValues('schedules.0');
                                                    newSchedule.startAge = firstSchedule.startAge;
                                                    newSchedule.startAgeUnit = firstSchedule.startAgeUnit;
                                                    newSchedule.endAge = firstSchedule.endAge;
                                                    newSchedule.endAgeUnit = firstSchedule.endAgeUnit;
                                                }
                                            }

                                            append(newSchedule);
                                        }}
                                    >
                                        Add Session
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}