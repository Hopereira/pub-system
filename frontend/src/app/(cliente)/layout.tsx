// Local: app/(cliente)/layout.tsx

import { FloatingNav } from '@/components/ui/FloatingNav'; // Ajuste o caminho se necessário

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Usamos um fragmento <>...</> para não adicionar divs extras desnecessárias,
    // mas você pode usar um <div> ou <main> se precisar de um container.
    <>
      {children}
      <FloatingNav />
    </>
  );
}