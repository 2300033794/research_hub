export const USER_ROLES = ["ADMIN", "USER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = [
  "PENDING",
  "APPROVED",
  "VERIFIED",
  "SUSPENDED",
  "REJECTED",
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const AUTH_PROVIDERS = ["email", "google"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const PAPER_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "CHANGES_REQUESTED",
] as const;
export type PaperStatus = (typeof PAPER_STATUSES)[number];

export const VOTE_TYPES = ["LIKE", "DISLIKE"] as const;
export type VoteType = (typeof VOTE_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "ACCOUNT_APPROVED",
  "ACCOUNT_REJECTED",
  "ACCOUNT_VERIFIED",
  "ACCOUNT_SUSPENDED",
  "POSTING_GRANTED",
  "POSTING_REVOKED",
  "PAPER_APPROVED",
  "PAPER_REJECTED",
  "PAPER_CHANGES_REQUESTED",
  "PAPER_COMMENTED",
  "COMMENT_REPLIED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const INITIAL_CATEGORIES = [
  { name: "Biotechnology", slug: "biotechnology", description: "Applied biological systems and bioprocess research." },
  { name: "B.Tech / Engineering", slug: "btech-engineering", description: "Undergraduate and professional engineering research." },
  { name: "Computer Science", slug: "computer-science", description: "Theory, systems, and computing research." },
  { name: "Artificial Intelligence", slug: "artificial-intelligence", description: "Intelligent systems, reasoning, and AI methods." },
  { name: "Machine Learning", slug: "machine-learning", description: "Statistical learning, models, and training methods." },
  { name: "Medical", slug: "medical", description: "Clinical and medical science research." },
  { name: "Healthcare", slug: "healthcare", description: "Health systems, delivery, and public health." },
  { name: "Biology", slug: "biology", description: "Life sciences and biological mechanisms." },
  { name: "Chemistry", slug: "chemistry", description: "Chemical sciences and molecular research." },
  { name: "Physics", slug: "physics", description: "Physical sciences and experimental physics." },
  { name: "Environmental Science", slug: "environmental-science", description: "Climate, ecology, and environmental systems." },
  { name: "Agriculture", slug: "agriculture", description: "Crop science, agronomy, and food systems." },
  { name: "Robotics", slug: "robotics", description: "Robotic systems, control, and automation." },
  { name: "Electronics", slug: "electronics", description: "Circuits, devices, and electronic systems." },
  { name: "Mechanical Engineering", slug: "mechanical-engineering", description: "Mechanics, design, and thermal systems." },
  { name: "Civil Engineering", slug: "civil-engineering", description: "Infrastructure, structures, and construction." },
  { name: "Data Science", slug: "data-science", description: "Data analysis, visualization, and applied statistics." },
  { name: "Cybersecurity", slug: "cybersecurity", description: "Security, privacy, and adversarial systems." },
  { name: "Other", slug: "other", description: "Research that does not fit a listed field." },
] as const;
