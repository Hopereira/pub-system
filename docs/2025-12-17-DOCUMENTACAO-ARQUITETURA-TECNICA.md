# 🏗️ Documentação de Arquitetura Técnica - Pub System

**Data:** 17 de Dezembro de 2025  
**Versão:** 1.0  
**Analista:** Cascade AI

---

## 📋 Sumário

1. [Diagrama de Componentes](#1-diagrama-de-componentes)
2. [Fluxo de Dados](#2-fluxo-de-dados)
3. [Sequência de Operações Críticas](#3-sequência-de-operações-críticas)
4. [Estrutura de Diretórios Comentada](#4-estrutura-de-diretórios-comentada)

---

## 1. 📊 Diagrama de Componentes

### 1.1 Visão Geral do Sistema

```mermaid
graph TB
    subgraph "CLIENTE"
        Browser[🌐 Navegador Web]
        Mobile[📱 Mobile Browser]
    end

    subgraph "FRONTEND - Next.js 15"
        AppRouter[App Router]
        
        subgraph "Rotas Públicas"
            Cliente[Cliente - QR Code]
            Evento[Eventos]
            Entrada[Entrada]
        end
        
        subgraph "Rotas Protegidas"
            Dashboard[Dashboard Admin]
            Garcom[Área Garçom]
            Caixa[Área Caixa]
            Cozinha[Área Cozinha]
        end
        
        subgraph "Contextos"
            AuthCtx[AuthContext]
            TurnoCtx[TurnoContext]
            CaixaCtx[CaixaContext]
            SocketCtx[SocketContext]
        end
        
        subgraph "Services"
            API[API Services]
            WS[WebSocket Client]
        end
    end

    subgraph "BACKEND - NestJS 10"
        subgraph "Auth"
            JWT[JWT Strategy]
            Guards[Guards & Roles]
        end
        
        subgraph "Controllers"
            AuthC[Auth Controller]
            PedidoC[Pedido Controller]
            ComandaC[Comanda Controller]
            CaixaC[Caixa Controller]
            ProdutoC[Produto Controller]
            MesaC[Mesa Controller]
            FuncC[Funcionário Controller]
        end
        
        subgraph "Services"
            PedidoS[Pedido Service]
            ComandaS[Comanda Service]
            CaixaS[Caixa Service]
            ProdutoS[Produto Service]
            MesaS[Mesa Service]
            FuncS[Funcionário Service]
        end
        
        subgraph "Gateways"
            PedidoGW[Pedidos Gateway]
            TurnoGW[Turno Gateway]
        end
        
        subgraph "Shared"
            Storage[GCS Storage]
            Logger[Logger]
            Filters[Exception Filters]
        end
    end

    subgraph "DATABASE"
        PostgreSQL[(PostgreSQL 15)]
        
        subgraph "Entidades"
            Empresa[Empresa]
            Funcionario[Funcionário]
            Mesa[Mesa]
            Comanda[Comanda]
            Pedido[Pedido]
            ItemPedido[Item Pedido]
            Produto[Produto]
            Caixa[Caixa]
        end
    end

    subgraph "EXTERNAL"
        GCS[Google Cloud Storage]
        SMTP[Email Service]
    end

    Browser --> AppRouter
    Mobile --> AppRouter
    
    AppRouter --> Cliente
    AppRouter --> Dashboard
    AppRouter --> Garcom
    AppRouter --> Caixa
    AppRouter --> Cozinha
    
    Cliente --> API
    Dashboard --> API
    Garcom --> API
    Caixa --> API
    Cozinha --> API
    
    API --> AuthC
    API --> PedidoC
    API --> ComandaC
    API --> CaixaC
    
    WS <--> PedidoGW
    WS <--> TurnoGW
    
    AuthC --> JWT
    PedidoC --> Guards
    ComandaC --> Guards
    
    PedidoC --> PedidoS
    ComandaC --> ComandaS
    CaixaC --> CaixaS
    
    PedidoS --> PostgreSQL
    ComandaS --> PostgreSQL
    CaixaS --> PostgreSQL
    ProdutoS --> PostgreSQL
    
    ProdutoS --> Storage
    Storage --> GCS
    
    PedidoS --> PedidoGW
    
    PostgreSQL --> Empresa
    PostgreSQL --> Funcionario
    PostgreSQL --> Mesa
    PostgreSQL --> Comanda
    PostgreSQL --> Pedido
    PostgreSQL --> ItemPedido
    PostgreSQL --> Produto
    PostgreSQL --> Caixa
```

### 1.2 Arquitetura de Módulos Backend

```mermaid
graph LR
    subgraph "17 Módulos de Negócio"
        A[Ambiente]
        AN[Analytics]
        AV[Avaliação]
        CX[Caixa]
        CL[Cliente]
        CM[Comanda]
        EM[Empresa]
        EV[Evento]
        FN[Funcionário]
        MD[Medalha]
        MS[Mesa]
        PE[Página Evento]
        PD[Pedido]
        PT[Ponto Entrega]
        PR[Produto]
        TN[Turno]
        ES[Estabelecimento]
    end
    
    subgraph "Módulos Core"
        Auth[Auth Module]
        DB[Database Module]
        Shared[Shared Module]
    end
    
    PD --> CM
    PD --> PR
    PD --> A
    CM --> MS
    CM --> CL
    CM --> PT
    MS --> A
    PR --> A
    CX --> TN
    TN --> FN
    MD --> FN
    
    A --> DB
    AN --> DB
    AV --> DB
    CX --> DB
    CL --> DB
    CM --> DB
    EM --> DB
    EV --> DB
    FN --> DB
    MD --> DB
    MS --> DB
    PE --> DB
    PD --> DB
    PT --> DB
    PR --> DB
    TN --> DB
    
    FN --> Auth
    PR --> Shared
    EV --> Shared
```

---

## 2. 🔄 Fluxo de Dados

### 2.1 Fluxo Completo: Usuário → Frontend → Backend → DB

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant B as 🌐 Browser
    participant F as ⚛️ Frontend (Next.js)
    participant API as 🔌 API Service
    participant BE as 🚀 Backend (NestJS)
    participant G as 🔒 Guards
    participant S as 📦 Service
    participant DB as 🗄️ PostgreSQL
    participant WS as 🔔 WebSocket

    U->>B: Acessa aplicação
    B->>F: Carrega página
    F->>F: Verifica autenticação (AuthContext)
    
    alt Não autenticado
        F->>B: Redireciona para /login
        U->>B: Insere credenciais
        B->>API: POST /auth/login
        API->>BE: Requisição HTTP
        BE->>G: Valida credenciais
        G->>S: AuthService.login()
        S->>DB: SELECT * FROM funcionarios
        DB-->>S: Dados do funcionário
        S->>S: Gera JWT token
        S-->>BE: Token + dados
        BE-->>API: 200 OK + token
        API-->>F: Armazena token (localStorage)
        F->>F: Atualiza AuthContext
        F->>B: Redireciona para área apropriada
    end
    
    U->>B: Navega para página protegida
    B->>F: Carrega componente
    F->>API: GET /pedidos (+ Authorization header)
    API->>BE: Requisição HTTP com JWT
    BE->>G: JwtAuthGuard valida token
    G->>G: RolesGuard verifica permissões
    G->>S: PedidoService.findAll()
    S->>DB: SELECT com joins
    DB-->>S: Lista de pedidos
    S-->>BE: Dados processados
    BE-->>API: 200 OK + JSON
    API-->>F: Atualiza estado
    F->>B: Renderiza UI
    B->>U: Exibe dados
    
    Note over F,WS: Conexão WebSocket
    F->>WS: Conecta Socket.IO
    WS-->>F: Conexão estabelecida
    
    Note over BE,WS: Evento em tempo real
    BE->>WS: emit('novo_pedido', data)
    WS-->>F: Recebe evento
    F->>F: Atualiza estado React
    F->>B: Re-renderiza componente
    B->>U: Notificação + som
```

### 2.2 Fluxo de Autenticação Detalhado

```mermaid
sequenceDiagram
    participant C as Cliente
    participant F as Frontend
    participant API as Backend API
    participant JWT as JWT Strategy
    participant DB as Database
    participant CTX as AuthContext

    C->>F: Acessa /login
    F->>C: Exibe formulário
    C->>F: Submete email + senha
    
    F->>API: POST /auth/login
    Note over F,API: { email, senha }
    
    API->>DB: SELECT * FROM funcionarios WHERE email = ?
    DB-->>API: Funcionário encontrado
    
    API->>API: bcrypt.compare(senha, hash)
    
    alt Senha correta
        API->>JWT: Gera token
        Note over API,JWT: Payload: { id, email, cargo, empresaId }
        JWT-->>API: Token JWT (4h expiração)
        API-->>F: 200 OK { access_token, funcionario }
        
        F->>CTX: login(token, user)
        CTX->>CTX: localStorage.setItem('token')
        CTX->>CTX: Atualiza estado user
        
        F->>F: Redireciona baseado em cargo
        Note over F: ADMIN → /dashboard<br/>GARCOM → /garcom<br/>CAIXA → /caixa<br/>COZINHA → /cozinha
        
        F->>C: Exibe área apropriada
    else Senha incorreta
        API-->>F: 401 Unauthorized
        F->>C: Exibe erro
    end
```

### 2.3 Fluxo de Requisição Protegida

```mermaid
sequenceDiagram
    participant F as Frontend
    participant API as Backend
    participant JWT as JwtAuthGuard
    participant RG as RolesGuard
    participant S as Service
    participant DB as Database

    F->>API: GET /pedidos
    Note over F,API: Authorization: Bearer <token>
    
    API->>JWT: Valida token
    JWT->>JWT: Decodifica payload
    
    alt Token válido
        JWT->>JWT: Extrai user do payload
        JWT->>RG: Passa user para RolesGuard
        
        RG->>RG: Verifica @Roles decorator
        RG->>RG: Compara user.cargo com roles permitidas
        
        alt Cargo permitido
            RG->>S: Executa método do controller
            S->>DB: Query com filtros
            DB-->>S: Resultados
            S-->>API: Dados processados
            API-->>F: 200 OK + JSON
        else Cargo não permitido
            RG-->>API: 403 Forbidden
            API-->>F: Erro de permissão
        end
    else Token inválido/expirado
        JWT-->>API: 401 Unauthorized
        API-->>F: Redireciona para /login
    end
```

---

## 3. ⚡ Sequência de Operações Críticas

### 3.1 Criar Pedido (Operação Completa)

```mermaid
sequenceDiagram
    participant G as 👨‍🍳 Garçom
    participant F as Frontend
    participant API as Backend
    participant PS as PedidoService
    participant CS as ComandaService
    participant DB as Database
    participant WS as WebSocket Gateway
    participant K as 👨‍🍳 Cozinha

    G->>F: Seleciona mesa no mapa
    F->>F: Abre modal de pedido
    G->>F: Adiciona produtos (3x Cerveja, 1x Porção)
    G->>F: Adiciona observações
    G->>F: Confirma pedido
    
    F->>API: POST /pedidos
    Note over F,API: {<br/>  comandaId: "uuid",<br/>  itens: [{<br/>    produtoId: "uuid",<br/>    quantidade: 3,<br/>    observacao: "Bem gelada"<br/>  }]<br/>}
    
    API->>PS: create(createPedidoDto)
    
    PS->>DB: SELECT * FROM comandas WHERE id = ?
    DB-->>PS: Comanda encontrada
    
    PS->>PS: Valida comanda.status === ABERTA
    
    loop Para cada item
        PS->>DB: SELECT * FROM produtos WHERE id = ?
        DB-->>PS: Produto encontrado
        PS->>PS: Cria ItemPedido
        Note over PS: quantidade, precoUnitario, observacao
    end
    
    PS->>PS: Calcula total (Decimal.js)
    Note over PS: total = Σ (precoUnitario × quantidade)
    
    PS->>DB: BEGIN TRANSACTION
    PS->>DB: INSERT INTO pedidos
    PS->>DB: INSERT INTO itens_pedido (bulk)
    PS->>DB: COMMIT
    
    DB-->>PS: Pedido criado
    
    PS->>WS: emitNovoPedido(pedido)
    Note over PS,WS: Inclui todas relações:<br/>comanda, mesa, cliente, itens, produtos
    
    WS->>WS: Identifica ambientes dos produtos
    
    loop Para cada ambiente único
        WS->>K: emit('novo_pedido_ambiente:uuid', pedido)
        Note over WS,K: Apenas cozinha desse ambiente recebe
    end
    
    WS->>F: emit('novo_pedido', pedido)
    
    PS-->>API: Pedido completo
    API-->>F: 201 Created + pedido
    
    F->>F: Atualiza lista de pedidos
    F->>F: Exibe toast de sucesso
    F->>G: "Pedido enviado!"
    
    K->>K: Recebe notificação WebSocket
    K->>K: Toca som de alerta
    K->>K: Adiciona card na coluna "Feito"
    K->>K: Destaque visual por 5 segundos
```

### 3.2 Atualizar Status de Item (Cozinha → Garçom)

```mermaid
sequenceDiagram
    participant K as 👨‍🍳 Cozinheiro
    participant F as Frontend Cozinha
    participant API as Backend
    participant PS as PedidoService
    participant DB as Database
    participant WS as WebSocket
    participant FG as Frontend Garçom
    participant G as 👨‍🍳 Garçom

    K->>F: Arrasta card "Cerveja" para "Em Preparo"
    F->>API: PATCH /pedidos/item/:itemId/status
    Note over F,API: { status: "EM_PREPARO" }
    
    API->>PS: updateItemPedidoStatus(itemId, dto)
    
    PS->>DB: SELECT * FROM itens_pedido WHERE id = ?
    DB-->>PS: Item encontrado
    
    PS->>DB: UPDATE itens_pedido SET status = ?, inicio_preparo = NOW()
    DB-->>PS: Item atualizado
    
    PS->>DB: SELECT pedido com todas relações
    DB-->>PS: Pedido completo
    
    PS->>WS: emitStatusAtualizado(pedido)
    
    WS->>FG: emit('status_atualizado', pedido)
    WS->>WS: emit('status_atualizado_ambiente:uuid', pedido)
    
    PS-->>API: Item atualizado
    API-->>F: 200 OK
    
    F->>F: Move card visualmente
    F->>K: Feedback visual
    
    FG->>FG: Recebe WebSocket
    FG->>FG: Atualiza status do item
    FG->>G: Item agora "Em Preparo"
    
    Note over K,G: Processo continua até "PRONTO"
    
    K->>F: Move para "Pronto"
    F->>API: PATCH /pedidos/item/:itemId/status
    Note over F,API: { status: "PRONTO" }
    
    API->>PS: updateItemPedidoStatus()
    PS->>DB: UPDATE + SET pronto_em = NOW()
    PS->>WS: emitStatusAtualizado()
    
    WS->>FG: emit('status_atualizado')
    
    FG->>FG: 🔔 NOTIFICAÇÃO SONORA
    FG->>FG: Toast: "Cerveja pronta!"
    FG->>FG: Destaque visual no card
    FG->>G: Alerta de pedido pronto
```

### 3.3 Fechar Comanda e Registrar Pagamento

```mermaid
sequenceDiagram
    participant C as 💰 Caixa
    participant F as Frontend
    participant API as Backend
    participant CS as ComandaService
    participant CXS as CaixaService
    participant DB as Database
    participant WS as WebSocket

    C->>F: Busca comanda (mesa 5)
    F->>API: GET /comandas?mesaId=uuid
    API->>CS: findAll(filters)
    CS->>DB: SELECT com joins
    DB-->>CS: Comanda com pedidos
    CS-->>API: Dados
    API-->>F: Comanda completa
    
    F->>F: Exibe resumo
    Note over F: Total: R$ 150,00<br/>3 pedidos<br/>8 itens
    
    C->>F: Confirma pagamento (PIX)
    F->>API: PATCH /comandas/:id/fechar
    Note over F,API: {<br/>  formaPagamento: "PIX",<br/>  valorPago: 150.00<br/>}
    
    API->>CS: fecharComanda(id, dto)
    
    CS->>DB: BEGIN TRANSACTION
    
    CS->>DB: SELECT * FROM comandas WHERE id = ?
    DB-->>CS: Comanda encontrada
    
    CS->>CS: Valida status === ABERTA
    
    CS->>DB: SELECT pedidos WHERE comandaId = ?
    DB-->>CS: Lista de pedidos
    
    CS->>CS: Calcula total real
    Note over CS: Σ (pedido.total)
    
    CS->>CS: Valida valorPago >= total
    
    CS->>DB: UPDATE comandas SET status = 'PAGA', fechada_em = NOW()
    CS->>DB: UPDATE mesas SET status = 'LIVRE'
    
    CS->>CXS: Registra movimentação no caixa
    Note over CS,CXS: createVenda({<br/>  valor: 150.00,<br/>  formaPagamento: "PIX",<br/>  comandaId: "uuid"<br/>})
    
    CXS->>DB: INSERT INTO movimentacoes_caixa
    Note over CXS,DB: tipo: VENDA<br/>forma_pagamento: PIX<br/>valor: 150.00
    
    CXS->>WS: emitCaixaAtualizado(aberturaCaixaId)
    
    CS->>DB: COMMIT
    
    DB-->>CS: Sucesso
    CS-->>API: Comanda fechada
    API-->>F: 200 OK
    
    F->>F: Exibe tela de sucesso
    F->>F: Imprime comprovante (opcional)
    F->>C: "Pagamento registrado!"
    
    WS->>F: emit('comanda_atualizada')
    F->>F: Remove comanda da lista de abertas
```

### 3.4 Abertura de Caixa (Início do Turno)

```mermaid
sequenceDiagram
    participant CX as 💰 Caixa
    participant F as Frontend
    participant API as Backend
    participant TS as TurnoService
    participant CXS as CaixaService
    participant DB as Database
    participant WS as TurnoGateway

    CX->>F: Acessa /caixa
    F->>F: Verifica turno ativo
    
    alt Sem turno ativo
        F->>CX: Exibe botão "Iniciar Turno"
        CX->>F: Clica "Check-in"
        
        F->>API: POST /turnos/checkin
        API->>TS: checkin(funcionarioId)
        
        TS->>DB: INSERT INTO turnos_funcionario
        Note over TS,DB: funcionario_id<br/>checkIn: NOW()<br/>ativo: true
        
        DB-->>TS: Turno criado
        TS->>WS: emitCheckIn(turno)
        TS-->>API: Turno ativo
        API-->>F: 201 Created
        
        F->>F: Atualiza TurnoContext
        F->>CX: "Turno iniciado!"
    end
    
    F->>CX: Exibe botão "Abrir Caixa"
    CX->>F: Clica "Abrir Caixa"
    F->>F: Abre modal
    
    CX->>F: Informa valor inicial (R$ 200)
    CX->>F: Adiciona observação
    CX->>F: Confirma
    
    F->>API: POST /caixa/abertura
    Note over F,API: {<br/>  turnoFuncionarioId: "uuid",<br/>  valorInicial: 200.00,<br/>  observacao: "Troco do dia"<br/>}
    
    API->>CXS: abrirCaixa(dto)
    
    CXS->>DB: SELECT * FROM turnos WHERE id = ?
    DB-->>CXS: Turno encontrado
    
    CXS->>CXS: Valida turno.ativo === true
    
    CXS->>DB: SELECT * FROM aberturas_caixa WHERE turno = ? AND status = 'ABERTO'
    DB-->>CXS: Nenhum caixa aberto
    
    CXS->>DB: INSERT INTO aberturas_caixa
    Note over CXS,DB: turno_funcionario_id<br/>funcionario_id<br/>data_abertura: TODAY<br/>hora_abertura: NOW<br/>valor_inicial: 200.00<br/>status: ABERTO
    
    DB-->>CXS: Abertura criada
    CXS-->>API: Caixa aberto
    API-->>F: 201 Created
    
    F->>F: Atualiza CaixaContext
    F->>F: Redireciona para dashboard
    F->>CX: "Caixa aberto com sucesso!"
    
    Note over CX,F: Caixa agora pode registrar vendas
```

---

## 4. 📁 Estrutura de Diretórios Comentada

### 4.1 Backend (NestJS)

```
backend/
├── src/
│   ├── main.ts                          # 🚀 Entry point - Bootstrap da aplicação
│   │                                    # - Configura ValidationPipe global
│   │                                    # - Ativa Helmet, CORS, Rate Limiting
│   │                                    # - Registra Exception Filter e Logging Interceptor
│   │                                    # - Inicializa Swagger (apenas dev)
│   │                                    # - Executa seeder
│   │
│   ├── app.module.ts                    # 📦 Módulo raiz
│   │                                    # - Importa ConfigModule (validação Joi)
│   │                                    # - Configura TypeORM (PostgreSQL)
│   │                                    # - Importa 17 módulos de negócio
│   │                                    # - Configura ThrottlerModule (rate limiting)
│   │                                    # - Configura ScheduleModule (cron jobs)
│   │
│   ├── auth/                            # 🔐 Autenticação e Autorização
│   │   ├── auth.module.ts              # - Configura JwtModule (4h expiração)
│   │   ├── auth.service.ts             # - Login, validação de credenciais
│   │   ├── auth.controller.ts          # - POST /auth/login, GET /auth/profile
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts         # - Valida JWT, extrai payload
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts       # - Verifica se usuário está autenticado
│   │   │   └── roles.guard.ts          # - Verifica se cargo tem permissão
│   │   └── decorators/
│   │       ├── roles.decorator.ts      # - @Roles(Cargo.ADMIN, Cargo.GERENTE)
│   │       └── current-user.decorator.ts # - @CurrentUser() user: Funcionario
│   │
│   ├── common/                          # 🛠️ Utilitários Compartilhados
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # - Captura todas exceções
│   │   │                                # - Log diferenciado (erro/warn)
│   │   │                                # - Resposta padronizada JSON
│   │   └── interceptors/
│   │       └── logging.interceptor.ts   # - Log de entrada/saída
│   │                                    # - Calcula tempo de resposta
│   │                                    # - Log de erros
│   │
│   ├── database/                        # 🗄️ Configuração de Banco
│   │   ├── data-source.ts              # - TypeORM DataSource
│   │   │                                # - Configuração para migrations
│   │   ├── migrations/                  # - 16 arquivos de migration
│   │   │   ├── 1700000000000-InitialSchema.ts
│   │   │   ├── 1731431000000-CreateCaixaTables.ts
│   │   │   └── ...                      # - Versionamento do schema
│   │   ├── seeder.module.ts            # - Módulo de seed
│   │   └── seeder.service.ts           # - Popula dados iniciais
│   │                                    # - Empresa, Admin, Ambientes, Produtos
│   │
│   ├── shared/                          # 🔗 Módulos Compartilhados
│   │   └── storage/
│   │       ├── storage.module.ts       # - Módulo de storage
│   │       └── gcs-storage.service.ts  # - Upload para Google Cloud Storage
│   │                                    # - uploadFile(file, folderPath)
│   │                                    # - deleteFile(publicUrl)
│   │
│   └── modulos/                         # 📦 17 Módulos de Negócio
│       │
│       ├── ambiente/                    # 🏢 Ambientes (PREPARO/ATENDIMENTO)
│       │   ├── ambiente.module.ts      # - TypeORM: Ambiente, Produto, Mesa
│       │   ├── ambiente.controller.ts  # - CRUD de ambientes
│       │   ├── ambiente.service.ts     # - Lógica de negócio
│       │   ├── entities/
│       │   │   └── ambiente.entity.ts  # - @Entity('ambientes')
│       │   │                            # - id, nome, tipo, produtos[], mesas[]
│       │   └── dto/
│       │       ├── create-ambiente.dto.ts
│       │       └── update-ambiente.dto.ts
│       │
│       ├── analytics/                   # 📊 Relatórios e Métricas
│       │   ├── analytics.module.ts
│       │   ├── analytics.controller.ts # - GET /analytics/geral
│       │   │                            # - GET /analytics/garcons
│       │   │                            # - GET /analytics/ambientes
│       │   └── analytics.service.ts    # - Queries complexas com agregações
│       │                                # - Cálculo de métricas
│       │
│       ├── avaliacao/                   # ⭐ Sistema de Avaliações
│       │   ├── avaliacao.module.ts
│       │   ├── avaliacao.controller.ts # - POST /avaliacoes (criar)
│       │   │                            # - GET /avaliacoes (listar)
│       │   ├── avaliacao.service.ts    # - Estatísticas de satisfação
│       │   └── entities/
│       │       └── avaliacao.entity.ts # - nota (1-5), comentario, comandaId
│       │
│       ├── caixa/                       # 💰 Gestão Financeira (13 arquivos)
│       │   ├── caixa.module.ts         # - TypeORM: 4 entidades
│       │   │                            # - Importa PedidoModule (WebSocket)
│       │   ├── caixa.controller.ts     # - POST /caixa/abertura
│       │   │                            # - POST /caixa/fechamento
│       │   │                            # - POST /caixa/sangria
│       │   │                            # - POST /caixa/suprimento
│       │   │                            # - GET /caixa/resumo/:id
│       │   ├── caixa.service.ts        # - Lógica financeira complexa
│       │   │                            # - Cálculo de diferenças
│       │   │                            # - Validações de negócio
│       │   ├── entities/
│       │   │   ├── abertura-caixa.entity.ts    # - Abertura do caixa
│       │   │   ├── fechamento-caixa.entity.ts  # - Fechamento com totais
│       │   │   ├── sangria.entity.ts           # - Retiradas de dinheiro
│       │   │   └── movimentacao-caixa.entity.ts # - Vendas registradas
│       │   └── dto/                     # - 8 DTOs específicos
│       │
│       ├── cliente/                     # 👥 Gestão de Clientes
│       │   ├── cliente.module.ts
│       │   ├── cliente.controller.ts   # - CRUD de clientes
│       │   │                            # - GET /clientes/buscar/:termo
│       │   ├── cliente.service.ts      # - Busca por CPF, nome, telefone
│       │   └── entities/
│       │       └── cliente.entity.ts   # - cpf (unique), nome, email, celular
│       │
│       ├── comanda/                     # 📋 Sistema de Comandas (13 arquivos)
│       │   ├── comanda.module.ts       # - TypeORM: Comanda, Pedido, Mesa, Cliente
│       │   │                            # - Importa PedidoModule (WebSocket)
│       │   ├── comanda.controller.ts   # - POST /comandas (criar)
│       │   │                            # - GET /comandas/:id/public (QR Code)
│       │   │                            # - PATCH /comandas/:id/fechar
│       │   │                            # - POST /comandas/recuperar (público)
│       │   ├── comanda.service.ts      # - Lógica de abertura/fechamento
│       │   │                            # - Validações de status
│       │   │                            # - Cálculo de totais
│       │   ├── entities/
│       │   │   ├── comanda.entity.ts   # - status (ABERTA/FECHADA/PAGA)
│       │   │   │                        # - mesaId OU pontoEntregaId
│       │   │   │                        # - pedidos[], cliente
│       │   │   └── comanda-agregado.entity.ts # - Múltiplos clientes
│       │   └── dto/                     # - 6 DTOs
│       │
│       ├── empresa/                     # 🏢 Dados do Estabelecimento
│       │   ├── empresa.module.ts
│       │   ├── empresa.controller.ts   # - GET /empresa
│       │   │                            # - PATCH /empresa/:id
│       │   ├── empresa.service.ts
│       │   └── entities/
│       │       └── empresa.entity.ts   # - cnpj, nome, telefone, endereço
│       │
│       ├── estabelecimento/             # 🏗️ Layout (Entity apenas)
│       │   └── entities/
│       │       └── estabelecimento.entity.ts # - Configuração de layout
│       │                                # - Sem controller (não usado ainda)
│       │
│       ├── evento/                      # 🎉 Eventos Especiais
│       │   ├── evento.module.ts        # - Importa StorageModule
│       │   ├── evento.controller.ts    # - CRUD de eventos
│       │   │                            # - PATCH /eventos/:id/upload (imagem)
│       │   ├── evento.service.ts       # - Upload de imagens para GCS
│       │   │                            # - Pasta: eventos/
│       │   └── entities/
│       │       └── evento.entity.ts    # - titulo, descricao, dataEvento
│       │                                # - urlImagem, valor, ativo
│       │
│       ├── funcionario/                 # 👨‍💼 Gestão de Funcionários (11 arquivos)
│       │   ├── funcionario.module.ts
│       │   ├── funcionario.controller.ts # - CRUD (apenas ADMIN)
│       │   │                            # - PATCH /funcionarios/:id/senha
│       │   ├── funcionario.service.ts  # - Hash de senhas (bcrypt)
│       │   │                            # - Validações de email único
│       │   └── entities/
│       │       └── funcionario.entity.ts # - nome, email, senha (hash)
│       │                                # - cargo (enum: 5 roles)
│       │                                # - empresaId, ambienteId
│       │
│       ├── medalha/                     # 🏆 Sistema de Gamificação
│       │   ├── medalha.module.ts
│       │   ├── medalha.controller.ts   # - GET /medalhas/garcom/:id
│       │   │                            # - GET /medalhas/garcom/:id/progresso
│       │   ├── medalha.service.ts      # - Cálculo de conquistas
│       │   │                            # - Verificação de critérios
│       │   └── entities/
│       │       └── medalha.entity.ts   # - nome, descricao, criterio
│       │                                # - icone, funcionarioId
│       │
│       ├── mesa/                        # 🪑 Gestão de Mesas
│       │   ├── mesa.module.ts
│       │   ├── mesa.controller.ts      # - CRUD de mesas
│       │   │                            # - GET /mesas/publico (sem auth)
│       │   │                            # - PATCH /mesas/:id/status
│       │   ├── mesa.service.ts
│       │   └── entities/
│       │       └── mesa.entity.ts      # - numero, capacidade
│       │                                # - status (LIVRE/OCUPADA/RESERVADA)
│       │                                # - ambienteId, posicaoX, posicaoY
│       │
│       ├── pagina-evento/               # 📄 Landing Pages Customizáveis
│       │   ├── pagina-evento.module.ts # - Importa StorageModule
│       │   ├── pagina-evento.controller.ts # - CRUD de páginas
│       │   │                            # - Upload de imagens
│       │   ├── pagina-evento.service.ts
│       │   └── entities/
│       │       └── pagina-evento.entity.ts # - titulo, url_imagem, ativa
│       │
│       ├── pedido/                      # 🍽️ Sistema de Pedidos (22 arquivos)
│       │   ├── pedido.module.ts        # - TypeORM: 8 entidades
│       │   │                            # - Providers: Service, Analytics, Gateway, Scheduler
│       │   │                            # - Exports: Service, Analytics, Gateway
│       │   ├── pedido.controller.ts    # - POST /pedidos (criar)
│       │   │                            # - GET /pedidos (listar com filtros)
│       │   │                            # - PATCH /pedidos/:id/status
│       │   │                            # - PATCH /pedidos/item/:id/status
│       │   │                            # - POST /pedidos/:id/deixar-ambiente
│       │   │                            # - POST /pedidos/:id/marcar-entregue
│       │   ├── pedido.service.ts       # - Lógica complexa de pedidos
│       │   │                            # - Cálculo de totais (Decimal.js)
│       │   │                            # - Validações de status
│       │   │                            # - Rastreamento completo
│       │   ├── pedido-analytics.controller.ts # - Relatórios de pedidos
│       │   ├── pedido-analytics.service.ts    # - Métricas e estatísticas
│       │   ├── pedidos.gateway.ts      # 🔔 WebSocket Gateway
│       │   │                            # - emitNovoPedido()
│       │   │                            # - emitStatusAtualizado()
│       │   │                            # - emitComandaAtualizada()
│       │   │                            # - emitNovaComanda()
│       │   │                            # - emitCaixaAtualizado()
│       │   │                            # - Rooms por comanda
│       │   ├── quase-pronto.scheduler.ts # ⏰ Cron Job
│       │   │                            # - Executa a cada 30s
│       │   │                            # - Verifica itens "quase prontos"
│       │   │                            # - Notifica garçons
│       │   ├── entities/
│       │   │   ├── pedido.entity.ts    # - status, total, data
│       │   │   │                        # - criadoPor, entreguePor
│       │   │   │                        # - tempoTotalMinutos
│       │   │   ├── item-pedido.entity.ts # - quantidade, precoUnitario
│       │   │   │                        # - status individual
│       │   │   │                        # - inicioPreparo, prontoEm
│       │   │   └── retirada-item.entity.ts # - Retiradas de itens
│       │   ├── dto/                     # - 9 DTOs específicos
│       │   └── enums/
│       │       └── pedido-status.enum.ts # - 5 status possíveis
│       │
│       ├── ponto-entrega/               # 📍 Pontos de Entrega (Delivery)
│       │   ├── ponto-entrega.module.ts
│       │   ├── ponto-entrega.controller.ts # - CRUD de pontos
│       │   ├── ponto-entrega.service.ts
│       │   └── entities/
│       │       └── ponto-entrega.entity.ts # - nome, descricao
│       │                                # - ambienteAtendimentoId
│       │                                # - posicaoX, posicaoY
│       │
│       ├── produto/                     # 🍔 Catálogo de Produtos
│       │   ├── produto.module.ts       # - Importa StorageModule
│       │   ├── produto.controller.ts   # - CRUD de produtos
│       │   │                            # - POST com upload de imagem
│       │   ├── produto.service.ts      # - Upload para GCS (pasta: produtos/)
│       │   └── entities/
│       │       └── produto.entity.ts   # - nome, descricao, preco
│       │                                # - categoria, urlImagem
│       │                                # - ambienteId (preparo), ativo
│       │
│       └── turno/                       # ⏰ Check-in/Check-out (8 arquivos)
│           ├── turno.module.ts
│           ├── turno.controller.ts     # - POST /turnos/checkin
│           │                            # - POST /turnos/checkout
│           │                            # - GET /turnos/ativo
│           ├── turno.service.ts        # - Cálculo de horas trabalhadas
│           │                            # - Validações de turno
│           ├── turno.gateway.ts        # 🔔 WebSocket Gateway
│           │                            # - emitCheckIn()
│           │                            # - emitCheckOut()
│           │                            # - emitFuncionariosAtualizados()
│           └── entities/
│               └── turno-funcionario.entity.ts # - checkIn, checkOut
│                                        # - ativo, funcionarioId
│
├── test/                                # 🧪 Testes
│   └── app.e2e-spec.ts                 # - Testes E2E (básico)
│
├── gcs-credentials.json                 # 🔑 Credenciais Google Cloud
├── .env                                 # ⚙️ Variáveis de ambiente
├── .env.example                         # 📝 Template de configuração
├── package.json                         # 📦 Dependências
├── tsconfig.json                        # 🔧 Configuração TypeScript
├── nest-cli.json                        # 🔧 Configuração NestJS
└── docker-compose.yml                   # 🐳 Orquestração de containers
```

### 4.2 Frontend (Next.js 15)

```
frontend/
├── src/
│   ├── app/                             # 🌐 App Router (Next.js 15)
│   │   │
│   │   ├── layout.tsx                   # 🎨 Root Layout
│   │   │                                # - Providers: Theme, Auth, Turno, Caixa, Socket
│   │   │                                # - Toaster (Sonner)
│   │   │                                # - Fonte: Inter
│   │   │
│   │   ├── page.tsx                     # 🏠 Página inicial (/)
│   │   │                                # - Redireciona para /entrada
│   │   │
│   │   ├── globals.css                  # 🎨 Estilos globais
│   │   │                                # - Tailwind CSS
│   │   │                                # - Variáveis CSS
│   │   │
│   │   ├── (auth)/                      # 🔐 Rotas de Autenticação
│   │   │   └── login/
│   │   │       └── page.tsx             # - Formulário de login
│   │   │                                # - Redireciona baseado em cargo
│   │   │
│   │   ├── (cliente)/                   # 👥 Interface Pública (9 itens)
│   │   │   ├── layout.tsx               # - FloatingNav
│   │   │   ├── acesso-cliente/
│   │   │   │   └── [comandaId]/
│   │   │   │       └── page.tsx         # - Acompanhamento de pedidos
│   │   │   │                            # - WebSocket para tempo real
│   │   │   │                            # - Tela de "Comanda Paga"
│   │   │   ├── cardapio/
│   │   │   │   └── [comandaId]/
│   │   │   │       └── page.tsx         # - Cardápio digital
│   │   │   │                            # - Adicionar produtos ao carrinho
│   │   │   │                            # - Fazer pedido
│   │   │   └── portal-cliente/
│   │   │       └── [comandaId]/
│   │   │           └── page.tsx         # - Hub do cliente
│   │   │                                # - QR Code, localização, links
│   │   │
│   │   ├── (protected)/                 # 🔒 Rotas Protegidas (52 itens)
│   │   │   ├── layout.tsx               # - RoleGuard
│   │   │   │                            # - Sidebar + Header
│   │   │   │
│   │   │   ├── dashboard/               # 📊 Dashboard Principal (33 itens)
│   │   │   │   ├── page.tsx             # - Dashboard geral
│   │   │   │   │                        # - Métricas do dia
│   │   │   │   │                        # - Gráficos (BentoGrid)
│   │   │   │   │
│   │   │   │   ├── admin/               # ⚙️ Área Administrativa (14 itens)
│   │   │   │   │   ├── empresa/         # - Dados da empresa
│   │   │   │   │   ├── funcionarios/    # - CRUD de funcionários
│   │   │   │   │   ├── ambientes/       # - CRUD de ambientes
│   │   │   │   │   ├── produtos/        # - CRUD de produtos
│   │   │   │   │   ├── mesas/           # - CRUD de mesas
│   │   │   │   │   ├── clientes/        # - CRUD de clientes
│   │   │   │   │   ├── eventos/         # - CRUD de eventos
│   │   │   │   │   └── paginas-evento/  # - Landing pages
│   │   │   │   │
│   │   │   │   ├── operacional/         # 🎯 Área Operacional (7 itens)
│   │   │   │   │   ├── [ambienteId]/    # - Kanban por ambiente
│   │   │   │   │   │   └── page.tsx     # - Colunas: Feito/Preparo/Pronto/Entregue
│   │   │   │   │   │                    # - Drag & drop
│   │   │   │   │   │                    # - WebSocket tempo real
│   │   │   │   │   └── mesas/
│   │   │   │   │       └── page.tsx     # - Mapa de mesas operacional
│   │   │   │   │                        # - Cards agrupados por ambiente
│   │   │   │   │
│   │   │   │   ├── relatorios/          # 📈 Analytics (1 item)
│   │   │   │   │   └── page.tsx         # - Relatórios gerais
│   │   │   │   │                        # - Performance de garçons
│   │   │   │   │                        # - Performance de ambientes
│   │   │   │   │                        # - Produtos mais/menos vendidos
│   │   │   │   │
│   │   │   │   ├── mapa/                # 🗺️ Mapa Visual (2 itens)
│   │   │   │   │   ├── configurar/      # - Drag & drop de mesas
│   │   │   │   │   │   └── page.tsx     # - Salvar posições X, Y
│   │   │   │   │   └── visualizar/      # - Visualização espacial
│   │   │   │   │       └── page.tsx     # - Cores por status
│   │   │   │   │
│   │   │   │   ├── gestaopedidos/       # 📋 Gestão de Pedidos (4 itens)
│   │   │   │   │   └── page.tsx         # - Lista todos os pedidos
│   │   │   │   │                        # - Filtros avançados
│   │   │   │   │                        # - WebSocket
│   │   │   │   │
│   │   │   │   ├── comandas/            # 📋 Gestão de Comandas
│   │   │   │   │   └── page.tsx         # - Lista comandas abertas
│   │   │   │   │                        # - Busca e filtros
│   │   │   │   │
│   │   │   │   ├── cardapio/            # 🍔 Gestão de Cardápio
│   │   │   │   │   └── page.tsx         # - CRUD de produtos
│   │   │   │   │
│   │   │   │   ├── cozinha/             # 👨‍🍳 Painel Cozinha
│   │   │   │   │   └── page.tsx         # - Redireciona para Kanban
│   │   │   │   │
│   │   │   │   └── perfil/              # 👤 Perfil do Usuário
│   │   │   │       └── page.tsx         # - Dados pessoais
│   │   │   │                            # - Trocar senha
│   │   │   │                            # - Status de turno
│   │   │   │
│   │   │   ├── caixa/                   # 💰 Área do Caixa (9 itens)
│   │   │   │   ├── page.tsx             # - Dashboard do caixa
│   │   │   │   │                        # - Check-in/checkout
│   │   │   │   │                        # - Estatísticas do dia
│   │   │   │   │                        # - Atalhos rápidos
│   │   │   │   ├── abertura/            # - Abrir caixa
│   │   │   │   ├── fechamento/          # - Fechar caixa
│   │   │   │   ├── sangria/             # - Registrar sangria
│   │   │   │   ├── suprimento/          # - Registrar suprimento
│   │   │   │   ├── terminal/            # - Terminal de busca
│   │   │   │   │   └── page.tsx         # - Busca por mesa/cliente/CPF
│   │   │   │   │                        # - 3 tabs: Buscar, Mesas, Clientes
│   │   │   │   └── comandas-abertas/    # - Lista comandas abertas
│   │   │   │       └── page.tsx         # - Cards com informações
│   │   │   │
│   │   │   ├── garcom/                  # 👨‍🍳 Área do Garçom (6 itens)
│   │   │   │   ├── page.tsx             # - Dashboard do garçom
│   │   │   │   │                        # - Check-in/checkout
│   │   │   │   │                        # - Estatísticas pessoais
│   │   │   │   │                        # - Atalhos rápidos
│   │   │   │   ├── mapa/                # - Mapa de mesas
│   │   │   │   │   └── page.tsx         # - Cards por ambiente
│   │   │   │   │                        # - Abrir/continuar comanda
│   │   │   │   ├── mapa-visual/         # - Visualização espacial
│   │   │   │   │   └── page.tsx         # - Mapa 2D com posições
│   │   │   │   │                        # - Cores semáforicas
│   │   │   │   │                        # - Filtro "Apenas prontos"
│   │   │   │   ├── novo-pedido/         # - Criar pedido
│   │   │   │   │   └── page.tsx         # - Formulário completo
│   │   │   │   ├── qrcode-comanda/      # - Gerar QR Code
│   │   │   │   │   └── page.tsx         # - QR Code da comanda
│   │   │   │   └── ranking/             # - Ranking (UI pendente)
│   │   │   │       └── page.tsx         # - Gamificação
│   │   │   │
│   │   │   ├── cozinha/                 # 👨‍🍳 Painel Cozinha (2 itens)
│   │   │   │   └── page.tsx             # - Redireciona para Kanban
│   │   │   │
│   │   │   └── mesas/                   # 🪑 Gestão de Mesas (1 item)
│   │   │       └── page.tsx             # - CRUD de mesas
│   │   │
│   │   ├── entrada/                     # 🚪 Página de Entrada (2 itens)
│   │   │   └── page.tsx                 # - Página inicial pública
│   │   │                                # - Link para recuperar comanda
│   │   │
│   │   ├── evento/                      # 🎉 Landing Pages de Eventos (2 itens)
│   │   │   └── [id]/
│   │   │       └── page.tsx             # - Landing page customizável
│   │   │                                # - QR Code de entrada
│   │   │
│   │   └── comanda/                     # 📋 Visualização Pública (1 item)
│   │       └── [id]/
│   │           └── page.tsx             # - Visualização via QR Code
│   │
│   ├── components/                      # 🧩 Componentes Reutilizáveis
│   │   ├── layout/                      # - Sidebar, Header, FloatingNav
│   │   ├── guards/                      # - RoleGuard, AuthGuard
│   │   ├── dashboard/                   # - BentoGrid, MetricCard, ChartCard
│   │   ├── mapa/                        # - MapaInterativo, ElementoDraggable
│   │   ├── pedidos/                     # - PedidoCard, ItemPedidoCard
│   │   ├── caixa/                       # - CaixaCard, MovimentacaoCard
│   │   ├── funcionarios/                # - FuncionarioTable, FuncionarioForm
│   │   └── ui/                          # - shadcn/ui (34 componentes)
│   │
│   ├── context/                         # 🎯 Contextos React
│   │   ├── AuthContext.tsx              # - JWT, user, login/logout
│   │   ├── TurnoContext.tsx             # - Check-in/out, turno ativo
│   │   ├── CaixaContext.tsx             # - Estado do caixa
│   │   └── SocketContext.tsx            # - WebSocket connection
│   │
│   ├── hooks/                           # 🪝 Hooks Customizados
│   │   ├── useAmbienteNotification.ts   # - WebSocket por ambiente
│   │   ├── useAuth.ts                   # - Hook de autenticação
│   │   └── useTurno.ts                  # - Hook de turno
│   │
│   ├── services/                        # 🔌 Serviços de API (20 arquivos)
│   │   ├── api.ts                       # - Axios instance configurado
│   │   │                                # - Interceptors (token, timeout)
│   │   ├── authService.ts               # - Login, profile
│   │   ├── pedidoService.ts             # - CRUD de pedidos
│   │   ├── comandaService.ts            # - CRUD de comandas
│   │   ├── caixaService.ts              # - Operações de caixa
│   │   ├── produtoService.ts            # - CRUD de produtos
│   │   ├── mesaService.ts               # - CRUD de mesas
│   │   ├── funcionarioService.ts        # - CRUD de funcionários
│   │   ├── turnoService.ts              # - Check-in/out
│   │   ├── analyticsService.ts          # - Relatórios
│   │   └── ...                          # - Outros 10 services
│   │
│   ├── types/                           # 📝 Tipos TypeScript
│   │   ├── pedido.ts                    # - Pedido, ItemPedido, PedidoStatus
│   │   ├── comanda.ts                   # - Comanda, ComandaStatus
│   │   ├── funcionario.ts               # - Funcionario, Cargo
│   │   ├── produto.ts                   # - Produto
│   │   └── ...                          # - Outros tipos
│   │
│   └── lib/                             # 🛠️ Utilitários
│       ├── socket.ts                    # - Socket.IO client
│       ├── logger.ts                    # - Logger frontend
│       └── utils.ts                     # - Funções auxiliares
│
├── public/                              # 📁 Arquivos Estáticos
│   ├── sounds/                          # - Sons de notificação
│   │   ├── notification.mp3
│   │   └── alert.mp3
│   └── images/                          # - Imagens estáticas
│
├── .env.local                           # ⚙️ Variáveis de ambiente
├── .env.example                         # 📝 Template
├── package.json                         # 📦 Dependências
├── tsconfig.json                        # 🔧 TypeScript config
├── next.config.js                       # 🔧 Next.js config
├── tailwind.config.ts                   # 🎨 Tailwind config
└── components.json                      # 🧩 shadcn/ui config
```

---

*Documento gerado em 17/12/2025*
