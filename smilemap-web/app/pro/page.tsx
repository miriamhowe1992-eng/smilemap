// app/pro/page.tsx
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "For Dentists – SmileMap ProHub",
  description:
    "Join SmileMap ProHub to reach more local patients. Verified NHS status badge, featured placement, lead delivery, and analytics.",
};

const theme = {
  brandBlue: "#133b5c",
  primary: "#1f6fff",
  border: "#e5e9f2",
};

export default function ProHubPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header (simple) */}
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-smilemap.png"
              alt="SmileMap"
              width={160}
              height={44}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-6 md:flex text-sm text-slate-700">
            <Link href="/">Home</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="border-b"
        style={{
          borderColor: theme.border,
          background:
            "radial-gradient(1200px 600px at -10% -20%, rgba(31,111,255,.06), transparent)",
        }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2">
          <div>
            <h1
              className="text-3xl font-extrabold leading-tight md:text-5xl"
              style={{ color: theme.brandBlue }}
            >
              SmileMap ProHub for Dental Practices
            </h1>
            <p className="mt-4 max-w-[60ch] text-base text-slate-600">
              Get high-intent local patients. Show an official NHS status badge,
              feature your practice in search, and receive leads instantly by
              email (or webhook) with simple analytics.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="rounded-xl px-5 py-3 text-center text-sm font-semibold text-white"
                style={{ backgroundColor: theme.primary }}
              >
                Enquire about ProHub
              </Link>
              <Link
                href="/"
                className="rounded-xl border px-5 py-3 text-center text-sm font-semibold"
                style={{ borderColor: theme.border, color: theme.brandBlue }}
              >
                View SmileMap
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6"
               style={{ borderColor: theme.border }}>
            <ul className="space-y-3 text-slate-700">
              <li>✅ Verified NHS status badge</li>
              <li>✅ Featured placement in relevant searches</li>
              <li>✅ Instant lead delivery (email or webhook)</li>
              <li>✅ Practice profile with photos & treatments</li>
              <li>✅ Light-touch analytics (views, clicks, leads)</li>
              <li>✅ Patient trust banners & reviews integration</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing (example) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900">Simple pricing</h2>
        <p className="mt-2 text-slate-600">Cancel anytime. No long contracts.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-6" style={{ borderColor: theme.border }}>
            <h3 className="text-lg font-semibold">Starter</h3>
            <p className="mt-2 text-slate-600">Best for a single location.</p>
            <p className="mt-4 text-3xl font-extrabold">£49<span className="text-base font-medium">/mo</span></p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Practice profile & contact</li>
              <li>• NHS status badge</li>
              <li>• Standard search placement</li>
            </ul>
          </div>

          <div className="rounded-2xl border p-6 ring-1 ring-blue-200"
               style={{ borderColor: theme.border }}>
            <h3 className="text-lg font-semibold">Growth</h3>
            <p className="mt-2 text-slate-600">Great for growing NHS + private.</p>
            <p className="mt-4 text-3xl font-extrabold">£99<span className="text-base font-medium">/mo</span></p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Featured placement</li>
              <li>• Instant lead delivery</li>
              <li>• Priority support</li>
            </ul>
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: theme.border }}>
            <h3 className="text-lg font-semibold">Multi-site</h3>
            <p className="mt-2 text-slate-600">For groups and multi-location brands.</p>
            <p className="mt-4 text-3xl font-extrabold">Custom</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Group pricing & reporting</li>
              <li>• Dedicated success manager</li>
              <li>• API/Webhook integrations</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
          <div className="text-sm text-slate-600">
            © {new Date().getFullYear()} SmileMap
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

