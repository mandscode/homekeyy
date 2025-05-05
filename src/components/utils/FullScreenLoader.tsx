// FullScreenLoader.tsx
import React from 'react';
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // if you're using ShadCN's utility function

const FullScreenLoader = () => {
    console.log("a")
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center w-screen h-screen bg-white">
        <Loader2 className={cn("h-12 w-12 animate-spin text-primary")} />
    </div>
  );
};

export default FullScreenLoader;
