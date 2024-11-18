"use client"

import * as React from "react"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function AcadenyDetailsSidebar() {
    const pathname = usePathname()

    return (
        <>
            <aside className='font-medium bg-[#E0E4D9] border-[#CDD1C7] h-full py-2'>
                <div className="bg-[#E0E4D9] h-full">
                    <div className='flex items-start justify-start gap-2 flex-col h-full w-40'>
                        <Link href='/academy' className='h-9 rounded-[12px] overflow-hidden w-full'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname === '/academy' && 'bg-[#F1F2E9]')}>
                                <span>Academy Details</span>
                            </div>
                        </Link>
                        <Link href='/academy/sports' className='h-9 rounded-[12px] overflow-hidden w-full'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/sports') && 'bg-[#F1F2E9]')}>
                                <span>Sports</span>
                            </div>
                        </Link>
                        <Link href='/academy/locations' className='h-9 rounded-[12px] overflow-hidden w-full'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/locations') && 'bg-[#F1F2E9]')}>
                                <span>Locations</span>
                            </div>
                        </Link>
                        <Link href='/academy/coaches' className='h-9 rounded-[12px] overflow-hidden w-full'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/coaches') && 'bg-[#F1F2E9]')}>
                                <span>Coaches</span>
                            </div>
                        </Link>
                        <Link href='/academy/programs' className='h-9 rounded-[12px] overflow-hidden w-full'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/programs') && 'bg-[#F1F2E9]')}>
                                <span>Programs</span>
                            </div>
                        </Link>
                        <Link href='/academy/assessments' className='h-9 rounded-[12px] overflow-hidden w-full'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/assessments') && 'bg-[#F1F2E9]')}>
                                <span>Assessments</span>
                            </div>
                        </Link>
                        <Link href='/academy/promo-codes' className='h-9 rounded-[12px] overflow-hidden w-full'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/promo-codes') && 'bg-[#F1F2E9]')}>
                                <span>Promo Codes</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    )
}
