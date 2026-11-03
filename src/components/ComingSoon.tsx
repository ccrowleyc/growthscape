import { Card, PageHeader } from "./ui";

export function ComingSoon({ title, description, bullets }: { title: string; description: string; bullets: string[] }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card className="p-8">
        <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">Coming in a later phase</span>
        <ul className="mt-5 space-y-2.5 text-sm text-ink-soft">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />{b}</li>
          ))}
        </ul>
      </Card>
    </>
  );
}
