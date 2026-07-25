import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Cursor } from "@/components/layout/Cursor";
import { Preloader } from "@/components/layout/Preloader";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PDF Genie — Every PDF task, one calm tool",
  description:
    "Merge, split, compress, convert, and sign PDFs in seconds. No installs, no watermarks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} antialiased`}>
      <body className="bg-brand-cream text-foreground">
        {/* Sets data-theme before first paint (no FOUC) without reading
            cookies() server-side, which would force every page dynamic —
            see lib/theme.ts for the shared resolution logic this mirrors. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <a href="#top" className="skip-link">
          Skip to content
        </a>
        <Preloader />
        <Cursor />
        <AuthProvider>
          <SmoothScroll>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </SmoothScroll>
        </AuthProvider>
      </body>
    </html>
  );
}
