'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateCoach } from '@/lib/actions/coaches.actions';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea';
import { getImageUrl, uploadImageToSupabase } from '@/lib/supabase-images';

type Coach = {
    id: number
    name: string
    title: string | null
    image: string | null
    bio: string | null
    gender: string | null
    dateOfBirth: string | null
    privateSessionPercentage: string | null
    sports: number[]
    languages: number[]
    packages: number[]
}

type Props = {
    coachEdited: Coach
    sports: {
        id: number
        name: string
        image: string | null
        locale: string
    }[]
    languages: {
        id: number
        name: string
        locale: string
    }[]
    academySports?: { id: number }[]
}

type FileState = {
    preview: string;
    file: File | null;
}

export default function EditCoach({ coachEdited, sports, languages, academySports }: Props) {
    const router = useRouter()

    const inputRef = useRef<HTMLInputElement>(null)

    const [editOpen, setEditOpen] = useState(false)
    const [selectedSports, setSelectedSports] = useState<number[]>(coachEdited.sports ?? [])
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>(coachEdited.languages ?? [])
    const [selectedImage, setSelectedImage] = useState<FileState>({
        preview: coachEdited.image || '',
        file: null
    });
    const [loading, setLoading] = useState(false)
    const [sportsOpen, setSportsOpen] = useState(false)
    const [languagesOpen, setLanguagesOpen] = useState(false)

    const form = useForm<z.infer<typeof addCoachSchema>>({
        resolver: zodResolver(addCoachSchema),
        defaultValues: {
            name: coachEdited.name,
            title: coachEdited.title ?? '',
            bio: coachEdited.bio ?? '',
            gender: coachEdited.gender ?? '',
            image: coachEdited.image ?? '',
            dateOfBirth: coachEdited.dateOfBirth ? new Date(coachEdited.dateOfBirth) : new Date(),
            privateSessionPercentage: coachEdited.privateSessionPercentage?.replaceAll('%', '') ?? '',
        }
    })

    const onSubmit = async (values: z.infer<typeof addCoachSchema>) => {
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

        await updateCoach(coachEdited.id, {
            ...values,
            image: imagePath || '',
            sports: selectedSports,
            languages: selectedLanguages,
        })

        if (selectedImage.preview) {
            URL.revokeObjectURL(selectedImage.preview);
        }

        setLoading(false)
        setEditOpen(false)
        router.refresh()
    }

    useEffect(() => {
        return () => {
            if (selectedImage.preview) {
                URL.revokeObjectURL(selectedImage.preview)
            }
        }
    }, [selectedImage.preview]);

    const imageURL = useMemo(() => {
        const getImage = async () => {
            if (selectedImage.file) {
                const url = await getImageUrl(selectedImage.file.name);

                return url;
            }
        }
        getImage();
    }, [form.getValues('image')])

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
                                <DialogTitle className='font-normal text-base'>Edit Coach</DialogTitle>
                                <div className='flex items-center gap-2'>
                                    <button disabled={loading} type='submit' className='flex disabled:opacity-60 items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5'>
                                        {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                                        Save
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
                                                                <Image
                                                                    src={selectedImage.preview || imageURL || '/images/placeholder.svg'}
                                                                    alt="Preview"
                                                                    fill
                                                                    className="rounded-[31px] object-cover"
                                                                />
                                                                {/* Add remove button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (selectedImage.preview) {
                                                                            URL.revokeObjectURL(selectedImage.preview);
                                                                        }
                                                                        setSelectedImage({ preview: '', file: null });
                                                                        field.onChange('');
                                                                    }}
                                                                    className="absolute -top-2 -right-2 bg-red-500 rounded-[31px] p-1"
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
                                                                className='rounded-[31px]'
                                                            />
                                                        )}
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageChange(e)}
                                                            hidden
                                                            ref={inputRef}
                                                            className='absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer'
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
                                                    <FormLabel>Title</FormLabel>
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
                                                    <FormLabel>Name</FormLabel>
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
                                            name='gender'
                                            render={({ field }) => (
                                                <FormItem className='flex-1'>
                                                    <FormLabel>Gender</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                        <FormField
                                            control={form.control}
                                            name='dateOfBirth'
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
                                                <FormLabel>Bio</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} className='min-h-[100px] rounded-[10px] border border-gray-500 font-inter' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex flex-col gap-4 w-full">
                                        <p className='text-xs'>Sports</p>
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
                                                            {academySports?.map(sport => (
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
                                        <p className='text-xs'>Languages</p>
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