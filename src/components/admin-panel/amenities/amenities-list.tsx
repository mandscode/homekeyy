"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

const amenitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["number", "boolean"]),
  forProperty: z.boolean(),
});

type Amenity = {
  id: number;
  name: string;
  type: "number" | "boolean";
  forProperty: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function AmenitiesList() {
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof amenitySchema>>({
    resolver: zodResolver(amenitySchema),
    defaultValues: {
      name: "",
      type: "boolean",
      forProperty: false,
    },
  });

  const fetchAmenities = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/web/amenity");
      setAllAmenities(response.data.amenities);
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to fetch amenities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

  const onSubmit = async (data: z.infer<typeof amenitySchema>) => {
    try {
      setIsLoading(true);
      const response = await api.post("/web/amenity", data);
      setAllAmenities([...allAmenities, response.data]);
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Amenity created successfully",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to create amenity",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAmenity = async (id: number) => {
    try {
      setIsLoading(true);
      await api.delete(`/web/amenity/${id}`);
      setAllAmenities(allAmenities.filter((amenity) => amenity.id !== id));
      toast({
        title: "Success",
        description: "Amenity deleted successfully",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to delete amenity",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(allAmenities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAmenities = allAmenities.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Amenities</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Amenity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Amenity</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Enter amenity name"
                  disabled={isLoading}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("type", value as "number" | "boolean")
                  }
                  defaultValue={form.getValues("type")}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="forProperty"
                  checked={form.watch("forProperty")}
                  onCheckedChange={(checked) =>
                    form.setValue("forProperty", checked)
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="forProperty">Only for Property</Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Amenity"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>For Property</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentAmenities.map((amenity) => (
            <TableRow key={amenity.id}>
              <TableCell>{amenity.name}</TableCell>
              <TableCell className="capitalize">{amenity.type}</TableCell>
              <TableCell>{amenity.forProperty ? "Yes" : "No"}</TableCell>
              <TableCell>
                {new Date(amenity.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAmenity(amenity.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, allAmenities.length)} of {allAmenities.length} amenities
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 