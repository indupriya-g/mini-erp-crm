"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
// GET /products?search=&lowStock=true&page=1&limit=20
router.get("/", async (req, res) => {
    try {
        const { search, lowStock } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ];
        }
        const [products, total] = await Promise.all([
            prismaClient_1.default.product.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: "asc" },
            }),
            prismaClient_1.default.product.count({ where }),
        ]);
        // lowStock filter is applied after fetching, since it compares two columns
        // (currentStock vs minStockAlert) which Prisma's basic "where" can't do directly
        const filtered = lowStock === "true"
            ? products.filter((p) => p.currentStock <= p.minStockAlert)
            : products;
        res.json({
            data: filtered,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
});
// GET /products/:id/stock-movements
router.get("/:id/stock-movements", async (req, res) => {
    try {
        const productId = parseInt(String(req.params.id), 10);
        const movements = await prismaClient_1.default.stockMovement.findMany({
            where: { productId },
            orderBy: { createdAt: "desc" },
        });
        res.json(movements);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch stock movements" });
    }
});
// POST /products  (add product)
router.post("/", async (req, res) => {
    try {
        const { name, sku, category, unitPrice, minStockAlert, location } = req.body;
        if (!name || !sku || unitPrice === undefined) {
            return res.status(400).json({ message: "name, sku, and unitPrice are required" });
        }
        const product = await prismaClient_1.default.product.create({
            data: {
                name,
                sku,
                category,
                unitPrice,
                minStockAlert: minStockAlert || 0,
                location,
            },
        });
        res.status(201).json(product);
    }
    catch (error) {
        // Prisma error code for "unique constraint failed" (duplicate SKU)
        if (error.code === "P2002") {
            return res.status(400).json({ message: "A product with this SKU already exists" });
        }
        console.error(error);
        res.status(500).json({ message: "Failed to create product" });
    }
});
// PUT /products/:id  (edit product)
router.put("/:id", async (req, res) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { name, category, unitPrice, minStockAlert, location } = req.body;
        const product = await prismaClient_1.default.product.update({
            where: { id },
            // Note: currentStock is deliberately NOT editable here directly —
            // it should only ever change via a stock movement, never a direct edit.
            data: { name, category, unitPrice, minStockAlert, location },
        });
        res.json(product);
    }
    catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Product not found" });
        }
        console.error(error);
        res.status(500).json({ message: "Failed to update product" });
    }
});
// POST /products/:id/stock-movements  (manual stock IN/OUT, e.g. restock)
router.post("/:id/stock-movements", async (req, res) => {
    try {
        const productId = parseInt(String(req.params.id), 10);
        const { quantity, type, reason } = req.body;
        if (!quantity || !type || !reason) {
            return res.status(400).json({ message: "quantity, type, and reason are required" });
        }
        if (!["IN", "OUT"].includes(type)) {
            return res.status(400).json({ message: "type must be IN or OUT" });
        }
        if (quantity <= 0) {
            return res.status(400).json({ message: "quantity must be greater than 0" });
        }
        const product = await prismaClient_1.default.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        // Prevent stock from going negative on a manual OUT movement too
        if (type === "OUT" && product.currentStock < quantity) {
            return res.status(400).json({
                message: `Insufficient stock. Current stock is ${product.currentStock}, requested ${quantity}`,
            });
        }
        const stockChange = type === "IN" ? quantity : -quantity;
        // A TRANSACTION: both of these operations succeed together, or
        // neither happens at all. We'll explain this in depth in the
        // Challan stage where it matters even more — same idea here.
        const [updatedProduct, movement] = await prismaClient_1.default.$transaction([
            prismaClient_1.default.product.update({
                where: { id: productId },
                data: { currentStock: { increment: stockChange } },
            }),
            prismaClient_1.default.stockMovement.create({
                data: {
                    productId,
                    quantity,
                    type,
                    reason,
                    createdBy: `User #${req.user.userId}`,
                },
            }),
        ]);
        res.status(201).json({ product: updatedProduct, movement });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to record stock movement" });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map