import "./globals.css";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "SmileMap – Find a dentist near you",
  description: "Real-time availability, contact details, opening times, accessibility and facilities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Global Header */}
        <header className="header">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {/* Put your logo at /public/smilemap-logo.png */}
              <Image
                src="/smilemap-logo.png"
                alt="SmileMap"
                width={150}
                height={40}
                priority
              />
            </Link>

            <nav className="hidden sm:flex items-center gap-6 text-slate-600">
              <Link href="/#how-it-works" className="hover:text-[--smile-navy]">How it works</Link>
              <Link href="/#benefits" className="hover:text-[--smile-navy]">Benefits</Link>
              <Link href="/#dentists" className="hover:text-[--smile-navy]">For dentists</Link>
              <Link href="/form" className="btn btn-primary">List your practice</Link>
            </nav>
          </div>
        </header>

        {/* Page content */}
        {children}

        {/* Global Footer */}
        <footer className="footer mt-16">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Image src="/smilemap-logo.png" alt="SmileMap" width={24} height={24} />
              <span>© {new Date().getFullYear()} SmileMap</span>
            </div>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
