import { NextRequest } from "next/server";
import type { QueryFilter } from "mongoose";
import { dbConnect, hasMongoUri } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { paperInputSchema } from "@/lib/validators";
import { requirePoster } from "@/lib/require-user";
import { pagination, parseList, clientIp } from "@/lib/http";
import { MAX_IMAGE_BYTES, MAX_PDF_BYTES, uploadImageBuffer, uploadPdfBuffer } from "@/lib/cloudinary";
import { isAdmin } from "@/lib/permissions";
import { Category } from "@/models/Category";
import { ResearchPaper } from "@/models/ResearchPaper";
import { User } from "@/models/User";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import type { ResearchPaperDocument } from "@/models/ResearchPaper";

function csvOrJsonList(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* use csv */
  }
  return parseList(value);
}

export async function GET(request: NextRequest) {
  if (!hasMongoUri()) return jsonOk({ items: [], page: 1, pages: 1, total: 0 });
  await dbConnect();
  const { page, limit, skip } = pagination(request);
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() || "";
  const category = params.get("category") || "";
  const subcategory = params.get("subcategory") || "";
  const author = params.get("author") || "";
  const field = params.get("field") || params.get("researchField") || "";
  const tag = params.get("tag") || "";
  const institution = params.get("institution") || "";
  const sort = params.get("sort") || "latest";
  const from = params.get("from");
  const to = params.get("to");
  const featured = params.get("featured");
  const uploadedBy = params.get("uploadedBy");

  const filter: QueryFilter<ResearchPaperDocument> = { status: "APPROVED" };

  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (field) filter.researchField = field;
  if (institution) filter.institution = new RegExp(institution, "i");
  if (author) filter.authors = new RegExp(author, "i");
  if (tag) filter.tags = tag;
  if (featured === "true") filter.isFeatured = true;
  if (uploadedBy) filter.uploadedBy = uploadedBy;
  if (from || to) {
    filter.publicationDate = {};
    if (from) filter.publicationDate.$gte = new Date(from);
    if (to) filter.publicationDate.$lte = new Date(to);
  }
  if (q) {
    filter.$or = [
      { title: new RegExp(q, "i") },
      { abstract: new RegExp(q, "i") },
      { authors: new RegExp(q, "i") },
      { tags: new RegExp(q, "i") },
      { keywords: new RegExp(q, "i") },
      { institution: new RegExp(q, "i") },
      { researchField: new RegExp(q, "i") },
      { category: new RegExp(q, "i") },
    ];
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    latest: { isFeatured: -1, createdAt: -1 },
    liked: { likeCount: -1, createdAt: -1 },
    discussed: { commentCount: -1, createdAt: -1 },
    viewed: { viewCount: -1, createdAt: -1 },
  };

  const [items, total] = await Promise.all([
    ResearchPaper.find(filter)
      .sort(sortMap[sort] || sortMap.latest)
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "name profileImage canPostResearch isVerified institution")
      .lean(),
    ResearchPaper.countDocuments(filter),
  ]);

  return jsonOk({
    items,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(`paper-upload:${clientIp(request)}`, 8, 60 * 60 * 1000);
  if (!limited.ok) return jsonError("Upload rate limit reached. Try later.", 429);

  const access = await requirePoster();
  if ("error" in access) return access.error;

  const form = await request.formData();
  const payload = {
    title: String(form.get("title") || ""),
    abstract: String(form.get("abstract") || ""),
    authors: csvOrJsonList(form.get("authors")),
    category: String(form.get("category") || ""),
    subcategory: String(form.get("subcategory") || ""),
    tags: csvOrJsonList(form.get("tags")),
    keywords: csvOrJsonList(form.get("keywords")),
    institution: String(form.get("institution") || ""),
    researchField: String(form.get("researchField") || ""),
    publicationDate: String(form.get("publicationDate") || ""),
    doi: String(form.get("doi") || ""),
    publishNow: String(form.get("publishNow") || "") === "true",
  };

  const parsed = paperInputSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError("Please complete the required paper metadata.", 422, {
      issues: parsed.error.flatten(),
    });
  }

  await dbConnect();
  const category = await Category.findOne({
    $or: [{ name: parsed.data.category }, { slug: parsed.data.category }],
    isActive: true,
  });
  if (!category) {
    return jsonError("Select a valid, active category.");
  }

  const pdf = form.get("pdf");
  if (!(pdf instanceof File) || pdf.size === 0) {
    return jsonError("A PDF file is required.");
  }
  if (pdf.type !== "application/pdf" && !pdf.name.toLowerCase().endsWith(".pdf")) {
    return jsonError("Only PDF files are supported.");
  }
  if (pdf.size > MAX_PDF_BYTES) {
    return jsonError("PDF files must be 20MB or smaller.");
  }

  const pdfBuffer = Buffer.from(await pdf.arrayBuffer());
  const uploaded = await uploadPdfBuffer(pdfBuffer, pdf.name);

  let thumbnailUrl = "";
  let thumbnailPublicId = "";
  const thumbnail = form.get("thumbnail");
  if (thumbnail instanceof File && thumbnail.size > 0) {
    if (!thumbnail.type.startsWith("image/")) {
      return jsonError("Thumbnail must be an image.");
    }
    if (thumbnail.size > MAX_IMAGE_BYTES) {
      return jsonError("Thumbnails must be 5MB or smaller.");
    }
    const imageBuffer = Buffer.from(await thumbnail.arrayBuffer());
    const imageUpload = await uploadImageBuffer(imageBuffer, thumbnail.type);
    thumbnailUrl = imageUpload.secure_url;
    thumbnailPublicId = imageUpload.public_id;
  }

  const publishNow = isAdmin(access.user) && parsed.data.publishNow;
  const paper = await ResearchPaper.create({
    ...parsed.data,
    category: category.name,
    publicationDate: parsed.data.publicationDate ? new Date(parsed.data.publicationDate) : null,
    fileUrl: uploaded.secure_url,
    cloudinaryPublicId: uploaded.public_id,
    thumbnailUrl,
    thumbnailPublicId,
    uploadedBy: access.user._id,
    status: publishNow ? "APPROVED" : "PENDING_REVIEW",
  });

  if (!publishNow && !isAdmin(access.user)) {
    const admins = await User.find({ role: "ADMIN" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        notify({
          userId: admin._id,
          type: "PAPER_COMMENTED",
          message: `${access.user.name} submitted “${paper.title}” for review.`,
          relatedPaperId: paper._id,
        }),
      ),
    );
  }

  return jsonOk({ paper }, 201);
}
