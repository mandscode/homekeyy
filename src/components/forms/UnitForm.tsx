"use client"

import { FieldErrors, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import ImageUpload from "@/components/forms/ImageUpload"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios"
import { Card, CardContent } from "../ui/card"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import FullScreenLoader from "../utils/FullScreenLoader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

const formSchema = z.object({
  number: z.string().min(1, "Unit number is required"),
  floor: z.string().min(1, "Floor is required"),
  block: z.string().min(1, "Block is required"),
  sqFt: z.string().min(1, "Square footage is required"),
  rooms: z.string().min(1, "Number of rooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  parkingNumber: z.string().min(1, "Parking number is required"),
  gasConnection: z.boolean(),
  powerBackup: z.boolean(),
  meterBox: z.string().optional(),
  initialMeterReading: z.string().optional(),
  status: z.enum(["AVAILABLE", "BOOKED", "OCCUPIED", "NOTICE_PERIOD"]),
  amenities: z.array(z.object({
    id: z.number(),
    name: z.string(),
    value: z.string()
  })),
  images: z.array(z.object({
    url: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number()
  }))
});

type UnitFormData = z.infer<typeof formSchema>;

type FormField = {
  name: keyof UnitFormData
  label: string
  type?: "text" | "number" | "checkbox" | "select"
  options?: { value: string; label: string }[]
}

interface UnitFormProps {
  unitId?: number;
}

export default function UnitForm({ unitId }: UnitFormProps) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const { toast } = useToast()

  const form = useForm<UnitFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amenities: [],
      images: [],
      gasConnection: false,
      powerBackup: false,
      status: "AVAILABLE"
    }
  })

  // Fetch unit data if unitId is provided
  const { data: unitData, isLoading: isLoadingUnit } = useQuery({
    queryKey: ["unit", unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const res = await api.get(`/web/unit/${unitId}`);
      return res.data.unit; // Access the unit data from the response
    },
    enabled: !!unitId
  });
  console.log(unitData, "unitData")

  // Update form when unit data is loaded
  useEffect(() => {
    if (unitData) {
      const formData = {
        number: unitData.number || "",
        floor: unitData.floor || "",
        block: unitData.block || "",
        sqFt: unitData.sqFt || "",
        rooms: unitData.rooms || "",
        bathrooms: unitData.bathrooms || "",
        parkingNumber: unitData.parkingNumber || "",
        gasConnection: unitData.gasConnection || false,
        powerBackup: unitData.powerBackup || false,
        meterBox: unitData.meterBox || "",
        initialMeterReading: unitData.initialMeterReading || "",
        status: unitData.status || "AVAILABLE",
        amenities: unitData.unitAmenities?.map((amenity: any) => ({
          id: amenity.amenityId,
            name: amenity.amenity.name,
          value: amenity.amenityValue
        })) || [],
        images: unitData.images?.map((img: any) => ({
          url: img.url,
          name: img.alt || "unit-image",
          type: img.type || "image/jpeg",
          size: 0
        })) || []
      };

      console.log("Form Data:", formData); // Debug log
      form.reset(formData);
    }
  }, [unitData, form]);

  const onSubmit = async (data: UnitFormData) => {
    setLoading(true)
    try {
      // Handle image uploads first
      const uploadedImages = await uploadImagesToS3(images, "unit", data.number);
      
      const payload = {
        number: data.number,
        floor: data.floor,
        block: data.block,
        sqFt: data.sqFt,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        parkingNumber: data.parkingNumber,
        gasConnection: data.gasConnection,
        powerBackup: data.powerBackup,
        meterBox: data.meterBox,
        initialMeterReading: data.initialMeterReading,
        status: data.status,
        unitAmenities: {
          create: data.amenities.map(amenity => ({
            amenityId: amenity.id,
            amenityValue: amenity.value
          }))
        },
        images: {
          create: uploadedImages.map(img => ({
            url: img.url,
            alt: img.name,
            type: img.type
          }))
        }
      };

      const response = unitId 
        ? await api.put(`/web/unit/${unitId}`, payload)
        : await api.post("/unit/register", payload);
      
      if (response.status === 1) {
        toast({
          title: unitId ? "Unit updated successfully" : "Unit created successfully"
        });
        if (!unitId) {
          form.reset();
        }
      }
    } catch (err: unknown) {
      let message = unitId ? "Failed to update unit" : "Failed to create unit";
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

  const onError = (errors: FieldErrors<UnitFormData>) => {
    let message = "Validation error";
    if (errors instanceof Error) {
      message = errors.message;
    }
    const firstErrorKey = Object.keys(errors)[0] as keyof UnitFormData;
    const error = errors[firstErrorKey];

    if (error?.message) {
      message = error.message;
    }

    toast({
      title: message,
      variant: "destructive"
    });
  }

  const uploadImagesToS3 = async (images: File[], entityName: string, entityId: string): Promise<{ url: string; name: string; type: string; size: number }[]> => {
    const uploaded = await Promise.all(
      images.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityName", entityName);
        formData.append("entityId", entityId);

        const res = await api.post("/upload", formData);

        return {
          url: res.data.url,
          name: file.name,
          type: file.type,
          size: file.size
        };
      })
    );

    return uploaded;
  };

  const handleImagesChange = (files: File[]) => {
    setImages(files)
    const validFiles = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type
    }));

    form.setValue('images', validFiles, { shouldValidate: true });
  }

  const formFields: FormField[] = [
    { name: "number", label: "Unit Number" },
    { name: "floor", label: "Floor" },
    { name: "block", label: "Block" },
    { name: "sqFt", label: "Square Footage" },
    { name: "rooms", label: "Number of Rooms" },
    { name: "bathrooms", label: "Number of Bathrooms" },
    { name: "parkingNumber", label: "Parking Number" },
    { name: "meterBox", label: "Meter Box Number" },
    { name: "initialMeterReading", label: "Initial Meter Reading" },
    { 
      name: "status", 
      label: "Status",
      type: "select",
      options: [
        { value: "AVAILABLE", label: "Available" },
        { value: "BOOKED", label: "Booked" },
        { value: "OCCUPIED", label: "Occupied" },
        { value: "NOTICE_PERIOD", label: "Notice Period" }
      ]
    }
  ];

  const { data: amenities = [] } = useQuery({
    queryKey: ["amenities"],
    queryFn: async () => {
      const res = await api.get("/amenity");
      return res.data.amenities ?? [];
    }
  });

  if (isLoadingUnit) {
    return <FullScreenLoader />;
  }
  
  return (
    <>
      {loading && <FullScreenLoader />}
      <Toaster />
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <Card className="rounded-lg border-none">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
              <div className="grid grid-cols-3 gap-6">
                {formFields.map(({ name, label, type = "text", options }) => (
                  <div key={name} className="flex flex-col gap-3">
                    <Label htmlFor={name}>{label}</Label>
                    {type === "select" && options ? (
                      <Select
                        onValueChange={(value) => form.setValue(name, value as any)}
                        value={form.watch(name) as string}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={name}
                        type={type}
                        placeholder={label}
                        {...form.register(name)}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Label>Features</Label>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={form.watch("gasConnection")}
                      onCheckedChange={(checked) => form.setValue("gasConnection", checked as boolean)}
                    />
                    <span>Gas Connection</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={form.watch("powerBackup")}
                      onCheckedChange={(checked) => form.setValue("powerBackup", checked as boolean)}
                    />
                    <span>Power Backup</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Label>Amenities</Label>
                <div className="grid grid-cols-3 gap-4">
                  {amenities.map((item: any) => {
                    const selectedAmenities = form.watch("amenities") || [];
                    const isSelected = selectedAmenities.some((a) => a.id === item.id);

                    return (
                      <label key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...selectedAmenities, { id: item.id, name: item.name, value: "true" }]
                              : selectedAmenities.filter((a) => a.id !== item.id);

                            form.setValue("amenities", updated);
                          }}
                        />
                        <span>{item.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Label>Images</Label>
                <ImageUpload onChange={handleImagesChange} />
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  {unitId ? "Update Unit" : "Create Unit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}