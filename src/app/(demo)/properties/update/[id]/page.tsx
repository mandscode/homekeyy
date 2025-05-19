"use client"

import Link from "next/link";
import { useParams } from "next/navigation";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import PropertyUpdateForm from "@/components/forms/PropertyUpdateForm";

export default function UpdatePropertyPage() {
  const params = useParams();
  const propertyId = parseInt(params.id as string);

  return (
    <ContentLayout title="Edit Property">
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
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </div> 
      </Breadcrumb>
      <PropertyUpdateForm propertyId={propertyId}/>
    </ContentLayout>
  );
}
