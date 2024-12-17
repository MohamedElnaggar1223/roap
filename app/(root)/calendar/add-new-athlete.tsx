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
import { countries, nationalities } from '@/constants'
import { SearchedAthlete } from '@/lib/validations/bookings'

type FileState = {
    preview: string
    file: File | null
}

type Props = {
    addNewAthleteOpen: boolean
    setAddNewAthleteOpen: React.Dispatch<React.SetStateAction<boolean>>
    handleAthleteSelect: (athlete: SearchedAthlete) => void
    onNext: () => void
}

export default function AddNewAthlete({ addNewAthleteOpen, setAddNewAthleteOpen, handleAthleteSelect, onNext }: Props) {
    const router = useRouter()
    const imageInputRef = useRef<HTMLInputElement>(null)
    const certificateInputRef = useRef<HTMLInputElement>(null)

    // const [addNewAthleteOpen, setAddNewAthleteOpen] = useState(false)
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
            firstName: '',
            lastName: '',
            gender: '',
            birthday: new Date(),
            image: '',
            certificate: '',
            type: 'primary',
            firstGuardianName: '',
            firstGuardianRelationship: '',
            firstGuardianEmail: '',
            firstGuardianPhone: '',
            secondGuardianName: '',
            secondGuardianRelationship: '',
            secondGuardianEmail: '',
            secondGuardianPhone: '',
            city: '',
            streetAddress: '',
            nationality: '',
            country: '',
        }
    })

    const onSubmit = async (values: z.infer<typeof addAthleteSchema>) => {
        try {
            // Validate guardian fields for fellow type
            let hasError = false;

            if (!values.firstGuardianName?.trim()) {
                form.setError('firstGuardianName', {
                    type: 'custom',
                    message: 'First guardian name is required'
                });
                hasError = true;
            }

            if (!values.firstGuardianRelationship?.trim()) {
                form.setError('firstGuardianRelationship', {
                    type: 'custom',
                    message: 'First guardian relationship is required'
                });
                hasError = true;
            }

            if (!values.firstGuardianEmail?.trim()) {
                form.setError('firstGuardianEmail', {
                    type: 'custom',
                    message: 'First guardian email is required'
                });
                hasError = true;
            }

            if (!values.firstGuardianPhone?.trim()) {
                form.setError('firstGuardianPhone', {
                    type: 'custom',
                    message: 'First guardian phone is required'
                });
                hasError = true;
            }

            if (hasError) return;

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
                name: values.firstName + ' ' + values.lastName,
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
            else if (result?.data?.id) {
                const imageValue = await getImageUrl('images/' + imagePath);
                handleAthleteSelect({ id: result.data.id, name: values.firstName + ' ' + values.lastName, phoneNumber: values.phoneNumber, image: imageValue || '' });
                onNext()
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
                                    {/* Basic Information */}
                                    <div className='flex w-full gap-2 items-start justify-center'>
                                        <FormField
                                            control={form.control}
                                            name='firstName'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Athlete First Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name='lastName'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Athlete Last Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
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
                                    <FormField
                                        control={form.control}
                                        name='type'
                                        render={({ field }) => (
                                            <FormItem className='flex-1 absolute hidden'>
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
                                                    <SelectContent className='!bg-[#F1F2E9]'>
                                                        <SelectItem value="primary">Athlete</SelectItem>
                                                        <SelectItem value="fellow">Guardian</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                                name='firstGuardianEmail'
                                                render={({ field }) => (
                                                    <FormItem className='flex-1'>
                                                        <FormLabel>First Guardian Email</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name='firstGuardianPhone'
                                                render={({ field }) => (
                                                    <FormItem className='flex-1'>
                                                        <FormLabel>First Guardian Phone</FormLabel>
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

                                        <div className='flex w-full gap-2 items-start justify-center'>
                                            <FormField
                                                control={form.control}
                                                name='secondGuardianEmail'
                                                render={({ field }) => (
                                                    <FormItem className='flex-1'>
                                                        <FormLabel>Second Guardian Email (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name='secondGuardianPhone'
                                                render={({ field }) => (
                                                    <FormItem className='flex-1'>
                                                        <FormLabel>Second Guardian Phone (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </>



                                    <div className="flex gap-4">

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
                                                            <SelectContent className='!bg-[#F1F2E9]'>
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
                                    </div>
                                    <div className='flex w-full gap-2 items-start justify-center'>
                                        <FormField
                                            control={form.control}
                                            name='nationality'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Nationality</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className='px-2 h-12 rounded-[10px] border border-gray-500 font-inter'>
                                                                <SelectValue placeholder="Select nationality" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className='!bg-[#F1F2E9]'>
                                                            {nationalities.map((nationality) => (
                                                                <SelectItem key={nationality} value={nationality}>
                                                                    {nationality}
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
                                            name='country'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Country</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className='px-2 h-12 rounded-[10px] border border-gray-500 font-inter'>
                                                                <SelectValue placeholder="Select country" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className='!bg-[#F1F2E9]'>
                                                            {/* {countries.map((country) => (
                                                                <SelectItem key={country} value={country}>
                                                                    {country}
                                                                </SelectItem>
                                                            ))} */}Z
                                                            <SelectItem key={'UAE'} value={'UAE'}>
                                                                {'UAE'}
                                                            </SelectItem>
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
                                            name='city'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name='streetAddress'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Street Address</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
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