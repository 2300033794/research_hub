import { dbConnect } from "@/lib/db";
import { jsonOk } from "@/lib/api-response";
import { User } from "@/models/User";
import { ResearchPaper } from "@/models/ResearchPaper";

export async function GET() {
  await dbConnect();
  const researchers = await User.find({
    role: "USER",
    canPostResearch: true,
    accountStatus: { $in: ["APPROVED", "VERIFIED"] },
  })
    .select("name profileImage bio institution researchInterests isVerified createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const counts = await ResearchPaper.aggregate([
    { $match: { status: "APPROVED" } },
    { $group: { _id: "$uploadedBy", n: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((row) => [String(row._id), row.n]));

  return jsonOk({
    researchers: researchers.map((user) => ({
      ...user,
      paperCount: countMap[String(user._id)] || 0,
    })),
  });
}
