'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createAthlete } from '@/lib/actions/athletes.actions'
import { Loader2, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { addAthleteSchema } from '@/lib/validations/athletes'
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
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getImageUrl, uploadImageToSupabase } from '@/lib/supabase-images'
import Image from 'next/image'

type FileState = {
    preview: string
    file: File | null
}

export default function AddNewAthlete() {
    const router = useRouter()
    const imageInputRef = useRef<HTMLInputElement>(null)
    const certificateInputRef = useRef<HTMLInputElement>(null)

    const [addNewAthleteOpen, setAddNewAthleteOpen] = useState(false)
    const [athleteType, setAthleteType] = useState<'primary' | 'fellow'>('primary')
    const [loading, setLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<FileState>({
        preview: '',
        file: null
    })
    const [selectedCertificate, setSelectedCertificate] = useState<FileState>({
        preview: '',
        file: null
    })

    const form = useForm<z.infer<typeof addAthleteSchema>>({
        resolver: zodResolver(addAthleteSchema),
        defaultValues: {
            email: '',
            phoneNumber: '',
            name: '',
            gender: '',
            birthday: new Date(),
            image: '',
            certificate: '',
            type: 'primary',
            firstGuardianName: '',
            firstGuardianRelationship: '',
            secondGuardianName: '',
            secondGuardianRelationship: '',
        }
    })

    const onSubmit = async (values: z.infer<typeof addAthleteSchema>) => {
        try {
            // Validate guardian fields for fellow type
            if (values.type === 'fellow') {
                let hasError = false;

                if (!values.firstGuardianName?.trim()) {
                    form.setError('firstGuardianName', {
                        type: 'custom',
                        message: 'First guardian name is required for fellow athletes'
                    });
                    hasError = true;
                }

                if (!values.firstGuardianRelationship?.trim()) {
                    form.setError('firstGuardianRelationship', {
                        type: 'custom',
                        message: 'First guardian relationship is required for fellow athletes'
                    });
                    hasError = true;
                }

                if (hasError) return;
            }

            setLoading(true)

            let imagePath = values.image;
            let certificatePath = values.certificate;

            if (selectedImage.file) {
                try {
                    imagePath = await uploadImageToSupabase(selectedImage.file);
                } catch (error) {
                    setLoading(false);
                    form.setError('image', {
                        type: 'custom',
                        message: 'Error uploading image. Please try again.'
                    });
                    return;
                }
            }

            if (selectedCertificate.file) {
                try {
                    certificatePath = await uploadImageToSupabase(selectedCertificate.file);
                } catch (error) {
                    setLoading(false);
                    form.setError('certificate', {
                        type: 'custom',
                        message: 'Error uploading certificate. Please try again.'
                    });
                    return;
                }
            }

            const result = await createAthlete({
                ...values,
                image: imagePath || '',
                certificate: certificatePath || ''
            });

            if (result.error) {
                if (result?.field) {
                    form.setError(result.field as any, {
                        type: 'custom',
                        message: result.error
                    });
                    return;
                }
                form.setError('root', {
                    type: 'custom',
                    message: result.error
                });
                return;
            }

            if (selectedImage.preview) URL.revokeObjectURL(selectedImage.preview);
            if (selectedCertificate.preview) URL.revokeObjectURL(selectedCertificate.preview);

            setAddNewAthleteOpen(false);
            form.reset();
            setSelectedImage({ preview: '', file: null });
            setSelectedCertificate({ preview: '', file: null });
            // router.refresh();
        } catch (error) {
            console.error('Error creating athlete:', error);
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        return () => {
            if (selectedImage.preview) URL.revokeObjectURL(selectedImage.preview);
            if (selectedCertificate.preview) URL.revokeObjectURL(selectedCertificate.preview);
        }
    }, [selectedImage.preview, selectedCertificate.preview]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'certificate') => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                form.setError(type, {
                    type: 'custom',
                    message: 'Only image files are allowed'
                });
                return;
            }

            const preview = URL.createObjectURL(file);
            if (type === 'image') {
                setSelectedImage({ preview, file });
            } else {
                setSelectedCertificate({ preview, file });
            }
        }
    }

    return (
        <>
            <button onClick={() => setAddNewAthleteOpen(true)} className='flex text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-white'>
                <Plus size={16} className='stroke-main-yellow' />
                New Athlete
            </button>
            <Dialog open={addNewAthleteOpen} onOpenChange={setAddNewAthleteOpen}>
                <DialogContent className='bg-main-white min-w-[720px]'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                            <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                                <DialogTitle className='font-normal text-base'>New Athlete</DialogTitle>
                                <div className='flex items-center gap-2'>
                                    <button disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                        {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                        Create
                                    </button>
                                </div>
                            </DialogHeader>
                            <div className="w-full max-h-[480px] overflow-y-auto">
                                <div className="flex flex-col gap-6 w-full px-2 pt-4">
                                    {/* Profile Image Upload */}
                                    <FormField
                                        control={form.control}
                                        name='image'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Profile Image</FormLabel>
                                                <FormControl>
                                                    <div className="flex flex-col gap-4 relative w-44">
                                                        {(field.value || selectedImage.preview) ? (
                                                            <div className="relative w-44 h-44">
                                                                <Image
                                                                    src={selectedImage.preview || '/images/placeholder.svg'}
                                                                    alt="Profile Preview"
                                                                    fill
                                                                    className="rounded-[31px] object-cover"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (selectedImage.preview) URL.revokeObjectURL(selectedImage.preview);
                                                                        setSelectedImage({ preview: '', file: null });
                                                                        if (imageInputRef.current) imageInputRef.current.value = '';
                                                                        field.onChange('');
                                                                    }}
                                                                    className="absolute -top-2 -right-2 bg-red-500 rounded-[31px] p-1 z-[10]"
                                                                >
                                                                    <X className="h-4 w-4 text-white" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <Image
                                                                src='/images/placeholder.svg'
                                                                alt='Profile Placeholder'
                                                                width={176}
                                                                height={176}
                                                                className='rounded-[31px] object-cover'
                                                            />
                                                        )}
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageChange(e, 'image')}
                                                            hidden
                                                            ref={imageInputRef}
                                                            className='absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-[5]'
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='type'
                                        render={({ field }) => (
                                            <FormItem className='flex-1'>
                                                <FormLabel>Athlete Type</FormLabel>
                                                <Select
                                                    onValueChange={(value: 'primary' | 'fellow') => {
                                                        field.onChange(value);
                                                        setAthleteType(value);
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className='px-2 h-12 rounded-[10px] border border-gray-500 font-inter'>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="primary">Primary</SelectItem>
                                                        <SelectItem value="fellow">Fellow</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {athleteType === 'fellow' && (
                                        <>
                                            <div className='flex w-full gap-2 items-start justify-center'>
                                                <FormField
                                                    control={form.control}
                                                    name='firstGuardianName'
                                                    render={({ field }) => (
                                                        <FormItem className='flex-1'>
                                                            <FormLabel>First Guardian Name*</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name='firstGuardianRelationship'
                                                    render={({ field }) => (
                                                        <FormItem className='flex-1'>
                                                            <FormLabel>First Guardian Relationship*</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className='flex w-full gap-2 items-start justify-center'>
                                                <FormField
                                                    control={form.control}
                                                    name='secondGuardianName'
                                                    render={({ field }) => (
                                                        <FormItem className='flex-1'>
                                                            <FormLabel>Second Guardian Name (Optional)</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name='secondGuardianRelationship'
                                                    render={({ field }) => (
                                                        <FormItem className='flex-1'>
                                                            <FormLabel>Second Guardian Relationship (Optional)</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Basic Information */}
                                    <div className='flex w-full gap-2 items-start justify-center'>
                                        <FormField
                                            control={form.control}
                                            name='name'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Athlete Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name='phoneNumber'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Mobile Number</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="tel" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name='email'
                                        render={({ field }) => (
                                            <FormItem className='flex-1'>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className='flex w-full gap-2 items-start justify-center'>
                                        <FormField
                                            control={form.control}
                                            name='gender'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Gender</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className='px-2 h-12 rounded-[10px] border border-gray-500 font-inter'>
                                                                <SelectValue placeholder="Select gender" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="male">Male</SelectItem>
                                                            <SelectItem value="female">Female</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className='flex w-full gap-2 items-start justify-center'>
                                        <FormField
                                            control={form.control}
                                            name='birthday'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Date of Birth</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                                            onChange={(e) => field.onChange(new Date(e.target.value))}
                                                            className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                    </div>

                                    {/* Certificate Upload */}
                                    <FormField
                                        control={form.control}
                                        name='certificate'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Certificate (Optional)</FormLabel>
                                                <FormControl>
                                                    <div className="flex flex-col gap-4 relative w-44">
                                                        {(field.value || selectedCertificate.preview) ? (
                                                            <div className="relative w-44 h-44">
                                                                <Image
                                                                    src={selectedCertificate.preview || '/images/placeholder.svg'}
                                                                    alt="Certificate Preview"
                                                                    fill
                                                                    className="rounded-[31px] object-cover"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (selectedCertificate.preview) URL.revokeObjectURL(selectedCertificate.preview);
                                                                        setSelectedCertificate({ preview: '', file: null });
                                                                        if (certificateInputRef.current) certificateInputRef.current.value = '';
                                                                        field.onChange('');
                                                                    }}
                                                                    className="absolute -top-2 -right-2 bg-red-500 rounded-[31px] p-1 z-[10]"
                                                                >
                                                                    <X className="h-4 w-4 text-white" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <Image
                                                                src='/images/placeholder.svg'
                                                                alt='Certificate Placeholder'
                                                                width={176}
                                                                height={176}
                                                                className='rounded-[31px] object-cover'
                                                            />
                                                        )}
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageChange(e, 'certificate')}
                                                            hidden
                                                            ref={certificateInputRef}
                                                            className='absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-[5]'
                                                        />
                                                    </div>
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
        </>
    )
}