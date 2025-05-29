import { Button } from "@/components/ui/button"

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  quantity: number;
}

export default function QuantitySelector({ value, onChange, quantity }: QuantitySelectorProps) {
  return (
    <div className="flex items-center border rounded-md overflow-hidden">
      <Button 
        variant="ghost" 
        className="rounded-none px-2 text-sm h-8"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        −
      </Button>
      <div className="w-8 text-center text-sm font-normal">{quantity}</div>
      <Button 
        variant="ghost" 
        className="rounded-none px-2 text-sm h-8"
        onClick={() => onChange(value + 1)}
      >
        +
      </Button>
    </div>
  )
}
