"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = __importDefault(require("./prismaClient"));
async function seed() {
    const password = "password123";
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const users = [
        {
            name: "Admin User",
            email: "admin@test.com",
            role: "ADMIN"
        },
        {
            name: "Sales User",
            email: "sales@test.com",
            role: "SALES"
        },
        {
            name: "Warehouse User",
            email: "warehouse@test.com",
            role: "WAREHOUSE"
        },
        {
            name: "Accounts User",
            email: "accounts@test.com",
            role: "ACCOUNTS"
        }
    ];
    for (const user of users) {
        await prismaClient_1.default.user.upsert({
            where: {
                email: user.email
            },
            update: {},
            create: {
                name: user.name,
                email: user.email,
                passwordHash,
                role: user.role
            }
        });
    }
    console.log("Seed complete. Test users created:");
    users.forEach((u) => {
        console.log(`  ${u.role}: ${u.email} / ${password}`);
    });
}
seed()
    .catch((e) => {
    console.error(e);
})
    .finally(() => {
    prismaClient_1.default.$disconnect();
});
//# sourceMappingURL=seed.js.map