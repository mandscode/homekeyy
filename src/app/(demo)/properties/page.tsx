"use client"

import Link from "next/link";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import PropertyList from "@/components/layout/PropertyList";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PostsPage() {

  const router = useRouter()

  return (
    <ContentLayout title="All Properties">
      <Breadcrumb>
        <div className="flex justify-between">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Properties</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
          <Button onClick={()=> router.push('/properties/new')}>
            Add new Property
          </Button>
        </div> 
      </Breadcrumb>
      <PropertyList />
    </ContentLayout>
  );
}
