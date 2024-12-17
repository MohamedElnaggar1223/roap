'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updatePackage } from '@/lib/actions/packages.actions';
import { Loader2, Pencil, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useOnboarding } from '@/providers/onboarding-provider';

const packageSchema = z.object({
    type: z.enum(["Term", "Monthly", "Full Season"]),
    termNumber: z.string().optional(),
    name: z.string().optional(),
    price: z.string().min(1, "Price is required"),
    startDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date({
        required_error: "End date is required",
    }),
    memo: z.string(),
    entryFees: z.string().default("0"),
    entryFeesExplanation: z.string().optional(),
    entryFeesAppliedUntil: z.array(z.string()).default([]).optional(),
    entryFeesStartDate: z.date().optional(),
    entryFeesEndDate: z.date().optional(),
    schedules: z.array(z.object({
        day: z.string().min(1, "Day is required"),
        from: z.string().min(1, "Start time is required"),
        to: z.string().min(1, "End time is required"),
        memo: z.string(),
        id: z.number().optional()
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
    type: "Term" | "Monthly" | "Full Season"
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
}

type EditedPackage = {
    editedPackage: Package
    index?: number
}

interface Props {
    packageEdited: Package
    open: boolean
    onOpenChange: (open: boolean) => void
    setEditedPackage: (editedPackage: EditedPackage) => void
    mutate?: () => void
    index?: number
    setCreatedPackages?: React.Dispatch<React.SetStateAction<Package[]>>
}

const days = {
    sun: "Sunday",
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday"
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

export default function EditPackage({ packageEdited, open, onOpenChange, mutate, setEditedPackage, setCreatedPackages, index }: Props) {
    const router = useRouter()

    const { mutate: mutatePackage } = useOnboarding()

    const [loading, setLoading] = useState(false)
    const [selectedMonths, setSelectedMonths] = useState<number[]>(() => {
        const startMonth = new Date(packageEdited.startDate).getMonth() + 1;
        const endMonth = new Date(packageEdited.endDate).getMonth() + 1;
        return Array.from(
            { length: endMonth - startMonth + 1 },
            (_, i) => startMonth + i
        );
    });

    const form = useForm<z.infer<typeof packageSchema>>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            type: packageEdited.name.startsWith('Term') ? 'Term' :
                packageEdited.name.includes('Monthly') ? 'Monthly' : 'Full Season',
            termNumber: packageEdited.name.startsWith('Term') ?
                packageEdited.name.split(' ')[1] : undefined,
            name: packageEdited.name.startsWith('Term') ? '' :
                packageEdited.name.startsWith('Monthly') ?
                    packageEdited.name.split(' ')[1] : packageEdited.name,
            price: packageEdited.price.toString(),
            startDate: new Date(packageEdited.startDate),
            endDate: new Date(packageEdited.endDate),
            schedules: packageEdited.schedules?.length > 0 ?
                packageEdited.schedules as Schedule[] :
                [{ day: '', from: '', to: '', memo: '' }] as Schedule[],
            memo: packageEdited.memo ?? '',
            entryFees: (packageEdited.entryFees ?? 0).toString(),
            entryFeesExplanation: packageEdited.entryFeesExplanation,
            entryFeesAppliedUntil: packageEdited.entryFeesAppliedUntil,
            entryFeesStartDate: packageEdited.entryFeesStartDate ?
                new Date(packageEdited.entryFeesStartDate) : undefined,
            entryFeesEndDate: packageEdited.entryFeesEndDate ?
                new Date(packageEdited.entryFeesEndDate) : undefined,
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
            if (packageEdited.id) {
                setLoading(true)
                const packageName = values.type === "Term" ?
                    `Term ${values.termNumber}` :
                    values.type === "Monthly" ?
                        `Monthly ${values.name}` :
                        values.name

                const result = await updatePackage(packageEdited.id, {
                    name: packageName!,
                    price: parseFloat(values.price),
                    startDate: values.startDate,
                    endDate: values.endDate,
                    schedules: values.schedules.map(schedule => ({
                        id: (schedule as any).id,
                        day: schedule.day,
                        from: schedule.from,
                        to: schedule.to,
                        memo: schedule.memo
                    })),
                    memo: values.memo,
                    entryFees: parseFloat(values.entryFees),
                    entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                    entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                        values.entryFeesAppliedUntil : undefined,
                    entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesStartDate : undefined,
                    entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                        values.entryFeesEndDate : undefined
                })

                if (result.error) {
                    form.setError('root', {
                        type: 'custom',
                        message: result.error
                    })
                    return
                }

                if (mutate) await mutate()

                setEditedPackage({
                    editedPackage: {
                        ...packageEdited,
                        name: packageName!,
                        price: parseFloat(values.price),
                        startDate: values.startDate,
                        endDate: values.endDate,
                        schedules: values.schedules,
                        memo: values.memo,
                        type: values.type,
                        entryFees: parseFloat(values.entryFees),
                        entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                        entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                            values.entryFeesAppliedUntil : undefined,
                        entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesStartDate : undefined,
                        entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesEndDate : undefined
                    }
                })

                onOpenChange(false)
                mutatePackage()
                router.refresh()
            }
            else if (setCreatedPackages) {
                const packageName = values.type === "Term" ?
                    `Term ${values.termNumber}` :
                    values.type === "Monthly" ?
                        `Monthly ${values.name}` :
                        values.name

                setCreatedPackages(prev => prev.map((packageData, i) =>
                    i === index ? {
                        ...packageData,
                        name: packageName!,
                        price: parseFloat(values.price),
                        startDate: values.startDate,
                        endDate: values.endDate,
                        schedules: values.schedules,
                        memo: values.memo,
                        type: values.type,
                        entryFees: parseFloat(values.entryFees),
                        entryFeesExplanation: showEntryFeesFields ? values.entryFeesExplanation : undefined,
                        entryFeesAppliedUntil: values.type === "Monthly" && showEntryFeesFields ?
                            values.entryFeesAppliedUntil : undefined,
                        entryFeesStartDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesStartDate : undefined,
                        entryFeesEndDate: values.type !== "Monthly" && showEntryFeesFields ?
                            values.entryFeesEndDate : undefined
                    } : packageData
                ))

                setEditedPackage({
                    editedPackage: {
                        ...packageEdited,
                        name: packageName!,
                        price: parseFloat(values.price),
                        startDate: values.startDate,
                        endDate: values.endDate,
                        schedules: values.schedules,
                        memo: values.memo,
                        type: values.type
                    },
                    index
                })

                onOpenChange(false)
            }
        } catch (error) {
            console.error('Error updating package:', error)
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='bg-main-white min-w-[560px]'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                        <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                            <DialogTitle className='font-normal text-base'>Edit Package</DialogTitle>
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
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className='!bg-[#F1F2E9]'>
                                                    <SelectItem value="Term">Term</SelectItem>
                                                    <SelectItem value="Monthly">Monthly</SelectItem>
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
                                            <FormLabel>Price</FormLabel>
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
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant={"outline"} className='w-full h-14 bg-transparent hover:bg-transparent'>
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
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>End Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant={"outline"} className='w-full h-14 bg-transparent hover:bg-transparent'>
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
                                )}

                                <FormField
                                    control={form.control}
                                    name="entryFees"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Entry Fees</FormLabel>
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
                                                                    checked={field?.value?.includes(month.label)}
                                                                    onCheckedChange={(checked) => {
                                                                        const updatedMonths = checked
                                                                            ? [...(field.value ?? []), month.label]
                                                                            : field?.value?.filter((m: string) => m !== month.label);
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
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant={"outline"} className='w-full h-14 bg-transparent hover:bg-transparent'>
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
                                            name="entryFeesEndDate"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel>Entry Fees End Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant={"outline"} className='w-full h-14 bg-transparent hover:bg-transparent'>
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
                                )}

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Sessions</FormLabel>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-main-green"
                                            onClick={() => append({ day: '', from: '', to: '', memo: '' })}
                                        >
                                            Add Session
                                        </Button>
                                    </div>

                                    {fields.map((field, index) => (
                                        <div key={field.id} className="space-y-4 p-4 border rounded-[10px] relative pt-8 bg-[#E0E4D9] overflow-hidden">
                                            <p className='text-xs'>Session {index + 1}</p>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-2 top-2"
                                                    onClick={() => remove(index)}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            )}

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

                                            <FormField
                                                control={form.control}
                                                name={`schedules.${index}.memo`}
                                                render={({ field }) => (
                                                    <FormItem>
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
                                </div>

                                <FormField
                                    control={form.control}
                                    name="memo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Package Memo</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    className="min-h-[100px] rounded-[10px] border border-gray-500 font-inter"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}