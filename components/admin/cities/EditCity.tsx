'use client'

import { AlertCircle, Edit, Eye, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDebouncedCallback } from 'use-debounce'
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { addCityTranslation, deleteCity, deleteCityTranslations, editCityTranslation } from "@/lib/actions/cities.actions"
import { addCityTranslationSchema } from "@/lib/validations/cities"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type CityTranslation = {
    id: number
    name: string
    locale: string
    stateId: number | null
}

type StateOption = {
    value: number
    label: string
}

type Props = {
    cityTranslations: CityTranslation[]
    cityId: string
    stateOptions: StateOption[]
}

const updateMainTranslationSchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
    locale: z.string().min(2, {
        message: "Please enter a valid locale",
    }),
    stateId: z.string().min(1, {
        message: "Please enter a valid stateId",
    }),
})

const updateCityTranslationSchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
    locale: z.string().min(2, {
        message: "Please enter a valid locale",
    }),
})

export default function EditCityAttachment({ cityTranslations, cityId, stateOptions }: Props) {
    const mainTranslation = cityTranslations.find(cityTranslation => cityTranslation.locale === 'en')
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [cityTranslationsData, setCityTranslationsData] = useState<CityTranslation[]>(cityTranslations)
    const [searchQuery, setSearchQuery] = useState('')
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const [newTranslationOpen, setNewTranslationOpen] = useState(false)
    const [newTranslationLoading, setNewTranslationLoading] = useState(false)
    const [newTranslationError, setNewTranslationError] = useState('')
    const [editCityTranslationOpen, setEditCityTranslationOpen] = useState(false)
    const [editCityTranslationId, setEditCityTranslationId] = useState<number | null>(null)
    const [editCityTranslationLoading, setEditCityTranslationLoading] = useState(false)
    const [editCityTranslationError, setEditCityTranslationError] = useState('')
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const formMainTranslation = useForm<z.infer<typeof updateMainTranslationSchema>>({
        resolver: zodResolver(updateMainTranslationSchema),
        defaultValues: {
            name: mainTranslation?.name || (cityTranslations.length > 0 ? cityTranslations[0].name : ''),
            locale: mainTranslation?.locale || (cityTranslations.length > 0 ? cityTranslations[0].locale : ''),
            stateId: mainTranslation?.stateId?.toString() || (cityTranslations.length > 0 ? cityTranslations[0].stateId?.toString() ? cityTranslations[0].stateId.toString() : '' : ''),
        },
    })

    async function onSubmitMainTranslation(values: z.infer<typeof updateMainTranslationSchema>) {
        setLoading(true)
        if (!mainTranslation) return
        await editCityTranslation(values, mainTranslation?.id, cityId)
        router.refresh()
        setLoading(false)
    }

    const formNewTranslation = useForm<z.infer<typeof addCityTranslationSchema>>({
        resolver: zodResolver(addCityTranslationSchema),
        defaultValues: {
            name: '',
            locale: '',
            cityId: cityId,
        },
    })

    async function onSubmitNewTranslation(values: z.infer<typeof addCityTranslationSchema>) {
        setNewTranslationLoading(true)
        const { error } = await addCityTranslation(values)
        setNewTranslationLoading(false)
        if (error) {
            setNewTranslationError(error)
            return
        }
        setNewTranslationOpen(false)
        router.refresh()
    }

    const formEditCityTranslation = useForm<z.infer<typeof updateCityTranslationSchema>>({
        resolver: zodResolver(updateCityTranslationSchema),
        defaultValues: {
            name: cityTranslations.find(cityTranslation => cityTranslation.id === editCityTranslationId)?.name || '',
            locale: cityTranslations.find(cityTranslation => cityTranslation.id === editCityTranslationId)?.locale || '',
        },
    })

    async function onSubmitEditCityTranslation(values: z.infer<typeof updateCityTranslationSchema>) {
        setEditCityTranslationLoading(true)
        if (!editCityTranslationId) return
        const { error } = await editCityTranslation(values, editCityTranslationId)
        setEditCityTranslationLoading(false)
        if (error) {
            setEditCityTranslationError(error)
            return
        }
        setEditCityTranslationOpen(false)
        router.refresh()
    }

    const handleDelete = async () => {
        setDeleteLoading(true)
        await deleteCity(parseInt(cityId))
        router.push('/admin/cities')
        setDeleteLoading(false)
        setDeleteOpen(false)
    }

    const handleRowSelect = (id: number) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedRows(
            selectedRows.length === cityTranslationsData.length ? [] : cityTranslationsData.map(city => city.id)
        )
    }

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            setCityTranslationsData(cityTranslations)
        }
        else {
            const filtered = cityTranslations.filter(city =>
                city.name?.toLowerCase().includes(lowercasedValue) ||
                city.locale?.toLowerCase().includes(lowercasedValue)
            )
            setCityTranslationsData(filtered)
        }
    }, 300)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true)
        await deleteCityTranslations(selectedRows, cityId)
        router.refresh()
        setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    const handleEditCityTranslation = (id: number) => {
        formEditCityTranslation.setValue('name', cityTranslations.find(cityTranslation => cityTranslation.id === id)?.name || '')
        formEditCityTranslation.setValue('locale', cityTranslations.find(cityTranslation => cityTranslation.id === id)?.locale || '')
        setEditCityTranslationOpen(true)
        setEditCityTranslationId(id)
    }

    return (
        <>
            <div className="flex flex-col w-full items-center justify-start h-full gap-6">
                <div className="flex max-w-7xl items-center justify-between gap-2 w-full">
                    <h1 className="text-3xl font-bold">Edit City</h1>
                    <div className="flex items-center gap-2">
                        <Link href={`/admin/cities/${cityId}/view`}>
                            <Button variant="outline" className='' >
                                View
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteOpen(true)}
                            className="flex items-center gap-2"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
                <Form {...formMainTranslation}>
                    <form onSubmit={formMainTranslation.handleSubmit(onSubmitMainTranslation)} className="space-y-4 w-full max-w-7xl">
                        <div className="max-w-7xl grid grid-cols-1 lg:grid-cols-2 w-full gap-4 border rounded-2xl p-6">
                            <FormField
                                control={formMainTranslation.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className='flex-1'>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2' placeholder="" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={formMainTranslation.control}
                                name="stateId"
                                render={({ field }) => (
                                    <FormItem className='flex-1'>
                                        <FormLabel>State</FormLabel>
                                        <Select disabled={loading} onValueChange={field.onChange} defaultValue={field.value.toString()}>
                                            <FormControl>
                                                <SelectTrigger className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2'>
                                                    <SelectValue placeholder="Select state" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className='!bg-[#F1F2E9]'>
                                                {stateOptions.map(state => (
                                                    <SelectItem key={state.value} value={state.value.toString()}>{state.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-4 max-w-7xl w-full space-x-2">
                            <Button disabled={loading || (formMainTranslation.getValues('name') === mainTranslation?.name && formMainTranslation.getValues('stateId') === mainTranslation?.stateId?.toString())} type='submit' variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' size="default">
                                {loading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                                Save changes
                            </Button>
                        </div>
                    </form>
                </Form>
                <div className="space-y-4 divide-y max-w-7xl w-full border rounded-2xl p-4 bg-[#fafafa]">
                    <div className="flex w-full items-center justify-between p-1.5">
                        <p className='font-semibold'>Translations</p>
                        <Button onClick={() => setNewTranslationOpen(true)} variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' size="sm">
                            <PlusIcon stroke='#fff' className="h-4 w-4" />
                            New Translation
                        </Button>
                    </div>
                    <div className='flex w-full items-center justify-end gap-2 pt-4'>
                        {selectedRows.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={() => setBulkDeleteOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Trash2Icon className="h-4 w-4" />
                                Delete Selected ({selectedRows.length})
                            </Button>
                        )}
                        <div className="relative">
                            <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className='focus-visible:ring-2 bg-white focus-visible:ring-main pl-8 pr-4 py-2'
                            />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedRows.length === cityTranslationsData.length && cityTranslationsData.length > 0}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className=''>Name</TableHead>
                                <TableHead className=''>Locale</TableHead>
                                <TableHead className='sr-only'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cityTranslationsData.map((city) => (
                                <TableRow key={city.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(city.id)}
                                            onCheckedChange={() => handleRowSelect(city.id)}
                                            aria-label={`Select ${city.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className=''>{city.name}</TableCell>
                                    <TableCell className=''>{city.locale}</TableCell>
                                    <TableCell className='w-[200px]'>
                                        <div className="flex space-x-2 items-center justify-end">
                                            <Button onClick={() => handleEditCityTranslation(city.id)} className='flex items-center justify-center gap-2' variant="outline" >
                                                <Edit className="h-4 w-4" />
                                                Edit
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent className='font-geist'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Delete Translations</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedRows.length} translations?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button disabled={bulkDeleteLoading} variant="destructive" onClick={handleBulkDelete} className='flex items-center gap-2'>
                            {bulkDeleteLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                            <Trash2Icon className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button disabled={bulkDeleteLoading} onClick={() => setBulkDeleteOpen(false)} className='flex items-center gap-2'>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={newTranslationOpen} onOpenChange={setNewTranslationOpen}>
                <DialogContent className='font-geist max-w-5xl'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Create city translation</DialogTitle>
                    </DialogHeader>
                    <Form {...formNewTranslation}>
                        <form onSubmit={formNewTranslation.handleSubmit(onSubmitNewTranslation)} className="space-y-4 w-full max-w-7xl">
                            <div className="max-w-7xl flex max-lg:flex-wrap items-center justify-center w-full gap-4 border rounded-2xl p-6">
                                <FormField
                                    control={formNewTranslation.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2' placeholder="" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formNewTranslation.control}
                                    name="locale"
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>Locale</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2' placeholder="" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {newTranslationError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        {newTranslationError}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <DialogFooter>
                                <div className="space-y-4 max-w-7xl w-full space-x-2">
                                    <Button disabled={newTranslationLoading} type='submit' variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' size="default">
                                        {newTranslationLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                                        Create
                                    </Button>
                                    <Button onClick={() => setNewTranslationOpen(false)} disabled={newTranslationLoading} type='button' variant="outline" size="default">
                                        Cancel
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <Dialog open={editCityTranslationOpen} onOpenChange={setEditCityTranslationOpen}>
                <DialogContent className='font-geist max-w-5xl'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Edit {cityTranslations.find(cityTranslation => cityTranslation.id === editCityTranslationId)?.name}</DialogTitle>
                    </DialogHeader>
                    <Form {...formEditCityTranslation}>
                        <form onSubmit={formEditCityTranslation.handleSubmit(onSubmitEditCityTranslation)} className="space-y-4 w-full max-w-7xl">
                            <div className="max-w-7xl flex max-lg:flex-wrap items-center justify-center w-full gap-4 border rounded-2xl p-6">
                                <FormField
                                    control={formEditCityTranslation.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2' placeholder="" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formEditCityTranslation.control}
                                    name="locale"
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>Locale</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2' placeholder="" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {editCityTranslationError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        {editCityTranslationError}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <DialogFooter>
                                <div className="space-y-4 max-w-7xl w-full space-x-2">
                                    <Button disabled={editCityTranslationLoading || (formEditCityTranslation.getValues('name') === cityTranslations.find(cityTranslation => cityTranslation.id === editCityTranslationId)?.name && formEditCityTranslation.getValues('locale') === cityTranslations.find(cityTranslation => cityTranslation.id === editCityTranslationId)?.locale)} type='submit' variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' size="default">
                                        {editCityTranslationLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                                        Save
                                    </Button>
                                    <Button onClick={() => setEditCityTranslationOpen(false)} disabled={editCityTranslationLoading} type='button' variant="outline" size="default">
                                        Cancel
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className='font-geist'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Delete City</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {mainTranslation?.name || 'this city'}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button disabled={deleteLoading} variant="destructive" onClick={handleDelete} className='flex items-center gap-2'>
                            {deleteLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                            <Trash2Icon className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button disabled={deleteLoading} onClick={() => setDeleteOpen(false)} className='flex items-center gap-2'>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}