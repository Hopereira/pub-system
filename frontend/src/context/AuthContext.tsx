"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode"; // 1. Importar a nova biblioteca
import { login as apiLogin } from "@/services/authService";

// --- Tipagem para os dados do usuário dentro do token ---
interface User {
  email: string;
  cargo: string; // O cargo do funcionário (ex: "ADMIN", "GARCOM")
  // ... outras informações do token
}

// --- Tipagem para os dados do nosso contexto ---
interface AuthData {
  token: string;
  user: User; // Agora guardamos o objeto do usuário
}

interface AuthContextType {
  authData: AuthData | null;
  login: (credentials: any) => Promise<void>; // A função login agora fará o redirect
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // Usamos o router aqui dentro agora

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      try {
        const user = jwtDecode<User>(storedToken); // 2. Decodificar o token ao carregar
        setAuthData({ token: storedToken, user });
      } catch (error) {
        console.error("Token inválido no localStorage:", error);
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any) => {
    const data = await apiLogin(credentials);
    const token = data.access_token;
    const user = jwtDecode<User>(token); // 3. Decodificar o token após o login

    setAuthData({ token, user });
    localStorage.setItem("authToken", token);

    // 4. Lógica de redirecionamento baseada no cargo
    switch (user.cargo) {
      case "ADMIN":
        router.push("/dashboard");
        break;
      case "GARCOM":
        router.push("/mesas"); // Futura página de mesas
        break;
      default:
        router.push("/"); // Página padrão para outros cargos
        break;
    }
  };

  const logout = () => {
    setAuthData(null);
    localStorage.removeItem("authToken");
    router.push("/login"); // Garante que o usuário vá para o login ao sair
  };

  return (
    <AuthContext.Provider value={{ authData, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};