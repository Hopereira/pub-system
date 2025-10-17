// Caminho: frontend/src/app/(protected)/dashboard/cozinha/page.tsx
import CozinhaPageClient from '@/components/cozinha/CozinhaPageClient';
import React from 'react';

export default function CozinhaPage() {
  // Não passamos ambienteId aqui - deixa o componente trabalhar com TODOS os ambientes
  // ou o usuário seleciona qual ambiente quer monitorar
  return <CozinhaPageClient />;
}