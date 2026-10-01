import { PageShell, PageTitle } from "@/components/layout/page-shell";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageShell className="max-w-3xl space-y-4">
      <PageTitle
        title="About ResearchHub"
        description="A Reddit-style community for discovering, reading, and discussing scientific papers."
      />
      <p className="leading-7 text-muted-foreground">
        Anyone can browse approved papers. Signing in lets you vote and comment after an administrator
        approves your account. Submitting PDFs is reserved for admins and users who have been granted
        posting permission.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
        <li>Papers are stored as PDFs on Cloudinary; metadata lives in MongoDB.</li>
        <li>New accounts start as pending until an admin approves them.</li>
        <li>Researcher posting access is granted separately from basic community access.</li>
        <li>Admins review submissions, moderate comments, and manage user status.</li>
      </ul>
    </PageShell>
  );
}
