"use client"

import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { CMS } from "./CMS"
import { JoinUs } from "./JoinUs"
import { UserManagement } from "./UserManagement"
import { Contact } from "lucide-react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) 
{
    const pathname = usePathname()

    return (
        <Sidebar className='font-medium' collapsible="icon" {...props}>
            <SidebarHeader>
                <Image
                    src="/images/roapLogo.svg"
                    alt="Logo"
                    width={100}
                    height={100} 
                    className='mx-auto'
                />
            </SidebarHeader>
            <SidebarContent className="">
                <SidebarGroup>
                    <Link href='/admin/academics'>
                        <SidebarMenuButton className={cn(pathname.includes('/academics') && 'bg-sidebar-accent')} tooltip='Academics'>
                            <Contact className={cn(pathname.includes('/academics') && 'stroke-main')} />
                            <span className={cn(pathname.includes('/academics') && 'text-main')}>Academics</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarGroup>
                <CMS />
                <JoinUs />
                <UserManagement />
            </SidebarContent>
            <SidebarFooter>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
