'use client'
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
import PropertyDetail from "@/components/PropertyDetail";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";

export default function NewPostPage() {
  const router = useRouter()
  const params = useParams()
  return (
    <ContentLayout title="New PropertY">
      <Breadcrumb>
      <div className="flex justify-between">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/properties">Properties</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Detail</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
        <Button onClick={() => router.push(`/properties/update/${params.id}`)}>
            Edit Property
          </Button>
      </div>
      </Breadcrumb>
      <PropertyDetail/>
      
    </ContentLayout>
  );
}