import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Área do Caixa | Pub System',
  description: 'Terminal de caixa e gestão de pagamentos',
};

export default function CaixaLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
