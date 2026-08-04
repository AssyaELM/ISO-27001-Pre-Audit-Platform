import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://normcore.io"),
  title: "NormCore",
  description:
    "Assess your security controls through a guided questionnaire, identify evidence gaps, and turn your results into a prioritized remediation plan.",
  applicationName: "NormCore",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "NormCore",
    title: "NormCore",
    description:
      "Assess your security controls through a guided questionnaire, identify evidence gaps, and turn your results into a prioritized remediation plan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NormCore",
    description:
      "Assess your security controls through a guided questionnaire, identify evidence gaps, and turn your results into a prioritized remediation plan.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050E1B",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
