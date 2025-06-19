"use client"

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Clock, Trash2, X } from 'lucide-react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';
import { UnitModal } from './ui/unit-modal';
import apiEndpoints from '@/lib/apiEndpoints';
import { DeleteUnitModal } from './ui/delete-unit-modal';
import { toast } from '@/components/ui/use-toast';

type Amenity = {
  id: number;
  name: string;
  type: 'number' | 'boolean'; // Using union type for the enum values
  forProperty: boolean;
  createdAt: string | Date; // Can be string (ISO format) or Date object
  updatedAt: string | Date;
};

type PropertyData = {
  propertyAmenities: {
    amenity: Amenity;
  }[];
  images: {
    id: number;
    propertyId: number;
    url: string;
    alt: string;
    createdAt: string;
    updatedAt: string;
  }[];
  serviceSchedules: {
    service: {
      type: string;
    };
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  name: string;
  address: string;
  city: string;
  zip: string;
  latitude: string;
  longitude: string;
  totalMotors: number;
  mainMeters: number;
  subMeters: number;
  subMeterRatePerUnit: number;
  fixedWaterBillAmount: number;
  units: FlatDetails[];
};

type FlatDetails = {
  id:number;
  number: string;
  floor: number;
  rooms: number;
  images:FlatImage[];
  bathrooms: number;
  status: FlatStatus;
}

type FlatImage = {
  id:number;
  propertyId:number;
  url:string;
  alt:string;
}

type FlatStatus = 'AVAILABLE' | 'BOOKED' | 'OCCUPIED' | 'NOTICE_PERIOD';

const FlatStatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    AVAILABLE: {
      label: "Available",
      className: "bg-green-100 text-green-800"
    },
    BOOKED: {
      label: "Booked",
      className: "bg-blue-100 text-blue-800"
    },
    OCCUPIED: {
      label: "Occupied",
      className: "bg-red-100 text-red-800"
    },
    NOTICE_PERIOD: {
      label: "Notice Period",
      className: "bg-yellow-100 text-yellow-800"
    }
  };

  const statusInfo = statusMap[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800"
  };

  return (
    <span className={`text-sm px-3 py-1 rounded ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
};

export default function PropertyDetail() {
  // const [flatImages, setFlatImages] = useState<Record<string, File[]>>({});
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [open, setOpen] = useState(false)
  const [unitId, setUnitId] = useState<number>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteUnitId, setDeleteUnitId] = useState<number>()
  const [deletingImage, setDeletingImage] = useState<string | null>(null)
  
  const params = useParams();
  const id = params.id as string;

  const queryClient = useQueryClient();

  const fetchProperty = async (): Promise<PropertyData> => {
    const res = await api.get(apiEndpoints.Property.endpoints.getPropertyById.path.replace("{id}", id));
    return res.data.property ?? {
      propertyAmenities: [],
      images: [],
      serviceSchedules: [],
      name: '',
      address: '',
      city: '',
      zip: '',
      latitude: '',
      longitude: '',
      totalMotors: 0,
      mainMeters: 0,
      subMeters: 0,
      subMeterRatePerUnit: 0,
      fixedWaterBillAmount: 0,
      units: []
    };
  };
  // const inputRefs = useRef<Record<string, HTMLInputElement | null>>({}); // <-- Single ref for all flats

  const { data: property = {
    propertyAmenities: [],
    images: [],
    serviceSchedules: [],
    name: '',
    address: '',
    city: '',
    zip: '',
    latitude: '',
    longitude: '',
    totalMotors: 0,
    mainMeters: 0,
    subMeters: 0,
    subMeterRatePerUnit: 0,
    fixedWaterBillAmount: 0,
    units: [],
  } } = useQuery<PropertyData>({
    queryKey: ["property", id],
    queryFn: fetchProperty,
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["property", id] });
  }, [id, queryClient]);

  const uniqueFloors = [...new Set((property?.units || []).map(flat => flat.floor))];
  const filteredFlats = selectedFloor && property?.units
    ? property?.units.filter((flat:FlatDetails) => flat.floor.toString() === selectedFloor.toString())
    : property?.units || [];
  
  const statusCounts = (property?.units || []).reduce<Record<string, number>>(
    (acc, flat: FlatDetails) => {
      const status = flat.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {}
  );

  // Function to delete property image
  const deletePropertyImage = async (imageUrl: string) => {
    try {
      setDeletingImage(imageUrl);
      await api.delete('/web/unit/image', {
        data: { propertyImageUrl: imageUrl, propertyId: id }
      });
      
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      
      // Invalidate the property query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["property", id] });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setDeletingImage(null);
    }
  };

  // const handleImageChange = (number: string, files: FileList | null) => {
  //   if (!files) return;
  
  //   const updated = {
  //     ...flatImages,
  //     [number]: [...(flatImages[number] || []), ...Array.from(files)],
  //   };
  
  //   setFlatImages(updated); // pass back 
  // };
  
  return (
    <>
    <div className="p-6 space-y-12">
      <h2 className="text-red-600 text-lg font-semibold">Property information</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
        <div>
          <p className="font-medium text-black">Property name</p>
          <p>{property.name}</p>
        </div>
        <div>
          <p className="font-medium text-black">Address</p>
          <p>{property.address}</p>
        </div>
        <div>
          <p className="font-medium text-black">City</p>
          <p>{property.city}</p>
        </div>
        <div>
          <p className="font-medium text-black">ZIP code</p>
          <p>{property.zip}</p>
        </div>
        <div>
          <p className="font-medium text-black">Map location</p>
          <p>
            Lat: {property.latitude}, Lng: {property.longitude}
          </p>
        </div>
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
        <div>
          <p className="font-medium text-black">Sub meter rate per unit</p>
          <p>{property.subMeterRatePerUnit}</p>
        </div>
        <div>
          <p className="font-medium text-black">Fixed water bill amount</p>
          <p>{property.fixedWaterBillAmount}</p>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Images</h3>
        <div className="flex gap-4 flex-wrap">
          {(property?.images || []).map((img, idx) => (
            <div key={idx} className="w-28 h-28 overflow-hidden rounded relative bg-gray-100 group">
              <Image
                src={img.url}
                alt={img.alt || 'Property image'}
                fill
                sizes="(max-width: 112px) 100vw, 112px"
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                }}
                unoptimized
              />
              {/* Delete button overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 rounded-full"
                  onClick={() => deletePropertyImage(img.url)}
                  disabled={deletingImage === img.url}
                >
                  {deletingImage === img.url ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <X size={16} />
                  )}
                </Button>
              </div>
            </div>
          ))}
          {(!property?.images || property.images.length === 0) && (
            <div className="w-28 h-28 overflow-hidden rounded bg-gray-100 flex items-center justify-center text-gray-400">
              No images
            </div>
          )}
        </div>
      </div>
  
      <div>
        <h3 className="font-medium mb-2">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {property.propertyAmenities.map((amenity, index) => (
            <Badge key={index} className="bg-red-100 text-red-600 text-base">
              {amenity.amenity.name}
            </Badge>
          ))}
        </div>
      </div>
  
      {/* Service schedule */}
      <div className=''>
        <h2 className="text-xl font-semibold mb-4">Service schedule</h2>
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-[30%_30%_40%] w-full gap-3 rounded-md text-sm text-gray-600 font-semibold">
            <span className="bg-gray-100 p-2 text-center rounded-sm">Service</span>
            <span className="bg-gray-100 p-2 text-center rounded-sm">Day</span>
            <div className="bg-gray-100 p-2 text-center rounded-sm">Availability</div>
          </div>
          {/* <Button onClick={addSchedule} variant="destructive" size="sm">Add more</Button> */}
        </div>
        {property?.serviceSchedules?.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[30%_30%_40%] gap-3 mt-2 items-center">
              <div>{item.service.type}</div>
              <Input disabled defaultValue={item.dayOfWeek} className="w-full" />
              <div className="flex justify-between items-center w-full">
              <span className="flex items-center justify-between w-1/3">
                  {item.startTime} <Clock size={16} />
                </span>
              <span className="flex items-center justify-between w-1/3">
                  {item.endTime} <Clock size={16} />
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Flats Overview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Flats overview</h2>

          <div className="flex items-center gap-4">
            <Select value={selectedFloor !== null ? selectedFloor.toString() : "all"} onValueChange={(value: string) => setSelectedFloor(value === "all" ? null : parseInt(value, 10))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value={"all"}>All</SelectItem>
                  {uniqueFloors.map((floor:number) => (
                    <SelectItem key={floor} value={floor.toString()}>
                      Floor {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            <div className="flex gap-4 text-sm">
              <span className="bg-green-100 px-2 py-1 rounded">Available  {statusCounts.available}</span>
              <span className="bg-yellow-100 px-2 py-1 rounded">Notice {statusCounts.notice}</span>
              <span className="bg-red-100 px-2 py-1 rounded">Occupied {statusCounts.occupied}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 w-full gap-3 rounded-md text-sm text-gray-600 font-semibold">
          <div className="bg-gray-100 p-2 text-center rounded-sm">Flat number</div>
          {/* <div className="bg-gray-100 p-2 text-center rounded-sm">Image</div> */}
          <div className="bg-gray-100 p-2 text-center rounded-sm">Floor</div>
          <div className="bg-gray-100 p-2 text-center rounded-sm">Rooms</div>
          <div className="bg-gray-100 p-2 text-center rounded-sm">Bathrooms</div>
          <div className="bg-gray-100 p-2 text-center rounded-sm">Status</div>
          <div className="bg-gray-100 p-2 text-center rounded-sm"></div>
        </div>

        {filteredFlats.map((flat, i) => 
        {
          return (
            <div key={i} className="grid grid-cols-6 gap-3 items-center py-3 border-b text-center">
              <div>{flat.number}</div>
              {/* <div className="flex flex-col items-center gap-1">
                <Button
                  variant="outline"
                  className="text-red-600 text-sm"
                  onClick={() => inputRefs.current[flat.number]?.click()} // <-- Access ref dynamically
                >
                  + Add images
                </Button>
  
                <input
                  // ref={inputRef}
                  ref={(el) => {
                    inputRefs.current[flat.number] = el; // Assign ref without returning anything
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageChange(flat.number, e.target.files)}
                />

                <span className="text-xs text-gray-500">
                {(flatImages[flat.number]?.length || 0) + (flat.images?.length || 0)} uploaded
                </span>
              </div> */}
              <div>{flat.floor}</div>
              <div>{flat.rooms}</div>
              <div>{flat.bathrooms}</div>
              <span className="px-2 py-1 rounded">
                <FlatStatusBadge status={flat.status} />
              </span>
              <div className='flex gap-2 justify-center'>
              <Button variant="link" onClick={() => {
                setUnitId(flat.id);
                setOpen(true);
              }} className="text-blue-600 px-0 text-sm">
                Edit
              </Button>
              <Button variant="link" onClick={() => {
                setDeleteUnitId(flat.id);
                setDeleteOpen(true);
              }} className="text-blue-600 px-0 text-sm">
                Delete
              </Button>
                </div>
            </div>
          )
        })}
      </div>
    </div>
    <UnitModal 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          // Invalidate the property query when modal is closed
          queryClient.invalidateQueries({ queryKey: ["property", id] });
        }
      }} 
      unitId={Number(unitId)}
    />
    <DeleteUnitModal
      open={deleteOpen}
      onOpenChange={(newOpen) => {
        setDeleteOpen(newOpen);
        if (!newOpen) {
          queryClient.invalidateQueries({ queryKey: ["property", id] });
        }
      }}
      unitId={deleteUnitId}
    />
  </>   
  );  
}