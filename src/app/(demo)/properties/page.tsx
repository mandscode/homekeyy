"use client"

import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage
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
