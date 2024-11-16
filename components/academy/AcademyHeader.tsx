'use client'
import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
import React from "react";
import { ChevronRight, Home } from "lucide-react";

export default function AcademyHeader({ children }: Readonly<{ children: React.ReactNode }>) {
	const pathname = usePathname();

	const generateBreadcrumbs = () => {
		// Remove the /admin prefix and split the remaining path
		const paths = pathname?.replace('/admin', '').split('/').filter(Boolean);

		// If there are no paths, return an empty array
		if (!paths?.length) {
			return [];
		}

		return paths
			// Filter out numeric paths (IDs)
			.filter(path => !/^\d+$/.test(path))
			.map((path, index, filteredPaths) => {
				// Capitalize the path segment and replace hyphens with spaces
				const label = path.charAt(0).toUpperCase() +
					path.slice(1).replace(/-/g, ' ');

				// Determine if this is an edit page or similar non-linking page
				const isNonLinkingPage = path === 'edit' || path === 'create' || path === 'view';

				// Calculate href - use '#' for non-linking pages, otherwise build the proper path
				const href = isNonLinkingPage
					? '#'
					: `/admin/${paths.slice(0, paths.indexOf(path) + 1).join('/')}`;

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

	return (
		<SidebarInset>
			<header className="flex h-16 shrink-0 bg-[#E0E4D9] border-b-[#CDD1C7] border-b sticky top-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					{pathname === '/admin' ? (
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
									<BreadcrumbLink href="/admin">
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
			</header>
			{children}
		</SidebarInset>
	)
}