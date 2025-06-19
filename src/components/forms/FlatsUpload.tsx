import { useEffect, useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileIcon, Upload, CheckCircle } from "lucide-react"
import api from "@/lib/axios"
import { toast } from "@/components/ui/use-toast"

export interface FlatDetailsRequest {
  flatNo: string
  floor: number
  rooms: number
  baths: number
  status: FlatStatus,
  sqft?: number,
  parkingNumber?: string,
  gasConnection?: boolean,
  powerBackup?: boolean,
  block?: string,
  meterType?: string,
  rentalType: string,
  rentAmount: number,
  securityDeposit: number,
  effectiveFrom: string,
  effectiveTo: string,
  amenities: string,
  meterBox: string,
  initialMeterReading: string,
}

export interface FlatDetailsResponse {
  flatNo: string
  floor: number
  rooms: number
  baths: number
  status: FlatStatus,
  sqft?: number,
  parkingNumber?: string,
  gasConnection?: boolean,
  powerBackup?: boolean,
  block?: string,
  meterType?: string,
  rentalType: string,
  rentAmount: number,
  securityDeposit: number,
  effectiveFrom: string,
  effectiveTo: string,
  amenities: Amenities[],
  meterBox: string,
  initialMeterReading: string,
}

export type Amenities = {
  name: string
  id: number
  type: string
  forProperty: boolean
  quantity?: number
}

type FlatStatus = 'AVAILABLE' | 'BOOKED' | 'OCCUPIED' | 'NOTICE_PERIOD';

export default function FlatsUpload({
  setFlats,
  propertyId
}: {
  flats?: FlatDetailsResponse[]
  setFlats: React.Dispatch<React.SetStateAction<FlatDetailsResponse[]>>
  propertyId: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploaded, setUploaded] = useState(false)
  const [existingFlats, setExistingFlats] = useState([])
  const [amenities, setAmenities] = useState<Amenities[]>([])
  // Fetch existing flats for the property

  useEffect(() => {
    const fetchFlats = async () => {
      const res = await api.get(`/web/property/${propertyId}`);
      const resAmenities = await api.get(`/web/amenity`);
      setAmenities(resAmenities.data.amenities)
      setExistingFlats(res.data.property.units || []);
    }
    fetchFlats()
  }, [propertyId])


  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json<FlatDetailsRequest>(worksheet);

        // Validate required fields
        const requiredFields = ['flatNo', 'floor', 'rooms', 'baths', 'status', 'block', 'sqft', 'rentAmount', 'securityDeposit', 'effectiveFrom', 'effectiveTo', 'meterBox', 'initialMeterReading', 'rentalType'];
        const missingFields = jsonData.some(flat => 
          requiredFields.some(field => !flat[field as keyof FlatDetailsRequest])
        );
        if (missingFields) {
          toast({
            title: "Error",
            description: "Excel file is missing required fields",
            variant: "destructive",
          });
          return;
        } 
        
        // Validate data types and formats
        const validatedData = jsonData.map(flat => {
          // Extract amenity fields from the flat data
          const amenityFields = Object.entries(flat).filter(([key]) => {
            // Check if the field name matches any amenity name
            return amenities.some(
              (a: {name: string}) => a.name.toLowerCase() === key.toLowerCase()
            );
          });

          // Map amenity fields to valid amenities
          const validFlatAmenities = amenityFields
            .map(([name, value]) => {
              const matchedAmenity = amenities.find(
                (a: {name: string, id: number, type: string, forProperty: boolean}) => 
                  a.name.toLowerCase() === name.toLowerCase()
              );
          
              if (!matchedAmenity) return null;
          
              return {
                id: matchedAmenity.id,
                name: matchedAmenity.name,
                type: matchedAmenity.type,
                forProperty: matchedAmenity.forProperty,
                quantity: Number(value)
              } as Amenities;
            })
            .filter((amenity): amenity is Amenities => amenity !== null);

          return {
            flatNo: flat.flatNo?.toString() || '',
            floor: parseInt(flat.floor?.toString() || '0'),
            gasConnection: flat.gasConnection?.toString().toUpperCase() === 'true' ? true : false,
            powerBackup: flat.powerBackup?.toString().toUpperCase() === 'true' ? true : false,
            rentalType: flat.rentalType?.toLowerCase() === 'yearly' ? 'yearly' : 'monthly',
            meterType: flat.meterType?.toUpperCase() || 'MAIN',
            block: flat.block?.toUpperCase() || 'A',
            parkingNumber: flat.parkingNumber?.toString() || '0',
            sqft: parseInt(flat.sqft?.toString() || '0'),
            status: flat.status?.toString().toUpperCase() as FlatStatus || 'AVAILABLE',
            rooms: parseInt(flat.rooms?.toString() || '0'),
            baths: parseInt(flat.baths?.toString() || '0'),
            rentAmount: parseInt(flat.rentAmount?.toString() || '0'),
            securityDeposit: parseInt(flat.securityDeposit?.toString() || '0'),
            effectiveFrom: flat.effectiveFrom?.toString() || '',
            effectiveTo: flat.effectiveTo?.toString() || '',
            amenities: validFlatAmenities,
            meterBox: flat.meterBox?.toString() || '',
            initialMeterReading: flat.initialMeterReading?.toString() || '0',
          };
        });

        setFlats(validatedData)
        setUploaded(true)
        toast({
          title: "Success",
          description: "Excel file uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process Excel file",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const sampleData: FlatDetailsResponse[] = [
      {
        flatNo: "101",
        floor: 1,
        rooms: 2,
        baths: 1,
        status: "AVAILABLE",
        sqft: 1000,
        parkingNumber: "1",
        gasConnection: true,
        powerBackup: true,
        block: "A",
        rentalType: "monthly",
        meterType: "MAIN",
        rentAmount: 1000,
        securityDeposit: 1000,
        effectiveFrom: "2021-01-01",
        effectiveTo: "2021-01-01",
        amenities: [
          {
            name: "AC",
            id: 1,
            type: "boolean",
            forProperty: false,
            quantity: 1
          }
        ],
        meterBox: "1",
        initialMeterReading: "1000" 
      },
    ]
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Flats")
    XLSX.writeFile(workbook, "flat_template.xlsx")
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <Label>Flat details</Label>
        <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center gap-4 text-center">
          <FileIcon className="w-10 h-10 text-gray-400" />

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={handleDownloadTemplate}
            >
              Download template
            </Button>

            <Button
              variant="default"
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              onClick={handleUploadClick}
              type="button"
            >
              {uploaded ? (
                <>
                  Uploaded <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Upload template <Upload className="w-4 h-4" />
                </>
              )}
            </Button>

            <input
              type="file"
              accept=".xlsx,.csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </>
  )
}
