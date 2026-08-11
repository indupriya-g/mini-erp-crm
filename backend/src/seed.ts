import bcrypt from "bcrypt";
import prisma from "./prismaClient";

async function seed() {
  const password = "password123";

  const passwordHash = await bcrypt.hash(password, 10);

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
    await prisma.user.upsert({
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
    console.log(
      `  ${u.role}: ${u.email} / ${password}`
    );
  });
}

seed()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    prisma.$disconnect();
  });