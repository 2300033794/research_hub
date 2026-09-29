import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { categorySchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/require-user";
import { isObjectId, slugify } from "@/lib/http";
import { Category } from "@/models/Category";
import { logAdminAction } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  if (!isObjectId(id)) return jsonError("Invalid category id.");

  const body = await request.json().catch(() => null);
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("Invalid category update.", 422);

  await dbConnect();
  const category = await Category.findById(id);
  if (!category) return jsonError("Category not found.", 404);
  if (parsed.data.name) {
    category.name = parsed.data.name;
    category.slug = slugify(parsed.data.name);
  }
  if (parsed.data.description !== undefined) category.description = parsed.data.description;
  if (parsed.data.isActive !== undefined) category.isActive = parsed.data.isActive;
  await category.save();
  await logAdminAction({
    adminId: access.user._id,
    action: "CATEGORY_UPDATED",
    details: category.name,
  });
  return jsonOk({ category });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireAdmin();
  if ("error" in access) return access.error;
  if (!isObjectId(id)) return jsonError("Invalid category id.");
  await dbConnect();
  const category = await Category.findByIdAndDelete(id);
  if (!category) return jsonError("Category not found.", 404);
  await logAdminAction({
    adminId: access.user._id,
    action: "CATEGORY_DELETED",
    details: category.name,
  });
  return jsonOk({ ok: true });
}
