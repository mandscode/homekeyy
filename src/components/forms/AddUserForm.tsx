"use client"

import { FieldErrors, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"


import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import FullScreenLoader from "../utils/FullScreenLoader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"


import { PropertyModal } from "../ui/PropertySelectModal"
import apiEndpoints from "@/lib/apiEndpoints"


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
  name: z.string()
    .min(3, "Name is required")
    .max(15, "Name cannot exceed 15 characters")
    .regex(/^[a-zA-Z0-9\s]+$/, "Name can only contain letters, numbers, and spaces"),
  email: z.string().email("Invalid email").nullable().optional().or(z.literal('')),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^[0-9]+$/, "Phone number must contain only digits"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .refine((val) => {
      // Check for repeated words (3 or more characters)
      const words = val.match(/\b\w{3,}\b/g) || [];
      const uniqueWords = new Set(words);
      return words.length === uniqueWords.size;
    }, "Password cannot contain repeated words")
    .nullable()
    .optional()
    .or(z.literal('')),
  role: z.enum(["SERVICE_MANAGER", "PROPERTY_MANAGER", "OWNER", "ADMIN"]),
  status: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  isFirstLogin: z.boolean().optional(),
  propertyId: z.array(z.number(), {
    required_error: "At least one property must be selected"
  }).min(1, "At least one property must be selected"),
  services: z.array(serviceSchema).optional()
}).superRefine((data, ctx) => {
  // Password validation for new users
  if (!data.id && (!data.password || data.password === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "Password is required for new users"
    });
  }

  // Password validation when provided
  if (data.password && data.password !== '') {
    if (data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must be at least 8 characters long"
      });
    }
    if (!/[A-Z]/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must contain at least one uppercase letter"
      });
    }
    if (!/[a-z]/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must contain at least one lowercase letter"
      });
    }
    if (!/[0-9]/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must contain at least one number"
      });
    }
    if (!/[^A-Za-z0-9]/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must contain at least one special character"
      });
    }
    // Check for repeated words
    const words = data.password.match(/\b\w{3,}\b/g) || [];
    const uniqueWords = new Set(words);
    if (words.length !== uniqueWords.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password cannot contain repeated words"
      });
    }
  }

  // Email validation when provided
  if (data.email && data.email !== '' && !data.email.includes('@')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "Invalid email format"
    });
  }

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

type PropertyProps = {
  propertyId:number;
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
  password?:  string | null;
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
  'OWNER' |
  'ADMIN'

type FormData = z.infer<typeof formSchema>;

export default function AddUserForm({ setOpen, userId }: { setOpen: (open: boolean) => void, userId?: number | null }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [isServicesHide, setServicesHide] = useState(false)
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      services: [],
      password: '',
      status: true
    }
  })

  // Fetch user data if userId is provided
  const { data: userData } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await api.get(`/web/user/${userId}`);
      return res.data.user;
    },
    enabled: !!userId
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (userData) {
      form.reset({
        id: userData.id,
        name: userData.name,
        email: userData.email || '',
        phone: userData.phone,
        role: userData.role,
        status: userData.status,
        propertyId: userData.properties?.map((p: PropertyProps) => p.propertyId) || [],
        services: userData.services || [],
        isFirstLogin: userData.isFirstLogin,
        password: '' // Set empty password for edit mode
      });
    }
  }, [userData, form, userId]);

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        password: data.password === '' ? undefined : data.password
      };

      // If id exists, update user; otherwise create new user
      const response = data.id 
        ? await api.put(`/web/user/${data.id}`, payload)
        : await api.post("/web/user", payload);
      
      if (response.status === 1) {
        // Invalidate and refetch relevant queries
        await queryClient.invalidateQueries({ queryKey: ["user", userId] });
        await queryClient.invalidateQueries({ queryKey: ["users"] });
        
        toast({
          title: data.id ? "User updated successfully" : "User created successfully"
        });
        setOpen(false);
        form.reset();
      }
    } catch (err: unknown) {
      let message = data.id ? "Failed to update user" : "Failed to create user";
      if (err instanceof Error) {
        message = err.message;
      }
      toast({
        title: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false)
    }
  }
  
  const onError = (errors: FieldErrors<User>) => {
    // Get all error messages
    const errorMessages = Object.entries(errors).map(([field, error]) => {
      if (error?.message) {
        // Convert field name to a more readable format
        const readableField = field
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
        
        return `${readableField}: ${error.message}`;
      }
      return null;
    }).filter(Boolean);

    // Show the first error message
    if (errorMessages.length > 0) {
      toast({
        title: "Validation Error",
        description: errorMessages[0],
        variant: "destructive"
      });
    } else {
      toast({
        title: "Validation Error",
        description: "Please check your input and try again",
        variant: "destructive"
      });
    }
  }
  
  const formFields: FormField[] = [
    { name: "name", label: "Full Name" },
    { name: "role", label: "Assign Role" },
    { name: "propertyId", label: "Properties" },
    { name: "status", label: "Status" },
    { name: "phone", label: "Phone Number" },
    ...(userId ? [] : [{ name: "password" as keyof z.infer<typeof formSchema>, label: "Password" }]),
  ]

  const fetchServices = async () => {
    const res = await api.get("/web/services");
  
    // Ensure you return an array or default to an empty array
    return res.data.services ?? [];
  };

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const fetchProperties = async () => {
    const res = await api.get(apiEndpoints.Property.endpoints.getAllProperties.path);
  
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
      { label: "OWNER", value: "OWNER" },
      { label: "ADMIN", value: "ADMIN" }
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
                        if (!val) return;
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
                      valueAsNumber: type === "number",
                      onChange: (e) => {
                        if (name === "phone") {
                          // Remove any non-numeric characters
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = value;
                          form.setValue(name, value);
                        }
                      }
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