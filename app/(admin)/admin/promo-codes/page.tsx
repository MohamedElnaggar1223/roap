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
    Loader2,
    PlusIcon,
    Trash2Icon,
} from "lucide-react"
import { getPaginatedPromoCodesAdmin, deletePromoCodesAdmin } from '@/lib/actions/admin-promo-codes.actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from "@/components/ui/badge"

type PromoCode = {
    id: number
    code: string
    discountType: 'fixed' | 'percentage'
    discountValue: number
    startDate: string
    endDate: string
    canBeUsed: number
    academicId: number | null
    academyName: string
    createdAt: string | null
}

type PaginationMeta = {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
}

export default function AdminPromoCodesTable() {
    const router = useRouter()

    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
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

    const fetchPromoCodes = (page: number, pageSize: number) => {
        startTransition(async () => {
            const result = await getPaginatedPromoCodesAdmin(page, pageSize)
            setPromoCodes(result?.data || [])
            setMeta(result?.meta || {
                page: 1,
                pageSize: 10,
                totalItems: 0,
                totalPages: 0,
            })
            setSelectedRows([])
        })
    }

    useEffect(() => {
        fetchPromoCodes(meta.page, meta.pageSize)
    }, [])

    const handlePageChange = (newPage: number) => {
        fetchPromoCodes(newPage, meta.pageSize)
    }

    const handlePageSizeChange = (newPageSize: string) => {
        fetchPromoCodes(1, parseInt(newPageSize))
    }

    const handleRowSelect = (id: number) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedRows(
            selectedRows.length === promoCodes.length ? [] : promoCodes.map(promoCode => promoCode.id)
        )
    }

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true)
        await deletePromoCodesAdmin(selectedRows)
        router.refresh()
        fetchPromoCodes(meta.page, meta.pageSize)
        setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    const formatDiscountValue = (value: number, type: string) => {
        return type === 'percentage' ? `${value}%` : `$${value}`
    }

    return (
        <>
            <div className="flex flex-col w-full items-center justify-start h-full gap-6">
                <div className="flex max-w-7xl items-center justify-between gap-2 w-full">
                    <h1 className="text-3xl font-bold">Promo Codes</h1>
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
                        <Link href="/admin/promo-codes/create">
                            <Button variant="outline" className='bg-main text-white hover:bg-main-hovered hover:text-white'>
                                <PlusIcon stroke='#fff' className="h-4 w-4" />
                                New Promo Code
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
                                        checked={selectedRows.length === promoCodes.length && promoCodes.length > 0}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Academy</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Usage Limit</TableHead>
                                <TableHead className='sr-only'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {promoCodes.map((promoCode) => (
                                <TableRow key={promoCode.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(promoCode.id)}
                                            onCheckedChange={() => handleRowSelect(promoCode.id)}
                                            aria-label={`Select ${promoCode.code}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{promoCode.code}</TableCell>
                                    <TableCell>
                                        {promoCode.academicId ? (
                                            <span>{promoCode.academyName}</span>
                                        ) : (
                                            <Badge variant="secondary">General</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {formatDiscountValue(promoCode.discountValue, promoCode.discountType)}
                                    </TableCell>
                                    <TableCell>{formatDate(promoCode.startDate)}</TableCell>
                                    <TableCell>{formatDate(promoCode.endDate)}</TableCell>
                                    <TableCell>{promoCode.canBeUsed}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2 items-center justify-end">
                                            <Button
                                                onClick={() => router.push(`/admin/promo-codes/${promoCode.id}/edit`)}
                                                className='flex items-center justify-center gap-2'
                                                variant="outline"
                                            >
                                                <Edit className="h-4 w-4" />
                                                Edit
                                            </Button>
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
                        <DialogTitle className='font-medium'>Delete Promo Codes</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete ({selectedRows.length}) promo codes?
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