"use client"

import { FieldErrors, useForm } from "react-hook-form"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import FullScreenLoader from "../utils/FullScreenLoader"
import { getPropertyById } from "@/lib/api/property"
import api from "@/lib/axios"
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from "next/navigation"

// Assume these are implemented or stubbed
import ImageUpload from "@/components/forms/ImageUpload"
import ServiceSchedule from "@/components/forms/ServiceSchedule"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"

import FlatsUpload, { Amenities } from "./FlatsUpload"

const formSchema = z.object({
  propertyName: z
    .string()
    .min(1, { message: "Please enter a property name" }),

  address: z
    .string()
    .min(1, { message: "Address is required" }),

  city: z
    .string()
    .min(1, { message: "City is required" }),

  zipCode: z
    .string()
    .min(1, { message: "ZIP Code is required" }),

  latitude: z
    .string()
    .min(1, { message: "Latitude is required" }),

  longitude: z
    .string()
    .min(1, { message: "Longitude is required" }),

  totalMotors: z
    .number({ invalid_type_error: "Total motors must be a number" }),

  mainMeters: z
    .number({ invalid_type_error: "Main meters must be a number" }),

  subMeters: z
    .number({ invalid_type_error: "Sub meters must be a number" }),

  subMeterRatePerUnit: z
    .number({ invalid_type_error: "Please enter a valid number for Sub Meter Rate Per Unit" })
    .min(0, { message: "Sub Meter Rate Per Unit cannot be negative" }),

  fixedWaterBillAmount: z
    .number({ invalid_type_error: "Please enter a valid number for Fixed Water Bill Amount" })
    .min(0, { message: "Fixed Water Bill Amount cannot be negative" }),

  amenities: z
    .array(z.object({
      id: z.number(),
      name: z.string(),
      type: z.enum(['number', 'boolean']),
      forProperty: z.boolean(),
      createdAt: z.union([z.string(), z.date()]),
      updatedAt: z.union([z.string(), z.date()])
    }))
    .min(1, { message: "At least one amenity required" }),

  images: z
    .array(z.object({
      url: z.string().url({ message: "Invalid image URL" }),
      alt: z.string().min(1, { message: "Image name required" }),
      size: z.number().max(5_000_000, { message: "Image too large (max 5MB)" }),
      type: z.string().regex(/^image\/(jpeg|png|webp)$/, {
        message: "Only JPEG, PNG, or WebP allowed"
      })
    }))
    .min(1, { message: "At least one image required" }),

  serviceSchedule: z
    .array(z.object({
      serviceType: z.string().min(1, { message: "Service type is required" }),
      day: z.string().min(1, { message: "Day is required" }),
      startTime: z.string().min(1, { message: "Start time is required" }),
      endTime: z.string().min(1, { message: "End time is required" })
    }))
});

type ServiceScheduleProps = {
  service: {
    type: string;
  }
  startTime: string;
  endTime: string;
  dayOfWeek: string;
}

type FormField = {
  name: keyof z.infer<typeof formSchema>
  label: string
  type?: "text" | "number"
}

type PropertyAmenity = {
  amenity: Amenity;
  amenityValue: string | number;
}

type ScheduleItem = {
  serviceType: string
  day: string
  startTime: string
  endTime:string
}

type UploadImage = {
  file: File;
  name?: string;
  type?: string;
};

type UploadedImage = {
  url: string;
  name: string;
  type: string;
  size: number;
  alt: string;
};

// On submit function tyoes
type PropertyData = {
  propertyName: string;
  address: string;
  city: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  totalMotors: number;
  mainMeters: number;
  subMeters: number;
  amenities: Amenity[];
  images: PropertyImage[];
  serviceSchedule: ServiceSchedule[];
  flatDetails: FlatDetails[];
  subMeterRatePerUnit: number;
  fixedWaterBillAmount: number;
};

type Amenity = {
  id: number;
  name: string;
  type: 'number' | 'boolean'; // Using union type for the enum values
  value: string | null;
  forProperty: boolean;
  createdAt: string | Date; // Can be string (ISO format) or Date object
  updatedAt: string | Date;
};

type Unit = {
  id: number;
  number: string;
  floor: string;
  rooms: string;
  bathrooms: string;
  status: string;
  sqFt: string;
  parkingNumber: string;
  gasConnection: boolean;
  powerBackup: boolean;
  block: string;
  meterType: string;
  rentalType: string;
  rentAmount: number;
  securityDeposit: number;
  effectiveFrom: string;
  effectiveTo: string;
  amenities: Amenities[];
}

type PropertyImage = {
  url: string;
  alt: string;
  size: number;
  type: string;
};

type ServiceSchedule = {
  serviceType: string;
  day: string;
  startTime: string;
  endTime: string;
};

export interface FlatDetails {
  flatNo: string;
  floor: number;
  rooms: number;
  baths: number;
  status: 'AVAILABLE' | 'BOOKED' | 'OCCUPIED' | 'NOTICE_PERIOD';
  sqft?: number;
  parkingNumber?: string;
  gasConnection?: boolean;
  powerBackup?: boolean;
  block?: string;
  meterType?: string;
  rentalType: string;
  rentAmount: number;
  securityDeposit: number;
  effectiveFrom: string;
  effectiveTo: string;
  amenities: Amenities[];
  meterBox: string;
  initialMeterReading: string;
}

interface PropertyUpdateFormProps {
  propertyId: number;
  onSuccess?: () => void;
}

export default function PropertyUpdateForm({ propertyId, onSuccess }: PropertyUpdateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [images, setImages] = useState<File[]>([])
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { serviceType: "", day: "", startTime: `""`, endTime: `""` },
  ])

  const [flats, setFlats] = useState<FlatDetails[]>([])
  
  const form = useForm<PropertyData>({
    defaultValues: {
      propertyName: '',
      address: '',
      city: '',
      zipCode: '',
      latitude: '',
      longitude: '',
      totalMotors: 0,
      mainMeters: 0,
      subMeters: 0,
      subMeterRatePerUnit: 0,
      fixedWaterBillAmount: 0,
      amenities: [],
      images: [],
      serviceSchedule: [],
      flatDetails: []
    }
  })
  
  const onError = (errors: FieldErrors<PropertyData>) => {
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

  const propertySubmit = async (data: PropertyData) => { 
    setLoading(true)
    
    try {
      
      const propertyImages: UploadImage[] = images.map((file) => ({
        file,
        name: file.name,
        type: file.type,
        size: file.size
      }));
      
      const uploadedPropertyImages = await uploadImagesToS3(propertyImages, "property", data.propertyName);
      // Transform the data to match Prisma schema
      const payload = {
        name: data.propertyName,
        address: data.address,
        city: data.city,
        zip: data.zipCode,
        subMeterRatePerUnit: data.subMeterRatePerUnit,
        fixedWaterBillAmount: data.fixedWaterBillAmount,
        latitude: data.latitude,
        longitude: data.longitude,
        amenities: data.amenities.filter(amenity => amenity.value !== 'false' && amenity.value !== null && amenity.value !== '0').map(amenity => ({
          id: amenity.id,
          value: amenity.type === 'boolean' ? amenity.value : 
                 amenity.type === 'number' ? amenity.value : null
        })),
        serviceSchedules: data.serviceSchedule.map(schedule => ({
          serviceType: schedule.serviceType,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime
        })),
        images: [ ...uploadedPropertyImages].map(img => ({
          url: img.url,
          alt: 'property-image'
        })),
        units: flats.map(flat => ({
          number: flat.flatNo.toString(),
          floor: flat.floor.toString(),
          rooms: flat.rooms.toString(),
          baths: flat.baths.toString(),
          status: flat.status,
          block: flat.block,
          sqFt: flat.sqft?.toString() || '0',
          parkingNumber: flat.parkingNumber,
          gasConnection: flat.gasConnection || false,
          powerBackup: flat.powerBackup || false,
          meterBox: flat.meterBox,
          initialMeterReading: flat.initialMeterReading,
          rentAmount: flat.rentAmount,
          securityDeposit: flat.securityDeposit,
          rentalType: flat.rentalType,
          meterType: flat.meterType,
          effectiveFrom: flat.effectiveFrom,
          effectiveTo: flat.effectiveTo,
          amenities: flat.amenities,
        }))
      };

      const response = await api.put(`/web/property/${propertyId}`, payload)
      
      if (response.status == 1) {
        toast({
          title: "Property updated successfully"
        });
        queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
        onSuccess?.();
        router.push(`/properties/details/${propertyId}`);
      }
    } catch (err: unknown) {
      let message = "Failed to update property";
      if (err instanceof Error) {
        message = err.message;
      }
      toast({
        title: message,
        variant: "destructive"
      });
      console.error("Error updating property:", err)
    } finally {
      setLoading(false)
    }
  }

  const uploadImagesToS3 = async (images: UploadImage[], entityName: string, entityId: string | number): Promise<UploadedImage[]> => {
    const uploaded = await Promise.all(
      images.map(async (img) => {
        const formData = new FormData();
        formData.append("file", img.file); // `file` is the image blob/File object
        formData.append("entityName", entityName);       // ✅ add entityName
        formData.append("entityId", entityId.toString()); // ✅ add entityId
  
        const res = await api.post("/upload", formData);
        return {
          url: res.data.url,
          name: img.name || 'flat-image',
          type: img.type || 'flat',
          size: img.file.size || 0,
          alt: img.file.name || 'flat-image'
        };
      })
    );
  
    return uploaded;
  };
  

  const handleImagesChange = (files: File[]) => {
    setImages(files)
    
    // Get existing images from form
    const existingImages = form.watch("images") || [];
    
    // Create new image objects from uploaded files
    const newImages = files.map(file => ({
      url: URL.createObjectURL(file),
      size: file.size || 0,
      type: file.type || 'image/jpeg',
      alt: file.name
    }));

    // Combine existing and new images
    const allImages = [...existingImages, ...newImages];

    // Update form with all images
    form.setValue('images', allImages, { shouldValidate: true });
  }

  useEffect(() => {
    if (form) {
    form.setValue("serviceSchedule", schedules)
    }
  }, [schedules, form])

  const formFields: FormField[] = [
    { name: "propertyName", label: "Property Name" },
    { name: "address", label: "Address" },
    { name: "city", label: "City" },
    { name: "zipCode", label: "ZIP Code" },
    { name: "latitude", label: "Latitude" },
    { name: "longitude", label: "Longitude" },
  ]

  const pricingFields: FormField[] = [
    { name: "subMeterRatePerUnit", label: "Sub Meter Rate Per Unit" },
    { name: "fixedWaterBillAmount", label: "Fixed Water Bill Amount" }
  ]

  const fetchAmenities = async () => {
    const res = await api.get(`/web/property/amenity/${propertyId}`);
    const amenities = res.data.amenities;
    return amenities ?? [];
  };

  const { data: amenities = [] } = useQuery({
    queryKey: ["amenities"],
    queryFn: fetchAmenities,
  });

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const response = await getPropertyById(propertyId);
        if (response?.data) {
          const property = response.data.property;
          // Map property amenities to the expected format
          const mappedAmenities = amenities.map((pa: Amenity) => ({
            id: pa.id,
            name: pa.name,
            type: pa.type,
            value: pa.value
          }));

          // Map service schedules to the expected format
          const mappedServiceSchedules = property.serviceSchedules?.map((ss: ServiceScheduleProps) => ({
            serviceType: ss?.service?.type,
            day: ss?.dayOfWeek,
            startTime: ss?.startTime,
            endTime: ss?.endTime
          }));


          // Map images to the expected format
          const mappedImages = property.images.map((img: PropertyImage) => ({
            url: img.url,
            name: img.alt || 'property-image',
            size: 0, // Since we don't have size in the response
            type: 'image/jpeg', // Default type since we don't have it in response
            alt: img.alt || 'property-image'
          }));

          form.reset({
            propertyName: property.name,
            address: property.address,
            city: property.city,
            zipCode: property.zip,
            latitude: property.latitude,
            longitude: property.longitude,
            totalMotors: parseInt(property.propertyAmenities.find((pa: PropertyAmenity) => pa.amenity.name === 'Total Motors')?.amenityValue || '0'),
            mainMeters: parseInt(property.propertyAmenities.find((pa: PropertyAmenity) => pa.amenity.name === 'Main Meter')?.amenityValue || '0'),
            subMeters: 0, // Default value since it's not in the response
            amenities: mappedAmenities,
            images: mappedImages,
            subMeterRatePerUnit: property.subMeterRatePerUnit,
            fixedWaterBillAmount: property.fixedWaterBillAmount,
            serviceSchedule: mappedServiceSchedules,
            flatDetails: property.units.map((unit: Unit) => ({
              flatNo: unit.number,
              floor: parseInt(unit.floor),
              rooms: parseInt(unit.rooms),
              baths: parseInt(unit.bathrooms),
              status: unit.status.toLowerCase() as 'available' | 'notice' | 'occupied',
              sqft: parseInt(unit.sqFt),
              parkingNumber: unit.parkingNumber,
              gasConnection: unit.gasConnection,
              powerBackup: unit.powerBackup,
              block: unit.block,
              meterType: unit.meterType,
              rentalType: unit.rentalType,
              rentAmount: unit.rentAmount,
              securityDeposit: unit.securityDeposit,
              effectiveFrom: unit.effectiveFrom,
              effectiveTo: unit.effectiveTo,
              amenities: unit.amenities
            }))
          });
          
          // Update the schedules state
          setSchedules(mappedServiceSchedules);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch property details",
          variant: "destructive"
        });
        console.error('Error fetching property:', error);
      }
    };

    fetchPropertyDetails();
  }, [propertyId, form, toast, amenities]);

  void formSchema;

  return (
    <>
      {loading && <FullScreenLoader />}
      <Toaster />
      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
        <form onSubmit={form.handleSubmit(propertySubmit, onError)} className="space-y-8">
            <div className="grid grid-cols-3 gap-6">
              {formFields.map(({ name, label, type = "text" }) => (
                <div key={name} className="flex flex-col gap-3">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    // disabled={name === "propertyName" || name === "address" || name === "city" || name === "zipCode" || name === "latitude" || name === "longitude"}
                    type={type}
                    placeholder={label}
                    {...form.register(name, { valueAsNumber: type === "number" })}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6">
              {pricingFields.map(({ name, label, type = "text" }) => (
                <div key={name} className="flex flex-col gap-3">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    type={type}
                    min={0}
                    placeholder={label}
                    {...form.register(name, { 
                      valueAsNumber: type === "number",
                      min: 0
                    })}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
                {form.watch("images")?.map((img: PropertyImage, idx: number) => (
                  <div key={idx} className="w-28 h-28 overflow-hidden rounded relative bg-gray-100">
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
                {(!form.watch("images") || form.watch("images").length === 0) && (
                  <div className="w-28 h-28 overflow-hidden rounded bg-gray-100 flex items-center justify-center text-gray-400">
                    No images
                  </div>
                )}
              </div>
            {/* Image Upload Placeholder */}
            <div className="flex flex-col gap-3">
              <Label>Images</Label>
              <ImageUpload onChange={handleImagesChange}/>
            </div>

            {/* Amenities Section */}
            <div className="space-y-6">
              <div className="flex flex-col gap-7">
                <Label>Amenities</Label>
                <div className="grid grid-cols-3 gap-6">
                  {form.watch("amenities")?.filter((item: Amenity) => item.type === "number").map((item: Amenity) => (
                    <div key={item.id} className="flex flex-col gap-3">
                      <Label htmlFor={item.name}>{item.name}</Label>
                      <Input
                        id={item.name}
                        type="number"
                        placeholder={item.name}
                        min={0}
                        value={Number(item.value) || 0}
                        onChange={(e) => {
                          const value = e.target.value;
                          const updatedAmenities = form.watch("amenities").map((amenity: Amenity) => {
                            if (amenity.id === item.id) {
                              return {
                                ...amenity,
                                value: value
                              };
                            }
                            return amenity;
                          });
                          form.setValue("amenities", updatedAmenities);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {form.watch("amenities")?.filter((item: Amenity) => item.type === "boolean").map((item: Amenity) => {
                    return (
                      <label key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={item.value === "true"}
                          onCheckedChange={(checked) => {
                            const updatedAmenities = form.watch("amenities").map((amenity: Amenity) => {
                              if (amenity.id === item.id) {
                                return {
                                  ...amenity,
                                  value: checked ? "true" : "false"
                                };
                              }
                              return amenity;
                            });
                            form.setValue("amenities", updatedAmenities);
                          }}
                        />
                        <span>{item.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Service Schedule Placeholder */}
            
            <div>
              <ServiceSchedule schedulesProps={schedules} setSchedulesProps={setSchedules} />
            </div>

                        {/* Flat Details Upload */}
            <div>
              <FlatsUpload flats={flats} setFlats={setFlats} propertyId={propertyId.toString()}/>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Update Property</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}