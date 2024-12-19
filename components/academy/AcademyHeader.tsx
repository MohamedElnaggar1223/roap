'use client'
import { usePathname, useRouter } from "next/navigation";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
import React, { useState } from "react";
import { Check, ChevronRight, Home, X } from "lucide-react";
import NotificationsComponent from "./Notifications";
import { useOnboarding } from "@/providers/onboarding-provider";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { startImpersonation, stopImpersonation } from "@/lib/actions/impersonations.actions";

export default function AcademyHeader({ academyId, children }: Readonly<{ academyId: number, children: React.ReactNode }>) {
	const pathname = usePathname();
	const router = useRouter()
	const [loading, setLoading] = useState(false)

	const {
		currentStep,
		steps,
		completedSteps,
		totalSteps,
		isStepComplete,
		onboarded,
		isAdmin,
		academyName
	} = useOnboarding()

	const generateBreadcrumbs = () => {
		const paths = pathname?.replace('/', '').split('/').filter(Boolean);

		if (!paths?.length) {
			return [];
		}

		return paths
			.filter(path => !/^\d+$/.test(path))
			.map((path, index, filteredPaths) => {
				const label = path.charAt(0).toUpperCase() +
					path.slice(1).replace(/-/g, ' ');

				const isNonLinkingPage = path === 'edit' || path === 'create' || path === 'view';

				const href = isNonLinkingPage
					? '#'
					: `/academy/${paths.slice(0, paths.indexOf(path) + 1).join('/')}`;

				return (
					<BreadcrumbItem key={path}>
						{isNonLinkingPage || index === filteredPaths.length - 1 ? (
							<BreadcrumbPage>{label}</BreadcrumbPage>
						) : (
							<BreadcrumbLink href={href}>
								{label}
							</BreadcrumbLink>
						)}
					</BreadcrumbItem>
				);
			});
	};

	const handleChange = async (academyId: string) => {
		try {
			setLoading(true)
			if (academyId === 'stop') {
				await stopImpersonation()
			} else {
				await startImpersonation(parseInt(academyId))
			}
			router.push('/admin')
		} catch (error) {
			console.error('Failed to switch academy:', error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<SidebarInset>
			<header className="flex h-16 shrink-0 bg-[#E0E4D9] pr-4 border-b-[#CDD1C7] justify-between border-b z-[10] sticky top-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					{pathname === '/' ? (
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbPage>Dashboard</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					) : (
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink href="/">
										<Home className="h-4 w-4" />
									</BreadcrumbLink>
								</BreadcrumbItem>
								{generateBreadcrumbs().map((item, index) => (
									<React.Fragment key={index}>
										<BreadcrumbSeparator>
											<ChevronRight className="h-4 w-4" />
										</BreadcrumbSeparator>
										{item}
									</React.Fragment>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					)}
				</div>
				{!onboarded && <div className="flex flex-col items-center gap-1">
					<Popover>
						<PopoverTrigger asChild>
							<button className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-gray-50">
								<span className="text-sm text-gray-500">
									{completedSteps} of {totalSteps} completed
								</span>
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-64" align="center">
							<div className="flex flex-col gap-2">
								{steps.map((step) => (
									<div
										key={step.id}
										className={`flex items-center justify-between p-2 rounded-lg ${currentStep.id === step.id ? 'bg-[#E0E4D9]' : ''
											}`}
									>
										<span className="text-sm font-medium">{step.title}</span>
										<div className="flex items-center justify-center w-6 h-6 rounded-full">
											{isStepComplete(step.id) ? (
												<Check className="h-4 w-4 text-green-500" />
											) : (
												<X className="h-4 w-4 text-red-500" />
											)}
										</div>
									</div>
								))}
							</div>
						</PopoverContent>
					</Popover>
				</div>}
				{isAdmin && (
					<div className="flex items-center gap-2">
						<p className='text-xs'>Currently Navigating as: {academyName}</p>
						<button onClick={() => handleChange('stop')} className="text-xs bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded-lg">
							Stop
						</button>
					</div>
				)}
				<NotificationsComponent academicId={academyId} />
			</header>
			{children}
		</SidebarInset>
	)
}