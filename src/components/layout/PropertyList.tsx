"use client";

import React from "react";
import {PropertyCard} from "@components/layout/PropertyCard"
import { Card, CardContent } from "@/components/ui/card";

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/axios";
import apiEndpoints from "@/lib/apiEndpoints";

// const properties = [
//   {
//     id: 1,
//     name: "Phoenix Towers",
//     city: "Gurugram",
//     manager: "Charles Pugh",
//     imageUrl: "/property1.jpg"
//   },
//   {
//     id: 2,
//     name: "Phoenix Towers",
//     city: "Gurugram",
//     manager: "Charles Pugh",
//     imageUrl: "/property2.jpg"
//   },
//   {
//     id: 3,
//     name: "Phoenix Towers",
//     city: "Gurugram",
//     manager: "Charles Pugh",
//     imageUrl: "/property1.jpg"
//   },
//   {
//     id: 4,
//     name: "Phoenix Towers",
//     city: "Gurugram",
//     manager: "Charles Pugh",
//     imageUrl: "/property2.jpg"
//   },
//   {
//     id: 5,
//     name: "Phoenix Towers",
//     city: "Gurugram",
//     manager: "Charles Pugh",
//     imageUrl: "/property1.jpg"
//   },
//   {
//     id: 6,
//     name: "Phoenix Towers",
//     city: "Gurugram",
//     manager: "Charles Pugh",
//     imageUrl: "/property2.jpg"
//   }
// ];

interface PropertyImage {
    id: number;
    propertyId: number;
    url: string;
    alt: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    // Additional image metadata if available
    size?: number;
    type?: string;
}
export interface Property {
    id: number;
    name: string;
    address: string;
    city: string;
    state?: string; // Optional if not always present
    zip: string;
    country?: string; // Optional
    latitude: string | number; // Can handle both string and number formats
    longitude: string | number;
    ownerName: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    images: PropertyImage[];
    // Add other potential fields that might exist in your API
    // amenities?: Amenity[];
    // flats?: Flat[];
}
  
const PropertyList = () => {
    
    const fetchProperties = async () => {
        const res = await api.get(apiEndpoints.Property.endpoints.getAllProperties.path);

        return res.data.properties ?? [];
    };

    const { data: properties = [] } = useQuery({
        queryKey: ["properties"],
        queryFn: fetchProperties,
    });

  return (
    <Card className="rounded-lg border-none mt-6">
      <CardContent className="p-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {properties && properties.length > 0 ? properties.map((property:Property) => (
        <PropertyCard key={property.id} property={property} />
      ))
      :
      <div className="col-span-full text-center text-muted-foreground text-sm py-10">
      There are currently no active properties available. Please check back later.
    </div>
      }
    </div>
    </CardContent>
    </Card>
  );
};

export default PropertyList;
