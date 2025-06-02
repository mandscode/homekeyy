"use client";

import React, { useState } from "react";
import {PropertyCard} from "@components/layout/PropertyCard"
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

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
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // Number of properties per page

    const fetchProperties = async () => {
        const res = await api.get(apiEndpoints.Property.endpoints.getAllProperties.path);
        return res.data.properties ?? [];
    };

    const { data: properties = [] } = useQuery({
        queryKey: ["properties"],
        queryFn: fetchProperties,
    });

    // Filter properties based on search query
    const filteredProperties = properties.filter((property: Property) =>
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProperties = filteredProperties.slice(startIndex, endIndex);

    // Reset to first page when search query changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <Card className="rounded-lg border-none mt-6">
            <CardContent className="p-6">
                {/* Property Count and Search Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="text-sm text-muted-foreground font-semibold">
                        {searchQuery ? (
                            <>
                                Showing {filteredProperties.length} of {properties.length} properties
                            </>
                        ) : (
                            `Total Properties: ${properties.length}`
                        )}
                    </div>
                    <div className="relative w-1/4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search properties by name, city or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
                    {currentProperties && currentProperties.length > 0 ? (
                        currentProperties.map((property: Property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-muted-foreground text-sm py-10">
                            {searchQuery ? (
                                "No properties found matching your search criteria."
                            ) : (
                                "There are currently no active properties available. Please check back later."
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious 
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    // Show first page, last page, current page, and pages around current page
                                    if (
                                        pageNumber === 1 ||
                                        pageNumber === totalPages ||
                                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                    ) {
                                        return (
                                            <PaginationItem key={pageNumber}>
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(pageNumber)}
                                                    isActive={currentPage === pageNumber}
                                                >
                                                    {pageNumber}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    } else if (
                                        pageNumber === currentPage - 2 ||
                                        pageNumber === currentPage + 2
                                    ) {
                                        return (
                                            <PaginationItem key={pageNumber}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }
                                    return null;
                                })}

                                <PaginationItem>
                                    <PaginationNext 
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PropertyList;
