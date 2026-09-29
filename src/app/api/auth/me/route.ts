import { jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/require-user";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return jsonOk({ user: null });
  }
  const result = await requireUser();
  if ("error" in result) {
    return jsonOk({ user: null });
  }
  const user = result.user;
  return jsonOk({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      isVerified: user.isVerified,
      canPostResearch: user.canPostResearch,
      profileImage: user.profileImage,
      bio: user.bio,
      institution: user.institution,
      researchInterests: user.researchInterests,
      authProviders: user.authProviders,
      createdAt: user.createdAt,
    },
  });
}
