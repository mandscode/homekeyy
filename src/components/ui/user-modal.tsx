'use client'

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import AddUserForm from "../forms/AddUserForm"

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: number | null;
}

export function UserModal({ open, onOpenChange, userId }: UserModalProps) {
  const handleFormSubmit = (success: boolean) => {
    if (!success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-8 px-8 shadow-lg focus:outline-none"
            >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              {userId ? "Edit User" : "Add New User"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </Dialog.Close>
          </div>

          <div>
            <AddUserForm setOpen={handleFormSubmit} userId={userId} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}