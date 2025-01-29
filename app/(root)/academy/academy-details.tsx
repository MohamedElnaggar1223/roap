'use client'
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
import { Textarea } from '@/components/ui/textarea';
import { getImageUrl, uploadImageToSupabase, uploadVideoToSupabase } from '@/lib/supabase-images';
import Image, { ImageLoaderProps } from 'next/image';
import TipTapEditor from '@/components/academy/academy-details/Editor';
import { academyDetailsSchema } from '@/lib/validations/academies';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Play, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAcademyDetailsPage, updateAcademyDetails } from '@/lib/actions/academics.actions';
import AddNewSport from './add-new-sport';
import { useOnboarding } from '@/providers/onboarding-provider';
import { cn } from '@/lib/utils';
import { useSportsStore } from '@/providers/store-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getQueryClient } from '../get-query-client';

// type Props = {
//     academyDetails: {
//         gallery: (string)[];
//         logo: string | null;
//         data?.sports?: number[] | undefined;
//         id?: number | undefined;
//         slug?: string | undefined;
//         policy?: string | null | undefined;
//         entryFees?: number | undefined;
//         extra?: string | null | undefined;
//         name?: string | undefined;
//         description?: string | undefined;
//         locale?: string | undefined;
//     }
//     sports: {
//         id: number;
//         image: string | null;
//         name: string;
//         locale: string;
//     }[];
// }

type FileState = {
    preview: string;
    file: File | null;
}

type GalleryState = {
    preview: string;
    file: File | null;
    type: 'image' | 'video'
}

export default function AcademyDetails() {

    const router = useRouter()
    const { toast } = useToast()
    const { mutate } = useOnboarding()

    const queryClient = getQueryClient()

    const { data } = useSuspenseQuery({
        queryKey: ['academyDetails'],
        queryFn: () => getAcademyDetailsPage(),
    })

    const { fetchSports, fetchRemainingSports } = useSportsStore((state) => state)

    const inputRef = useRef<HTMLInputElement>(null)

    const [selectedSports, setSelectedSports] = useState<number[]>(data?.academyDetails.sports ?? [])
    const [loading, setLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<FileState>({
        preview: data?.academyDetails.logo ?? '',
        file: null
    });
    const [selectedGalleryImages, setSelectedGalleryImages] = useState<GalleryState[]>(
        data?.academyDetails?.gallery?.map((url: string) => ({
            preview: url,
            file: null,
            type: url?.toLowerCase().endsWith('.mp4') ? 'video' : 'image'
        })) as GalleryState[]
    );

    const [isDraggingLogo, setIsDraggingLogo] = useState(false);
    const [isDraggingGallery, setIsDraggingGallery] = useState(false);

    const handleDragOver = (e: React.DragEvent, setDragging: (value: boolean) => void) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent, setDragging: (value: boolean) => void) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const handleLogoDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingLogo(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const preview = URL.createObjectURL(file);
            setSelectedImage({
                preview,
                file
            });
        } else {
            form.setError('logo', {
                type: 'custom',
                message: 'Only image files are allowed'
            });
        }
    };

    useEffect(() => {
        setSelectedSports(data?.academyDetails.sports ?? [])
    }, [data])

    const handleGalleryDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingGallery(false);

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/') || file.type.startsWith('video/mp4')
        );

        if (files.length > 0) {
            const newFiles = files.map(file => ({
                preview: URL.createObjectURL(file),
                file,
                type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video'
            }));
            setSelectedGalleryImages(prev => [...prev, ...newFiles]);
        }
    };

    const form = useForm({
        resolver: zodResolver(academyDetailsSchema),
        defaultValues: {
            policy: data?.academyDetails.policy ?? '',
            entryFees: 0,
            extra: data?.academyDetails.extra ?? '',
            name: data?.academyDetails.name ?? '',
            logo: data?.academyDetails.logo ?? '',
            description: data?.academyDetails.description ?? '',
            gallery: (data?.academyDetails?.gallery?.length ?? 0) > 0 ? data?.academyDetails.gallery.filter(Boolean) as string[] : [] as string[],
        }
    })

    const onSubmit = async (values: z.infer<typeof academyDetailsSchema>) => {
        try {
            setLoading(true)

            let logoPath = values.logo;

            if (selectedImage.file) {
                try {
                    logoPath = await uploadImageToSupabase(selectedImage.file);
                } catch (error) {
                    setLoading(false);
                    form.setError('logo', {
                        type: 'custom',
                        message: 'Error uploading logo. Please try again.'
                    });
                    return;
                }
            }

            const galleryUrls: string[] = []

            selectedGalleryImages
                .filter(img => !img.file)
                .forEach(img => {
                    galleryUrls.push(img.preview)
                })

            const newGalleryImages = selectedGalleryImages.filter(img => img.file);
            console.log("New Gallery Images", newGalleryImages)
            if (newGalleryImages.length > 0) {
                try {
                    const uploadPromises = newGalleryImages.map(media => {
                        if (media.type === 'video') {
                            return uploadVideoToSupabase(media.file!);
                        }
                        return uploadImageToSupabase(media.file!);
                    });
                    const newUrls = await Promise.all(uploadPromises);
                    galleryUrls.push(...newUrls);
                } catch (error) {
                    setLoading(false);
                    console.log("Error uploading gallery media: ", error)
                    form.setError('gallery', {
                        type: 'custom',
                        message: 'Error uploading gallery media. Please try again.'
                    });
                    return;
                }
            }

            const result = await updateAcademyDetails({
                ...values,
                logo: logoPath || '',
                gallery: galleryUrls,
                sports: selectedSports,
            })

            if (result.error) {
                // Reset sports selection if error is related to sports
                if (result.field === 'sports') {
                    setSelectedSports(data?.academyDetails.sports ?? []);
                    form.reset({
                        policy: data?.academyDetails.policy ?? '',
                        entryFees: data?.academyDetails.entryFees ?? 0,
                        extra: data?.academyDetails.extra ?? '',
                        name: data?.academyDetails.name ?? '',
                        logo: data?.academyDetails.logo ?? '',
                        description: data?.academyDetails.description ?? '',
                        gallery: data?.academyDetails.gallery ?? [],
                    });
                    toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive"
                    });
                    return;
                }

                if (result.field) {
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

            if (selectedImage.preview) {
                URL.revokeObjectURL(selectedImage.preview);
            }
            selectedGalleryImages.forEach(img => {
                if (img.preview && img.file) {
                    URL.revokeObjectURL(img.preview);
                }
            });

            toast({
                title: "Success",
                description: "Academy details updated successfully",
            })

            queryClient.invalidateQueries({
                queryKey: ['academyDetails']
            })

            mutate()
            router.refresh()
        } catch (error) {
            console.error('Error updating academy details:', error)
            form.setError('root', {
                type: 'custom',
                message: 'An unexpected error occurred'
            })
        } finally {
            setLoading(false)
        }

        await fetchSports()
        await fetchRemainingSports()
    }

    const handleSelectSport = (id: number) => {
        if (loading) return;

        setSelectedSports(prev => {
            const newSelection = prev.includes(id)
                ? prev.filter(sportId => sportId !== id)
                : [...prev, id];

            // Prevent empty selection
            if (newSelection.length === 0) {
                toast({
                    title: "Error",
                    description: "At least one sport must be selected",
                    variant: "destructive"
                });
                return prev;
            }

            return newSelection;
        });
    };

    useEffect(() => {
        return () => {
            if (selectedImage.preview) {
                URL.revokeObjectURL(selectedImage.preview)
            }
        }
    }, [selectedImage.preview]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                form.setError('logo', {
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

    const handleGalleryImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newFiles = Array.from(files).map(file => ({
                preview: URL.createObjectURL(file),
                file,
                type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video'
            }));
            setSelectedGalleryImages(prev => [...prev, ...newFiles]);
        }
    };

    const removeGalleryImage = (index: number) => {
        setSelectedGalleryImages(prev => {
            const newImages = [...prev];
            if (newImages[index].preview) {
                URL.revokeObjectURL(newImages[index].preview);
            }
            newImages.splice(index, 1);
            return newImages;
        });
    };

    console.log(
        form.formState.errors.description,
        form.formState.errors.entryFees,
        form.formState.errors.extra,
        form.formState.errors.gallery,
        form.formState.errors.logo,
        form.formState.errors.name,
        form.formState.errors.policy,
    )

    console.log(form.getValues('entryFees'))

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
                <div className="flex w-full items-center justify-between">
                    <p className='font-bold text-sm'>Academy Details</p>
                    <Button variant="default" className='flex text-nowrap items-center justify-center gap-2 rounded-3xl px-4 py-5 bg-main-green text-sm text-main-yellow'>
                        {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Academy Name</FormLabel>
                            <FormControl>
                                <Input
                                    disabled={loading}
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" "))}
                                    className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter'
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="entryFees"
                    render={({ field }) => (
                        <FormItem className='hidden absolute'>
                            <FormLabel>Academy Name</FormLabel>
                            <FormControl>
                                <Input disabled={loading} {...field} className='px-2 py-6 rounded-[10px] border border-gray-500 font-inter' />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>About</FormLabel>
                            <FormControl>
                                <Textarea disabled={loading} rows={5} {...field} className='px-2 py-3 rounded-[10px] border border-gray-500 font-inter' />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex w-full items-start justify-between gap-4">
                    <div className="flex flex-col gap-4 w-full flex-1">
                        <p className='text-xs'>Sports</p>
                        <div className="flex w-full flex-col gap-4 border border-gray-500 p-3 rounded-lg">
                            <div className="flex flex-wrap gap-2">
                                {selectedSports.map((sport) => (
                                    <Badge
                                        key={sport}
                                        variant="default"
                                        className="flex items-center gap-1 hover:bg-[#E0E4D9] pr-0.5 bg-[#E0E4D9] rounded-3xl text-main-green font-semibold font-inter text-sm"
                                    >
                                        <span className="text-xs">{data?.sports?.find(s => s.id === sport)?.name}</span>
                                        <button
                                            onClick={() => handleSelectSport(sport)}
                                            disabled={loading}
                                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                                        >
                                            <X className="size-3" fill='#1f441f' />
                                            <span className="sr-only">Remove {data?.sports?.find(s => s.id === sport)?.name}</span>
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <AddNewSport sports={data?.sports?.filter(s => data?.academyDetails?.sports?.includes(s.id))!} />
                            {/* <Popover open={sportsOpen} onOpenChange={setSportsOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="default"
                                        disabled={loading}
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
                                            {data?.sports?.map(sport => (
                                                <p
                                                    key={sport.id}
                                                    onClick={() => handleSelectSport(sport.id)}
                                                    className="p-2 flex items-center justify-start gap-2 text-left cursor-pointer hover:bg-[#fafafa] rounded-lg"
                                                >
                                                    {selectedSports.includes(sport.id) && <X className="size-3" fill='#1f441f' />}
                                                    {sport.name}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover> */}

                        </div>
                    </div>
                    <div className="flex flex-col gap-4 w-full flex-1">
                        <p className='text-xs'>
                            Logo
                            {" "}
                            <span className='text-[10px] text-red-500'>jpeg, png, svg, webp</span>
                        </p>
                        <div className="flex w-full items-center justify-center gap-4 border border-gray-500 p-3 rounded-lg">
                            <FormField
                                control={form.control}
                                name='logo'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div
                                                className={cn(
                                                    "flex flex-col gap-4 items-center justify-center w-full border border-gray-500 p-3 rounded-lg transition-colors",
                                                    isDraggingLogo && "border-main-green bg-main-green/10"
                                                )}
                                                onDragOver={(e) => handleDragOver(e, setIsDraggingLogo)}
                                                onDragLeave={(e) => handleDragLeave(e, setIsDraggingLogo)}
                                                onDrop={handleLogoDrop}
                                            >
                                                <div className="flex flex-col gap-4 relative w-44">
                                                    {(field.value || selectedImage.preview) ? (
                                                        <div className="relative w-44 h-44">
                                                            <img
                                                                src={selectedImage?.preview || '/images/placeholder.svg'}
                                                                alt="Preview"
                                                                width={176}
                                                                height={176}
                                                                className="rounded-[31px] object-cover aspect-square"
                                                            />
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
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                </div>

                <div className="flex flex-col gap-4 w-full">
                    <div className="flex w-full items-center justify-between">

                        <p className='text-xs'>
                            Gallery
                            {" "}
                            <span className='text-[10px] text-red-500'>jpeg, png, svg, webp, for video(s) mp4</span>
                        </p>
                        <Button
                            variant="default"
                            disabled={loading}
                            className="flex text-nowrap relative cursor-pointer items-center justify-center gap-2 rounded-3xl px-4 py-5 bg-main-green text-sm text-main-yellow"
                        >
                            <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleGalleryImageChange}
                                className="absolute w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center">
                                <span className="">Upload</span>
                            </div>
                        </Button>
                    </div>
                    <FormField
                        control={form.control}
                        name="gallery"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="flex flex-col gap-4 w-full">
                                        <div
                                            className={cn(
                                                "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 border border-gray-500 p-3 rounded-lg transition-colors",
                                                isDraggingGallery && "border-main-green bg-main-green/10"
                                            )}
                                            onDragOver={(e) => handleDragOver(e, setIsDraggingGallery)}
                                            onDragLeave={(e) => handleDragLeave(e, setIsDraggingGallery)}
                                            onDrop={handleGalleryDrop}
                                        >
                                            {selectedGalleryImages.map((image, index) => (
                                                <div key={index} className="relative aspect-square">
                                                    {image.type === 'image' ? (
                                                        <img
                                                            src={image.preview}
                                                            alt={image.preview}
                                                            width={300}
                                                            height={300}
                                                            className="object-cover rounded-lg aspect-square"
                                                        />
                                                    ) : (
                                                        <div className="relative w-full h-full">
                                                            <video
                                                                src={image.preview}
                                                                className="absolute inset-0 w-full h-full object-cover rounded-lg"
                                                                controls
                                                            />
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <Play className="h-8 w-8 text-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGalleryImage(index)}
                                                        disabled={loading}
                                                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 z-10"
                                                    >
                                                        <X className="h-4 w-4 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                                                <Input
                                                    type="file"
                                                    accept="image/*, video/mp4"
                                                    multiple
                                                    disabled={loading}
                                                    onChange={handleGalleryImageChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="text-center">
                                                    <Plus className="h-8 w-8 mx-auto text-gray-400" />
                                                    <span className="text-sm text-gray-500">Add Media</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="policy"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Policy</FormLabel>
                            <FormControl>
                                <TipTapEditor
                                    value={field.value ?? ''}
                                    onValueChange={field.onChange}
                                    disabled={loading}
                                    className="min-h-[400px] listDisplay !font-inter !antialiased"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form >
    )
}