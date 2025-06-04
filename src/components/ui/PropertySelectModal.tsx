import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

type Option = { value: number; label: string };

interface PropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: number[];
  onDone: (values: number[]) => void;
  options: Option[];
}

export function PropertyModal({ open, onOpenChange, selected, onDone, options }: PropertyModalProps) {
  const [tempSelected, setTempSelected] = useState<number[]>(selected || []);

  // Update tempSelected when selected prop changes
  useEffect(() => {
    setTempSelected(selected || []);
  }, [selected]);

  const toggle = (value: number) => {
    setTempSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">Select Properties</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="grid  grid-cols-2 gap-3 max-h-64 overflow-y-auto mb-4">
            {options.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <Checkbox
                  checked={tempSelected.includes(option.value)}
                  onCheckedChange={() => toggle(option.value)}
                />
                {option.label.length > 25 
                    ? `${option.label.substring(0, 20)}...` 
                    : option.label}
                </label>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => {
                onDone(tempSelected);
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
