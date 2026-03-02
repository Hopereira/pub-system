# [F4.2] Isolamento de Storage por Path de Tenant

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição

Refatoração do `GcsStorageService` para organizar arquivos por tenant no Google Cloud Storage, facilitando gestão, auditoria e exclusão de dados (LGPD).

---

## 📁 Estrutura de Pastas

### Antes (Misturado)
```
bucket/
├── 1700000000-produto1.jpg
├── 1700000001-produto2.jpg
├── eventos/
│   └── 1700000002-banner.jpg
└── ...
```

### Depois (Isolado por Tenant)
```
bucket/
├── tenants/
│   ├── {tenant_id_1}/
│   │   ├── produtos/
│   │   │   └── 1700000000-produto1.jpg
│   │   ├── eventos/
│   │   │   └── 1700000002-banner.jpg
│   │   └── empresas/
│   │       └── 1700000003-logo.png
│   └── {tenant_id_2}/
│       ├── produtos/
│       │   └── 1700000001-produto2.jpg
│       └── ...
└── global/
    └── geral/
        └── arquivos-sem-tenant.jpg
```

---

## 💻 API do GcsStorageService

### Upload com Isolamento

```typescript
// Novo método (recomendado)
await storageService.uploadFile(file, 'produtos');
// Path: tenants/{tenant_id}/produtos/{timestamp}-{filename}

// Com tenant explícito
await storageService.uploadFile(file, 'eventos', 'uuid-do-tenant');
```

### Módulos Suportados

| Módulo | Descrição |
|--------|-----------|
| `produtos` | Fotos de produtos |
| `eventos` | Banners e imagens de eventos |
| `funcionarios` | Fotos de perfil |
| `empresas` | Logos e documentos |
| `geral` | Outros arquivos |

### Métodos de Gestão

```typescript
// Listar arquivos de um tenant
const files = await storageService.listTenantFiles('tenant-id', 'produtos');

// Calcular uso de storage
const usage = await storageService.getTenantStorageUsage('tenant-id');
// { totalBytes: 1048576, fileCount: 10 }

// Deletar todos os arquivos (LGPD)
const result = await storageService.deleteAllTenantFiles('tenant-id');
// { deleted: 10, errors: 0 }
```

---

## 🔒 Metadados de Rastreabilidade

Cada arquivo enviado inclui metadados:

```json
{
  "tenantId": "uuid-do-tenant",
  "module": "produtos",
  "originalName": "foto-original.jpg",
  "uploadedAt": "2025-12-18T15:00:00.000Z"
}
```

---

## 📊 Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **Organização** | Arquivos agrupados por cliente |
| **LGPD** | Fácil exclusão de dados por tenant |
| **Auditoria** | Rastreabilidade de uploads |
| **Billing** | Cálculo de uso por tenant |
| **Backup** | Possibilidade de backup seletivo |

---

## ⚠️ Compatibilidade

O método `uploadFileLegacy()` foi mantido para compatibilidade com código existente:

```typescript
// Legado (deprecated)
await storageService.uploadFileLegacy(file, 'eventos');
```

Recomenda-se migrar para o novo método `uploadFile(file, module)`.

---

## 📁 Arquivos Modificados

- `backend/src/shared/storage/gcs-storage.service.ts`

---

## ✅ Critérios de Aceitação

| Critério | Status |
|----------|--------|
| Upload salva em `tenants/{id}/{module}/` | ✅ |
| Metadados incluem tenantId | ✅ |
| Método para listar arquivos por tenant | ✅ |
| Método para deletar todos (LGPD) | ✅ |
| Método para calcular uso de storage | ✅ |
| Compatibilidade com código legado | ✅ |

---

## 🚀 Próximos Passos

1. Atualizar `ProdutoService` para usar `uploadFile(file, 'produtos')`
2. Atualizar `EventoService` para usar `uploadFile(file, 'eventos')`
3. Configurar políticas de acesso no GCS
4. Criar job de migração de arquivos existentes
