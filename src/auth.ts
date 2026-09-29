import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { dbConnect } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { User } from "@/models/User";

async function hydrateToken(token: { email?: string | null; [key: string]: unknown }) {
  if (!token.email) return token;
  await dbConnect();
  const dbUser = await User.findOne({ email: token.email.toLowerCase() });
  if (!dbUser) {
    token.id = undefined;
    return token;
  }
  token.id = dbUser._id.toString();
  token.role = dbUser.role;
  token.accountStatus = dbUser.accountStatus;
  token.canPostResearch = dbUser.canPostResearch;
  token.isVerified = dbUser.isVerified;
  token.name = dbUser.name;
  token.picture = dbUser.profileImage || token.picture;
  return token;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await dbConnect();
        const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        if (user.accountStatus === "REJECTED") {
          throw new Error("Your account was rejected by an administrator.");
        }

        user.lastLogin = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.profileImage || undefined,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase();
      if (!email) return false;

      await dbConnect();
      const existing = await User.findOne({ email });

      if (existing) {
        if (existing.accountStatus === "REJECTED") {
          return "/login?error=rejected";
        }
        if (!existing.authProviders.includes("google")) {
          existing.authProviders.push("google");
        }
        existing.googleAccountId = account.providerAccountId;
        if (!existing.profileImage && user.image) {
          existing.profileImage = user.image;
        }
        if (!existing.name && user.name) {
          existing.name = user.name;
        }
        existing.lastLogin = new Date();
        await existing.save();
        return true;
      }

      await User.create({
        name: user.name || "Google User",
        email,
        passwordHash: null,
        role: "USER",
        accountStatus: "PENDING",
        isVerified: false,
        canPostResearch: false,
        profileImage: user.image || "",
        authProviders: ["google"],
        googleAccountId: account.providerAccountId,
        lastLogin: new Date(),
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return hydrateToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as "ADMIN" | "USER") || "USER";
        session.user.accountStatus =
          (token.accountStatus as
            | "PENDING"
            | "APPROVED"
            | "VERIFIED"
            | "SUSPENDED"
            | "REJECTED") || "PENDING";
        session.user.canPostResearch = Boolean(token.canPostResearch);
        session.user.isVerified = Boolean(token.isVerified);
        session.user.name = (token.name as string) || session.user.name;
        session.user.image = (token.picture as string) || session.user.image;
      }
      return session;
    },
  },
});
