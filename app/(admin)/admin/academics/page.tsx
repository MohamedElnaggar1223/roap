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
  SelectLabel
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Edit,
  Eye,
  Loader2,
  Trash2Icon,
} from "lucide-react"
import { acceptAcademic, deleteAcademics, getPaginatedAcademics, rejectAcademic } from '@/lib/actions/academics.actions'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type Academic = {
  id: number
  slug: string
  description: string | null
  entryFees: number
  userId: number | null
  userName: string | null
  status: 'pending' | 'accepted' | 'rejected' | null
}

type PaginationMeta = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export default function AcademicsTable() {
  const router = useRouter()

  const [academics, setAcademics] = useState<Academic[]>([])
  const [filteredAcademics, setFilteredAcademics] = useState<Academic[]>([])
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [rejectAcademicOpen, setRejectAcademicOpen] = useState(false)
  const [rejectAcademicId, setRejectAcademicId] = useState<number | null>(null)
  const [rejectAcademicLoading, setRejectAcademicLoading] = useState(false)
  const [acceptAcademicLoading, setAcceptAcademicLoading] = useState<number | null>(null)

  const fetchAcademics = (page: number, pageSize: number) => {
    startTransition(async () => {
      const result = await getPaginatedAcademics(page, pageSize)

      setAcademics(result?.data)
      setFilteredAcademics(result?.data)
      setMeta(result?.meta)
    })
  }

  useEffect(() => {
    fetchAcademics(meta.page, meta.pageSize)
  }, [])

  const handlePageChange = (newPage: number) => {
    fetchAcademics(newPage, meta.pageSize)
  }

  const handlePageSizeChange = (newPageSize: string) => {
    fetchAcademics(1, parseInt(newPageSize))
  }

  const handleRowSelect = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedRows(
      selectedRows.length === academics.length ? [] : academics.map(academy => academy.id)
    )
  }

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true)
    await deleteAcademics(selectedRows)
    router.refresh()
    fetchAcademics(meta.page, meta.pageSize)
    setBulkDeleteLoading(false)
    setBulkDeleteOpen(false)
  }

  const handleAcceptAcademic = async (academicId: number) => {
    setAcceptAcademicLoading(academicId)
    await acceptAcademic(academicId)
    setAcceptAcademicLoading(null)
    router.refresh()
    fetchAcademics(meta.page, meta.pageSize)
  }

  const handleRejectAcademic = async () => {
    if (!rejectAcademicId) return

    setRejectAcademicLoading(true)
    await rejectAcademic(rejectAcademicId)
    router.refresh()
    setRejectAcademicLoading(false)
    fetchAcademics(meta.page, meta.pageSize)
  }

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredAcademics(academics)
      return
    }
    const filtered = academics.filter(academy => academy.status === statusFilter)
    setFilteredAcademics(filtered)
  }, [statusFilter])

  return (
    <>
      <div className="flex flex-col w-full items-center justify-center h-full gap-6">
        <div className="flex max-w-7xl items-center justify-between gap-2 w-full">
          <h1 className="text-3xl font-bold">Academics</h1>
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
            <Label htmlFor='statusFilter' className="text-sm font-medium">Status: </Label>
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger id='statusFilter' className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className='!bg-[#F1F2E9]'>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-4 max-w-7xl overflow-auto w-full border rounded-2xl p-4 bg-[#fafafa]">
          <Table className='overflow-auto max-w-7xl'>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedRows.length === academics.length && academics.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className='min-w-[400px]'>Name</TableHead>
                <TableHead className='min-w-[600px]'>Description</TableHead>
                <TableHead className='min-w-[200px]'>Entry Fees</TableHead>
                <TableHead className='min-w-[200px]'>Academic Lead</TableHead>
                <TableHead className='min-w-[200px]'>Status</TableHead>
                <TableHead className='sr-only'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAcademics.map((academic) => (
                <TableRow key={academic.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(academic.id)}
                      onCheckedChange={() => handleRowSelect(academic.id)}
                      aria-label={`Select ${academic.slug}`}
                    />
                  </TableCell>
                  <TableCell className='min-w-[400px]'>{academic.slug}</TableCell>
                  <TableCell className='min-w-[600px]'>{academic.description ? academic.description.substring(0, 100) + '...' : 'N/A'}</TableCell>
                  <TableCell className='min-w-[200px]'>${academic.entryFees.toFixed(2)}</TableCell>
                  <TableCell className='min-w-[200px]'>{academic.userName || 'N/A'}</TableCell>
                  <TableCell className='min-w-[200px]'>{academic.status || 'pending'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button className='flex items-center justify-center gap-2' variant="outline" onClick={() => console.log('Edit', academic.id)}>
                        <Edit />
                        Edit
                      </Button>
                      <Button className='flex items-center justify-center gap-2' variant="outline" onClick={() => console.log('View', academic.id)}>
                        <Eye />
                        View
                      </Button>
                      {academic.status === 'pending' && (
                        <>
                          <Button disabled={acceptAcademicLoading === academic.id} className='flex bg-main hover:bg-main-hovered hover:text-white text-white items-center justify-center gap-2' variant="outline" onClick={() => handleAcceptAcademic(academic.id)}>
                            Accept
                          </Button>
                          <Button disabled={acceptAcademicLoading === academic.id} className='flex bg-red-500 hover:bg-red-600 hover:text-white text-white items-center justify-center gap-2' variant="outline" onClick={() => { setRejectAcademicOpen(true); setRejectAcademicId(academic.id); }}>
                            Reject
                          </Button>
                        </>
                      )}
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
              Are you sure you want to delete ({selectedRows.length}) countries?
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
      <Dialog open={rejectAcademicOpen} onOpenChange={setRejectAcademicOpen}>
        <DialogContent className='font-geist'>
          <DialogHeader>
            <DialogTitle className='font-medium'>Reject Academic</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this academic?
            </DialogDescription>
            <DialogFooter>
              <Button disabled={rejectAcademicLoading} variant="destructive" onClick={handleRejectAcademic} className='flex items-center gap-2'>
                {rejectAcademicLoading && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
                Reject
              </Button>
              <Button disabled={rejectAcademicLoading} onClick={() => setRejectAcademicOpen(false)} className='flex items-center gap-2'>
                Cancel
              </Button>
            </DialogFooter>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}