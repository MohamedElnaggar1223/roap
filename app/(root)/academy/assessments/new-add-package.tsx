'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createPackage } from '@/lib/actions/packages.actions';
import { Loader2, TrashIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { useGendersStore } from '@/providers/store-provider';
import { Badge } from '@/components/ui/badge';

const packageSchema = z.object({
    type: z.enum(["Term", "Monthly", "Full Season", "Assessment"]),
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
        startDateOfBirth: z.date({
            required_error: "Start age is required",
        }).nullable(),
        endDateOfBirth: z.date({
            required_error: "End age is required",
        }).nullable(),
        gender: z.string().min(1, "Gender is required").nullable(),
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
    type: "Term" | "Monthly" | "Full Season" | 'Assessment' | 'Assessment'
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
    startDateOfBirth: Date | null
    endDateOfBirth: Date | null
    gender: string | null
}

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    programId?: number
    setCreatedPackages?: React.Dispatch<React.SetStateAction<Package[]>>
    packagesLength?: number
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

export default function AddPackage({ open, onOpenChange, programId, setCreatedPackages, packagesLength }: Props) {
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

    const form = useForm<z.infer<typeof packageSchema>>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            type: "Assessment",
            price: '',
            termNumber: packagesLength ? (packagesLength + 1).toString() : '1',
            memo: '',
            entryFees: '0',
            schedules: [{
                day: '', from: '', to: '', memo: '', startDateOfBirth: null, endDateOfBirth: null, gender: null
            }] as Schedule[],
            entryFeesStartDate: undefined,
            entryFeesEndDate: undefined
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "schedules"
    })

    const packageType = form.watch("type")
    const entryFees = parseFloat(form.watch("entryFees") || "0")
    const showEntryFeesFields = entryFees > 0

    const onSubmit = async (values: z.infer<typeof packageSchema>) => {
        try {
            if (programId) {
                setLoading(true)
                const packageName = values.type === "Assessment" ?
                    `Assessment ${values.termNumber}` :
                    values.type === "Monthly" ?
                        `Monthly ${values.name ?? ''}` :
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
                    startDate: finalStartDate.toLocaleString(),
                    endDate: finalEndDate.toLocaleString(),
                    programId,
                    memo: values.memo,
                    entryFees: parseFloat(values.entryFees),
                    entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                    entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                        values.entryFeesAppliedUntil : undefined,
                    entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesStartDate?.toLocaleString() : undefined,
                    entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesEndDate?.toLocaleString() : undefined,
                    schedules: values.schedules.map(schedule => ({
                        day: schedule.day,
                        from: schedule.from,
                        to: schedule.to,
                        memo: schedule.memo ?? '',
                        startDateOfBirth: schedule.startDateOfBirth ? format(schedule.startDateOfBirth, 'yyyy-MM-dd 00:00:00') : undefined,
                        endDateOfBirth: schedule.endDateOfBirth ? format(schedule.endDateOfBirth, 'yyyy-MM-dd 00:00:00') : undefined,
                        gender: schedule.gender
                    })),
                    capacity: 99999,
                    type: values.type
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
                const packageName = values.type === "Assessment" ?
                    `Assessment ${values.termNumber}` :
                    values.type === "Monthly" ?
                        `Monthly ${values.name ?? ''}` :
                        values.name

                setCreatedPackages(prev => [...prev, {
                    name: packageName ?? '',
                    price: parseFloat(values.price),
                    startDate: values.startDate,
                    endDate: values.endDate,
                    schedules: values.schedules.map(schedule => ({
                        ...schedule,
                        memo: schedule.memo ?? '',
                        startDateOfBirth: schedule.startDateOfBirth ? new Date(schedule.startDateOfBirth) : null,
                        endDateOfBirth: schedule.endDateOfBirth ? new Date(schedule.endDateOfBirth) : null,
                        gender: schedule.gender
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
                    type: values.type
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
                if (!schedule.startDateOfBirth) missingFields.push(`Session ${index + 1} Start Age Date`);
                if (!schedule.endDateOfBirth) missingFields.push(`Session ${index + 1} End Age Date`);
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
            <DialogContent className='bg-main-white min-w-[820px]'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
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
                                ) : (
                                    <div className="flex gap-4">
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


                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Sessions</FormLabel>
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

                                            <div className="flex gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`schedules.${index}.startDateOfBirth`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormLabel>Start Age</FormLabel>
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    field.onChange(getDateFromAge(parseInt(value)));
                                                                }}
                                                                value={field.value ?
                                                                    getAgeFromDate(new Date(field.value)).toString()
                                                                    : ''}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className='border border-gray-500 bg-transparent'>
                                                                        <SelectValue placeholder="Select age" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className='!bg-[#F1F2E9]'>
                                                                    {generateAgeOptions().map(option => (
                                                                        <SelectItem key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`schedules.${index}.endDateOfBirth`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormLabel>End Age</FormLabel>
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    field.onChange(getDateFromAge(parseInt(value)));
                                                                }}
                                                                value={field.value ?
                                                                    getAgeFromDate(new Date(field.value)).toString()
                                                                    : ''}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className='border border-gray-500 bg-transparent'>
                                                                        <SelectValue placeholder="Select age" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className='!bg-[#F1F2E9]'>
                                                                    {generateAgeOptions().map(option => (
                                                                        <SelectItem key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
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
                                                                                const newGenders = scheduleGenders[index].filter(g => g !== gender)
                                                                                setScheduleGenders(prev => ({
                                                                                    ...prev,
                                                                                    [index]: newGenders
                                                                                }))
                                                                                field.onChange(newGenders.join(','))
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
                                                                                    const currentGenders = scheduleGenders[index] || []
                                                                                    const newGenders = currentGenders.includes(gender)
                                                                                        ? currentGenders.filter(g => g !== gender)
                                                                                        : [...currentGenders, gender]
                                                                                    setScheduleGenders(prev => ({
                                                                                        ...prev,
                                                                                        [index]: newGenders
                                                                                    }))
                                                                                    field.onChange(newGenders.join(','))
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
                                        onClick={() => append({ day: '', from: '', to: '', memo: '', startDateOfBirth: null, endDateOfBirth: null, gender: null })}
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