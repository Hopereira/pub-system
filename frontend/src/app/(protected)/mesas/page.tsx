// Caminho: frontend/src/app/(protected)/dashboard/mesas/page.tsx
'use client';

// Supondo que o seu código do Mapa de Mesas está num componente em /components
import MapaMesasClient from '@/components/mesas/MapaMesasClient';

// Esta página agora renderiza APENAS a visão do Garçom.
export default function MesasGarcomPage() {
  return <MapaMesasClient />;
}