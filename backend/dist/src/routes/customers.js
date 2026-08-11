"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Every customer route requires JWT authentication
router.use(authMiddleware_1.authMiddleware);
// GET /customers?search=&status=&page=1&limit=20
// Get customers with search, filtering and pagination
router.get("/", async (req, res) => {
    try {
        const { search, status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const where = {};
        // Filter by status
        if (status) {
            where.status = status;
        }
        // Search by name, mobile or email
        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    mobile: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    email: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ];
        }
        const [customers, total] = await Promise.all([
            prismaClient_1.default.customer.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prismaClient_1.default.customer.count({
                where,
            }),
        ]);
        res.json({
            data: customers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch customers",
        });
    }
});
// GET /customers/:id
// Get one customer including follow-ups
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            return res.status(400).json({
                message: "Invalid customer ID",
            });
        }
        const customer = await prismaClient_1.default.customer.findUnique({
            where: {
                id,
            },
            include: {
                followUps: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });
        if (!customer) {
            return res.status(404).json({
                message: "Customer not found",
            });
        }
        res.json(customer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch customer",
        });
    }
});
// POST /customers
// Create a customer
router.post("/", async (req, res) => {
    try {
        const { name, mobile, email, businessName, gstNumber, customerType, address, } = req.body;
        if (!name || !mobile || !customerType) {
            return res.status(400).json({
                message: "name, mobile, and customerType are required",
            });
        }
        const validTypes = ["RETAIL", "WHOLESALE", "DISTRIBUTOR"];
        if (!validTypes.includes(customerType)) {
            return res.status(400).json({
                message: "customerType must be RETAIL, WHOLESALE, or DISTRIBUTOR",
            });
        }
        const customer = await prismaClient_1.default.customer.create({
            data: {
                name,
                mobile,
                email,
                businessName,
                gstNumber,
                customerType,
                address,
            },
        });
        res.status(201).json(customer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to create customer",
        });
    }
});
// PUT /customers/:id
// Update a customer
router.put("/:id", async (req, res) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            return res.status(400).json({
                message: "Invalid customer ID",
            });
        }
        const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes, } = req.body;
        const customer = await prismaClient_1.default.customer.update({
            where: {
                id,
            },
            data: {
                name,
                mobile,
                email,
                businessName,
                gstNumber,
                customerType,
                address,
                status,
                followUpDate,
                notes,
            },
        });
        res.json(customer);
    }
    catch (error) {
        console.error(error);
        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Customer not found",
            });
        }
        res.status(500).json({
            message: "Failed to update customer",
        });
    }
});
// POST /customers/:id/follow-ups
// Add a follow-up note
router.post("/:id/follow-ups", async (req, res) => {
    try {
        const customerId = parseInt(String(req.params.id), 10);
        const { note } = req.body;
        if (isNaN(customerId)) {
            return res.status(400).json({
                message: "Invalid customer ID",
            });
        }
        if (!note) {
            return res.status(400).json({
                message: "note is required",
            });
        }
        const customer = await prismaClient_1.default.customer.findUnique({
            where: {
                id: customerId,
            },
        });
        if (!customer) {
            return res.status(404).json({
                message: "Customer not found",
            });
        }
        const followUp = await prismaClient_1.default.followUp.create({
            data: {
                note,
                customerId,
                createdBy: `User #${req.user.userId}`,
            },
        });
        res.status(201).json(followUp);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to add follow-up",
        });
    }
});
exports.default = router;
//# sourceMappingURL=customers.js.map