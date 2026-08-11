import { Router, Response } from "express";
import prisma from "../prismaClient";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { generateChallanNumber } from "../utils/generateChallanNumber";

const router = Router();
router.use(authMiddleware);

// GET /challans?status=&page=1&limit=20
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where: any = {};
    if (status) where.status = status;

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { customer: true, items: true },
      }),
      prisma.challan.count({ where }),
    ]);

    res.json({
      data: challans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch challans" });
  }
});

// GET /challans/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!challan) {
      return res.status(404).json({ message: "Challan not found" });
    }

    res.json(challan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch challan" });
  }
});

// POST /challans  (create as DRAFT or CONFIRMED directly)
// Body shape:
// {
//   customerId: 1,
//   status: "DRAFT" | "CONFIRMED",
//   items: [ { productId: 1, quantity: 5 }, { productId: 2, quantity: 3 } ]
// }
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, status, items } = req.body;

    // ----- Step 1: basic input validation -----
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "customerId and at least one item are required" });
    }

    const finalStatus = status === "CONFIRMED" ? "CONFIRMED" : "DRAFT";

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: "Each item needs a valid productId and quantity > 0" });
      }
    }

    // ----- Step 2: make sure the customer actually exists -----
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // ----- Step 3: fetch all products involved, in one go -----
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Make sure every productId the user sent actually exists
    if (products.length !== productIds.length) {
      return res.status(400).json({ message: "One or more products not found" });
    }

    // Quick lookup map: productId -> product, so we don't search the array repeatedly
    const productMap = new Map(products.map((p) => [p.id, p]));

    // ----- Step 4: if CONFIRMED, validate stock for EVERY item BEFORE changing anything -----
    if (finalStatus === "CONFIRMED") {
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        if (product.currentStock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`,
          });
        }
      }
    }

    const challanNumber = await generateChallanNumber();
    const totalQuantity = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

    // ----- Step 5: build the snapshot data for each item -----
    const itemsData = items.map((item: any) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: item.productId,
        quantity: item.quantity,
        productName: product.name,
        productSku: product.sku,
        unitPrice: product.unitPrice,
      };
    });

    // ----- Step 6: everything happens in ONE transaction -----
    const result = await prisma.$transaction(async (tx) => {
      // Create the challan + its items together (nested write)
      const challan = await tx.challan.create({
        data: {
          challanNumber,
          status: finalStatus,
          totalQuantity,
          customerId,
          createdBy: `User #${req.user!.userId}`,
          items: { create: itemsData },
        },
        include: { items: true, customer: true },
      });

      // Only if CONFIRMED: deduct stock + log a movement, for each item
      if (finalStatus === "CONFIRMED") {
        for (const item of items) {
          const product = productMap.get(item.productId)!;

          // Re-check stock INSIDE the transaction — this closes the race-condition gap
          // described earlier. If another confirmed challan snuck in between our
          // earlier check and now, this catches it and the whole transaction aborts.
          const freshProduct = await tx.product.findUnique({ where: { id: product.id } });
          if (!freshProduct || freshProduct.currentStock < item.quantity) {
            // Throwing inside a transaction causes Prisma to roll back everything
            throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
          }

          await tx.product.update({
            where: { id: product.id },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: product.id,
              quantity: item.quantity,
              type: "OUT",
              reason: `Sold via challan ${challanNumber}`,
              createdBy: `User #${req.user!.userId}`,
            },
          });
        }
      }

      return challan;
    });

    res.status(201).json(result);
  } catch (error: any) {
    // Catch our custom race-condition error and turn it into a clean 400
    if (typeof error.message === "string" && error.message.startsWith("INSUFFICIENT_STOCK:")) {
      const productName = error.message.split(":")[1];
      return res.status(400).json({
        message: `Insufficient stock for "${productName}" (stock changed during processing). Please try again.`,
      });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create challan" });
  }
});

// PUT /challans/:id/confirm  (confirm a DRAFT challan)
router.put("/:id/confirm", async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ message: "Challan not found" });
    }
    if (challan.status !== "DRAFT") {
      return res.status(400).json({ message: `Only DRAFT challans can be confirmed. This challan is ${challan.status}` });
    }

    // Validate stock for every item first, same logic as during creation
    for (const item of challan.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.currentStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${item.productName}". Available: ${product?.currentStock ?? 0}, Requested: ${item.quantity}`,
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of challan.items) {
        const freshProduct = await tx.product.findUnique({ where: { id: item.productId } });
        if (!freshProduct || freshProduct.currentStock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${item.productName}`);
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: "OUT",
            reason: `Sold via challan ${challan.challanNumber}`,
            createdBy: `User #${req.user!.userId}`,
          },
        });
      }

      return tx.challan.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: { items: true, customer: true },
      });
    });

    res.json(updated);
  } catch (error: any) {
    if (typeof error.message === "string" && error.message.startsWith("INSUFFICIENT_STOCK:")) {
      const productName = error.message.split(":")[1];
      return res.status(400).json({
        message: `Insufficient stock for "${productName}" (stock changed since draft was created). Please try again.`,
      });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to confirm challan" });
  }
});

export default router;