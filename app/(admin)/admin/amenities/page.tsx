'use client'

import { useState, useEffect, useTransition } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    Edit,
    Eye,
    Loader2,
    PlusIcon,
    Trash2Icon,
} from "lucide-react"
import { deleteFacilities, getPaginatedFacilities } from '@/lib/actions/amenities.actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'

type Amenity = {
    id: number
    name: string | null
    locale: string | null
}

type PaginationMeta = {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
}

export default function AmenitiesTable() {

    const router = useRouter()

    const [amenities, setAmenities] = useState<Amenity[]>([])
    const [meta, setMeta] = useState<PaginationMeta>({
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    })
    const [isPending, startTransition] = useTransition()
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    const fetchAmenities = (page: number, pageSize: number) => {
        startTransition(async () => {
            const result = await getPaginatedFacilities(page, pageSize)
            setAmenities(result?.data)
            setMeta(result?.meta)
            setSelectedRows([])
        })
    }

    useEffect(() => {
        fetchAmenities(meta.page, meta.pageSize)
    }, [])

    const handlePageChange = (newPage: number) => {
        fetchAmenities(newPage, meta.pageSize)
    }

    const handlePageSizeChange = (newPageSize: string) => {
        fetchAmenities(1, parseInt(newPageSize))
    }

    const handleRowSelect = (id: number) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedRows(
            selectedRows.length === amenities.length ? [] : amenities.map(amenity => amenity.id)
        )
    }

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true)
        await deleteFacilities(selectedRows)
        router.refresh()
        fetchAmenities(meta.page, meta.pageSize)
        setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    return (
        <>
            <div className="flex flex-col w-full items-center justify-start h-full gap-6">
                <div className="flex max-w-7xl items-center justify-between gap-2 w-full">
                    <h1 className="text-3xl font-bold">Amenities</h1>
                    <div className="flex items-center gap-2">
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
                        <Link href="/admin/amenities/create">
                            <Button variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white' >
                                <PlusIcon stroke='#fff' className="h-4 w-4" />
                                New Amenity
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="space-y-4 max-w-7xl w-full border rounded-2xl p-4 bg-[#fafafa]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedRows.length === amenities.length && amenities.length > 0}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className='sr-only'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {amenities.map((amenity) => (
                                <TableRow key={amenity.id.toString() + amenity.name}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(amenity.id)}
                                            onCheckedChange={() => handleRowSelect(amenity.id)}
                                            aria-label={`Select ${amenity.name}`}
                                        />
                                    </TableCell>
                                    <TableCell>{amenity.name}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2 items-center justify-end">
                                            <Button onClick={() => router.push(`/admin/amenities/${amenity.id.toString()}/edit`)} className='flex items-center justify-center gap-2' variant="outline" >
                                                <Edit className="h-4 w-4" />
                                                Edit
                                            </Button>
                                            {/* <Button onClick={() => router.push(`/admin/amenities/${amenity.id.toString()}/view`)} className='flex items-center justify-center gap-2' variant="outline" >
                                                <Eye className="h-4 w-4" />
                                                View
                                            </Button> */}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <Select
                                value={meta.pageSize.toString()}
                                onValueChange={handlePageSizeChange}
                                disabled={isPending}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={meta.pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((size) => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(1)}
                                disabled={meta.page === 1 || isPending}
                            >
                                <ChevronsLeftIcon className="h-4 w-4" />
                                <span className="sr-only">First page</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(meta.page - 1)}
                                disabled={meta.page === 1 || isPending}
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                                <span className="sr-only">Previous page</span>
                            </Button>
                            <span className="text-sm">
                                Page {meta.page} of {meta.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(meta.page + 1)}
                                disabled={meta.page === meta.totalPages || isPending}
                            >
                                <ChevronRightIcon className="h-4 w-4" />
                                <span className="sr-only">Next page</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(meta.totalPages)}
                                disabled={meta.page === meta.totalPages || isPending}
                            >
                                <ChevronsRightIcon className="h-4 w-4" />
                                <span className="sr-only">Last page</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent className='font-geist'>
                    <DialogHeader>
                        <DialogTitle className='font-medium'>Delete Translations</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete ({selectedRows.length}) amenities?
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
        </>
    )
}