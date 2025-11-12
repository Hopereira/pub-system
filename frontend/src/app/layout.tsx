// Caminho: frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { Toaster } from "@/components/ui/sonner";

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
    // A propriedade sai daqui...
    <html lang="pt-br">
      {/* ...e vem para a tag <body> */}
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}