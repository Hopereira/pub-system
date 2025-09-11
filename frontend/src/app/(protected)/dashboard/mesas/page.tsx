// Caminho: frontend/src/app/(protected)/dashboard/mesas/page.tsx

import MapaMesasClient from '@/components/mesas/MapaMesasClient';
import React from 'react';

// Esta é a página do "Mapa de Mesas" para a operação do dia a dia.
// Ela simplesmente renderiza o nosso componente cliente que contém toda a lógica.
export default function MapaDeMesasPage() {
  return <MapaMesasClient />;
}