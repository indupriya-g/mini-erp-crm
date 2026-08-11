import prisma from "../prismaClient";

// Generates challan numbers like CH-0001, CH-0002, ...
export async function generateChallanNumber(): Promise<string> {
  const count = await prisma.challan.count();
  const nextNumber = count + 1;
  return `CH-${String(nextNumber).padStart(4, "0")}`;
}