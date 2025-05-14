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
import UserListTable from "@/components/layout/UserListTable";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserModal } from "@/components/ui/user-modal";

export default function UsersPage() {

  const [open, setOpen] = useState(false)

  return (
    <ContentLayout title="Users">
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
              <BreadcrumbPage>Users</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
          <Button onClick={()=> setOpen(true)}>
            Add user
          </Button>
        </div>
      </Breadcrumb>
      <UserListTable />

      <UserModal open={open} onOpenChange={setOpen} />
    </ContentLayout>
  );
}
