import { NextRequest } from "next/server";
import { dbConnect, hasMongoUri } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { categorySchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/require-user";
import { slugify } from "@/lib/http";
import { logAdminAction } from "@/lib/audit";
import { Category } from "@/models/Category";

export async function GET() {
  await dbConnect();
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  return jsonOk({ categories });
}

export async function POST(request: NextRequest) {
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid category.", 422);

  await dbConnect();
  const slug = slugify(parsed.data.name);
  const exists = await Category.findOne({ $or: [{ slug }, { name: parsed.data.name }] });
  if (exists) return jsonError("A category with this name already exists.", 409);

  const category = await Category.create({ ...parsed.data, slug });
  await logAdminAction({
    adminId: access.user._id,
    action: "CATEGORY_CREATED",
    details: category.name,
  });
  return jsonOk({ category }, 201);
}
