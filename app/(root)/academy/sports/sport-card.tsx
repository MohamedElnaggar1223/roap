'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { deleteSport } from "@/lib/actions/academics.actions"
import { EllipsisVertical, Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SportCard({ sport }: { sport: { id: number, name: string, image: string | null } }) {
    const router = useRouter()

    const [isOpen, setIsOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleDeleteSport = async () => {
        setLoading(true)

        await deleteSport(sport.id)

        router.refresh()
        setLoading(false)
        setDeleteOpen(false)
    }

    return (
        <>
            <div className='flex gap-4 items-center justify-between bg-main-white rounded-[20px] p-5'>
                <div className="flex items-center justify-center gap-4">
                    <Image
                        src={`https://roap.co/storage/${sport?.image}`}
                        alt={sport.name}
                        width={64}
                        height={64}
                        className='min-w-16 min-h-16 max-w-16 max-h-16 object-contain'
                    />
                    <p className='text-base font-bold text-black'>{sport.name}</p>
                </div>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <EllipsisVertical size={20} className='cursor-pointer' />
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-56 overflow-hidden rounded-lg p-0"
                        align="end"
                    >
                        <Sidebar collapsible="none" className="bg-transparent border-none outline-none">
                            <SidebarContent className='outline-none border-none'>
                                <SidebarGroup className='outline-none border-none'>
                                    <SidebarGroupContent className="gap-0 outline-none border-none">
                                        <SidebarMenu className='outline-none border-none'>
                                            <SidebarMenuItem className='outline-none border-none'>
                                                <SidebarMenuButton onClick={() => setDeleteOpen(true)} className='outline-none border-none'>
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        </SidebarMenu>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            </SidebarContent>
                        </Sidebar>
                    </PopoverContent>
                </Popover>
            </div>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className='font-inter'>
                    <DialogHeader>
                        <DialogTitle className='font-normal'>
                            Are you sure you want to delete <span className='font-semibold'>{sport.name}</span>?
                        </DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                        <Button disabled={loading} className='font-medium' onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button disabled={loading} className='font-medium' onClick={handleDeleteSport} variant="destructive">
                            {loading && <Loader2 className='h-5 w-5 animate-spin' />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}