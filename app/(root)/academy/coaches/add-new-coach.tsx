'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { addCoachSchema } from '@/lib/validations/coaches';
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
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea';
import { getImageUrl, uploadImageToSupabase } from '@/lib/supabase-images';
import Image from 'next/image';
import { DateSelector } from '@/components/shared/date-selector';
import { useToast } from '@/hooks/use-toast';
import { useCoachesStore } from '@/providers/store-provider';

type Props = {
    sports: {
        id: number;
        image: string | null;
        name: string;
        locale: string;
    }[];
    languages: {
        id: number;
        name: string;
        locale: string;
    }[];
    academySports?: { id: number }[]
}

type FileState = {
    preview: string;
    file: File | null;
}

export default function AddNewCoach({ sports, languages, academySports }: Props) {
    const { toast } = useToast()
    const addCoachAction = useCoachesStore((state) => state.addCoach)

    const inputRef = useRef<HTMLInputElement>(null)

    const [addNewCoachOpen, setAddNewCoachOpen] = useState(false)
    const [selectedSports, setSelectedSports] = useState<number[]>([])
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>([])
    const [selectedImage, setSelectedImage] = useState<FileState>({
        preview: '',
        file: null
    });
    const [loading, setLoading] = useState(false)
    const [sportsOpen, setSportsOpen] = useState(false)
    const [languagesOpen, setLanguagesOpen] = useState(false)

    const form = useForm<z.infer<typeof addCoachSchema>>({
        resolver: zodResolver(addCoachSchema),
        defaultValues: {
            name: '',
            title: '',
            bio: '',
            gender: '',
            image: '',
            privateSessionPercentage: '',
            dateOfBirth: undefined,
        }
    })

    const onSubmit = async (values: z.infer<typeof addCoachSchema>) => {
        try {
            setLoading(true)

            let imagePath = values.image;

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

            const result = await addCoachAction({
                name: values.name,
                title: values.title,
                bio: values.bio,
                gender: values.gender,
                image: imagePath || '',
                dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
                privateSessionPercentage: values.privateSessionPercentage,
                sports: selectedSports,
                languages: selectedLanguages,
            })

            if (result.error) {
                if (result?.field) {
                    form.setError(result.field as any, {
                        type: 'custom',
                        message: result.error
                    })
                } else {
                    toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive",
                    })
                }
                return
            }

            // Success
            toast({
                title: "Success",
                description: "Coach created successfully",
            })

            if (selectedImage.preview) {
                URL.revokeObjectURL(selectedImage.preview);
            }

            // Reset form
            form.reset()
            setSelectedSports([])
            setSelectedLanguages([])
            setSelectedImage({ preview: '', file: null })
            if (inputRef.current) {
                inputRef.current.value = ''
            }

            setAddNewCoachOpen(false)
        } catch (error) {
            console.error('Error creating coach:', error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        return () => {
            if (selectedImage.preview) {
                URL.revokeObjectURL(selectedImage.preview)
            }
        }
    }, [selectedImage.preview]);

    // const imageURL = useMemo(() => {
    //     const getImage = async () => {
    //         if (selectedImage.file) {
    //             const url = await getImageUrl(selectedImage.file.name);

    //             return url;
    //         }
    //     }
    //     getImage();
    // }, [form.getValues('image')])

    const handleSelectSport = (id: number) => {
        if (loading) return
        setSelectedSports(prev =>
            prev.includes(id) ? prev.filter(sportId => sportId !== id) : [...prev, id]
        )
    }

    const handleSelectLanguage = (id: number) => {
        if (loading) return
        setSelectedLanguages(prev =>
            prev.includes(id) ? prev.filter(langId => langId !== id) : [...prev, id]
        )
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                form.setError('image', {
                    type: 'custom',
                    message: 'Only image files are allowed'
                });
                return;
            }

            const preview = URL.createObjectURL(file);
            setSelectedImage({
                preview,
                file
            });
        }
    }

    const handleToastValidation = () => {
        const values = form.getValues()
        const missingFields: string[] = [];

        if (!values.title) missingFields.push('Job Title');
        if (!values.name) missingFields.push('Name');
        if (!values.gender) missingFields.push('Gender');
        if (!values.bio) missingFields.push('Bio');
        if (!selectedSports.length) missingFields.push('Sports');
        if (!selectedLanguages.length) missingFields.push('Languages');

        if (missingFields.length > 0) {
            toast({
                title: "Missing Required Fields",
                description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
                variant: "destructive",
            });
        }
    }

    return (
        <>
            <button onClick={() => setAddNewCoachOpen(true)} className='flex text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-white'>
                <Plus size={16} className='stroke-main-yellow' />
                New Coach
            </button>
            <Dialog open={addNewCoachOpen} onOpenChange={setAddNewCoachOpen}>
                <DialogContent className='bg-main-white max-lg:max-w-[100vw] lg:min-w-[820px]'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full max-lg:max-w-[90vw]'>
                            <DialogHeader className='flex flex-row pr-6 text-center items-center justify-between gap-2'>
                                <DialogTitle className='font-normal text-base'>New Coach</DialogTitle>
                                <div className='flex items-center gap-2'>
                                    <button onClick={handleToastValidation} disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                        {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                        Create
                                    </button>
                                </div>
                            </DialogHeader>
                            <div className="w-full max-h-[480px] overflow-y-auto">
                                <div className="flex flex-col gap-6 w-full px-2 pt-4">

                                    <FormField
                                        control={form.control}
                                        name='image'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="flex flex-col gap-4 relative w-44">
                                                        {/* Show either the existing image or the new preview */}
                                                        {(field.value || selectedImage.preview) ? (
                                                            <div className="relative w-44 h-44">
                                                                <img
                                                                    src={selectedImage.preview || '/images/placeholder.svg'}
                                                                    alt="Preview"
                                                                    width={176}
                                                                    height={176}
                                                                    className="rounded-[31px] object-cover aspect-square"
                                                                />
                                                                {/* Add remove button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (selectedImage.preview) {
                                                                            URL.revokeObjectURL(selectedImage.preview);
                                                                        }
                                                                        setSelectedImage({ preview: '', file: null });
                                                                        if (inputRef.current) {
                                                                            inputRef.current.value = ''
                                                                        }
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
                                                                alt='Placeholder'
                                                                width={176}
                                                                height={176}
                                                                className='rounded-[31px] object-cover'
                                                            />
                                                        )}
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageChange(e)}
                                                            hidden
                                                            ref={inputRef}
                                                            className='absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-[5]'
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className='flex w-full gap-2 items-start justify-center'>
                                        <FormField
                                            control={form.control}
                                            name='title'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Job Title <span className='text-xs text-red-500'>*</span></FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name='name'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Name <span className='text-xs text-red-500'>*</span></FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className='flex w-full gap-2 items-start justify-center max-lg:flex-col'>
                                        <FormField
                                            control={form.control}
                                            name='gender'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Gender <span className='text-xs text-red-500'>*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                        <FormField
                                            control={form.control}
                                            name='dateOfBirth'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Date of Birth <span className='text-xs text-gray-500'>(optional)</span></FormLabel>
                                                    <FormControl>
                                                        <DateSelector field={field} optional />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name='privateSessionPercentage'
                                        render={({ field }) => (
                                            <FormItem className='hidden absolute'>
                                                <FormLabel>Private Session Percentage</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="number" min="0" max="100" className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='bio'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bio <span className='text-xs text-red-500'>*</span></FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} className='min-h-[100px] rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex flex-col gap-4 w-full">
                                        <p className='text-xs'>Sports <span className='text-xs text-red-500'>*</span></p>
                                        <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedSports.map((sport) => (
                                                    <Badge
                                                        key={sport}
                                                        variant="default"
                                                        className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                                    >
                                                        <span className="text-xs">{sports?.find(s => s.id === sport)?.name}</span>
                                                        <button
                                                            onClick={() => handleSelectSport(sport)}
                                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                                        >
                                                            <X className="size-3" fill='#1f441f' />
                                                            <span className="sr-only">Remove {sports?.find(s => s.id === sport)?.name}</span>
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                            <Popover open={sportsOpen} onOpenChange={setSportsOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="default"
                                                        className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                                    >
                                                        Select sports
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0 overflow-hidden" align="start">
                                                    <div
                                                        className="max-h-64 overflow-y-scroll overscroll-contain"
                                                        style={{
                                                            scrollbarWidth: 'thin',
                                                            WebkitOverflowScrolling: 'touch',
                                                            willChange: 'scroll-position'
                                                        }}
                                                        onWheel={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <div className="p-2">
                                                            {academySports?.reduce((unique, sport) => {
                                                                if (!unique.some(item => item.id === sport.id)) {
                                                                    unique.push(sport);
                                                                }
                                                                return unique;
                                                            }, [] as {
                                                                id: number;
                                                            }[]).map(sport => (
                                                                <p
                                                                    key={sport.id}
                                                                    onClick={() => handleSelectSport(sport.id)}
                                                                    className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                                >
                                                                    {selectedSports.includes(sport.id) && <X className="size-3" fill='#1f441f' />}
                                                                    {sports?.find(s => s.id === sport.id)?.name}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 w-full">
                                        <p className='text-xs'>Languages <span className='text-xs text-red-500'>*</span></p>
                                        <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedLanguages.map((lang) => (
                                                    <Badge
                                                        key={lang}
                                                        variant="default"
                                                        className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                                    >
                                                        <span className="text-xs">{languages?.find(l => l.id === lang)?.name}</span>
                                                        <button
                                                            onClick={() => handleSelectLanguage(lang)}
                                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                                        >
                                                            <X className="size-3" fill='#1f441f' />
                                                            <span className="sr-only">Remove {languages?.find(l => l.id === lang)?.name}</span>
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                            <Popover open={languagesOpen} onOpenChange={setLanguagesOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="default"
                                                        className="gap-2 hover:bg-transparent text-left flex items-center bg-transparent text-black border border-gray-500 justify-start"
                                                    >
                                                        Select languages
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0 overflow-hidden" align="start">
                                                    <div
                                                        className="max-h-64 overflow-y-scroll overscroll-contain"
                                                        style={{
                                                            scrollbarWidth: 'thin',
                                                            WebkitOverflowScrolling: 'touch',
                                                            willChange: 'scroll-position'
                                                        }}
                                                        onWheel={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <div className="p-2">
                                                            {languages?.map(language => (
                                                                <p
                                                                    key={language.id}
                                                                    onClick={() => handleSelectLanguage(language.id)}
                                                                    className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                                >
                                                                    {selectedLanguages.includes(language.id) && <X className="size-3" fill='#1f441f' />}
                                                                    {language.name}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
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