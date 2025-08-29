"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { authData, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!authData) {
      router.push("/login");
    }
  }, [isLoading, authData, router]);

  if (isLoading || !authData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>A verificar autenticação...</p>
      </div>
    );
  }

  return <>{children}</>;
}