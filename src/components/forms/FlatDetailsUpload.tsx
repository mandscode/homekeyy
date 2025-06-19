"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { FileIcon, Upload, CheckCircle } from "lucide-react";
import { Amenities } from "./FlatsUpload";
import api from "@/lib/axios";

interface ExcelFlatDetails {
  flatNo: string;
  floor: string;
  rooms: string;
  baths: string;
  status: string;
  block: string;
  sqft: string;
  parkingNumber: string;
  gasConnection: string;
  powerBackup: string;
  entityId: string;
  amenities: string;
  meterBox: string;
  initialMeterReading: string;
  rentAmount: string;
  securityDeposit: string;
  rentalType: string;
  effectiveFrom: string;
  effectiveTo: string;
  meterType: string;
}

interface FlatDetails {
  flatNo: string;
  floor: number;
  rooms: number;
  baths: number;
  status: FlatStatus;
  block: string;
  sqft: number;
  parkingNumber: string;
  gasConnection: boolean;
  powerBackup: boolean;
  amenities: Amenities[];
  meterBox: string;
  initialMeterReading: string;
  rentAmount: number;
  securityDeposit: number;
  rentalType: 'yearly' | 'monthly';
  effectiveFrom: string;
  effectiveTo: string;
  meterType: string;
}

type FlatStatus = 'AVAILABLE' | 'BOOKED' | 'OCCUPIED' | 'NOTICE_PERIOD';

interface FlatDetailsUploadProps {
  onFlatsUploaded: (flats: FlatDetails[]) => void;
}

export function FlatDetailsUpload({ onFlatsUploaded }: FlatDetailsUploadProps) {
  const [amenities, setAmenities] = useState<Amenities[]>([]);
  const [uploaded, setUploaded] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchFlats = async () => {
      const resAmenities = await api.get(`/web/amenity`);
      setAmenities(resAmenities.data.amenities)
    }
    fetchFlats()
  }, [])

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

        const jsonData = XLSX.utils.sheet_to_json<ExcelFlatDetails>(worksheet);
        
        // Validate required fields
        const requiredFields = ['flatNo', 'floor', 'rooms', 'baths', 'status', 'block', 'sqft', 'rentAmount', 'securityDeposit', 'effectiveFrom', 'effectiveTo', 'meterBox', 'initialMeterReading'];
        const missingFields = jsonData.some(flat => 
          requiredFields.some(field => !flat[field as keyof ExcelFlatDetails])
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
            gasConnection: flat.gasConnection?.toString() === 'true' ? true : false,
            powerBackup: flat.powerBackup?.toString() === 'true' ? true : false,
            rentalType: flat.rentalType?.toLowerCase(),
            meterType: flat.meterType?.toUpperCase(),
            block: flat.block?.toUpperCase(),
            parkingNumber: flat.parkingNumber?.toString(),
            sqft: parseInt(flat.sqft?.toString() || '0'),
            rooms: parseInt(flat.rooms?.toString() || '0'),
            baths: parseInt(flat.baths?.toString() || '0'),
            meterBox: flat.meterBox?.toString() || '',
            initialMeterReading: flat.initialMeterReading?.toString() || '0',
            status: flat.status?.toString() as FlatStatus || 'AVAILABLE',
            rentAmount: parseInt(flat.rentAmount?.toString() || '0'),
            securityDeposit: parseInt(flat.securityDeposit?.toString() || '0'),
            effectiveFrom: flat.effectiveFrom?.toString() || '',
            effectiveTo: flat.effectiveTo?.toString() || '',
            amenities: validFlatAmenities,
          } as FlatDetails;
        });
        setUploaded(true);
        onFlatsUploaded(validatedData);
        
        toast({
          title: "Success",
          description: "Excel file uploaded successfully",
        });
      } catch (error) {
        console.log(error);
        toast({
          title: "Error",
          description: "Failed to process Excel file",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const sampleData: FlatDetails[] = [
      {
        flatNo: "101",
        floor: 1,
        rooms: 2,
        baths: 1,
        status: "AVAILABLE",
        block: "",
        sqft: 0,
        parkingNumber: "",
        gasConnection: false,
        powerBackup: false,
        amenities: [],
        meterBox: "",
        initialMeterReading: "",
        rentAmount: 0,
        securityDeposit: 0,
        rentalType: "monthly",
        effectiveFrom: "",
        effectiveTo: "",
        meterType: "MAIN",
      },
    ]
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Flats")
    XLSX.writeFile(workbook, "flat_template.xlsx")
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Upload Flat Details Excel</Label>
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
    </div>
  );
}
