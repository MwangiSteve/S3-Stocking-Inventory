/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProductStore } from "@/app/useProductStore";
import { useToast } from "@/hooks/use-toast";
// Replaced small field components with direct form inputs for Mali Mali fields
import { Product } from "@/app/types";

const ProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product Name is required")
    .max(100, "Product Name must be 100 characters or less"),
  family: z.string().min(1, "Family is required"),
  weightClass: z.string().min(1, "Weight Class is required"),
  size: z.string().min(1, "Size is required"),
  buyingPrice: z.number().nonnegative("Buying Price cannot be negative"),
  sellingPrice: z.number().nonnegative("Selling Price cannot be negative"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .nonnegative("Quantity cannot be negative"),
  lowStockAlert: z
    .number()
    .int("Low Stock Alert must be an integer")
    .nonnegative("Low Stock Alert cannot be negative"),
});

interface ProductFormData {
  name: string;
  family: string;
  weightClass: string;
  size: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockAlert: number;
}

interface AddProductDialogProps {
  allProducts: Product[];
  userId: string;
}

export default function AddProductDialog({
  allProducts,
  userId,
}: AddProductDialogProps) {
  const methods = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      family: "",
      weightClass: "",
      size: "",
      buyingPrice: 0,
      sellingPrice: 0,
      quantity: 0,
      lowStockAlert: 0,
    },
  });

  const { reset } = methods;

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Button loading state
  const dialogCloseRef = useRef<HTMLButtonElement | null>(null);

  const {
    isLoading,
    setOpenProductDialog,
    openProductDialog,
    setSelectedProduct,
    selectedProduct,
    addProduct,
    updateProduct,
    loadProducts,
    categories,
    suppliers,
  } = useProductStore();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedProduct) {
      reset({
        name: selectedProduct.name,
        family: selectedProduct.family || "",
        weightClass: selectedProduct.weightClass || "",
        size: selectedProduct.size || "",
        buyingPrice: selectedProduct.buyingPrice || 0,
        sellingPrice: selectedProduct.sellingPrice || 0,
        quantity: selectedProduct.quantity,
        lowStockAlert: selectedProduct.lowStockAlert || 0,
      });
      setSelectedCategory(selectedProduct.categoryId || "");
      setSelectedSupplier(selectedProduct.supplierId || "");
    } else {
      // Reset form to default values for adding a new product
      reset({
        name: "",
        family: "",
        weightClass: "",
        size: "",
        buyingPrice: 0,
        sellingPrice: 0,
        quantity: 0,
        lowStockAlert: 0,
      });
      setSelectedCategory("");
      setSelectedSupplier("");
    }
  }, [selectedProduct, openProductDialog, reset]);

  const calculateStatus = (quantity: number): string => {
    if (quantity > 20) return "Available";
    if (quantity > 0 && quantity <= 20) return "Stock Low";
    return "Stock Out";
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true); // Start loading
    const status: Product["status"] = data.quantity <= data.lowStockAlert ? "LOW_STOCK" : "IN_STOCK";

    try {
      if (!selectedProduct) {
        const newProduct = {
          name: data.name,
          family: data.family,
          weightClass: data.weightClass,
          size: data.size,
          buyingPrice: data.buyingPrice,
          sellingPrice: data.sellingPrice,
          quantity: data.quantity,
          lowStockAlert: data.lowStockAlert,
          categoryId: selectedCategory,
          supplierId: selectedSupplier,
        };

        const result = await addProduct(newProduct as any);

        if (result.success) {
          toast({
            title: "Product Created Successfully!",
            description: `"${data.name}" has been added to your inventory.`,
          });
          dialogCloseRef.current?.click();
          loadProducts();
          setOpenProductDialog(false);
        } else {
          toast({
            title: "Creation Failed",
            description: "Failed to create the product. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        const productToUpdate = {
          id: selectedProduct.id,
          name: data.name,
          family: data.family,
          weightClass: data.weightClass,
          size: data.size,
          buyingPrice: data.buyingPrice,
          sellingPrice: data.sellingPrice,
          quantity: data.quantity,
          lowStockAlert: data.lowStockAlert,
          status,
          categoryId: selectedCategory,
          supplierId: selectedSupplier,
          createdAt: new Date(selectedProduct.createdAt),
          userId: selectedProduct.userId,
        };

        const result = await updateProduct(productToUpdate as any);
        if (result.success) {
          toast({
            title: "Product Updated Successfully!",
            description: `"${data.name}" has been updated in your inventory.`,
          });
          loadProducts();
          setOpenProductDialog(false);
        } else {
          toast({
            title: "Update Failed",
            description: "Failed to update the product. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Operation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // When opening the dialog for adding a new product, clear any selected product
      setSelectedProduct(null);
    } else {
      // When closing the dialog, also clear the selected product to ensure clean state
      setSelectedProduct(null);
    }
    setOpenProductDialog(open);
  };

  return (
    <Dialog open={openProductDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 font-semibold">+Add Product</Button>
      </DialogTrigger>
      <DialogContent
        className="p-4 sm:p-7 sm:px-8 poppins max-h-[90vh] overflow-y-auto"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="text-[22px]">
            {selectedProduct ? "Update Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription id="dialog-description">
          Enter the details of the product below.
        </DialogDescription>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Product Name *
                </label>
                <input
                  {...methods.register("name")}
                  id="name"
                  type="text"
                  placeholder="Product name"
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {methods.formState.errors.name && (
                  <span className="text-red-500 text-xs">{methods.formState.errors.name.message}</span>
                )}
              </div>
              <div>
                <label htmlFor="family" className="block text-sm font-medium">
                  Family *
                </label>
                <input
                  {...methods.register("family")}
                  id="family"
                  type="text"
                  placeholder="e.g., Sufuria Family, General Items"
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {methods.formState.errors.family && (
                  <span className="text-red-500 text-xs">{methods.formState.errors.family.message}</span>
                )}
              </div>
              <div>
                <label htmlFor="weightClass" className="block text-sm font-medium">
                  Weight Class *
                </label>
                <select
                  {...methods.register("weightClass")}
                  id="weightClass"
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Weight Class</option>
                  <option value="Light">Light</option>
                  <option value="Medium">Medium</option>
                  <option value="Heavy">Heavy</option>
                </select>
                {methods.formState.errors.weightClass && (
                  <span className="text-red-500 text-xs">{methods.formState.errors.weightClass.message}</span>
                )}
              </div>
              <div>
                <label htmlFor="size" className="block text-sm font-medium">
                  Size *
                </label>
                <select
                  {...methods.register("size")}
                  id="size"
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Size</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                  <option value="22">22</option>
                  <option value="24">24</option>
                </select>
                {methods.formState.errors.size && (
                  <span className="text-red-500 text-xs">{methods.formState.errors.size.message}</span>
                )}
              </div>
              <div>
                <label htmlFor="buyingPrice" className="block text-sm font-medium">
                  Buying Price *
                </label>
                <input
                  {...methods.register("buyingPrice", { valueAsNumber: true })}
                  id="buyingPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {methods.formState.errors.buyingPrice && (
                  <span className="text-red-500 text-xs">{methods.formState.errors.buyingPrice.message}</span>
                )}
              </div>
              <div>
                <label htmlFor="sellingPrice" className="block text-sm font-medium">
                  Selling Price *
                </label>
                <input
                  {...methods.register("sellingPrice", { valueAsNumber: true })}
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {methods.formState.errors.sellingPrice && (
                  <span className="text-red-500 text-xs">{methods.formState.errors.sellingPrice.message}</span>
                )}
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium">
                  Quantity *
                </label>
                <input
                  {...methods.register("quantity", { valueAsNumber: true })}
                  id="quantity"
                  type="number"
                  placeholder="0"
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {methods.formState.errors.quantity && (
                  <span className="text-red-500 text-xs">{methods.formState.errors.quantity.message}</span>
                )}
              </div>
              <div>
                <label htmlFor="lowStockAlert" className="block text-sm font-medium">
                  Low Stock Alert *
                </label>
                <input
                  {...methods.register("lowStockAlert", { valueAsNumber: true })}
                  id="lowStockAlert"
                  type="number"
                  placeholder="0"
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {methods.formState.errors.lowStockAlert && (
                  <span className="text-red-500 text-xs">{methods.formState.errors.lowStockAlert.message}</span>
                )}
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium">
                  Supplier
                </label>
                <select
                  id="supplier"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="mt-1 h-11 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-4">
              <DialogClose asChild>
                <Button
                  ref={dialogCloseRef}
                  variant="secondary"
                  className="h-11 w-full sm:w-auto px-11"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-11 w-full sm:w-auto px-11"
                isLoading={isSubmitting} // Button loading effect
              >
                {isSubmitting
                  ? "Loading..."
                  : selectedProduct
                  ? "Update Product"
                  : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
