"use client"
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage
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
