import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ErrorSuppressor from "./components/ErrorSuppressor";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finfactor AA Flow Test",
  description: "Account Aggregator Flow Testing Application",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorSuppressor />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#13131a',
              color: '#e4e4e7',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#13131a',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#13131a',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
