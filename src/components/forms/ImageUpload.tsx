// components/forms/ImageUpload.tsx

"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Image as ImageIcon } from "lucide-react"

export default function ImageUpload({ onChange }: { onChange: (files: File[]) => void }) {
  const [files, setFiles] = useState<File[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    const fileArray = Array.from(fileList)
    
    setFiles(fileArray)
    onChange(fileArray)
  }

  return (
    <div className="space-y-2">

      <label
        htmlFor="image-upload"
        className={cn(
          "flex items-center justify-center h-40 w-full rounded-md border border-dashed border-gray-300 bg-gray-100 cursor-pointer"
        )}
      >
        <div className="text-gray-400 flex flex-col items-center">
          <ImageIcon size={40} />
          <span className="text-sm mt-1">Click or drag to upload</span>
        </div>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          className="hidden"
        />
      </label>

      {/* Optional file list preview */}
      {files.length > 0 && (
        <ul className="text-sm text-muted-foreground">
          {files.map((file, idx) => (
            <li key={idx}>{file.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
