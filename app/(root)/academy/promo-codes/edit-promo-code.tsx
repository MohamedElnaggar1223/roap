'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updatePromoCode } from '@/lib/actions/promo-codes.actions';
import { Loader2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { addPromoCodeSchema } from '@/lib/validations/promo-codes';
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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectLabel
} from "@/components/ui/select"
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DateSelector } from '@/components/shared/date-selector';

type PromoCode = {
    id: number
    code: string
    discountType: 'fixed' | 'percentage'
    discountValue: number
    startDate: string
    endDate: string
}

type Props = {
    promoCodeEdited: PromoCode
}

export default function EditNewPromoCode({ promoCodeEdited }: Props) {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [editNewPromoCodeOpen, setEditNewPromoCodeOpen] = useState(false)

    const form = useForm<z.infer<typeof addPromoCodeSchema>>({
        resolver: zodResolver(addPromoCodeSchema),
        defaultValues: {
            code: promoCodeEdited.code,
            discountType: promoCodeEdited.discountType,
            discountValue: promoCodeEdited.discountValue,
            startDate: new Date(promoCodeEdited.startDate),
            endDate: new Date(promoCodeEdited.endDate),
        }
    })

    const onSubmit = async (values: z.infer<typeof addPromoCodeSchema>) => {
        try {
            setLoading(true)
            const result = await updatePromoCode(promoCodeEdited.id, {
                code: values.code,
                discountType: values.discountType,
                discountValue: values.discountValue,
                startDate: new Date(values.startDate),
                endDate: new Date(values.endDate),
            })

            if (result.error) {
                if (result?.field) {
                    form.setError(result.field as "code" | "discountType" | "discountValue" | "startDate" | "endDate", {
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

            router.refresh()
        } catch (error) {
            console.error('Error creating promoCode:', error)
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
            <Button variant="ghost" size="icon" onClick={() => setEditNewPromoCodeOpen(true)}>
                <Image
                    src='/images/edit.svg'
                    alt='Edit'
                    width={20}
                    height={20}
                />
            </Button>
            <Dialog open={editNewPromoCodeOpen} onOpenChange={setEditNewPromoCodeOpen}>
                <DialogContent className='bg-main-white max-lg:max-w-[100vw] lg:min-w-[820px]'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                            <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                                <DialogTitle className='font-normal text-base'>New PromoCode</DialogTitle>
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
                                        name='code'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Code</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className='flex w-full flex-col gap-2 items-start justify-center'>
                                        <p>Discount Value</p>
                                        <div className='flex w-full relative'>
                                            <FormField
                                                control={form.control}
                                                name='discountValue'
                                                render={({ field }) => (
                                                    <FormItem className='flex flex-col flex-1 gap-2 items-start justify-start text-center'>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                                className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name='discountType'
                                                render={({ field }) => (
                                                    <FormItem className='flex absolute right-8 top-[0.45rem] gap-2 items-end justify-start text-center max-w-[4.25rem] w-screen'>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className='px-2 py-1 bg-white rounded-[8px] outline-none border border-gray-500 font-inter'>
                                                                    <SelectValue placeholder="Select gender" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className='!bg-[#F1F2E9]'>
                                                                <SelectItem value="fixed">
                                                                    AED
                                                                </SelectItem>
                                                                <SelectItem value="percentage">
                                                                    %
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 w-full">
                                        <FormField
                                            control={form.control}
                                            name='startDate'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Start Date</FormLabel>
                                                    <FormControl>
                                                        <DateSelector field={field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name='endDate'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>End Date</FormLabel>
                                                    <FormControl>
                                                        <DateSelector field={field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}