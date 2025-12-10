# 📊 Dados de Teste - Terminal de Caixa

## ✅ Seeding Executado com Sucesso!

O banco de dados foi populado automaticamente com dados de teste realistas.

### 📈 Resumo Geral
- **8 Ambientes** (5 de preparo + 3 de atendimento)
- **22 Mesas** (distribuídas pelos ambientes de atendimento)
- **42 Produtos** (distribuídos pelos ambientes de preparo)
- **5 Clientes** cadastrados
- **5 Comandas ABERTAS** (4 com mesa + 1 no balcão)

---

## 👥 Clientes Cadastrados

### 1. João Silva
- **CPF:** 12345678900
- **Email:** joao.silva@email.com
- **Celular:** 11987654321

### 2. Maria Santos
- **CPF:** 98765432100
- **Email:** maria.santos@email.com
- **Celular:** 11976543210

### 3. Pedro Oliveira
- **CPF:** 11122233344
- **Email:** pedro.oliveira@email.com
- **Celular:** 11965432109

### 4. Ana Costa
- **CPF:** 55566677788
- **Email:** ana.costa@email.com
- **Celular:** 11954321098

### 5. Carlos Pereira
- **CPF:** 99988877766
- **Email:** carlos.pereira@email.com
- **Celular:** 11943210987

---

## 🍽️ Comandas Abertas

### Comanda 1 - João Silva
- **Cliente:** João Silva
- **CPF:** 12345678900
- **Mesa:** 1 (Salão Principal)
- **Status:** ABERTA

### Comanda 2 - Maria Santos
- **Cliente:** Maria Santos
- **CPF:** 98765432100
- **Mesa:** 2 (Salão Principal)
- **Status:** ABERTA

### Comanda 3 - Pedro Oliveira
- **Cliente:** Pedro Oliveira
- **CPF:** 11122233344
- **Mesa:** 3 (Salão Principal)
- **Status:** ABERTA

### Comanda 4 - Ana Costa (Balcão)
- **Cliente:** Ana Costa
- **CPF:** 55566677788
- **Mesa:** Nenhuma (Balcão/Delivery)
- **Status:** ABERTA

### Comanda 5 - Carlos Pereira
- **Cliente:** Carlos Pereira
- **CPF:** 99988877766
- **Mesa:** 4 (Salão Principal)
- **Status:** ABERTA

---

## 🔍 Testes de Busca Sugeridos

### Busca por Nome (Parcial)
- **"João"** → Deve encontrar João Silva (Mesa 1)
- **"Maria"** → Deve encontrar Maria Santos (Mesa 2)
- **"Pedro"** → Deve encontrar Pedro Oliveira (Mesa 3)
- **"Ana"** → Deve encontrar Ana Costa (Balcão)
- **"Carlos"** → Deve encontrar Carlos Pereira (Mesa 4)
- **"Silva"** → Deve encontrar João Silva
- **"santos"** → Deve encontrar Maria Santos (case-insensitive)

### Busca por CPF (Parcial ou Completo)
- **"123"** → Deve encontrar João Silva (CPF: 12345678900)
- **"987"** → Deve encontrar Maria Santos (CPF: 98765432100)
- **"111"** → Deve encontrar Pedro Oliveira (CPF: 11122233344)
- **"555"** → Deve encontrar Ana Costa (CPF: 55566677788)
- **"999"** → Deve encontrar Carlos Pereira (CPF: 99988877766)
- **"12345678900"** → Deve encontrar João Silva (CPF completo)

### Busca por Número da Mesa
- **"1"** → Deve encontrar João Silva (Mesa 1)
- **"2"** → Deve encontrar Maria Santos (Mesa 2)
- **"3"** → Deve encontrar Pedro Oliveira (Mesa 3)
- **"4"** → Deve encontrar Carlos Pereira (Mesa 4)

### Busca que NÃO deve retornar resultados
- **"XYZ"** → Nenhum resultado (nome inexistente)
- **"00000000000"** → Nenhum resultado (CPF inexistente)
- **"999"** → Encontra Carlos (CPF: 999...), mas não mesa 999 (não existe)

---

## 🎯 Fluxo de Teste Recomendado

### 1. Testar Tab "Buscar Comanda"
1. Acesse `/dashboard/operacional/caixa`
2. Digite "João" no campo de busca
3. Verifique se aparece a comanda de João Silva na Mesa 1
4. Clique no card da comanda
5. Você será redirecionado para `/dashboard/comandas/[id]`

### 2. Testar Tab "Mesas"
1. Clique na aba "Mesas"
2. Verifique que as primeiras 4 mesas (1-4) estão marcadas com status OCUPADA (vermelho)
3. As demais mesas devem estar com status LIVRE (verde)

### 3. Testar Tab "Clientes"
1. Clique na aba "Clientes"
2. Verifique que aparecem 5 clientes cadastrados
3. Veja os dados: nome, CPF, email e celular

### 4. Testar Fechamento de Comanda
1. Use a busca para encontrar uma comanda (ex: "João")
2. Clique no card para abrir a comanda
3. Na página de detalhes, clique em "Fechar Comanda"
4. A comanda deve mudar para status FECHADA
5. Volte ao Terminal de Caixa e busque novamente
6. A comanda de João NÃO deve mais aparecer (só comandas ABERTAS são exibidas)

---

## 🔄 Como Recriar os Dados de Teste

Se precisar limpar e recriar os dados:

```bash
# Parar os containers e limpar volumes
docker-compose down -v

# Subir os containers novamente
docker-compose up -d --build

# Aguardar inicialização (10-15 segundos)
# Executar migrations
docker-compose exec backend npm run typeorm migration:run

# Reiniciar backend para executar seeder
docker-compose restart backend
```

O seeder é executado automaticamente na inicialização do backend e só cria dados se o banco estiver vazio.

---

## 📝 Observações Importantes

1. **Apenas comandas ABERTAS** aparecem na busca do Terminal de Caixa
2. **Busca case-insensitive** (não diferencia maiúsculas/minúsculas)
3. **CPF com menos de 5 dígitos** não é tratado como número de mesa
4. **Debounce de 300ms** na busca para evitar requisições excessivas
5. **Ana Costa** tem comanda sem mesa (balcão) - útil para testar esse cenário

---

## 🎉 Dados Criados com Sucesso!

Agora você pode testar todas as funcionalidades do Terminal de Caixa com dados realistas!
