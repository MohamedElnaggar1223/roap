"use client"

import * as React from "react"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useOnboarding } from "@/providers/onboarding-provider"

export function AcadenyDetailsSidebar({ onboarded }: { onboarded: boolean }) {
    const pathname = usePathname()

    const { completedSteps } = useOnboarding()

    const DisabledLinkWrapper = ({ children, href }: { children: React.ReactNode, href: string }) => {
        console.log(onboarded)
        if (onboarded) return <Link href={href} className='h-9 rounded-[12px] overflow-hidden w-full'>{children}</Link>

        const disabledHref =
            href.includes('/locations') && (completedSteps < 1)
            || href.includes('/coaches') && (completedSteps < 1)
            || href.includes('/programs') && (completedSteps < 3)
            || href.includes('/assessments') && (completedSteps < 4)
            || href.includes('/promo-codes') && (completedSteps < 5)

        if (disabledHref) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="h-9 rounded-[12px] overflow-hidden cursor-not-allowed opacity-40">
                                {children}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            {href.includes('/locations') && <p>Finish academy details first</p>}
                            {href.includes('/coaches') && <p>Finish academy details first</p>}
                            {href.includes('/programs') && <p>Finish academy details, coaches, and locations first</p>}
                            {href.includes('/assessments') && <p>Finish academy details, coaches, programs, and locations first</p>}
                            {href.includes('/promo-codes') && <p>Finish onboarding first</p>}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }
        else return <Link href={href} className='h-9 rounded-[12px] overflow-hidden w-full'>{children}</Link>
    }

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
                        {/* <DisabledLinkWrapper href='/academy/sports'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/sports') && 'bg-[#F1F2E9]')}>
                                <span>Sports</span>
                            </div>
                        </DisabledLinkWrapper> */}
                        <DisabledLinkWrapper href='/academy/locations'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/locations') && 'bg-[#F1F2E9]')}>
                                <span>Locations</span>
                            </div>
                        </DisabledLinkWrapper>
                        <DisabledLinkWrapper href='/academy/coaches'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/coaches') && 'bg-[#F1F2E9]')}>
                                <span>Coaches</span>
                            </div>
                        </DisabledLinkWrapper>
                        <DisabledLinkWrapper href='/academy/programs'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/programs') && 'bg-[#F1F2E9]')}>
                                <span>Programs</span>
                            </div>
                        </DisabledLinkWrapper>
                        <DisabledLinkWrapper href='/academy/assessments'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/assessments') && 'bg-[#F1F2E9]')}>
                                <span>Assessments</span>
                            </div>
                        </DisabledLinkWrapper>
                        <DisabledLinkWrapper href='/academy/promo-codes'>
                            <div className={cn('text-sm h-9 flex items-center justify-start px-2 rounded-[12px] w-full', pathname?.includes('/academy/promo-codes') && 'bg-[#F1F2E9]')}>
                                <span>Promo Codes</span>
                            </div>
                        </DisabledLinkWrapper>
                    </div>
                </div>
            </aside>
        </>
    )
}
