import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const createProduct = async (
  data: Prisma.ProductCreateInput
) => {
  return prisma.product.create({
    data,
  });
};

export const getProductsByUser = async (userId: string) => {
  return prisma.product.findMany({
    where: { userId },
  });
};

export const updateProduct = async (
  id: string,
  data: Prisma.ProductUpdateInput
) => {
  return prisma.product.update({
    where: { id },
    data,
  });
};

export const deleteProduct = async (id: string) => {
  return prisma.product.delete({
    where: { id },
  });
};
