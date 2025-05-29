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
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export default function NewPostPage() {
  const router = useRouter()
  const params = useParams()

  const { data: property } = useQuery({
    queryKey: ["property", params.id],
    queryFn: async () => {
      const res = await api.get(`/web/property/${params.id}`);
      return res.data.property;
    },
    enabled: !!params.id
  });

  return (
    <ContentLayout title={property?.name || "Loading..."}>
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