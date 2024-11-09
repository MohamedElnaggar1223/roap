'use client'
import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
import React from "react";
import { ChevronRight, Home } from "lucide-react";

export default function AdminHeader({ children }: Readonly<{ children: React.ReactNode }>)
{
    const pathname = usePathname();

    const generateBreadcrumbs = () => {
        // Remove the /admin prefix and split the remaining path
        const paths = pathname.replace('/admin', '').split('/').filter(Boolean);
        
        // Generate array of breadcrumb items with proper links
        return paths.map((path, index) => {
          // Calculate the href for this breadcrumb
          const href = `/admin/${paths.slice(0, index + 1).join('/')}`;
          
          // Capitalize the path segment and replace hyphens with spaces
          const label = path.charAt(0).toUpperCase() + 
            path.slice(1).replace(/-/g, ' ');
          
          // If it's the last item, return it as the current page
          if (index === paths.length - 1) {
            return (
              <BreadcrumbItem key={path}>
                <BreadcrumbPage>{label}</BreadcrumbPage>
              </BreadcrumbItem>
            );
          }
          
          // Otherwise return it as a link
          return (
            <BreadcrumbItem key={path}>
              <BreadcrumbLink href={href}>
                {label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          );
        });
      };

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 sticky top-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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