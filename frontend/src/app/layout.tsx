// Caminho: frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner"; // <-- 1. IMPORTE O NOVO COMPONENTE

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
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors /> {/* <-- 2. ADICIONE AQUI (com a prop 'richColors' fica mais bonito) */}
      </body>
    </html>
  );
}