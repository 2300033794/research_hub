export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>ResearchHub — a community for discovering and discussing research papers.</p>
        <p>PDFs are stored on Cloudinary. Metadata lives in MongoDB.</p>
      </div>
    </footer>
  );
}
