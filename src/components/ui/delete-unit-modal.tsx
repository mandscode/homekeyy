'use client'

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/axios";
import apiEndpoints from "@/lib/apiEndpoints";
import { toast } from "@/hooks/use-toast";

interface DeleteUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId?: number | null;
}

export function DeleteUnitModal({ open, onOpenChange, unitId }: DeleteUnitModalProps) {
  const handleFormSubmit = async () => {
    try {
      const response = await api.delete(`${apiEndpoints.Unit.endpoints.deleteUnit.path.replace("{id}", unitId?.toString() || "")}`)
      if(response.status === 1) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      console.log(message,"message")
        toast({
          title: "Error",
            description: message,
          });
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
              {unitId ? "Delete Unit" : "Add New Unit"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </Dialog.Close>
          </div>

          <div className='flex flex-col gap-4 justify-center items-center'>
            <p>Are you sure you want to delete this unit?</p>
            <Button variant="destructive" onClick={() => {
              handleFormSubmit();
            }}>Delete</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}