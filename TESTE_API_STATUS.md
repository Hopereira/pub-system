# 🧪 Teste da API - Campo Status

## Como Testar

### 1. Via Swagger
```
1. Acesse: http://localhost:3000/api
2. Faça login em POST /auth/login
   - Email: admin@admin.com
   - Senha: admin123
3. Copie o access_token
4. Clique em "Authorize" 🔒
5. Cole o token
6. Teste GET /funcionarios
7. Verifique se o campo "status" aparece na resposta
```

### 2. Via Postman/Insomnia
```
GET http://localhost:3000/funcionarios
Authorization: Bearer SEU_TOKEN_AQUI
```

### 3. Via curl (PowerShell)
```powershell
# 1. Fazer login
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body (@{email="admin@admin.com"; password="admin123"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.access_token

# 2. Buscar funcionários
$headers = @{Authorization = "Bearer $token"}
$funcionarios = Invoke-RestMethod -Uri "http://localhost:3000/funcionarios" -Method GET -Headers $headers

# 3. Ver resultado
$funcionarios | ConvertTo-Json -Depth 3
```

## Resposta Esperada

```json
[
  {
    "id": "uuid",
    "nome": "Administrador Padrão",
    "email": "admin@admin.com",
    "cargo": "ADMIN",
    "status": "INATIVO",  // ✅ DEVE APARECER
    "empresaId": null,
    "ambienteId": null
  },
  {
    "id": "uuid",
    "nome": "hop",
    "email": "pereira_hebert@msn.com",
    "cargo": "GARCOM",
    "status": "INATIVO",  // ✅ DEVE APARECER
    "empresaId": null,
    "ambienteId": null
  }
]
```

## Se o campo NÃO aparecer:

### Solução 1: Reiniciar Backend
```bash
docker-compose restart backend
```

### Solução 2: Limpar Cache do TypeORM
```bash
docker-compose down
docker-compose up -d
```

### Solução 3: Verificar Entidade
```bash
docker-compose exec backend cat src/modulos/funcionario/entities/funcionario.entity.ts | grep -A 5 "status"
```

## Checklist de Verificação

- [ ] Migration executada com sucesso
- [ ] Campo `status` existe no banco de dados
- [ ] Entidade `Funcionario` tem campo `status`
- [ ] Backend reiniciado após migration
- [ ] API retorna campo `status`
- [ ] Frontend exibe coluna "Status"
- [ ] Badge mostra cores corretas (verde/cinza)
