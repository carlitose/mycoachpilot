import Link from "next/link";

export const dynamic = "force-dynamic";

// Dashboard page
export default async function Dashboard() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
          <Link href="/app" className="btn btn-primary btn-sm">
            Go to App
          </Link>
        </div>
        <div className="grid gap-4">
          <Link href="/app/settings/ai" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h2 className="card-title">AI Settings</h2>
              <p className="text-base-content/70">Configure your OpenAI API key and templates</p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
