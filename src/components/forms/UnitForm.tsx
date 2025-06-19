"use client"

import { FieldErrors, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import ImageUpload from "@/components/forms/ImageUpload"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { Card, CardContent } from "../ui/card"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import FullScreenLoader from "../utils/FullScreenLoader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import Image from "next/image"
import QuantitySelector from "../utils/QuantitySelector"

type Amenity = {
  id: number;
  name: string;
  value: string;
};

const formSchema = z.object({
  number: z.string().min(1, "Unit number is required"),
  floor: z.string().min(1, "Floor is required"),
  block: z.string().min(1, "Block is required"),
  sqFt: z.string().min(1, "Square footage is required"),
  rooms: z.string().min(1, "Number of rooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  parkingNumber: z.string().min(1, "Parking number is required"),
  gasConnection: z.boolean().optional(),
  powerBackup: z.boolean().optional(),
  meterBox: z.string().optional(),
  initialMeterReading: z.string().optional(),
  status: z.enum(["AVAILABLE", "BOOKED", "OCCUPIED", "NOTICE_PERIOD"]),
  rent: z.string().min(1, "Rent amount is required"),
  sercurityDeposit: z.string().min(1, "Security deposit is required"),
  rentalType: z.enum(['monthly', 'yearly']),
  effective_from: z.string().min(1, "Effective from date is required"),
  effective_to: z.string().min(1, "Effective to date is required"),
  meterType: z.enum(['SUB', 'MAIN']),
  amenities: z.array(z.object({
    id: z.number(),
    name: z.string(),
    value: z.string()
  })).min(1, "At least one amenity is required"),
  images: z.array(z.object({
    url: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number()
  }))
});


type FlatImage = {
  id:number;
  url:string;
  alt:string;
  type:string;
}

type UnitAmenity = {
  id: number;
  name: string;
  value: string;
}

type UnitFormData = {
  number: string;
  floor: string;
  block: string;
  sqFt: string;
  rooms: string;
  bathrooms: string;
  parkingNumber: string;
  gasConnection?: boolean;
  powerBackup?: boolean;
  meterBox?: string;
  initialMeterReading?: string;
  status: "AVAILABLE" | "BOOKED" | "OCCUPIED" | "NOTICE_PERIOD";
  rent: string;
  sercurityDeposit: string;
  rentalType: 'monthly' | 'yearly';
  meterType: 'SUB' | 'MAIN';
  effective_from: string;
  effective_to: string;
  amenities: Array<{
    id: number;
    name: string;
    value: string;
  }>;
  images: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
};

type FormField = {
  name: keyof UnitFormData
  label: string
  type?: "text" | "number" | "checkbox" | "select"
  options?: { value: string; label: string }[]
}

interface UnitFormProps {
  unitId?: number;
  onOpenChange?: (open: boolean) => void;
}

export default function UnitForm({ unitId, onOpenChange }: UnitFormProps) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient();
  const form = useForm<UnitFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amenities: [],
      images: [],
      gasConnection: false,
      powerBackup: false,
      status: "AVAILABLE",
      meterType: 'SUB',
      rentalType: "monthly",
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
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
        meterType: unitData.meterType || "",
        meterBox: unitData.meterBox || "",
        initialMeterReading: unitData.initialMeterReading || "",
        status: unitData.status && unitData.status !== "" ? unitData.status : "AVAILABLE",
        rent: unitData.unitRentalDetails?.[0]?.rent?.toString() || "",
        sercurityDeposit: unitData.unitRentalDetails?.[0]?.sercurityDeposit?.toString() || "",
        rentalType: unitData.unitRentalDetails?.[0]?.rentalType || "monthly",
        effective_from: unitData.unitRentalDetails?.[0]?.effective_from?.split('T')[0] || new Date().toISOString().split('T')[0],
        effective_to: unitData.unitRentalDetails?.[0]?.effective_to?.split('T')[0] || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        amenities: unitData.unitAmenities?.map((amenity: Amenity) => ({
          id: amenity.id,
          name: amenity.name,
          value: amenity.value
        })).filter((amenity: Amenity) => Number(amenity.value) > 0) || [],
        images: unitData.images?.map((img: FlatImage) => ({
          url: img.url,
          name: img.alt || "unit-image",
          type: img.type || "image/jpeg",
          size: 0
        })) || []
      };
      form.reset(formData as UnitFormData);
    }
  }, [unitData, form]);
  

  const onSubmit = async (data: UnitFormData) => {
    setLoading(true)
    try {
      // Handle image uploads first
      const uploadedImages = await uploadImagesToS3(images, "unit", data.number);
      
      const rentalDetailsData = {
        rent: Number(data.rent),
        sercurityDeposit: Number(data.sercurityDeposit),
        rentalType: data.rentalType,
        effective_from: new Date(data.effective_from).toISOString(),
        effective_to: new Date(data.effective_to).toISOString()
      };      

      // Remove duplicate amenities
      const uniqueAmenities = data.amenities.reduce((acc, current) => {
        const exists = acc.find(item => item.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, [] as typeof data.amenities);

      const payload = {
        number: data.number,
        floor: data.floor,
        block: data.block,
        sqFt: data.sqFt,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        parkingNumber: data.parkingNumber,
        meterType: data.meterType,
        gasConnection: data.gasConnection,
        powerBackup: data.powerBackup,
        meterBox: data.meterBox,
        initialMeterReading: data.initialMeterReading,
        status: data.status,
        unitRentalDetails: unitId && unitData?.unitRentalDetails?.[0]?.id 
          ? {
              update: {
                where: { id: unitData.unitRentalDetails[0].id },
                data: rentalDetailsData
              }
            }
          : {
              create: rentalDetailsData
            },
        unitAmenities: unitId
          ? {
              deleteMany: {},
              create: uniqueAmenities.map(amenity => ({
                amenityId: amenity.id,
                amenityValue: amenity.value
              }))
            }
          : {
              create: uniqueAmenities.map(amenity => ({
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
        queryClient.invalidateQueries({ queryKey: ["unit", unitId] });
        toast({
          title: unitId ? "Unit updated successfully" : "Unit created successfully",
          variant: "default",
          duration: 3000,
          className: "z-[100]"
        });
        if (onOpenChange) {
          onOpenChange(false);
        }
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
        variant: "destructive",
        duration: 3000,
        className: "z-[100]"
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
    console.log(error);
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

  const handleSelectChange = (name: string, value: string) => {
    if (value !== "") {
      form.setValue(name as keyof UnitFormData, value as keyof UnitFormData, { shouldValidate: true });
    }
  }

  const rentalTypeOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" }
  ];
  const meterTypeOptions = [
    { value: "SUB", label: "Sub Meter" },
    { value: "MAIN", label: "Main Meter" }
  ];
  const statusOptions = [
    { value: "AVAILABLE", label: "Available" },
    { value: "BOOKED", label: "Booked" },
    { value: "OCCUPIED", label: "Occupied" },
    { value: "NOTICE_PERIOD", label: "Notice Period" }
  ];

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
      options: statusOptions
    },
    { name: "rent", label: "Rent Amount", type: "text" },
    { name: "sercurityDeposit", label: "Security Deposit", type: "text" },
    { name: "rentalType", label: "Rental Type", type: "select", options: rentalTypeOptions },
    { name: "effective_from", label: "Effective From", type: "text" },
    { name: "effective_to", label: "Effective To", type: "text" },
    { name: "meterType", label: "Meter Type", type: "select", options: meterTypeOptions }
  ];

  if (isLoadingUnit) {
    return <FullScreenLoader />;
  }

  return (
    <>
      {loading && <FullScreenLoader />}
      <div className="h-[calc(100vh-4rem)]">
        <Card className="rounded-lg border-none">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
              <div className="grid grid-cols-3 gap-6">
                {formFields.map(({ name, label, type = "text", options }) => {
                  const value = form.watch(name);
                  return (
                  <div key={name} className="flex flex-col gap-3">
                    <Label htmlFor={name}>{label}</Label>
                    {type === "select" && options ? (
                      <Select
                        onValueChange={(value) => handleSelectChange(name, value)}
                        value={value as string}
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
                )})}
              </div>

              <div className="flex flex-col gap-3">
                <Label>Amenities</Label>
                <div className="grid grid-cols-3 gap-4">
                {/* {unitData?.unitAmenities?.map((item:  UnitAmenity) => {
                    const currentAmenities = form.watch("amenities") || [];
                    const isChecked = currentAmenities.some(a => a.id === item.id);
                    return (
                      <label key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...currentAmenities, { id: item.id, name: item.name, value: "true" }]
                              : currentAmenities.filter((a: Amenity) => a.id !== item.id);
                            form.setValue("amenities", updated);
                          }}
                        />
                        <span>{item.name}</span>
                      </label>
                    );
                  })} */}
                  {unitData?.unitAmenities?.map((item:  UnitAmenity) => {
                    const currentAmenities = form.watch("amenities") || [];
                    const currentAmenity = currentAmenities.find((a: Amenity) => a.id === item.id);
                    const quantity = currentAmenity ? parseInt(currentAmenity.value) || 0 : 0;
                    
                    return (
                      <label key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={quantity > 0}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...currentAmenities.filter((a: Amenity) => a.id !== item.id), 
                                 { id: item.id, name: item.name, value: "1" }]
                              : currentAmenities.filter((a: Amenity) => a.id !== item.id);
                            form.setValue("amenities", updated);
                          }}
                        />
                        <span>{item.name}</span>
                        {
                          quantity > 0 && (
                            <>
                            <QuantitySelector 
                              value={quantity}
                          onChange={(newValue) => {
                            const updated = newValue > 0
                              ? [...currentAmenities.filter((a: Amenity) => a.id !== item.id),
                                 { id: item.id, name: item.name, value: newValue.toString() }]
                              : currentAmenities.filter((a: Amenity) => a.id !== item.id);
                            form.setValue("amenities", updated);
                                }}
                                quantity={quantity}
                              />
                            </>
                          )
                        }
                      </label>
                    );
                  })}
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
              <div className="flex flex-wrap gap-4">
                {/* Show existing images */}
                {unitData?.images?.map((img: FlatImage, idx: number) => (
                  <div key={`existing-${idx}`} className="w-28 h-28 overflow-hidden rounded relative bg-gray-100">
                    <Image
                      src={img.url}
                      alt={img.alt || 'Unit image'}
                      fill
                      sizes="(max-width: 112px) 100vw, 112px"
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                      unoptimized
                    />
                  </div>
                ))}
                
                {/* Show newly uploaded images */}
                {images.map((file, idx) => (
                  <div key={`new-${idx}`} className="w-28 h-28 overflow-hidden rounded relative bg-gray-100">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Uploaded image ${idx + 1}`}
                      fill
                      sizes="(max-width: 112px) 100vw, 112px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}

                {/* Show "No images" message only if there are no images at all */}
                {(!unitData?.images || unitData.images.length === 0) && images.length === 0 && (
                  <div className="w-28 h-28 overflow-hidden rounded bg-gray-100 flex items-center justify-center text-gray-400">
                    No images
                  </div>
                )}
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