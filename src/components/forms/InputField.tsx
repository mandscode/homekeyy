import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError, FieldValues, UseFormRegister } from "react-hook-form"

interface InputFieldProps {
  label: string
  name: string
  type?: string
  placeholder?: string
  register: UseFormRegister<FieldValues>
  error?: FieldError
}

export const InputField = ({ label, name, type = "text", placeholder, register, error }: InputFieldProps) => {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} placeholder={placeholder} {...register(name)} />
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  )
}
