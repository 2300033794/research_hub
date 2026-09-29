import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { jsonOk } from "@/lib/api-response";
import { User } from "@/models/User";
import { ResearchPaper } from "@/models/ResearchPaper";

export async function GET(request: NextRequest) {
  await dbConnect();
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q) return jsonOk({ papers: [], researchers: [] });

  const [papers, researchers] = await Promise.all([
    ResearchPaper.find({
      status: "APPROVED",
      $or: [
        { title: new RegExp(q, "i") },
        { authors: new RegExp(q, "i") },
        { tags: new RegExp(q, "i") },
        { keywords: new RegExp(q, "i") },
        { category: new RegExp(q, "i") },
        { institution: new RegExp(q, "i") },
        { researchField: new RegExp(q, "i") },
      ],
    })
      .sort({ likeCount: -1, createdAt: -1 })
      .limit(8)
      .select("title category authors likeCount commentCount")
      .lean(),
    User.find({
      role: "USER",
      accountStatus: { $in: ["APPROVED", "VERIFIED"] },
      $or: [{ name: new RegExp(q, "i") }, { institution: new RegExp(q, "i") }],
    })
      .limit(6)
      .select("name profileImage institution canPostResearch")
      .lean(),
  ]);

  return jsonOk({ papers, researchers });
}
