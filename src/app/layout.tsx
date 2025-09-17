import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/lib/errorHandler"; // Auto-initialize error handler

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BRAIN DB - AI Material Capture Tool",
  description: "KI-gestützte Erfassung von Baumaterialien beim Browsen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=monospace:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        
        {/* Autodesk APS Viewer SDK - MUST be loaded statically in HTML */}
        <script 
          src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js"
          crossOrigin="anonymous"
          defer
        ></script>
        <link 
          rel="stylesheet" 
          type="text/css" 
          href="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
        {/* React DevTools for development */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined') {
                  const script = document.createElement('script');
                  script.src = 'https://unpkg.com/react-devtools@^4.28.0/standalone/globalHook.js';
                  script.onload = () => {
                    const script2 = document.createElement('script');
                    script2.src = 'https://unpkg.com/react-devtools@^4.28.0/standalone/backend.js';
                    document.head.appendChild(script2);
                  };
                  document.head.appendChild(script);
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
