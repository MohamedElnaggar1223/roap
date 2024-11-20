// 'use client'

// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { updatePackage } from '@/lib/actions/packages.actions';
// import { Loader2, Pencil } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import { useState } from 'react';
// import { z } from 'zod';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import {
//     Form,
//     FormControl,
//     FormField,
//     FormItem,
//     FormLabel,
//     FormMessage,
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Calendar } from '@/components/ui/calendar';
// import { Calendar as CalendarIcon } from "lucide-react"
// import { format } from "date-fns"
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Textarea } from '@/components/ui/textarea';
// import Image from 'next/image';

// const editPackageSchema = z.object({
//     name: z.string().min(1, "Name is required"),
//     price: z.string().min(1, "Price is required"),
//     startDate: z.date({
//         required_error: "Start date is required",
//     }),
//     endDate: z.date({
//         required_error: "End date is required",
//     }),
//     sessionPerWeek: z.string().min(1, "Sessions per week is required"),
//     sessionDuration: z.string().min(1, "Sessions duration is required"),
//     memo: z.string(),
// })

// interface Package {
//     name: string
//     price: number
//     startDate: Date
//     endDate: Date
//     sessionPerWeek: number
//     sessionDuration: number | null
//     memo: string | null
//     id?: number
// }

// type EditedPackage = {
//     editedPackage: Package
//     index?: number
// }

// interface Props {
//     packageEdited: Package
//     open: boolean
//     onOpenChange: (open: boolean) => void
//     setEditedPackage: (editedPackage: EditedPackage) => void
//     mutate?: () => void
//     index?: number
//     setCreatedPackages?: React.Dispatch<React.SetStateAction<Package[]>>
// }

// export default function EditPackage({ packageEdited, index, setCreatedPackages, open, onOpenChange, mutate, setEditedPackage }: Props) {
//     const router = useRouter()
//     const [loading, setLoading] = useState(false)

//     const form = useForm<z.infer<typeof editPackageSchema>>({
//         resolver: zodResolver(editPackageSchema),
//         defaultValues: {
//             name: packageEdited.name,
//             price: packageEdited.price.toString(),
//             startDate: new Date(packageEdited.startDate),
//             endDate: new Date(packageEdited.endDate),
//             sessionPerWeek: packageEdited.sessionPerWeek.toString(),
//             sessionDuration: packageEdited.sessionDuration?.toString() ?? '',
//             memo: packageEdited.memo ?? '',
//         }
//     })


//     const onSubmit = async (values: z.infer<typeof editPackageSchema>) => {
//         try {
//             if (packageEdited.id) {
//                 setLoading(true)

//                 const result = await updatePackage(packageEdited.id, {
//                     name: values.name,
//                     price: parseFloat(values.price),
//                     startDate: values.startDate,
//                     endDate: values.endDate,
//                     sessionPerWeek: parseInt(values.sessionPerWeek),
//                     sessionDuration: values.sessionDuration ? parseInt(values.sessionDuration) : null,
//                     memo: values.memo
//                 })

//                 if (result.error) {
//                     form.setError('root', {
//                         type: 'custom',
//                         message: result.error
//                     })
//                     return
//                 }

//                 if (mutate) await mutate()

//                 setEditedPackage({ editedPackage: { ...packageEdited, name: values.name, price: parseFloat(values.price), startDate: values.startDate, endDate: values.endDate, sessionPerWeek: parseInt(values.sessionPerWeek), sessionDuration: values.sessionDuration ? parseInt(values.sessionDuration) : null, memo: values.memo }, index })

//                 onOpenChange(false)
//                 router.refresh()
//             }
//             else if (setCreatedPackages) {
//                 setCreatedPackages(prev => prev.map((packageData, i) => i === index ? { ...packageData, name: values.name, price: parseFloat(values.price), startDate: values.startDate, endDate: values.endDate, sessionPerWeek: parseInt(values.sessionPerWeek), sessionDuration: values.sessionDuration ? parseInt(values.sessionDuration) : null, memo: values.memo } : packageData))
//                 setEditedPackage({ editedPackage: { ...packageEdited, name: values.name, price: parseFloat(values.price), startDate: values.startDate, endDate: values.endDate, sessionPerWeek: parseInt(values.sessionPerWeek), sessionDuration: values.sessionDuration ? parseInt(values.sessionDuration) : null, memo: values.memo }, index })
//                 onOpenChange(false)
//             }
//         } catch (error) {
//             console.error('Error updating package:', error)
//             form.setError('root', {
//                 type: 'custom',
//                 message: 'An unexpected error occurred'
//             })
//         } finally {
//             setLoading(false)
//         }
//     }

//     return (
//         <>

//             <Dialog open={open} onOpenChange={onOpenChange}>
//                 <DialogContent className='bg-main-white min-w-[560px]'>
//                     <Form {...form}>
//                         <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
//                             <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
//                                 <DialogTitle className='font-normal text-base'>Edit Package</DialogTitle>
//                                 <div className='flex items-center gap-2'>
//                                     <button disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
//                                         {loading && <Loader2 className='h-5 w-5 animate-spin' />}
//                                         Save
//                                     </button>
//                                 </div>
//                             </DialogHeader>
//                             <ScrollArea className="w-full h-[380px]">
//                                 <div className="flex flex-col gap-6 w-full px-2">
//                                     <FormField
//                                         control={form.control}
//                                         name='name'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Name</FormLabel>
//                                                 <FormControl>
//                                                     <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='price'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Price</FormLabel>
//                                                 <FormControl>
//                                                     <Input {...field} type="number" step="0.01" min="0" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='startDate'
//                                         render={({ field }) => (
//                                             <FormItem className="flex flex-col">
//                                                 <FormLabel>Start Date</FormLabel>
//                                                 <Popover>
//                                                     <PopoverTrigger asChild>
//                                                         <FormControl>
//                                                             <Button
//                                                                 variant={"outline"}
//                                                                 className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter w-full'
//                                                             >
//                                                                 <CalendarIcon className="mr-2 h-4 w-4" />
//                                                                 {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
//                                                             </Button>
//                                                         </FormControl>
//                                                     </PopoverTrigger>
//                                                     <PopoverContent className="w-auto p-0" align="start">
//                                                         <Calendar
//                                                             mode="single"
//                                                             selected={field.value}
//                                                             onSelect={field.onChange}
//                                                             initialFocus
//                                                         />
//                                                     </PopoverContent>
//                                                 </Popover>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='endDate'
//                                         render={({ field }) => (
//                                             <FormItem className="flex flex-col">
//                                                 <FormLabel>End Date</FormLabel>
//                                                 <Popover>
//                                                     <PopoverTrigger asChild>
//                                                         <FormControl>
//                                                             <Button
//                                                                 variant={"outline"}
//                                                                 className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter w-full'
//                                                             >
//                                                                 <CalendarIcon className="mr-2 h-4 w-4" />
//                                                                 {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
//                                                             </Button>
//                                                         </FormControl>
//                                                     </PopoverTrigger>
//                                                     <PopoverContent className="w-auto p-0" align="start">
//                                                         <Calendar
//                                                             mode="single"
//                                                             selected={field.value}
//                                                             onSelect={field.onChange}
//                                                             initialFocus
//                                                         />
//                                                     </PopoverContent>
//                                                 </Popover>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='sessionPerWeek'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Sessions Per Week</FormLabel>
//                                                 <FormControl>
//                                                     <Input {...field} type="number" min="1" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='sessionDuration'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Session Duration (minutes)</FormLabel>
//                                                 <FormControl>
//                                                     <Input {...field} type="string" onChange={(e) => e.target.value === '' ? form.setValue('sessionDuration', '') : form.setValue('sessionDuration', /^\d*$/.test(e.target.value) ? e.target.value : (form.getValues('sessionDuration') ?? ''))} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />

//                                     <FormField
//                                         control={form.control}
//                                         name='memo'
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Memo</FormLabel>
//                                                 <FormControl>
//                                                     <Textarea {...field} className='min-h-[100px] rounded-[10px] border border-gray-500 font-inter' />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />
//                                 </div>
//                             </ScrollArea>
//                         </form>
//                     </Form>
//                 </DialogContent>
//             </Dialog>
//         </>
//     )
// }