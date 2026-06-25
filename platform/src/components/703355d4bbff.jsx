import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/f101c4e63a93";
import { SITE_LOGO_PATH } from "@/components/171b48435a24";
import { Providers } from "@/components/411267a323b5";
import "@/components/dd438e7ca4da.css";
const fontBody = Inter({
    variable: "--font-body",
    subsets: ["latin"],
});
const fontHeading = Fraunces({
    variable: "--font-heading",
    subsets: ["latin"],
});
const fontMono = JetBrains_Mono({
    variable: "--font-code",
    subsets: ["latin"],
});
export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://psychlink.pro"),
    title: {
        default: "Psychlink.pro",
        template: "%s | Psychlink.pro",
    },
    description: "Psychlink.pro is a secure online therapy platform that connects clients with licensed therapists for messaging, scheduling, and sessions.",
    applicationName: "Psychlink.pro",
    keywords: [
        "online therapy",
        "teletherapy",
        "mental health",
        "therapist",
        "psychiatrist",
        "counseling",
    ],
    icons: {
        icon: [{ url: SITE_LOGO_PATH, type: "image/png" }],
        shortcut: [SITE_LOGO_PATH],
        apple: [{ url: SITE_LOGO_PATH, type: "image/png" }],
    },
    openGraph: {
        type: "website",
        siteName: "Psychlink.pro",
        title: "Psychlink.pro",
        description: "Secure online therapy platform connecting clients and licensed therapists.",
        url: "/",
    },
    twitter: {
        card: "summary_large_image",
        title: "Psychlink.pro",
        description: "Secure online therapy platform connecting clients and licensed therapists.",
    },
};
export default function RootLayout({ children, }) {
    return (<html lang="en" suppressHydrationWarning>
      <body className={`${fontBody.variable} ${fontHeading.variable} ${fontMono.variable} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors/>
      </body>
    </html>);
}
