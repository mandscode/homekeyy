"use client"

import { FieldErrors, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

// Assume these are implemented or stubbed
import ImageUpload from "@/components/forms/ImageUpload"
import ServiceSchedule from "@/components/forms/ServiceSchedule"
import {FlatDetailsUpload} from "@/components/forms/FlatDetailsUpload"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { Card, CardContent } from "../ui/card"
import { useEffect, useState } from "react"
import PropertyInfo, { PropertyData } from "../PropertyInfo"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import FullScreenLoader from "../utils/FullScreenLoader"
import { FlatDetails } from "./PropertyUpdateForm"
import { useRouter } from "next/navigation"


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
  
    state: z
    .string()
    .min(1, { message: "State is required" }),
  
    zipCode: z
    .string()
    .min(1, { message: "ZIP Code is required" }),

  latitude: z
    .string()
    .min(1, { message: "Latitude is required" }),

  longitude: z
    .string()
    .min(1, { message: "Longitude is required" }),

  subMeterRatePerUnit: z
    .number({ invalid_type_error: "Please enter a valid number for Sub Meter Rate Per Unit" })
    .min(0, { message: "Sub Meter Rate Per Unit cannot be negative" }),

  fixedWaterBillAmount: z
    .number({ invalid_type_error: "Please enter a valid number for Fixed Water Bill Amount" })
    .min(0, { message: "Fixed Water Bill Amount must be greater than 0" }),

  amenities: z
    .array(z.object({
      id: z.number(),
      name: z.string(),
      type: z.enum(['number', 'boolean']),
      forProperty: z.boolean(),
      value: z.string().optional(),
      createdAt: z.union([z.string(), z.date()]),
      updatedAt: z.union([z.string(), z.date()])
    }))
    .min(1, { message: "At least one amenity required" }),

  images: z
    .array(z.object({
      url: z.string().url({ message: "Invalid image URL" }),
      name: z.string().min(1, { message: "Image name required" }),
      size: z.number().max(5_000_000, { message: "Image too large (max 5MB)" }),
      type: z.string().regex(/^image\/(jpeg|png|webp)$/, {
        message: "Only JPEG, PNG, or WebP allowed"
      })
    }))
    .min(1, { message: "At least one image required" }),

  serviceSchdule: z
    .array(z.object({
      serviceType: z.string().min(1, { message: "Service type is required" }),
      day: z.string().min(1, { message: "Day is required" }),
      startTime: z.string().min(1, { message: "Start time is required" }),
      endTime: z.string().min(1, { message: "End time is required" })
    })),

  flatDetails: z
    .array(z.object({
      flatNo: z.string().min(1, { message: "Flat number is required" }),
      floor: z.number({ invalid_type_error: "Floor must be a number" }),
      rooms: z.number({ invalid_type_error: "Rooms must be a number" }),
      baths: z.number({ invalid_type_error: "Baths must be a number" }),
      status: z.enum(["AVAILABLE", "BOOKED", "OCCUPIED", "NOTICE_PERIOD"]),
      sqft: z.number().optional(),
      parkingNumber: z.string().optional(),
      gasConnection: z.boolean().optional(),
      powerBackup: z.boolean().optional(),
      block: z.string().optional(),
      meterType: z.string().optional(),
      rentalType: z.string(),
      rentAmount: z.number(),
      securityDeposit: z.number(),
      effectiveFrom: z.string(),
      effectiveTo: z.string(),
      amenities: z.array(z.any()),
      meterBox: z.string(),
      initialMeterReading: z.string()
    })),
});


type FormField = {
  name: keyof z.infer<typeof formSchema>
  label: string
  type?: "text" | "number"
}

type PricingField = {
  name: keyof z.infer<typeof formSchema>
  label: string
  type?: "text" | "number"
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
};



// On submit function tyoes
type Property = {
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  subMeterRatePerUnit: number;
  fixedWaterBillAmount: number;
  amenities: Amenity[];
  images: PropertyImage[];
  serviceSchdule: ServiceSchedule[];
  flatDetails: FlatDetails[];
};

type Amenity = {
  id: number;
  name: string;
  type: 'number' | 'boolean'; // Using union type for the enum values
  forProperty: boolean;
  createdAt: string | Date; // Can be string (ISO format) or Date object
  updatedAt: string | Date;
};


type PropertyImage = {
  url: string;
  name: string;
  size: number;
  type: string;
};

type ServiceSchedule = {
  serviceType: string;
  day: string;
  startTime: string;
  endTime: string;
};

// If you need to make some fields optional for form handling:
type PropertyForm = Partial<Property> & {
  // Required fields can be specified here
  propertyName: string;
  address: string;
  // etc...
};

export default function PropertyForm() {
  const [step, setStep] = useState<"form" | "summary">("form")
  const [loading, setLoading] = useState(false)
  const [flatImages, setFlatImages] = useState<Record<string, File[]>>({});
  const { toast } = useToast()
  const [images, setImages] = useState<File[]>([])
  const router = useRouter()
  const queryClient = useQueryClient()
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { serviceType: "", day: "", startTime: `""`, endTime: `""` },
  ])
  const [flats, setFlats] = useState<FlatDetails[]>([])
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      latitude: '',
      longitude: '',
      amenities: [],
      images: [],
      serviceSchdule: [],
      flatDetails: []
    },
    mode: "onChange",
    reValidateMode: "onChange"
  })

  const onSubmit = (data: Property) => {
    console.log("Form submitted", data);
    setStep("summary");
  }

  const onError = (errors: FieldErrors<Property>) => {
    console.log("onError triggered", errors);
    let message = "Validation error";
    
    // Check for specific field errors
    if (errors.propertyName?.message) {
      message = errors.propertyName.message;
    } else if (errors.address?.message) {
      message = errors.address.message;
    } else if (errors.city?.message) {
      message = errors.city.message;
    } else if (errors.state?.message) {
      message = errors.state.message;
    } else if (errors.zipCode?.message) {
      message = errors.zipCode.message;
    } else if (errors.latitude?.message) {
      message = errors.latitude.message;
    } else if (errors.longitude?.message) {
      message = errors.longitude.message;
    } else if (errors.images?.message) {
      message = errors.images.message;
    } else if (errors.subMeterRatePerUnit?.message) {
      message = errors.subMeterRatePerUnit.message;
    } else if (errors.fixedWaterBillAmount?.message) {
      message = errors.fixedWaterBillAmount.message;
    } else if (errors.amenities?.message) {
      message = errors.amenities.message;
    } else if (errors.serviceSchdule) {
      message = "Service schedule is required";
    } else {
      // Check for array errors
      const firstErrorKey = Object.keys(errors)[0] as keyof Property;
      const error = errors[firstErrorKey];

      if (Array.isArray(error) && error.length > 0) {
        const nestedError = error[0];
        message = nestedError?.message || message;
      } else if (error?.message) {
        message = error.message;
      }
    }

    console.log(message, "message");
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  };
  
  const propertySubmit = async (data: Property) => { 
    setLoading(true)
    
    try {
      const propertyImages: UploadImage[] = images.map((file) => ({
        file,
        name: file.name,
        type: file.type,
        size: file.size
      }));
      
      const uploadedPropertyImages = await uploadImagesToS3(propertyImages, "property", data.propertyName);

      const enhancedFlatDetails = await Promise.all(
        data.flatDetails.map(async (flat:FlatDetails) => {
          
          const rawImages: UploadImage[] = (flatImages[flat.flatNo] || []).map((file: File) => ({
            file,
            name: file.name,
            type: file.type,
          }));

          const uploadedImages = await uploadImagesToS3(rawImages, "property", flat.flatNo);
          return {
            ...flat,
            images: uploadedImages,
          };
        })
      );
    
      const payload = {
        ...data,
        images: uploadedPropertyImages,
        flatDetails: enhancedFlatDetails,
      };


      const response = await api.post("/property/register", payload)
      
      if (response.status == 1) {
        toast({
          title: "Property listed successfully"
        })

        queryClient.invalidateQueries({ queryKey: ["property", response.data.newProperty.id] });
        router.push(`/properties/details/${response.data.newProperty.id}`);      
      }
    } catch (err: unknown) {
      let message = "Login failed";
      if (err instanceof Error) {
        message = err.message;
      }
      toast({
        title: message
      });
      console.error("Login failed", err)
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
          size: img.file.size || 0
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
      size: file.size || 0,
      type: file.type || 'image/jpeg' // default if not provided
    }));

    form.setValue('images', validFiles, { shouldValidate: true });
  }

  useEffect(() => {
    if (form) {
    form.setValue("serviceSchdule", schedules)
    }
  }, [schedules, form])

  useEffect(() => {
    if (form) {
      form.setValue("flatDetails", flats)
    }
  }, [flats, form])

  const formFields: FormField[] = [
    { name: "propertyName", label: "Property Name" },
    { name: "address", label: "Address" },
    { name: "city", label: "City" },
    { name: "state", label: "State" },
    { name: "zipCode", label: "ZIP Code", type: "text" },
    { name: "latitude", label: "Latitude" },
    { name: "longitude", label: "Longitude" },
  ]
  
  const pricingFields: PricingField[] = [
    { name: "subMeterRatePerUnit", label: "Sub Meter Rate Per Unit", type: "number" },
    { name: "fixedWaterBillAmount", label: "Fixed Water Bill Amount", type: "number" }
  ]

  const fetchAmenities = async () => {
    const res = await api.get("/web/property/amenity");
    const amenities = res.data.amenities.map((amenity: Amenity) => ({
      ...amenity,
      forProperty: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    return amenities ?? [];
  };

  const { data: amenities = [] } = useQuery({
    queryKey: ["amenities"],
    queryFn: fetchAmenities,
  });

  return (
    <>
      <Toaster />
      {loading && <FullScreenLoader />}
      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
        {step === "form" ? (
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
            <div className="grid grid-cols-3 gap-6">
              {formFields.map(({ name, label, type = "text" }) => (
                <div key={name} className="flex flex-col gap-3">
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    type={type}
                    placeholder={label}
                    {...form.register(name, { 
                      valueAsNumber: type === "number",
                      onChange: (e) => {
                        if (name === "zipCode") {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = value;
                          form.setValue(name, value);
                        }
                      }
                    })}
                  />
                </div>
              ))}
            </div>

            {/* Image Upload with Error Display */}
            <div className="flex flex-col gap-3">
              <Label>Images</Label>
              <ImageUpload onChange={handleImagesChange}/>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-7">
                <Label>Pricing</Label>
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
              </div>
            </div>

            {/* Amenities Section */}
            <div className="space-y-6">
              <div className="flex flex-col gap-7">
                <Label>Amenities</Label>
                {/* Number type amenities */}
                <div className="grid grid-cols-3 gap-6">
                  {amenities
                    .filter((item: Amenity) => item.type === 'number')
                    .map((item: Amenity) => {
                      const fieldName = item.name.toLowerCase().replace(/\s+/g, '');
                      return (
                        <div key={item.id} className="flex flex-col gap-3">
                          <Label htmlFor={fieldName}>{item.name}</Label>
                          <Input
                            id={fieldName}
                            type="number"
                            placeholder={item.name}
                            min={0}
                            value={form.getValues("amenities").find((i: Amenity) => i.id === item.id)?.value || ""}
                            onChange={(e) =>  {
                              const value = e.target.value;
                              const currentAmenities = form.getValues("amenities") || [];
                              
                              const updated = value
                                ? (() => {
                                  const existingAmenity = currentAmenities.find((i: Amenity) => i.id === item.id);
                                  if (existingAmenity) {
                                    return currentAmenities.map((i: Amenity) => i.id === item.id ? { ...i, value } : i);
                                  }
                                  return [...currentAmenities, { ...item, value }];
                                })()
                                : form.getValues("amenities").filter((i: Amenity) => i.id !== item.id);

                              form.setValue("amenities", updated);
                            }}
                          />
                        </div>
                      );
                    })}
                </div>

                {/* Boolean type amenities */}
                <div className="grid grid-cols-3 gap-6">
                  {amenities
                    .filter((item: Amenity) => item.type === 'boolean')
                    .map((item: Amenity) => {
                      const selectedAmenities = form.watch("amenities") || [];
                      const isSelected = selectedAmenities.some((i) => i.id === item.id);
                      
                      return (
                        <label key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...selectedAmenities, {
                                    ...item,
                                    forProperty: true,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                    value: checked ? "true" : "false"
                                  }]
                                : selectedAmenities.filter((i: Amenity) => i.id !== item.id);

                              form.setValue("amenities", updated);
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
            <FlatDetailsUpload onFlatsUploaded={setFlats}/>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-red-600 hover:bg-red-700">List Property</Button>
            </div>
          </form>
        ) : (
            <div className="space-y-6">
              {form.getValues() ? (
                <>
                  {/* <h2 className="text-xl font-semibold">Listing Summary</h2>
                  <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px]">
            {JSON.stringify(form.getValues(), null, 2)}
          </pre> */}
                  <PropertyInfo data={form.getValues() as PropertyData} onImagesChange={setFlatImages}/>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("form")}>Back to Edit</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => propertySubmit(form.getValues())}>Submit Final</Button>
                  </div>
                </>
              ) : (
                <FullScreenLoader />
              )}
            </div>
        )}
        </CardContent>
      </Card>
    </>
  )
}