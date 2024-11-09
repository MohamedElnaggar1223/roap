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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Edit,
  Eye,
} from "lucide-react"
import { getPaginatedAcademics } from '@/lib/actions/academics.actions'

type Academic = {
  id: number
  slug: string
  policy: string | null
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
  const [academics, setAcademics] = useState<Academic[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  })
  const [isPending, startTransition] = useTransition()

  const fetchAcademics = (page: number, pageSize: number) => {
    startTransition(async () => {
      const result = await getPaginatedAcademics(page, pageSize)
      setAcademics(result?.data)
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

  return (
    <div className="flex w-full items-start justify-center h-full">
      <div className="space-y-4 max-w-7xl w-full border rounded-2xl p-4 bg-[#fafafa]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Entry Fees</TableHead>
              <TableHead>Academic Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='sr-only'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {academics.map((academic) => (
              <TableRow key={academic.id}>
                <TableCell>{academic.slug}</TableCell>
                <TableCell>{academic.policy ? academic.policy.substring(0, 100) + '...' : 'N/A'}</TableCell>
                <TableCell>${academic.entryFees.toFixed(2)}</TableCell>
                <TableCell>{academic.userName || 'N/A'}</TableCell>
                <TableCell>{academic.status || 'pending'}</TableCell>
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
  )
}