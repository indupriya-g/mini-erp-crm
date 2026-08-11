"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const prismaClient_1 = __importDefault(require("./prismaClient"));
const auth_1 = __importDefault(require("./routes/auth"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const roleMiddleware_1 = require("./middleware/roleMiddleware");
const customers_1 = __importDefault(require("./routes/customers"));
const products_1 = __importDefault(require("./routes/products"));
const challans_1 = __importDefault(require("./routes/challans"));
// Create the Express application
const app = (0, express_1.default)();
// Allow our frontend to call this API
app.use((0, cors_1.default)());
// Allow Express to understand JSON
app.use(express_1.default.json());
app.use("/customers", customers_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Server is running"
    });
});
app.use("/challans", challans_1.default);
// Database test
app.get("/db-test", async (req, res) => {
    try {
        const userCount = await prismaClient_1.default.user.count();
        res.json({
            status: "ok",
            userCount
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "Database connection failed"
        });
    }
});
app.use("/auth", auth_1.default);
app.get("/protected", authMiddleware_1.authMiddleware, (req, res) => {
    const authReq = req;
    res.json({
        message: "You are authenticated!",
        user: authReq.user,
    });
});
app.use("/products", products_1.default);
app.get("/admin-only", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.requireRole)("ADMIN"), (req, res) => {
    res.json({
        message: "Welcome Admin! You have access to this route.",
    });
});
// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map