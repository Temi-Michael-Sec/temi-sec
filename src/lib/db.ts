import mongoose from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * Next's dev server re-executes modules on every save. A fresh
 * `mongoose.connect()` per reload exhausts the Atlas connection pool within
 * minutes of normal editing, so the connection promise is stashed on
 * `globalThis` — which survives hot reload, unlike module scope.
 */

const MONGODB_URI = process.env.MONGODB_URI;

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

  // Deliberately thrown at call time, not at module load. The app must boot
  // and serve static pages with MONGODB_URI unset — only DB-backed routes
  // should fail. Contrast with JWT_SECRET, which fails at boot on purpose.
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local — see .env.example.",
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
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
  return Boolean(MONGODB_URI);
}
