"use client"

import { ChevronRight, FolderKanban } from "lucide-react"

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function CMS() {
	return (
		<SidebarGroup>
			<SidebarMenu>
				<Collapsible
					key='CMS'
					asChild
					defaultOpen={false}
					className="group/collapsible"
				>
					<SidebarMenuItem>
						<CollapsibleTrigger asChild>
							<SidebarMenuButton tooltip='CMS'>
								<FolderKanban />
								<span className=''>CMS</span>
								<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
							</SidebarMenuButton>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<SidebarMenuSub>
								<SidebarMenuSubItem key='cities'>
									<SidebarMenuSubButton asChild>
										<Link href='/admin/cities'>
											<span>Cities</span>
										</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
								<SidebarMenuSubItem key='countries'>
									<SidebarMenuSubButton asChild>
										<Link href='/admin/countries'>
											<span>Countries</span>
										</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
								<SidebarMenuSubItem key='states'>
									<SidebarMenuSubButton asChild>
										<Link href='#'>
											<span>States</span>
										</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							</SidebarMenuSub>
						</CollapsibleContent>
					</SidebarMenuItem>
				</Collapsible>
			</SidebarMenu>
		</SidebarGroup>
	)
}
