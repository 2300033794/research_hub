import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { INITIAL_CATEGORIES } from "../src/types";
import { Category } from "../src/models/Category";
import { User } from "../src/models/User";

loadEnvConfig(process.cwd());

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set.");
  }

  await mongoose.connect(uri);

  for (const category of INITIAL_CATEGORIES) {
    await Category.updateOne(
      { slug: category.slug },
      { $setOnInsert: { name: category.name, slug: category.slug, description: category.description, isActive: true } },
      { upsert: true },
    );
  }

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: "ResearchHub Admin",
          role: "ADMIN",
          accountStatus: "VERIFIED",
          isVerified: true,
          canPostResearch: true,
          authProviders: ["email"],
          passwordHash,
        },
        $setOnInsert: { email },
      },
      { upsert: true },
    );
    console.log(`Admin user ready: ${email}`);
  } else {
    console.log("Skipped admin user (set ADMIN_EMAIL and ADMIN_PASSWORD).");
  }

  console.log(`Seeded ${INITIAL_CATEGORIES.length} categories.`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
