import AgendaEventosClientPage from "./AgendaEventosClientPage";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

// Esta página renderiza a estrutura e passa a responsabilidade para o componente cliente.
export default function AgendaEventosPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agenda de Eventos</h1>
          <p className="text-muted-foreground">Crie e gira a programação do seu estabelecimento.</p>
        </div>
      </div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Agenda de Eventos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Esta linha renderiza o componente que contém toda a lógica da página */}
      <AgendaEventosClientPage />
    </div>
  );
}