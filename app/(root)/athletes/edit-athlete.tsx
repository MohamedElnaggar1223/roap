'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAthletesStore } from '@/providers/store-provider'
import { Loader2, X } from 'lucide-react'
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
import Image from 'next/image'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getImageUrl, uploadImageToSupabase } from '@/lib/supabase-images'
import { countries, nationalities } from '@/constants'
import { DateSelector } from '@/components/shared/date-selector'
import { useToast } from '@/hooks/use-toast'

import type { Athlete } from '@/stores/athletes-store'

const relationships = [
    "mother",
    "father",
    "husband",
    "wife",
    "son",
    "daughter",
    "other"
]

type Props = {
    athleteEdited: Athlete
}

type FileState = {
    preview: string
    file: File | null
}

export default function EditAthlete({ athleteEdited }: Props) {
    const { toast } = useToast()
    const editAthlete = useAthletesStore((state) => state.editAthlete)

    const imageInputRef = useRef<HTMLInputElement>(null)
    const certificateInputRef = useRef<HTMLInputElement>(null)

    console.log("Edited Athlete", athleteEdited)

    const [editOpen, setEditOpen] = useState(false)
    const [showOtherFirstGuardian, setShowOtherFirstGuardian] = useState(false)
    const [showOtherSecondGuardian, setShowOtherSecondGuardian] = useState(false)
    const [loading, setLoading] = useState(false)
    const [athleteType, setAthleteType] = useState<'primary' | 'fellow'>(athleteEdited.type)
    const [selectedImage, setSelectedImage] = useState<FileState>({
        preview: athleteEdited.profile?.image || '',
        file: null
    })
    const [selectedCertificate, setSelectedCertificate] = useState<FileState>({
        preview: athleteEdited.certificate || '',
        file: null
    })

    const form = useForm<z.infer<typeof addAthleteSchema>>({
        resolver: zodResolver(addAthleteSchema),
        defaultValues: {
            email: athleteEdited.email,
            phoneNumber: athleteEdited.phoneNumber || '',
            firstName: athleteEdited.profile?.name.split(' ')[0] || '',
            lastName: athleteEdited.profile?.name.split(' ')[1] || '',
            gender: athleteEdited.profile?.gender?.toLowerCase() || '',
            birthday: athleteEdited.profile?.birthday ? new Date(athleteEdited.profile.birthday) : new Date(),
            image: athleteEdited.profile?.image || '',
            certificate: athleteEdited.certificate || '',
            type: athleteEdited.type,
            firstGuardianName: athleteEdited.firstGuardianName || '',
            firstGuardianRelationship: athleteEdited.firstGuardianRelationship?.toLowerCase() || '',
            firstGuardianPhone: athleteEdited.firstGuardianPhone || '',
            firstGuardianEmail: athleteEdited.firstGuardianEmail || '',
            secondGuardianName: athleteEdited.secondGuardianName || '',
            secondGuardianRelationship: athleteEdited.secondGuardianRelationship?.toLowerCase() || '',
            secondGuardianPhone: athleteEdited.secondGuardianPhone || '',
            secondGuardianEmail: athleteEdited.secondGuardianEmail || '',
            city: athleteEdited.profile?.city || '',
            streetAddress: athleteEdited.profile?.streetAddress || '',
            nationality: athleteEdited.profile?.nationality || '',
            country: athleteEdited.profile?.country || '',
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

            let imagePath = values.image
            let certificatePath = values.certificate

            if (selectedImage.file) {
                try {
                    imagePath = await uploadImageToSupabase(selectedImage.file)
                } catch (error) {
                    setLoading(false)
                    form.setError('image', {
                        type: 'custom',
                        message: 'Error uploading image. Please try again.'
                    })
                    return
                }
            }

            if (selectedCertificate.file) {
                try {
                    certificatePath = await uploadImageToSupabase(selectedCertificate.file)
                } catch (error) {
                    setLoading(false)
                    form.setError('certificate', {
                        type: 'custom',
                        message: 'Error uploading certificate. Please try again.'
                    })
                    return
                }
            }

            await editAthlete(athleteEdited.id, {
                ...values,
                email: values.email ?? '',
                name: values.firstName + ' ' + values.lastName,
                image: imagePath || '',
                certificate: certificatePath || ''
            })

            if (selectedImage.preview) URL.revokeObjectURL(selectedImage.preview)
            if (selectedCertificate.preview) URL.revokeObjectURL(selectedCertificate.preview)

            setLoading(false)
            setEditOpen(false)
        } catch (error) {
            console.error('Error updating athlete:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        return () => {
            if (selectedImage.preview) URL.revokeObjectURL(selectedImage.preview)
            if (selectedCertificate.preview) URL.revokeObjectURL(selectedCertificate.preview)
        }
    }, [selectedImage.preview, selectedCertificate.preview])

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'certificate') => {
        const file = event.target.files?.[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                form.setError(type, {
                    type: 'custom',
                    message: 'Only image files are allowed'
                })
                return
            }

            const preview = URL.createObjectURL(file)
            if (type === 'image') {
                setSelectedImage({ preview, file })
            } else {
                setSelectedCertificate({ preview, file })
            }
        }
    }

    const handleToastValidation = () => {
        const values = form.getValues()
        const missingFields: string[] = [];

        // Basic Information
        if (!values.firstName) missingFields.push('First Name');
        if (!values.lastName) missingFields.push('Last Name');
        if (!values.phoneNumber) missingFields.push('Mobile Number');
        if (!values.gender) missingFields.push('Gender');
        if (!values.birthday) missingFields.push('Date of Birth');

        // First Guardian Information (Required)
        if (!values.firstGuardianName) missingFields.push('First Guardian Name');
        if (!values.firstGuardianRelationship) missingFields.push('First Guardian Relationship');
        if (!values.firstGuardianEmail) missingFields.push('First Guardian Email');
        if (!values.firstGuardianPhone) missingFields.push('First Guardian Phone');

        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (values.email && !emailRegex.test(values.email)) {
            toast({
                title: "Invalid Email Format",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        if (values.firstGuardianEmail && !emailRegex.test(values.firstGuardianEmail)) {
            toast({
                title: "Invalid First Guardian Email Format",
                description: "Please enter a valid email address for the first guardian",
                variant: "destructive",
            });
            return;
        }

        if (values.secondGuardianEmail && !emailRegex.test(values.secondGuardianEmail)) {
            toast({
                title: "Invalid Second Guardian Email Format",
                description: "Please enter a valid email address for the second guardian",
                variant: "destructive",
            });
            return;
        }

        if (missingFields.length > 0) {
            toast({
                title: "Missing Required Fields",
                description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
                <Image
                    src='/images/edit.svg'
                    alt='Edit'
                    width={20}
                    height={20}
                />
            </Button>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className='bg-main-white min-w-[720px]'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                            <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                                <DialogTitle className='font-normal text-base'>Edit Athlete</DialogTitle>
                                <div className='flex items-center gap-2'>
                                    <button onClick={handleToastValidation} disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                        {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                        Save
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
                                                            <DateSelector field={field} />
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
                                                            ))} */}
                                                            <SelectItem key={'UAE'} value={'United Arab Emirates'}>
                                                                {'UAE'}
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                    </div>
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
                                                name="firstGuardianRelationship"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel>First Guardian Relationship*</FormLabel>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                if (value === "Other") {
                                                                    setShowOtherFirstGuardian(true)
                                                                    field.onChange("")
                                                                } else {
                                                                    setShowOtherFirstGuardian(false)
                                                                    field.onChange(value)
                                                                }
                                                            }}
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter">
                                                                    <SelectValue placeholder="Select relationship" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {relationships.map((relationship) => (
                                                                    <SelectItem key={relationship} value={relationship}>
                                                                        {relationship.slice(0, 1).toUpperCase() + relationship.slice(1)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {showOtherFirstGuardian && (
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Please specify relationship"
                                                                    className="mt-2 px-2 py-6 rounded-[10px] border border-gray-500 font-inter"
                                                                />
                                                            </FormControl>
                                                        )}
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
                                                name="secondGuardianRelationship"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel>Second Guardian Relationship*</FormLabel>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                if (value === "Other") {
                                                                    setShowOtherSecondGuardian(true)
                                                                    field.onChange("")
                                                                } else {
                                                                    setShowOtherSecondGuardian(false)
                                                                    field.onChange(value)
                                                                }
                                                            }}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter">
                                                                    <SelectValue placeholder="Select relationship" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {relationships.map((relationship) => (
                                                                    <SelectItem key={relationship} value={relationship}>
                                                                        {relationship}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {showOtherSecondGuardian && (
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Please specify relationship"
                                                                    className="mt-2 px-2 py-6 rounded-[10px] border border-gray-500 font-inter"
                                                                />
                                                            </FormControl>
                                                        )}
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