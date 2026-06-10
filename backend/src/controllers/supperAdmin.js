

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/userSchema");
const connectDB = require("../config/connectDB");

// ─── Super Admin Data ─────────────────────────────────────────

const SUPER_ADMIN = {
  name: "Titu Sarkar",
  email: "titu17940@gmail.com",
  password: "Admin@Titu@1234",   
  role: "admin",
  isEmailVerified: true,
  isActive: true,
};

// ─── Colors for terminal output ───────────────────────────────
const c = {
  green:  (t) => `\x1b[32m${t}\x1b[0m`,
  red:    (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan:   (t) => `\x1b[36m${t}\x1b[0m`,
  bold:   (t) => `\x1b[1m${t}\x1b[0m`,
};

// ─── Seed admin ───────────────────────────────────────────────
const seedAdmin = async () => {
  await connectDB();

  console.log(c.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(c.bold("   Running Admin Seeder..."));
  console.log(c.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  // Check if admin already exists
  const existing = await User.findOne({ email: SUPER_ADMIN.email });

  if (existing) {
    console.log(c.yellow(`  Admin already exists: ${existing.email}`));
    console.log(c.yellow("   Skipping seed. Use --delete flag to reset.\n"));
    process.exit(0);
  }

  // Create the super admin
  const admin = await User.create(SUPER_ADMIN);

  console.log(c.green("Super Admin created successfully!\n"));
  console.log(c.bold("  Credentials:"));
  console.log(`   Email    : ${c.cyan(admin.email)}`);
  console.log(`   Password : ${c.cyan(SUPER_ADMIN.password)}`);
  console.log(`   Role     : ${c.cyan(admin.role)}`);
  console.log(`   ID       : ${c.cyan(admin._id)}\n`);
  console.log(c.red("    IMPORTANT: Change your password after first login!\n"));
  console.log(c.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  process.exit(0);
};

// ─── Delete admin ─────────────────────────────────────────────
const deleteAdmin = async () => {
  await connectDB();

  console.log(c.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(c.bold(" Deleting Admin..."));
  console.log(c.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  const result = await User.deleteOne({ email: SUPER_ADMIN.email });

  if (result.deletedCount === 0) {
    console.log(c.yellow(`  No admin found with email: ${SUPER_ADMIN.email}\n`));
  } else {
    console.log(c.green(` Admin deleted: ${SUPER_ADMIN.email}\n`));
  }

  process.exit(0);
};

// ─── Run based on flag ────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes("--delete")) {
  deleteAdmin().catch((err) => {
    console.error(c.red(" Seeder Error:"), err.message);
    process.exit(1);
  });
} else {
  seedAdmin().catch((err) => {
    console.error(c.red(" Seeder Error:"), err.message);
    process.exit(1);
  });
}