import Image from "next/image";
import { Property } from "./PropertyList";
import FullScreenLoader from "../utils/FullScreenLoader";
import Link from "next/link";

export const PropertyCard = ({ property }: { property: Property }) => {


  function cleanImageUrl(url: string): string {
    try {
      // Remove unwanted whitespace and encode only the path part
      const parsedUrl = new URL(url.trim());
      const cleanPath = parsedUrl.pathname.replace(/\s/g, "%20");
      return `${parsedUrl.origin}${cleanPath}`;
    } catch {
      return "/placeholder.jpg"; // fallback
    }
  }
  const rawUrl = property.images?.[0]?.url || "";
  const imageUrl = cleanImageUrl(rawUrl);

  return (
    <>
      {
        property.name ?
        <Link href={`/properties/details/${property.id}`}>
          <div className="bg-white overflow-hidden">
            {property.images?.length > 0 && property.images[0]?.url ? (
              <Image
                src={imageUrl}
                alt={property.name || 'Property image'}
                className="w-full h-[170px] object-cover"
                width={100}
                height={170}
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                }}
                unoptimized
              />
            ) : (
              <Image
                src="/placeholder.jpg"
                alt="Placeholder image"
                className="w-full h-[170px] object-cover"
                width={100}
                height={170}
                priority
              />
            )}

            <div className="p-4">
              <h3 className="text-lg font-semibold">{property.name}</h3>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500">City</span><br />
                  <span className="text-black font-semibold">{property.city}</span>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <span className="text-gray-500">Property manager</span><br />
                  <span className="text-black font-semibold underline cursor-pointer">
                    {property.ownerName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        :
        <FullScreenLoader/>
      }
    </>
  );
} 