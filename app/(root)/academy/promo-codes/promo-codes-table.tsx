'use client'

import { useState, Fragment } from 'react'
import { Loader2, SearchIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import AddNewPromoCode from './add-new-promo-code'
import { useDebouncedCallback } from 'use-debounce'
import Image from 'next/image'
import EditPromoCode from './edit-promo-code'
import { useRouter } from 'next/navigation'
import { deletePromoCodes } from '@/lib/actions/promo-codes.actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface PromoCode {
    id: number
    code: string
    discountType: 'fixed' | 'percentage'
    discountValue: number
    startDate: string
    endDate: string
}

interface PromoCodesDataTableProps {
    data: PromoCode[]
}

export function PromoCodesDataTable({ data }: PromoCodesDataTableProps) {
    const router = useRouter()

    const [filteredData, setFilteredData] = useState<PromoCode[]>(data)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRows, setSelectedRows] = useState<number[]>([])
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    const debouncedSearch = useDebouncedCallback((value: string) => {
        const lowercasedValue = value.toLowerCase()
        if (!lowercasedValue) {
            setFilteredData(data)
        }
        else {
            const filtered = data.filter(promoCode =>
                promoCode.code?.toLowerCase().includes(lowercasedValue)
            )
            setFilteredData(filtered)
        }
    }, 300)

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        debouncedSearch(value)
    }

    const handleRowSelect = (id: number) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedRows(
            selectedRows.length === filteredData.length ? [] : filteredData.map(location => location.id)
        )
    }

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true)
        await deletePromoCodes(selectedRows)
        router.refresh()
        setBulkDeleteLoading(false)
        setBulkDeleteOpen(false)
    }

    return (
        <>
            <div className="flex items-center justify-between gap-4 w-full flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                    <AddNewPromoCode />
                </div>
                <div className='flex ml-auto items-center justify-end gap-2'>
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
                        <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 peer-focus:text-black" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className='ring-2 bg-transparent ring-[#868685] rounded-3xl pl-8 pr-4 py-2'
                        />
                    </div>
                </div>
            </div>

            <div className="w-full max-w-screen-2xl overflow-x-auto">
                <div className="min-w-full grid grid-cols-[auto,0.25fr,auto,auto,auto,auto,auto] gap-y-2 text-nowrap">
                    {/* Header */}
                    <div className="contents">
                        <div className="py-4 px-4 flex items-center justify-center">
                            <Checkbox
                                checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all"
                            />
                        </div>
                        <div className="py-4 px-4">Code</div>
                        <div className="py-4 px-4">Discount</div>
                        <div className="py-4 px-4">Start Date</div>
                        <div className="py-4 px-4">End Date</div>
                        <div className="py-4 px-4">Redeemed</div>
                        <div className="py-4 px-4"></div>
                    </div>

                    {/* Rows */}
                    {filteredData
                        .map((promoCode) => (
                            <Fragment key={promoCode.id}>
                                <div className="py-4 px-4 bg-main-white rounded-l-[20px] flex items-center justify-center font-bold font-inter">
                                    <Checkbox
                                        checked={selectedRows.includes(promoCode.id)}
                                        onCheckedChange={() => handleRowSelect(promoCode.id)}
                                        aria-label={`Select ${promoCode.code}`}
                                    />
                                </div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{promoCode.code}</div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{promoCode.discountValue}{promoCode.discountType === 'fixed' ? ' AED' : '%'}</div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{new Date(promoCode.startDate).toLocaleDateString()}</div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">{new Date(promoCode.endDate).toLocaleDateString()}</div>
                                <div className="py-4 px-4 bg-main-white flex items-center justify-start font-bold font-inter">0</div>
                                <div className="py-4 px-4 bg-main-white rounded-r-[20px] flex items-center justify-end font-bold font-inter">
                                    <EditPromoCode promoCodeEdited={promoCode} />
                                </div>
                            </Fragment>
                        ))}
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