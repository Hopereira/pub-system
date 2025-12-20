// Caminho: frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TurnoProvider } from "@/context/TurnoContext";
import { CaixaProvider } from "@/context/CaixaContext";
import { SocketProvider } from "@/context/SocketContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pub System",
  description: "Sistema de Gerenciamento para Pubs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <TurnoProvider>
              <CaixaProvider>
                <SocketProvider>
                  {children}
                </SocketProvider>
              </CaixaProvider>
            </TurnoProvider>
          </AuthProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}