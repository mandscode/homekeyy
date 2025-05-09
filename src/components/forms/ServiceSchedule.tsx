// components/forms/ServiceSchedule.tsx

"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { useQuery } from "@tanstack/react-query"

interface ScheduleItem {
  serviceType: string
  day: string
  startTime: string
  endTime: string
}

interface ServiceItem {
  id:number,
  type:string
}

interface Props {
  schedulesProps: ScheduleItem[]
  setSchedulesProps: React.Dispatch<React.SetStateAction<ScheduleItem[]>>
}

export default function ServiceSchedule({ schedulesProps, setSchedulesProps }: Props) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { serviceType: "", day: "", startTime: "", endTime: "" },
  ])
  console.log(schedulesProps)
  const updateSchedule = (index: number, field: keyof ScheduleItem, value: string) => {
    const newSchedules = [...schedules]
    newSchedules[index][field] = value
    setSchedules(newSchedules)

    setSchedulesProps(newSchedules)
  }

  const addSchedule = () => {
    setSchedules([...schedules, { serviceType: "", day: "", startTime: "", endTime: "" }])

    setSchedulesProps([...schedules, { serviceType: "", day: "", startTime: "", endTime: "" }])
  }

  const handleEndTimeChange = (index: number, value: string) => {
    // Validate if endTime is after startTime
    const startTime = schedules[index].startTime;
    if (value < startTime) {
      alert("End time must be later than start time.");
      return; // Do not update if validation fails
    }

    updateSchedule(index, "endTime", value);
  };

  const fetchServices = async () => {
    const res = await api.get("/services");
  
    // Ensure you return an array or default to an empty array
    return res.data.services ?? [];
  };

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });
  return (
    <div className="space-y-3">
        <div className="flex flex-col gap-3">
            <div className="flex justify-between">
            <Label>Service Schedule</Label>
            <Button type="button" onClick={addSchedule} variant="destructive" size="sm">Add more</Button>
            </div>
            <div className="flex items-center justify-between">
                <div className="grid grid-cols-3 w-full gap-2 rounded-md text-sm text-gray-600 font-semibold">
                <span className="bg-gray-100 p-2 text-center rounded-sm">Service</span>
                <span className="bg-gray-100 p-2 text-center rounded-sm">Day</span>
                <div className="bg-gray-100 p-2 text-center rounded-sm">Availability</div>
                </div>
                {/* <Button onClick={addSchedule} variant="destructive" size="sm">Add more</Button> */}
            </div>
        </div>

      {schedules.map((item, index) => (
        <div key={index} className="grid grid-cols-3 gap-2 items-center">
          {/* Service type select */}
          <Select
            value={item.serviceType}
            onValueChange={(val) => updateSchedule(index, "serviceType", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Service type" />
            </SelectTrigger>
            <SelectContent>
              {
                services.length > 0 && services.map((s:ServiceItem, idx:number) => (
                  <SelectItem value={s.id.toString()} key={idx}>{s.type}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>

          {/* Day select */}
          <Select
            value={item.day}
            onValueChange={(val) => updateSchedule(index, "day", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Days" />
            </SelectTrigger>
            <SelectContent>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                </SelectContent>
            </Select>

          {/* Time range */}
          <div className="flex gap-1">
            <Input
              type="time"
              value={item.startTime}
              onChange={(e) => updateSchedule(index, "startTime", e.target.value)}
            />
            <Input
              type="time"
              value={item.endTime}
              onChange={(e) => handleEndTimeChange(index, e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}