import Image from "next/image";
import { Property } from "./PropertyList";

export const PropertyCard = ({ property }: { property: Property }) => {

    return (
        <div className="bg-white overflow-hidden">
          <Image
            src={property.images[0].url}
            alt={property.name}
            className="w-full h-48 object-cover rounded-2xl"
          />
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
    );
} 