'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createPackage } from '@/lib/actions/packages.actions';
import { Loader2, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormDescription,
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
import { Package } from '@/stores/programs-store';
import { useProgramsStore } from '@/providers/store-provider';
import { v4 as uuid } from 'uuid';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formatTimeValue = (value: string) => {
    if (!value) return '';
    // Ensure the value is in HH:mm format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value)) return '';
    return value;
};

function getFirstAndLastDayOfMonths(months: string[]) {
    if (!months.length) {
        console.error("No months provided to getFirstAndLastDayOfMonths");
        throw new Error("At least one month must be selected");
    }

    console.log("Processing months:", months);

    const sortedMonths = [...months].sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA.getTime() - dateB.getTime();
    });

    // Get first day of first month
    const [firstMonth, firstYear] = sortedMonths[0].split(' ');
    const monthIndex = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3,
        'May': 4, 'June': 5, 'July': 6, 'August': 7,
        'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    // Create dates using UTC
    const startDate = new Date(Date.UTC(
        parseInt(firstYear),
        monthIndex[firstMonth as keyof typeof monthIndex],
        1,
        12, 0, 0, 0
    ));

    // Get last day of last month
    const [lastMonth, lastYear] = sortedMonths[sortedMonths.length - 1].split(' ');
    const lastMonthIndex = monthIndex[lastMonth as keyof typeof monthIndex];

    // Get the last day by moving to the first day of next month and subtracting one day
    const endDate = new Date(Date.UTC(
        parseInt(lastYear),
        lastMonthIndex + 1,
        0,  // This gives us the last day of the current month
        12, 0, 0, 0
    ));

    console.log("Calculated dates:", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    });

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Invalid date calculation:", {
            startDate,
            endDate,
            firstMonth: sortedMonths[0],
            lastMonth: sortedMonths[sortedMonths.length - 1]
        });
        throw new Error("Failed to calculate valid dates from months");
    }

    return { startDate, endDate };
}


const packageSchema = z.object({
    type: z.enum(["Term", "Monthly", "Full Season", "Assessment"]),
    termNumber: z.string().optional(),
    name: z.string().optional(),
    price: z.string().min(1, "Price is required"),
    startDate: z.date({
        required_error: "Start date is required",
    }).optional(),
    endDate: z.date({
        required_error: "End date is required",
    }).optional(),
    months: z.array(z.string()).optional(),
    memo: z.string().optional(),
    entryFees: z.string().default("0"),
    entryFeesExplanation: z.string().optional(),
    entryFeesAppliedUntil: z.array(z.string()).default([]).optional(),
    entryFeesStartDate: z.date().optional(),
    entryFeesEndDate: z.date().optional(),
    schedules: z.array(z.object({
        day: z.string().min(1, "Day is required"),
        from: z.string().min(1, "Start time is required"),
        to: z.string().min(1, "End time is required"),
        memo: z.string().optional(),
        id: z.number().optional(),
        capacity: z.string().default("0"),
        capacityType: z.enum(["normal", "unlimited"]).default("normal")
    })),
    capacity: z.string().default("0"),
    capacityType: z.enum(["normal", "unlimited"]).default("normal"),
    flexible: z.boolean().default(false),
    sessionPerWeek: z.string().transform(val => parseInt(val) || 0).optional(),
    sessionDuration: z.string().transform(val => parseInt(val) || null).optional().nullable(),
}).superRefine((data, ctx) => {
    if (parseFloat(data.entryFees) > 0 && !data.entryFeesExplanation) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Entry fees explanation is required when entry fees is set",
            path: ["entryFeesExplanation"]
        });
    }

    if (data.type === "Monthly" && parseFloat(data.entryFees) > 0 && data.entryFeesAppliedUntil?.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must select months for entry fees application",
            path: ["entryFeesAppliedUntil"]
        });
    }

    if (data.type === "Monthly" && (!data.months || data.months.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must select at least one month",
            path: ["months"]
        });
    }

    if (data.type !== "Monthly" && (!data.startDate || !data.endDate)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Start and end dates are required",
            path: ["startDate"]
        });
    }

    if (data.flexible) {
        // Check sessionPerWeek when package is flexible
        if (!data.sessionPerWeek || data.sessionPerWeek <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Sessions per week is required and must be greater than 0",
                path: ["sessionPerWeek"]
            });
        }

        if ((data?.sessionPerWeek ?? 0) > data.schedules.length) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Sessions per week cannot be greater than available schedules (${data.schedules.length})`,
                path: ["sessionPerWeek"]
            });
        }

        // Check sessionDuration when package is flexible
        if (!data.sessionDuration) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Session duration is required for flexible packages",
                path: ["sessionDuration"]
            });
        }

        // Validate that all schedules have capacity when package is flexible
        data.schedules.forEach((schedule, index) => {
            if (schedule.capacityType === "normal" && !schedule?.capacity || schedule.capacity === 'NaN' || parseInt(schedule.capacity) <= 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Schedule capacity must be greater than 0",
                    path: [`schedules.${index}.capacity`]
                });
            }
        });
    } else {
        // When not flexible, validate package capacity
        if (data.capacityType === "normal" && parseInt(data.capacity) <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Package capacity must be greater than 0",
                path: ["capacity"]
            });
        }
    }
});

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    programId?: number
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

const getMonthsInRange = (startDate: Date, endDate: Date) => {
    const months: Array<{ label: string, value: string }> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);
    current.setDate(1); // Set to first day of month to avoid skipping months

    while (current <= end) {
        const monthLabel = format(current, "MMMM yyyy");
        const monthValue = monthLabel; // Using the same format for value and label
        months.push({ label: monthLabel, value: monthValue });
        current.setMonth(current.getMonth() + 1);
    }

    return months;
};

export default function AddPackage({ open, onOpenChange, programId }: Props) {
    const router = useRouter()

    const { toast } = useToast()

    const { mutate } = useOnboarding()
    const [loading, setLoading] = useState(false)
    const [availableMonths, setAvailableMonths] = useState<Array<{ label: string, value: string }>>([])
    const [yearOptions] = useState(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear + i);
    });

    const addPackage = useProgramsStore((state) => state.addPackage)
    const program = useProgramsStore((state) => state.programs.find(p => p.id === programId))

    const form = useForm<z.infer<typeof packageSchema>>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            type: "Monthly",
            price: '',
            memo: '',
            entryFees: '0',
            schedules: [{ day: '', from: '', to: '', memo: '', capacityType: 'normal' }],
            entryFeesStartDate: undefined,
            entryFeesEndDate: undefined,
            capacity: '0',
            months: [],
            capacityType: 'normal',
            flexible: program?.flexible ?? false,
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "schedules"
    })

    useEffect(() => {
        form.setValue('flexible', program?.flexible ?? false)
    }, [program])

    const packageType = form.watch("type")
    const entryFees = parseFloat(form.watch("entryFees") || "0")
    const showEntryFeesFields = entryFees > 0
    const startDate = form.watch("startDate")
    const endDate = form.watch("endDate")
    const months = form.watch("months") || []

    const addMonth = () => {
        const newMonthEntry = {
            month: '',
            year: new Date().getFullYear().toString()
        };
        form.setValue('months', [...months, `${newMonthEntry.month} ${newMonthEntry.year}`]);
    };

    // Function to remove a month
    const removeMonth = (index: number) => {
        const newMonths = [...months];
        newMonths.splice(index, 1);
        form.setValue('months', newMonths);
    };

    // Function to update a month
    const updateMonth = (index: number, month: string, year: string) => {
        const newMonths = [...months];
        newMonths[index] = `${month} ${year}`;
        form.setValue('months', newMonths);
    };

    useEffect(() => {
        if (startDate && endDate) {
            const months = getMonthsInRange(startDate, endDate)
            setAvailableMonths(months)
        }
    }, [startDate, endDate])

    const capacityTypeChange = form.watch("capacityType")

    useEffect(() => {
        if (capacityTypeChange === 'normal') {
            form.setValue('capacity', '0')
        }
    }, [capacityTypeChange])

    const onSubmit = async (values: z.infer<typeof packageSchema>) => {
        try {
            if (programId) {
                setLoading(true)
                const packageName = values.type === "Term" ?
                    `Term ${values.termNumber}` :
                    values.type === "Monthly" ?
                        `Monthly ${values.name ?? ''}` :
                        `Full Season ${values.name ?? ''}`

                let startDate = values.startDate;
                let endDate = values.endDate;

                if (values.type === "Monthly" && values.months && values.months.length > 0) {
                    try {
                        console.log("Processing monthly dates for months:", values.months);
                        const dates = getFirstAndLastDayOfMonths(values.months);
                        console.log("Got dates from months:", dates);

                        startDate = new Date(dates.startDate);
                        startDate.setUTCHours(12, 0, 0, 0);

                        endDate = new Date(dates.endDate);
                        endDate.setUTCHours(12, 0, 0, 0);

                        console.log("Final dates:", {
                            startDate: startDate.toISOString(),
                            endDate: endDate.toISOString()
                        });
                    } catch (error) {
                        console.error("Error processing monthly dates:", error);
                        toast({
                            title: "Date Error",
                            description: "Failed to process package dates. Please check your month selection.",
                            variant: "destructive",
                        });
                        return;
                    }
                } else {
                    // Handle non-monthly packages
                    if (!values.startDate || !values.endDate) {
                        toast({
                            title: "Dates Required",
                            description: "Please select both start and end dates",
                            variant: "destructive",
                        });
                        return;
                    }

                    try {
                        startDate = new Date(values.startDate);
                        startDate.setUTCHours(12, 0, 0, 0);

                        endDate = new Date(values.endDate);
                        endDate.setUTCHours(12, 0, 0, 0);

                        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            throw new Error("Invalid date values");
                        }
                    } catch (error) {
                        console.error("Error processing dates:", error);
                        toast({
                            title: "Invalid Dates",
                            description: "Please ensure your dates are valid",
                            variant: "destructive",
                        });
                        return;
                    }
                }

                try {
                    const baseFields = {
                        ...values,
                        name: packageName!,
                        price: parseFloat(values.price),
                    };

                    let startDateISO: string;
                    let endDateISO: string;

                    try {
                        if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
                            throw new Error("Invalid start date");
                        }
                        if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
                            throw new Error("Invalid end date");
                        }

                        // Ensure we have valid dates by creating new Date objects
                        const validStartDate = new Date(startDate);
                        const validEndDate = new Date(endDate);

                        // Set to noon UTC to avoid timezone issues
                        validStartDate.setUTCHours(12, 0, 0, 0);
                        validEndDate.setUTCHours(12, 0, 0, 0);

                        startDateISO = validStartDate.toISOString();
                        endDateISO = validEndDate.toISOString();

                        console.log("Processed startDateISO:", startDateISO);
                        console.log("Processed endDateISO:", endDateISO);
                    } catch (dateError: any) {
                        console.error("Date processing error:", dateError);
                        console.error("StartDate:", startDate);
                        console.error("EndDate:", endDate);
                        throw new Error(`Invalid date format: ${dateError.message}`);
                    }

                    const withDates = {
                        ...baseFields,
                        startDate: startDateISO,
                        endDate: endDateISO,
                    };
                    const withMonths = {
                        ...withDates,
                        months: values.months ?? [],
                    };
                    const schedules = values.schedules.map(s => {
                        console.log("Processing schedule:", s);
                        return {
                            ...s,
                            capacity: program?.flexible ?
                                (s.capacityType === "unlimited" ? 9999 : parseInt(s.capacity)) :
                                (values.capacityType === "unlimited" ? 9999 : parseInt(values.capacity)),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            memo: s.memo ?? '',
                            id: undefined,
                            packageId: undefined
                        };
                    });
                    const withSchedules = {
                        ...withMonths,
                        schedules,
                    };
                    const withEntryFees = {
                        ...withSchedules,
                        memo: values.memo ?? '',
                        entryFees: parseFloat(values.entryFees),
                        entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation ?? '' : null,
                        entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                            values.entryFeesAppliedUntil ?? [] : null,
                        entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesStartDate?.toISOString() ?? null : null,
                        entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesEndDate?.toISOString() ?? null : null,
                    };
                    const addedPackage = {
                        ...withEntryFees,
                        capacity: program?.flexible ? null : (values.capacityType === "unlimited" ? 9999 : parseInt(values.capacity)),
                        sessionPerWeek: values.flexible ? (values.sessionPerWeek ?? 0) : values.schedules.length,
                        sessionDuration: values.flexible ? (values.sessionDuration ?? 0) : null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        programId,
                    };

                    addPackage(addedPackage);
                } catch (error) {
                    console.error("Error occurred at:", error);
                    throw error
                }

                onOpenChange(false)
                mutate()
                router.refresh()
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

    const sessionDurationChange = form.watch('sessionDuration')

    useEffect(() => {
        if (program?.flexible) {
            form.setValue('schedules', form.getValues('schedules').map(s => {
                const duration = form.watch("sessionDuration");
                const [hours, minutes] = s.from.split(':').map(Number);
                const startDate = new Date();
                startDate.setHours(hours, minutes, 0);
                const endDate = new Date(startDate.getTime() + (duration ?? 0) * 60000);
                const to = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
                return {
                    ...s,
                    to
                }
            }))
        }
    }, [sessionDurationChange])

    const handleToastValidation = () => {
        const values = form.getValues()
        const missingFields: string[] = [];

        // Check basic fields
        if (!values.type) missingFields.push('Package Type');
        if (!values.price) missingFields.push('Price');
        if (values.type === 'Term' && !values.termNumber) missingFields.push('Term Number');

        // Check dates/months based on package type
        if (values.type === 'Monthly') {
            if (!values.months || values.months.length === 0) missingFields.push('Months');
        } else {
            if (!values.startDate) missingFields.push('Start Date');
            if (!values.endDate) missingFields.push('End Date');
        }

        // Entry fees validation
        const entryFees = parseFloat(values.entryFees || '0');
        if (entryFees > 0) {
            if (!values.entryFeesExplanation) missingFields.push('Entry Fees Explanation');
            if (values.type === 'Monthly' && (!values.entryFeesAppliedUntil || values.entryFeesAppliedUntil.length === 0)) {
                missingFields.push('Entry Fees Applied For');
            }
            if (values.type !== 'Monthly') {
                if (!values.entryFeesStartDate) missingFields.push('Entry Fees Start Date');
                if (!values.entryFeesEndDate) missingFields.push('Entry Fees End Date');
            }
        }

        // Sessions validation
        if (!values.schedules || values.schedules.length === 0) {
            missingFields.push('Sessions');
        } else {
            values.schedules.forEach((schedule, index) => {
                if (!schedule.day) missingFields.push(`Session ${index + 1} Day`);
                if (!schedule.from) missingFields.push(`Session ${index + 1} Start Time`);
                if (!schedule.to) missingFields.push(`Session ${index + 1} End Time`);

                // Flexible package specific validations
                if (program?.flexible) {
                    if (schedule.capacityType === 'normal' && (!schedule.capacity || parseInt(schedule.capacity) <= 0)) {
                        missingFields.push(`Session ${index + 1} Capacity`);
                    }
                }
            });
        }

        // Flexible package validations
        if (program?.flexible) {
            if (!values.sessionPerWeek || values.sessionPerWeek <= 0) {
                missingFields.push('Sessions Per Week');
            }
            if (!values.sessionDuration) {
                missingFields.push('Session Duration');
            }
            if (values.sessionPerWeek && values.sessionPerWeek > values.schedules.length) {
                missingFields.push('Sessions Per Week (cannot be greater than available schedules)');
            }
        } else {
            // Regular package capacity validation
            if (values.capacityType === 'normal' && (!values.capacity || parseInt(values.capacity) <= 0)) {
                missingFields.push('Package Capacity');
            }
        }

        console.log('Missing fields:', missingFields);
        if (missingFields.length > 0) {
            toast({
                title: "Missing Required Fields",
                description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
                variant: "destructive",
            });
            return;
        }
    };

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
                                        <FormItem>
                                            <FormLabel>Type <span className='text-xs text-red-500'>*</span></FormLabel>
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
                                            <FormItem>
                                                <FormLabel>Term Number <span className='text-xs text-red-500'>*</span></FormLabel>
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
                                ) : packageType === 'Monthly' || packageType === 'Full Season' ? (
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem className='absolute hidden'>
                                                <FormLabel>Name <span className='text-xs text-red-500'>*</span></FormLabel>
                                                <FormControl>
                                                    <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : null}

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="flexible"
                                        render={({ field }) => (
                                            <FormItem className="absolute hidden flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Flexible Schedule</FormLabel>
                                                    <FormDescription>
                                                        Allow students to choose which days they want to attend
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {program?.flexible ? (
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="sessionPerWeek"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Sessions Per Week <span className='text-xs text-red-500'>*</span></FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                min="1"
                                                                max={fields.length}
                                                                className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter"
                                                                value={field.value || ''} // Convert 0 to empty string
                                                                onChange={(e) => {
                                                                    const value = parseInt(e.target.value) || 0;
                                                                    field.onChange(value.toString());
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="sessionDuration"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Session Duration (minutes) <span className='text-xs text-red-500'>*</span></FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                min="1"
                                                                className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter"
                                                                value={field.value || ''} // Convert null to empty string
                                                                onChange={(e) => {
                                                                    const value = e.target.value ? parseInt(e.target.value) : null;
                                                                    field.onChange(value?.toString());
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex gap-4 max-lg:flex-col">
                                                <FormField
                                                    control={form.control}
                                                    name="capacity"
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormLabel>Package Capacity <span className='text-xs text-red-500'>*</span></FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="number"
                                                                    min="1"
                                                                    disabled={capacityTypeChange === "unlimited"}
                                                                    className={cn("px-2 py-6 rounded-[10px] border border-gray-500 font-inter", capacityTypeChange === "unlimited" && 'text-transparent')}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="capacityType"
                                                    render={({ field }) => (
                                                        <FormItem className="w-[200px]">
                                                            <FormLabel>Capacity Type</FormLabel>
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    field.onChange(value);
                                                                    if (value === "unlimited") {
                                                                        form.setValue("capacity", "9999");
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
                                        </div>
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price <span className='text-xs text-red-500'>(All Prices Include VAT)</span></FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <span className="px-2 py-3.5 text-sm bg-transparent border border-r-0 border-gray-500 rounded-l-[10px]">AED</span>
                                                    <Input {...field} type="number" min="0" step="0.01" className='px-2 py-6 rounded-l-none rounded-r-[10px] border border-gray-500 font-inter' />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {packageType === "Monthly" ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <FormLabel>Package Months <span className='text-xs text-red-500'>*</span></FormLabel>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-main-green"
                                                onClick={addMonth}
                                            >
                                                Add Month
                                            </Button>
                                        </div>

                                        {months.map((monthValue, index) => {
                                            const [month, year] = monthValue.split(' ');
                                            return (
                                                <div key={index} className="flex gap-4 items-center">
                                                    <Select
                                                        value={month}
                                                        onValueChange={(value) => updateMonth(index, value, year)}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select month" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="January">January</SelectItem>
                                                            <SelectItem value="February">February</SelectItem>
                                                            <SelectItem value="March">March</SelectItem>
                                                            <SelectItem value="April">April</SelectItem>
                                                            <SelectItem value="May">May</SelectItem>
                                                            <SelectItem value="June">June</SelectItem>
                                                            <SelectItem value="July">July</SelectItem>
                                                            <SelectItem value="August">August</SelectItem>
                                                            <SelectItem value="September">September</SelectItem>
                                                            <SelectItem value="October">October</SelectItem>
                                                            <SelectItem value="November">November</SelectItem>
                                                            <SelectItem value="December">December</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={year}
                                                        onValueChange={(value) => updateMonth(index, month, value)}
                                                    >
                                                        <SelectTrigger className="w-[120px]">
                                                            <SelectValue placeholder="Select year" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {yearOptions.map((year) => (
                                                                <SelectItem key={year} value={year.toString()}>
                                                                    {year}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeMonth(index)}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                        <FormMessage />
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>Start Date <span className='text-xs text-red-500'>*</span></FormLabel>
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
                                                    <FormLabel>End Date <span className='text-xs text-red-500'>*</span></FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="entryFees"
                                    render={({ field }) => (
                                        <FormItem>
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
                                                <FormLabel>Entry Fees Explanation <span className='text-xs text-red-500'>*</span></FormLabel>
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

                                {showEntryFeesFields && packageType !== "Monthly" && (
                                    <div className="flex gap-4">
                                        <FormField
                                            control={form.control}
                                            name="entryFeesStartDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>Entry Fees Start Date <span className='text-xs text-red-500'>*</span></FormLabel>
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
                                                    <FormLabel>Entry Fees End Date <span className='text-xs text-red-500'>*</span></FormLabel>
                                                    <DateSelector field={field} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {showEntryFeesFields && packageType === "Monthly" && (
                                    <FormField
                                        control={form.control}
                                        name="entryFeesAppliedUntil"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Entry Fees Applied For <span className='text-xs text-red-500'>*</span></FormLabel>
                                                <div className="grid grid-cols-3 gap-4 border rounded-[10px] p-4">
                                                    {form.getValues('months')?.map((month) => (
                                                        <label
                                                            key={month}
                                                            className="flex items-center space-x-2 cursor-pointer"
                                                        >
                                                            <Checkbox
                                                                checked={field.value?.includes(month)}
                                                                onCheckedChange={(checked) => {
                                                                    const updatedMonths = checked
                                                                        ? [...(field.value ?? []), month]
                                                                        : field.value?.filter((m: string) => m !== month) ?? [];
                                                                    field.onChange(updatedMonths);
                                                                }}
                                                                className='data-[state=checked]:!bg-main-green'
                                                            />
                                                            <span>{month}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Sessions <span className='text-xs text-red-500'>*</span></FormLabel>
                                    </div>

                                    {fields.map((field, index) => (
                                        <div key={field.id} className="space-y-4 p-4 border rounded-lg relative pt-8 bg-[#E0E4D9] overflow-hidden">
                                            <p className='text-xs'>Session {index + 1}</p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-2 top-2"
                                                onClick={() => remove(index)}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>

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
                                                                {Object.entries(days).map(([value, label]) => (
                                                                    <SelectItem key={value} value={value}>
                                                                        {label}
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
                                                                    value={formatTimeValue(field.value)}
                                                                    onChange={(e) => {
                                                                        const newValue = e.target.value;
                                                                        if (newValue === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newValue)) {
                                                                            field.onChange(newValue);
                                                                            // If package is flexible, automatically calculate and set 'to' time
                                                                            if (program?.flexible && newValue && form.watch("sessionDuration")) {
                                                                                const duration = form.watch("sessionDuration");
                                                                                const [hours, minutes] = newValue.split(':').map(Number);
                                                                                const startDate = new Date();
                                                                                startDate.setHours(hours, minutes, 0);
                                                                                const endDate = new Date(startDate.getTime() + (duration ?? 0) * 60000);
                                                                                const to = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
                                                                                form.setValue(`schedules.${index}.to`, to);
                                                                            }
                                                                        }
                                                                    }}
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
                                                                    value={formatTimeValue(field.value)}
                                                                    onChange={(e) => {
                                                                        if (!program?.flexible) {
                                                                            const newValue = e.target.value;
                                                                            if (newValue === '' || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newValue)) {
                                                                                field.onChange(newValue);
                                                                            }
                                                                        }
                                                                    }}
                                                                    disabled={program?.flexible}
                                                                    className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter disabled:opacity-50"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {program?.flexible && (
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
                                                                            required={program?.flexible}
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
                                                )}
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name={`schedules.${index}.memo`}
                                                render={({ field }) => (
                                                    <FormItem className=''>
                                                        <FormLabel>Memo</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
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
                                        onClick={() => append({ day: '', from: '', to: '', memo: '', capacity: '', capacityType: 'normal' })}
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