'use client'

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import UnitForm from "../forms/UnitForm"

interface UnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId?: number;
}

export function UnitModal({ open, onOpenChange, unitId }: UnitModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[70%] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-8 px-8 shadow-lg focus:outline-none overflow-y-auto"
            >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              {unitId ? "Edit Unit" : "Add New Unit"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* 👉 Replace this with your actual form or design */}
          <div>
            <UnitForm unitId={unitId} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}