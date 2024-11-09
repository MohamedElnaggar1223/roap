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
import { getPaginatedCities } from '@/lib/actions/cities.actions'

type City = {
  id: number
  name: string | null
  state: string | null
}

type PaginationMeta = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export default function CitiesTable() {
  const [cities, setCities] = useState<City[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  })
  const [isPending, startTransition] = useTransition()

  const fetchCities = (page: number, pageSize: number) => {
    startTransition(async () => {
      const result = await getPaginatedCities(page, pageSize)
      setCities(result?.data)
      setMeta(result?.meta)
    })
  }

  useEffect(() => {
    fetchCities(meta.page, meta.pageSize)
  }, [])

  const handlePageChange = (newPage: number) => {
    fetchCities(newPage, meta.pageSize)
  }

  const handlePageSizeChange = (newPageSize: string) => {
    fetchCities(1, parseInt(newPageSize))
  }

  return (
    <div className="flex w-full items-start justify-center h-full">
        <div className="space-y-4 max-w-7xl w-full border rounded-2xl p-4 bg-[#fafafa]">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead className='sr-only'>Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {cities.map((city) => (
                <TableRow key={city.id}>
                <TableCell>{city.name}</TableCell>
                <TableCell>{city.state}</TableCell>
                <TableCell>
                    <div className="flex space-x-2">
                    <Button className='flex items-center justify-center gap-2' variant="outline" size="sm" onClick={() => console.log('Edit', city.id)}>
                        <Edit />
                        Edit
                    </Button>
                    <Button className='flex items-center justify-center gap-2' variant="outline" size="sm" onClick={() => console.log('View', city.id)}>
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