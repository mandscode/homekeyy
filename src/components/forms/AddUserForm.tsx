"use client"

import { FieldErrors, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"


import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import FullScreenLoader from "../utils/FullScreenLoader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"


import { PropertyModal } from "../ui/PropertySelectModal"


export const propertySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Property name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().min(1, "Zip code is required")
})
export const serviceSchema = z.object({
  id: z.number(),
  type: z.string()
})
export const formSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().min(10, "Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SERVICE_MANAGER", "PROPERTY_MANAGER", "OWNER"]),
  status: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  isFirstLogin: z.boolean().optional(),
  propertyId: z.array(z.number(), {
    required_error: "At least one property must be selected"
  }).min(1, "At least one property must be selected"),
  services: z.array(serviceSchema).optional()
}).superRefine((data, ctx) => {
  if (data.role === "SERVICE_MANAGER" && (!data.services || data.services.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["service"],
      message: "Service ID is required for Service Manager role"
    });
  }
});


type FormField = {
  name: keyof z.infer<typeof formSchema>
  label: string
  type?: "text" | "number"
}



// On submit function tyoes
type Property = {
  id:number;
  name: string;
  address: string;
  city: string;
  zipCode: string;
};


type User = {
  id?:        number;
  name:      string;
  email?:     string;
  phone:     string;
  password:  string;
  role:      Role;
  status:    boolean;
  createdAt?: string;
  updatedAt?:  string;
  isFirstLogin?: boolean;

  propertyId:     number[];

  services?: Service[];
}

type Service = {
  id:number,
  type: string
}

type Role =
  "SERVICE_MANAGER" | 
  'PROPERTY_MANAGER' |
  'OWNER'

export default function AddUserForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [isServicesHide , setServicesHide] = useState(false)

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);


  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { services: [] }
  })

  const onSubmit = async (data:User) => {
    
    setLoading(true)
    
    try {
    
      const payload = {
        ...data
      };

      const response = await api.post("/user", payload)
      
      if (response.status == 1) {
        setOpen(false)
      }
    } catch (err: unknown) {
      let message = " ";

      if (typeof err === "object" && err !== null && "message" in err) {
        message = String((err as { message: unknown }).message);
      }
      toast({
        title: message
      });
      console.error("Add user failed", err)
    } finally {
      setLoading(false)
    }
  }
  
  const onError = (errors:FieldErrors<User>) => {
    let message = "Validation error";
    console.log(errors, "errors")
    if (errors instanceof Error) {
      message = errors.message;
    }
    const firstErrorKey = Object.keys(errors)[0] as keyof User;
    const error = errors[firstErrorKey];

    if (Array.isArray(error) && error.length > 0) {
      const nestedError = error[0]; // first item in the array
      const nestedFieldKey = Object.keys(nestedError)[0];
      message = nestedError[nestedFieldKey]?.message || message;
    } else if (error?.message) {
      message = error.message;
    }

    toast({
      title: message
    });
  }
  

  const formFields: FormField[] = [
    { name: "name", label: "Full Name" },
    { name: "role", label: "Assign Role" },
    { name: "propertyId", label: "Properties" },
    { name: "status", label: "Status" },
    { name: "phone", label: "Phone Number" },
    { name: "password", label: "Password" },
  ]

  const fetchServices = async () => {
    const res = await api.get("/services");
  
    // Ensure you return an array or default to an empty array
    return res.data.services ?? [];
  };

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const fetchProperties = async () => {
    const res = await api.get("/property");
  
    // Ensure you return an array or default to an empty array
    return res.data.properties ?? [];
  };

  const { data: properties = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const propertyOptions = properties.map((property: Property) => ({
    label: property.name,  // change according to actual API response
    value: property.id     // or `service.slug` if more appropriate
  }));

  const dropdownOptions: Record<string, { label: string; value: string }[]> = {
    role: [
      { label: "SERVICE_MANAGER", value: "SERVICE_MANAGER" },
      { label: "PROPERTY_MANAGER", value: "PROPERTY_MANAGER" },
      { label: "OWNER", value: "OWNER" }
    ],
    status: [
      { label: "Active", value: 'true' },
      { label: "Inactive", value: 'false' }
    ],
    propertyId: propertyOptions
  };

  const roleValue = form.watch("role"); // This watches the `role` field

  useEffect(() => {
    if(roleValue == "SERVICE_MANAGER") {
      setServicesHide(false)
    } else {
      setServicesHide(true)
    }
  }, [roleValue])

  return (
    <>
      {loading && <FullScreenLoader />}
      <Toaster />

        <div className="pt-5">
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
            <div className="grid grid-cols-3 gap-6">
            {formFields.map(({ name, label, type = "text" }) => (
              <div key={name} className="flex flex-col gap-3">
                <Label htmlFor={name}>{label}</Label>

                {/* Check if field is dropdown */}
                {dropdownOptions[name] ? (
                  name === "propertyId" ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full overflow-hidden justify-between"
                        onClick={() => setPropertyModalOpen(true)}
                      >
                        {form.watch("propertyId")?.length
                          ? propertyOptions
                              .filter((option:{value:number, label:string}) => form.watch("propertyId")?.includes(option.value))
                              .map((o:{value:number, label:string}) => o.label)
                              .join(", ")
                          : "Select Properties"}
                      </Button>

                  ) : (
                    <Select
                      value={form.watch(name) !== undefined ? String(form.watch(name)) : undefined}
                      onValueChange={(val) => {
                        let finalValue: string | number | boolean = val;
                        if (name === "status") {
                          finalValue = val === "true";
                        }
                        form.setValue(name, finalValue);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {dropdownOptions[name].map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                ) : (
                  <Input
                    id={name}
                    type={type}
                    placeholder={label}
                    {...form.register(name, {
                      valueAsNumber: type === "number"
                    })}
                  />
                )}
              </div>
            ))}
            </div>
            {
              !isServicesHide &&
              <div className="space-y-6">
                <div className="flex flex-col gap-7">
                  <Label>Services</Label>
                </div>
                  <div className="grid grid-cols-3 gap-6">
                  {services.map((item: Service) => {
                    const selectedAmenities = form.watch("services") || [];

                    return (
                      <label key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedAmenities.some((i) => i.id === item.id)}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...selectedAmenities, item]
                              : selectedAmenities.filter((i) => i.id !== item.id);

                            form.setValue("services", updated);
                          }}
                        />
                        <span>{item.type}</span>
                      </label>
                    );
                  })}

                  </div>
                </div>
            }

            <div className="flex justify-end">
              <Button type="submit" className="bg-red-600 hover:bg-red-700">Submit</Button>
            </div>
          </form>
          <PropertyModal
            open={propertyModalOpen}
            onOpenChange={setPropertyModalOpen}
            selected={form.watch("propertyId") || []}
            onDone={(values) => form.setValue("propertyId", values)}
            options={propertyOptions}
          />
        </div>
    </>
  )
}