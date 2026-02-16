
//import { ReactNode } from "react";

// Define the Product interface
export interface Product {
  id: string;
  name: string;
  family?: string;
  weightClass?: string;
  size?: string;
  buyingPrice?: number;
  sellingPrice?: number;
  quantity: number;
  lowStockAlert?: number;
  status?: string;
  createdAt: Date;
  userId: string;
  categoryId: string;
  supplierId?: string;
  category?: string;
  supplier?: string;
  // Deprecated fields: sku and price removed for Mali Mali product model
}

// Define the Supplier interface
export interface Supplier {
  id: string;
  name: string;
  userId: string;
}

// Define the Category interface
export interface Category {
  id: string;
  name: string;
  userId: string;
}

//import { ReactNode } from "react";

// Define the Product interface
export interface Product {
  id: string;
  name: string;
  family?: string;
  weightClass?: string;
  size?: string;
  buyingPrice?: number;
  sellingPrice?: number;
  quantity: number;
  lowStockAlert?: number;
  status?: string;
  createdAt: Date;
  userId: string;
  categoryId: string;
  supplierId?: string;
  category?: string;
  supplier?: string;
  sku?: string;
  price?: number;
}

// Define the Supplier interface
export interface Supplier {
  id: string;
  name: string;
  userId: string;
}

// Define the Category interface
export interface Category {
  id: string;
  name: string;
  userId: string;
}

