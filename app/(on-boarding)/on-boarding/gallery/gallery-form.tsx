// 'use client'

// import { useState, useEffect } from 'react'
// import { z } from 'zod'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
// import { Input } from '@/components/ui/input'
// import { Play, Plus, X } from 'lucide-react'
// import Image from 'next/image'
// import { useOnboarding } from '@/providers/onboarding-provider'
// import { useSave } from '@/providers/onboarding-save-provider'
// import { updateAcademyDetails } from '@/lib/actions/academics.actions'
// import { uploadImageToSupabase, uploadVideoToSupabase } from '@/lib/supabase-images'
// import { useToast } from '@/hooks/use-toast'

// const gallerySchema = z.object({
//     gallery: z.array(z.string())
// })

// type GalleryState = {
//     preview: string
//     file: File | null
//     type: 'image' | 'video'
// }

// interface Props {
//     academyDetails: {
//         gallery: string[]
//         name?: string | null
//         description?: string | null
//         sports?: number[] | null
//         logo?: string | null
//         policy?: string | null
//         entryFees?: number | null
//         extra?: string | null
//         coaches: {
//             sports: number[];
//             languages: number[];
//             packages: number[];
//             id: number;
//             name: string;
//             title: string | null;
//             image: string | null;
//             bio: string | null;
//             gender: string | null;
//             dateOfBirth: string | null;
//             privateSessionPercentage: string | null;
//         }[] | null
//         programs: {
//             coaches: string[];
//             packages: string[];
//             id: number;
//             name: string | null;
//             description: string | null;
//             type: string | null;
//             numberOfSeats: number | null;
//             branchId: number | null;
//             sportId: number | null;
//             sportName: string | null;
//             startDateOfBirth: string | null;
//             endDateOfBirth: string | null;
//             branchName: string | null;
//         }[] | undefined
//         locations: {
//             sports: string[];
//             facilities: string[];
//             id: number;
//             name: string;
//             locale: string;
//             nameInGoogleMap: string | null;
//             url: string | null;
//             isDefault: boolean;
//             rate: number | null;
//             amenities: string[];
//         }[] | null
//     }
// }

// export default function OnboardingGalleryForm({ academyDetails }: Props) {
//     const { updateRequirements } = useOnboarding()
//     const { registerSaveHandler, unregisterSaveHandler } = useSave()

//     const [selectedGalleryImages, setSelectedGalleryImages] = useState<GalleryState[]>(
//         academyDetails.gallery.map(url => ({
//             preview: url,
//             file: null,
//             type: url.toLowerCase().endsWith('.mp4') ? 'video' : 'image'
//         }))
//     )

//     const form = useForm({
//         resolver: zodResolver(gallerySchema),
//         defaultValues: {
//             gallery: academyDetails.gallery.length > 0 ? academyDetails.gallery.filter(Boolean) : []
//         }
//     })

//     useEffect(() => {
//         updateRequirements('gallery', {
//             hasGallery: selectedGalleryImages.length > 0
//         })
//         updateRequirements('academy-details', { name: !!academyDetails.name, description: !!academyDetails.description, sports: !!academyDetails.sports, logo: !!academyDetails.logo })
//         updateRequirements('policy', { hasPolicy: !!academyDetails.policy })
//         updateRequirements('coach', {
//             name: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].name,
//             title: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].title,
//             bio: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].bio,
//             gender: (academyDetails?.coaches ?? []).length > 0 && !!academyDetails?.coaches![0].gender,
//             sports: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].sports.length > 0,
//             languages: (academyDetails?.coaches ?? []).length > 0 && academyDetails?.coaches![0].languages.length > 0,
//         })
//         updateRequirements('location', {
//             name: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].name,
//             branchId: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].id,
//             nameInGoogleMap: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].nameInGoogleMap,
//             url: (academyDetails.locations ?? [])?.length > 0 && !!academyDetails.locations![0].url,
//             sports: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].sports.length > 0),
//             facilities: (academyDetails.locations ?? [])?.length > 0 && (academyDetails.locations![0].facilities.length > 0),
//         })
//         updateRequirements('program', { packages: ((academyDetails.programs ?? []).length > 0 && academyDetails?.programs![0]?.packages.length > 0) })
//     }, [selectedGalleryImages])

//     useEffect(() => {
//         const values = form.getValues()
//         const currentRequirements = {
//             hasGallery: (values.gallery.length > 0 || selectedGalleryImages.length > 0)
//         }
//         updateRequirements('gallery', currentRequirements)
//     }, [selectedGalleryImages, form.getValues('gallery')])


//     useEffect(() => {
//         registerSaveHandler('gallery', {
//             handleSave: async () => {
//                 try {
//                     const galleryUrls: string[] = []

//                     selectedGalleryImages
//                         .filter(img => !img.file)
//                         .forEach(img => {
//                             galleryUrls.push(img.preview)
//                         })

//                     const newGalleryImages = selectedGalleryImages.filter(img => img.file)
//                     if (newGalleryImages.length > 0) {
//                         const uploadPromises = newGalleryImages.map(media => {
//                             if (media.type === 'video') {
//                                 return uploadVideoToSupabase(media.file!)
//                             }
//                             return uploadImageToSupabase(media.file!)
//                         })
//                         const newUrls = await Promise.all(uploadPromises)
//                         galleryUrls.push(...newUrls)
//                     }

//                     const result = await updateAcademyDetails({
//                         ...academyDetails,
//                         entryFees: academyDetails.entryFees ?? 0,
//                         extra: academyDetails.extra ?? '',
//                         policy: academyDetails.policy ?? '',
//                         name: academyDetails.name ?? '',
//                         description: academyDetails.description ?? '',
//                         logo: academyDetails.logo ?? '',
//                         sports: academyDetails.sports ?? [],
//                         gallery: galleryUrls,
//                     })

//                     if (result.error) {
//                         return { success: false, error: result.error }
//                     }

//                     return { success: true }
//                 } catch (error) {
//                     return {
//                         success: false,
//                         error: error instanceof Error ? error.message : 'Failed to save gallery'
//                     }
//                 }
//             }
//         })

//         return () => unregisterSaveHandler('gallery')
//     }, [registerSaveHandler, unregisterSaveHandler, selectedGalleryImages, academyDetails])

//     const handleGalleryImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const files = event.target.files
//         if (files) {
//             const newFiles = Array.from(files).map(file => ({
//                 preview: URL.createObjectURL(file),
//                 file,
//                 type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video'
//             }))
//             setSelectedGalleryImages(prev => [...prev, ...newFiles])
//         }
//     }

//     const removeGalleryImage = (index: number) => {
//         setSelectedGalleryImages(prev => {
//             const newImages = [...prev]
//             if (newImages[index].preview) {
//                 URL.revokeObjectURL(newImages[index].preview)
//             }
//             newImages.splice(index, 1)
//             return newImages
//         })
//     }

//     return (
//         <Form {...form}>
//             <form className='flex flex-col gap-6 w-full'>
//                 <div className="flex flex-col gap-4 w-full">
//                     <div className="flex w-full items-center justify-between">
//                         <h3 className="text-lg font-semibold">Gallery</h3>
//                         <div className="flex items-center gap-2 relative">
//                             <Input
//                                 type="file"
//                                 accept="image/*, video/mp4"
//                                 multiple
//                                 onChange={handleGalleryImageChange}
//                                 hidden
//                                 id="gallery-upload"
//                                 className="hidden absolute w-full h-full"
//                             />
//                             <label
//                                 htmlFor="gallery-upload"
//                                 className="flex cursor-pointer items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-main-yellow"
//                             >
//                                 Upload
//                             </label>
//                         </div>
//                     </div>
//                     <FormField
//                         control={form.control}
//                         name="gallery"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormControl>
//                                     <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 border border-gray-500 p-3 rounded-lg">
//                                         {selectedGalleryImages.map((image, index) => (
//                                             <div key={index} className="relative aspect-square">
//                                                 {image.type === 'image' ? (
//                                                     <Image
//                                                         src={image.preview}
//                                                         alt={`Gallery item ${index + 1}`}
//                                                         fill
//                                                         className="object-cover rounded-lg"
//                                                     />
//                                                 ) : (
//                                                     <div className="relative w-full h-full">
//                                                         <video
//                                                             src={image.preview}
//                                                             className="absolute inset-0 w-full h-full object-cover rounded-lg"
//                                                             controls
//                                                         />
//                                                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//                                                             <Play className="h-8 w-8 text-white" />
//                                                         </div>
//                                                     </div>
//                                                 )}
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => removeGalleryImage(index)}
//                                                     className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 z-10"
//                                                 >
//                                                     <X className="h-4 w-4 text-white" />
//                                                 </button>
//                                             </div>
//                                         ))}
//                                         <label className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
//                                             <Input
//                                                 type="file"
//                                                 accept="image/*, video/mp4"
//                                                 multiple
//                                                 onChange={handleGalleryImageChange}
//                                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//                                             />
//                                             <div className="text-center">
//                                                 <Plus className="h-8 w-8 mx-auto text-gray-400" />
//                                                 <span className="text-sm text-gray-500">Add Media</span>
//                                             </div>
//                                         </label>
//                                     </div>
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                 </div>
//             </form>
//         </Form>
//     )
// }