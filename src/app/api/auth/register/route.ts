import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { registerSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  const limited = rateLimit(`register:${clientIp(request)}`, 8, 60 * 60 * 1000);
  if (!limited.ok) {
    return jsonError("Too many registration attempts. Try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Check your name, email, and password (8+ characters).", 422);
  }

  await dbConnect();
  const email = parsed.data.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    return jsonError("An account with this email already exists. Try signing in instead.", 409);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({
    name: parsed.data.name,
    email,
    passwordHash,
    role: "USER",
    accountStatus: "PENDING",
    isVerified: false,
    canPostResearch: false,
    authProviders: ["email"],
  });

  return jsonOk(
    {
      id: user._id.toString(),
      email: user.email,
      accountStatus: user.accountStatus,
      message: "Account created. An administrator must approve it before you can participate.",
    },
    201,
  );
}
