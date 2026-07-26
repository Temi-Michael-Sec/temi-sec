import mongoose from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * Next's dev server re-executes modules on every save. A fresh
 * `mongoose.connect()` per reload exhausts the Atlas connection pool within
 * minutes of normal editing, so the connection promise is stashed on
 * `globalThis` — which survives hot reload, unlike module scope.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis._mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  // Read at call time, not module load. Two reasons:
  //   1. The app must boot and serve static pages with MONGODB_URI unset — only
  //      DB-backed routes should fail. (Contrast JWT_SECRET, which fails at boot
  //      on purpose.)
  //   2. A module-load capture races env loaders. A script that calls
  //      loadEnvConfig() at top level runs it AFTER its imports are evaluated,
  //      so a captured value would be undefined. Reading here avoids that trap.
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local — see .env.example.",
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Clear the rejected promise so the next request retries instead of
    // replaying the same failure forever.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}
