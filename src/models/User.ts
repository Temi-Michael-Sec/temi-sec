import mongoose, { Schema, type Model } from "mongoose";

/**
 * The admin user.
 *
 * There is exactly one today — the site is single-author (PLAN.md §1). But it
 * is modelled as a real collection rather than an env-var credential so the
 * guest-author phase adds rows instead of replacing the auth mechanism. `role`
 * exists for the same reason: `admin` is the only value now, contributor/editor
 * roles slot in later without a migration.
 */

export type UserRole = "admin";

export interface UserDoc {
  email: string;
  passwordHash: string;
  role: UserRole;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // `select: false` keeps the hash out of every query result unless a caller
    // explicitly asks for it (`.select("+passwordHash")`), so it can never leak
    // through a DTO or a stray `.lean()` into a response.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["admin"], default: "admin" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "users" },
);

// Hot-reload safe, same reason as Post.ts: Next re-executes modules on save and
// a second `mongoose.model("User", …)` throws OverwriteModelError.
function registerModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}

export const User = registerModel<UserDoc>("User", userSchema);
