import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Utsav — Beautiful celebrations, thoughtfully brought together",
  description:
    "Discover local event professionals, compare clear proposals and bring your celebration to life in Hyderabad, Nellore and Wanaparthy.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
