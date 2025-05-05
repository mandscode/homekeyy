import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileIcon, Upload, CheckCircle } from "lucide-react"

interface FlatDetails {
  flatNo: string
  floor: number
  rooms: number
  baths: number
  status: FlatStatus
}

type FlatStatus = 'available' | 'notice' | 'occupied';

export default function FlatDetailsUpload({
  flats,
  setFlats,
}: {
  flats: FlatDetails[]
  setFlats: React.Dispatch<React.SetStateAction<FlatDetails[]>>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploaded, setUploaded] = useState(false)
  console.log(flats)
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      const jsonData = XLSX.utils.sheet_to_json<FlatDetails>(worksheet)
      setFlats(jsonData)
      setUploaded(true)
    }

    reader.readAsArrayBuffer(file)
  }

  const handleDownloadTemplate = () => {
    const sampleData: FlatDetails[] = [
      {
        flatNo: "101",
        floor: 1,
        rooms: 2,
        baths: 1,
        status: "available",
      },
    ]
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Flats")
    XLSX.writeFile(workbook, "flat_template.xlsx")
  }

  return (
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
  )
}
