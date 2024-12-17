'use client'

import { AlertCircle, Edit, Eye, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addStateTranslation, deleteState, deleteStateTranslations, editCityTranslation, editStateTranslation } from "@/lib/actions/states.actions";
import { addStateTranslationSchema } from "@/lib/validations/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteCity } from "@/lib/actions/cities.actions";

type StateTranslation = {
    id: number;
    name: string;
    locale: string;
    countryId: number | null;
}

type CountryOption = {
    value: number;
    label: string;
}

type City = {
    id: number
    name: string
    translationId: number
}

type Props = {
    stateTranslations: StateTranslation[]
    stateId: string
    countryOptions: CountryOption[]
    cities: City[]
}

const updateMainTranslationSchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
    locale: z.string().min(2, {
        message: "Please enter a valid locale",
    }),
    countryId: z.string().min(1, {
        message: "Please enter a valid countryId",
    }),
})

const updateStateTranslationSchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
    locale: z.string().min(2, {
        message: "Please enter a valid locale",
    }),
})

const updateCitySchema = z.object({
    name: z.string().min(2, {
        message: "Please enter a valid name",
    }),
})

export default function EditState({ stateTranslations, stateId, countryOptions, cities }: Props) {
    const mainTranslation = stateTranslations.find(stateTranslation => stateTranslation.locale === 'en')
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [stateTranslationsData, setStateTranslationsData] = useState<StateTranslation[]>(stateTranslations)
    const [searchQuery, setSearchQuery] = useState('')
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const [newTranslationOpen, setNewTranslationOpen] = useState(false)
    const [newTranslationLoading, setNewTranslationLoading] = useState(false)
    const [newTranslationError, setNewTranslationError] = useState('')
    const [editStateTranslationOpen, setEditStateTranslationOpen] = useState(false)
    const [editStateTranslationId, setEditStateTranslationId] = useState<number | null>(null)
    const [editStateTranslationLoading, setEditStateTranslationLoading] = useState(false)
    const [editStateTranslationError, setEditStateTranslationError] = useState('')
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [selectedCitiesRows, setSelectedCitiesRows] = useState<number[]>([])
    const [bulkDeleteCitiesOpen, setBulkDeleteCitiesOpen] = useState(false)
    const [editCityId, setEditCityId] = useState<number | null>(null)
    const [editCityOpen, setEditCityOpen] = useState(false)
    const [editCityLoading, setEditCityLoading] = useState(false)
    const [editCityError, setEditCityError] = useState('')
    const [bulkDeleteCitiesLoading, setBulkDeleteCitiesLoading] = useState(false)
    const [bulkDeleteCitiesError, setBulkDeleteCitiesError] = useState('')

    const formMainTranslation = useForm<z.infer<typeof updateMainTranslationSchema>>({
        resolver: zodResolver(updateMainTranslationSchema),
        defaultValues: {
            name: mainTranslation?.name || (stateTranslations.length > 0 ? stateTranslations[0].name : ''),
            locale: mainTranslation?.locale || (stateTranslations.length > 0 ? stateTranslations[0].locale : ''),
            countryId: mainTranslation?.countryId?.toString() || (stateTranslations.length > 0 ? stateTranslations[0].countryId?.toString() ? stateTranslations[0].countryId.toString() : '' : ''),
        },
    })

    async function onSubmitMainTranslation(values: z.infer<typeof updateMainTranslationSchema>) {
        setLoading(true)
        if (!mainTranslation) return
        await editStateTranslation(values, mainTranslation?.id, stateId)
        router.refresh()
        setLoading(false)
    }

    const formNewTranslation = useForm<z.infer<typeof addStateTranslationSchema>>({
        resolver: zodResolver(addStateTranslationSchema),
        defaultValues: {
            name: '',
            locale: '',
            stateId: stateId,
        },
    })

    async function onSubmitNewTranslation(values: z.infer<typeof addStateTranslationSchema>) {
        setNewTranslationLoading(true)
        const { error } = await addStateTranslation(values)
        setNewTranslationLoading(false)
        if (error) {
            setNewTranslationError(error)
            return
        }
        setNewTranslationOpen(false)
        router.refresh()
    }

    const formEditStateTranslation = useForm<z.infer<typeof updateStateTranslationSchema>>({
        resolver: zodResolver(updateStateTranslationSchema),
        defaultValues: {
            name: stateTranslations.find(stateTranslation => stateTranslation.id === editStateTranslationId)?.name || '',
            locale: stateTranslations.find(stateTranslation => stateTranslation.id === editStateTranslationId)?.locale || '',
        },
    })

    async function onSubmitEditStateTranslation(values: z.infer<typeof updateStateTranslationSchema>) {
        setEditStateTranslationLoading(true)
        if (!editStateTranslationId) return
        const { error } = await editStateTranslation(values, editStateTranslationId)
        setEditStateTranslationLoading(false)
        if (error) {
            setEditStateTranslationError(error)
            return
        }
        setEditStateTranslationOpen(false)
        router.refresh()
    }

    const formEditCity = useForm<z.infer<typeof updateCitySchema>>({
        resolver: zodResolver(updateCitySchema),
        defaultValues: {
            name: cities.find(city => city.id === editCityId)?.name || '',
        },
    })

    async function onSubmitEditCity(values: z.infer<typeof updateCitySchema>) {
        setEditCityLoading(true)
        if (!editCityId) return
        const { error } = await editCityTranslation(values, editCityId)
        setEditCityLoading(false)
        if (error) {
            setEditCityError(error)
            return
        }
        setEditCityOpen(false)
        router.refresh()
    }

    const handleDelete = async () => {
        setDeleteLoading(true)
        await deleteState(parseInt(stateId))
        router.push('/admin/states')
        setDeleteLoading(false)
        setDeleteOpen(false)
    }

    const handleRowSelect = (id: number) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const handleCityRowSelect = (id: number) => {
        setSelectedCitiesRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedRows(
            selectedRows.length === stateTranslationsData.length ? [] : stateTranslationsData.map(state => state.id)
        )
    }

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            setStateTranslationsData(stateTranslations)
        }
        else {
            const filtered = stateTranslations.filter(state =>
                state.name?.toLowerCase().includes(lowercasedValue) ||
                state.locale?.toLowerCase().includes(lowercasedValue)
            )
            setStateTranslationsData(filtered)
        }
    }, 300)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true)
        await deleteStateTranslations(selectedRows, stateId)
        router.refresh()
        setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    const handleEditStateTranslation = (id: number) => {
        formEditStateTranslation.setValue('name', stateTranslations.find(stateTranslation => stateTranslation.id === id)?.name || '')
        formEditStateTranslation.setValue('locale', stateTranslations.find(stateTranslation => stateTranslation.id === id)?.locale || '')
        setEditStateTranslationOpen(true)
        setEditStateTranslationId(id)
    }

    const handleCitiesSelectAll = () => {
        setSelectedCitiesRows(
            selectedCitiesRows.length === cities.length ? [] : cities.map(city => city.id)
        )
    }

    const handleEditCity = (id: number) => {
        formEditCity.setValue('name', cities.find(city => city.id === id)?.name || '')
        setEditCityOpen(true)
        setEditCityId(id)
    }

    const handleCitiesBulkDelete = async () => {
        setBulkDeleteCitiesLoading(true)
        await Promise.all(selectedCitiesRows.map(async cityId => {
            await deleteCity(cityId)
        }))
        router.refresh()
        setBulkDeleteCitiesLoading(false)
        setBulkDeleteCitiesOpen(false)
    }

    return (
        <>
            <div className="flex flex-col w-full items-center justify-start h-full gap-6">
                <div className="flex max-w-7xl items-center justify-between gap-2 w-full">
                    <h1 className="text-3xl font-bold">Edit State</h1>
                    <div className="flex items-center gap-2">
                        <Link href={`/admin/states/${stateId}/view`}>
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
                                name="countryId"
                                render={({ field }) => (
                                    <FormItem className='flex-1'>
                                        <FormLabel>Country</FormLabel>
                                        <Select disabled={loading} onValueChange={field.onChange} defaultValue={field.value.toString()}>
                                            <FormControl>
                                                <SelectTrigger className='max-w-[570px] focus-visible:ring-main focus-visible:ring-2'>
                                                    <SelectValue placeholder="Select country" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className='!bg-[#F1F2E9]'>
                                                {countryOptions.map(country => (
                                                    <SelectItem key={country.value} value={country.value.toString()}>{country.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-4 max-w-7xl w-full space-x-2">
                            <Button disabled={loading || (formMainTranslation.getValues('name') === mainTranslation?.name && formMainTranslation.getValues('countryId') === mainTranslation?.countryId?.toString())} type='submit' variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' size="default">
                                {loading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                                Save changes
                            </Button>
                        </div>
                    </form>
                </Form>
                <Tabs defaultValue="translations" className="w-full flex flex-col items-center justify-center gap-4">
                    <TabsList className='h-[3.25rem] px-2 py-2 bg-[#FAFAFA]'>
                        <TabsTrigger className='h-full data-[state=active]:bg-white data-[state=active]:text-main' value="translations">Translations</TabsTrigger>
                        <TabsTrigger className='h-full data-[state=active]:bg-white data-[state=active]:text-main' value="cities">Cities</TabsTrigger>
                    </TabsList>
                    <TabsContent value="translations" className='w-full flex items-center justify-center'>
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
                                                checked={selectedRows.length === stateTranslationsData.length && stateTranslationsData.length > 0}
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
                                    {stateTranslationsData.map((state) => (
                                        <TableRow key={state.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedRows.includes(state.id)}
                                                    onCheckedChange={() => handleRowSelect(state.id)}
                                                    aria-label={`Select ${state.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className=''>{state.name}</TableCell>
                                            <TableCell className=''>{state.locale}</TableCell>
                                            <TableCell className='w-[200px]'>
                                                <div className="flex space-x-2 items-center justify-end">
                                                    <Button onClick={() => handleEditStateTranslation(state.id)} className='flex items-center justify-center gap-2' variant="outline" >
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
                    </TabsContent>
                    <TabsContent value="cities" className='w-full flex items-center justify-center'>
                        <div className="space-y-4 divide-y max-w-7xl w-full border rounded-2xl p-4 bg-[#fafafa]">
                            <div className="flex w-full items-center justify-between p-1.5">
                                <p className='font-semibold'>Cities</p>
                                <div className='flex w-full items-center justify-end gap-2 pt-4'>
                                    {selectedCitiesRows.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            onClick={() => setBulkDeleteCitiesOpen(true)}
                                            className="flex items-center gap-2"
                                        >
                                            <Trash2Icon className="h-4 w-4" />
                                            Delete Selected ({selectedCitiesRows.length})
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={selectedCitiesRows.length === cities.length && cities.length > 0}
                                                onCheckedChange={handleCitiesSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead className=''>Name</TableHead>
                                        <TableHead className='sr-only'>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cities.map((city) => (
                                        <TableRow key={city.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedCitiesRows.includes(city.id)}
                                                    onCheckedChange={() => handleCityRowSelect(city.id)}
                                                    aria-label={`Select ${city.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className=''>{city.name}</TableCell>
                                            <TableCell className='w-[200px]'>
                                                <div className="flex space-x-2 items-center justify-end">
                                                    <Button onClick={() => handleEditCity(city.translationId)} className='flex items-center justify-center gap-2' variant="outline" >
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
                    </TabsContent>
                </Tabs>
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
                        <DialogTitle className='font-medium'>Create state translation</DialogTitle>
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
            <Dialog open={editStateTranslationOpen} onOpenChange={setEditStateTranslationOpen}>
                <DialogContent className='font-geist max-w-5xl'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Edit {stateTranslations.find(stateTranslation => stateTranslation.id === editStateTranslationId)?.name}</DialogTitle>
                    </DialogHeader>
                    <Form {...formEditStateTranslation}>
                        <form onSubmit={formEditStateTranslation.handleSubmit(onSubmitEditStateTranslation)} className="space-y-4 w-full max-w-7xl">
                            <div className="max-w-7xl flex max-lg:flex-wrap items-center justify-center w-full gap-4 border rounded-2xl p-6">
                                <FormField
                                    control={formEditStateTranslation.control}
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
                                    control={formEditStateTranslation.control}
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
                            {editStateTranslationError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        {editStateTranslationError}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <DialogFooter>
                                <div className="space-y-4 max-w-7xl w-full space-x-2">
                                    <Button disabled={editStateTranslationLoading || (formEditStateTranslation.getValues('name') === stateTranslations.find(stateTranslation => stateTranslation.id === editStateTranslationId)?.name && formEditStateTranslation.getValues('locale') === stateTranslations.find(stateTranslation => stateTranslation.id === editStateTranslationId)?.locale)} type='submit' variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' size="default">
                                        {editStateTranslationLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                                        Save
                                    </Button>
                                    <Button onClick={() => setEditStateTranslationOpen(false)} disabled={editStateTranslationLoading} type='button' variant="outline" size="default">
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
                        <DialogTitle className='font-medium'>Delete State</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {mainTranslation?.name || 'this state'}?
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
            <Dialog open={editCityOpen} onOpenChange={setEditCityOpen}>
                <DialogContent className='font-geist max-w-5xl'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Edit City</DialogTitle>
                    </DialogHeader>
                    <Form {...formEditCity}>
                        <form onSubmit={formEditCity.handleSubmit(onSubmitEditCity)} className="space-y-4 w-full max-w-7xl">
                            <div className="max-w-7xl flex max-lg:flex-wrap items-center justify-center w-full gap-4 border rounded-2xl p-6">
                                <FormField
                                    control={formEditCity.control}
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
                            </div>
                            {editCityError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        {editCityError}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <DialogFooter>
                                <div className="space-y-4 max-w-7xl w-full space-x-2">
                                    <Button disabled={editCityLoading || (formEditCity.getValues('name') === cities.find(city => city.id === editCityId)?.name)} type='submit' variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' size="default">
                                        {editCityLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                                        Save
                                    </Button>
                                    <Button onClick={() => setEditCityOpen(false)} disabled={editCityLoading} type='button' variant="outline" size="default">
                                        Cancel
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <Dialog open={bulkDeleteCitiesOpen} onOpenChange={setBulkDeleteCitiesOpen}>
                <DialogContent className='font-geist'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Delete Cities</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete ({selectedCitiesRows.length}) cities?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button disabled={bulkDeleteCitiesLoading} variant="destructive" onClick={handleCitiesBulkDelete} className='flex items-center gap-2'>
                            {bulkDeleteCitiesLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                            <Trash2Icon className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button disabled={bulkDeleteCitiesLoading} onClick={() => setBulkDeleteCitiesOpen(false)} className='flex items-center gap-2'>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}