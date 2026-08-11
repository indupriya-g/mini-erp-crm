"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChallanNumber = generateChallanNumber;
const prismaClient_1 = __importDefault(require("../prismaClient"));
// Generates challan numbers like CH-0001, CH-0002, ...
async function generateChallanNumber() {
    const count = await prismaClient_1.default.challan.count();
    const nextNumber = count + 1;
    return `CH-${String(nextNumber).padStart(4, "0")}`;
}
//# sourceMappingURL=generateChallanNumber.js.map