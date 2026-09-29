import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

export async function getDbUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  await dbConnect();
  return User.findById(session.user.id);
}

export async function requireDbUser() {
  const user = await getDbUser();
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return user;
}
