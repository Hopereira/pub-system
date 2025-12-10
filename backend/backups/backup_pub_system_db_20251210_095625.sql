--
-- PostgreSQL database dump
--

\restrict KcVgyVQGWpmtK1hZmJoyqWmCHjElBmuPLhERx1J4hVDkav1FBlOTZ1vpv2s79cm

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: ambientes_tipo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ambientes_tipo_enum AS ENUM (
    'PREPARO',
    'ATENDIMENTO'
);


ALTER TYPE public.ambientes_tipo_enum OWNER TO postgres;

--
-- Name: comandas_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.comandas_status_enum AS ENUM (
    'ABERTA',
    'FECHADA',
    'PAGA'
);


ALTER TYPE public.comandas_status_enum OWNER TO postgres;

--
-- Name: funcionarios_cargo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.funcionarios_cargo_enum AS ENUM (
    'ADMIN',
    'CAIXA',
    'GARCOM',
    'COZINHA'
);


ALTER TYPE public.funcionarios_cargo_enum OWNER TO postgres;

--
-- Name: itens_pedido_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.itens_pedido_status_enum AS ENUM (
    'FEITO',
    'EM_PREPARO',
    'PRONTO',
    'ENTREGUE',
    'CANCELADO',
    'DEIXADO_NO_AMBIENTE',
    'QUASE_PRONTO',
    'RETIRADO'
);


ALTER TYPE public.itens_pedido_status_enum OWNER TO postgres;

--
-- Name: mesas_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.mesas_status_enum AS ENUM (
    'LIVRE',
    'OCUPADA',
    'RESERVADA',
    'AGUARDANDO_PAGAMENTO'
);


ALTER TYPE public.mesas_status_enum OWNER TO postgres;

--
-- Name: pedidos_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.pedidos_status_enum AS ENUM (
    'FEITO',
    'EM_PREPARO',
    'PRONTO',
    'ENTREGUE',
    'CANCELADO'
);


ALTER TYPE public.pedidos_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aberturas_caixa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aberturas_caixa (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    turno_funcionario_id uuid NOT NULL,
    funcionario_id uuid NOT NULL,
    "dataAbertura" date NOT NULL,
    "horaAbertura" time without time zone NOT NULL,
    "valorInicial" numeric(10,2) DEFAULT 0 NOT NULL,
    observacao text,
    status character varying DEFAULT 'ABERTO'::character varying NOT NULL,
    "criadoEm" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "atualizadoEm" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.aberturas_caixa OWNER TO postgres;

--
-- Name: ambientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ambientes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    tipo public.ambientes_tipo_enum DEFAULT 'ATENDIMENTO'::public.ambientes_tipo_enum NOT NULL,
    is_ponto_de_retirada boolean DEFAULT false NOT NULL
);


ALTER TABLE public.ambientes OWNER TO postgres;

--
-- Name: avaliacoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avaliacoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "comandaId" uuid NOT NULL,
    "clienteId" uuid,
    nota integer NOT NULL,
    comentario text,
    "tempoEstadia" integer,
    "valorGasto" numeric(10,2) NOT NULL,
    "criadoEm" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.avaliacoes OWNER TO postgres;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cpf character varying NOT NULL,
    nome character varying NOT NULL,
    email character varying,
    celular character varying,
    ambiente_id uuid,
    ponto_entrega_id uuid
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- Name: comanda_agregados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comanda_agregados (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    comanda_id uuid NOT NULL,
    nome character varying(100) NOT NULL,
    cpf character varying(11),
    ordem integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comanda_agregados OWNER TO postgres;

--
-- Name: comandas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comandas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    status public.comandas_status_enum DEFAULT 'ABERTA'::public.comandas_status_enum NOT NULL,
    "mesaId" uuid,
    "clienteId" uuid,
    "dataAbertura" timestamp without time zone DEFAULT now() NOT NULL,
    "paginaEventoId" uuid,
    ponto_entrega_id uuid,
    criado_por_id uuid,
    criado_por_tipo character varying
);


ALTER TABLE public.comandas OWNER TO postgres;

--
-- Name: empresas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empresas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cnpj character varying NOT NULL,
    "nomeFantasia" character varying NOT NULL,
    "razaoSocial" character varying NOT NULL,
    telefone character varying,
    endereco character varying
);


ALTER TABLE public.empresas OWNER TO postgres;

--
-- Name: eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titulo character varying NOT NULL,
    descricao text,
    valor numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp without time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp without time zone DEFAULT now() NOT NULL,
    "paginaEventoId" uuid,
    "dataEvento" timestamp without time zone NOT NULL,
    "urlImagem" character varying
);


ALTER TABLE public.eventos OWNER TO postgres;

--
-- Name: fechamentos_caixa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fechamentos_caixa (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    abertura_caixa_id uuid NOT NULL,
    turno_funcionario_id uuid NOT NULL,
    funcionario_id uuid NOT NULL,
    "dataFechamento" date NOT NULL,
    "horaFechamento" time without time zone NOT NULL,
    "valorEsperadoDinheiro" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorEsperadoPix" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorEsperadoDebito" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorEsperadoCredito" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorEsperadoValeRefeicao" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorEsperadoValeAlimentacao" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorEsperadoTotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorInformadoDinheiro" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorInformadoPix" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorInformadoDebito" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorInformadoCredito" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorInformadoValeRefeicao" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorInformadoValeAlimentacao" numeric(10,2) DEFAULT 0 NOT NULL,
    "valorInformadoTotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "diferencaDinheiro" numeric(10,2) DEFAULT 0 NOT NULL,
    "diferencaPix" numeric(10,2) DEFAULT 0 NOT NULL,
    "diferencaDebito" numeric(10,2) DEFAULT 0 NOT NULL,
    "diferencaCredito" numeric(10,2) DEFAULT 0 NOT NULL,
    "diferencaValeRefeicao" numeric(10,2) DEFAULT 0 NOT NULL,
    "diferencaValeAlimentacao" numeric(10,2) DEFAULT 0 NOT NULL,
    "diferencaTotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "totalSangrias" numeric(10,2) DEFAULT 0 NOT NULL,
    "quantidadeSangrias" integer DEFAULT 0 NOT NULL,
    "quantidadeVendas" integer DEFAULT 0 NOT NULL,
    "quantidadeComandasFechadas" integer DEFAULT 0 NOT NULL,
    "ticketMedio" numeric(10,2) DEFAULT 0 NOT NULL,
    observacao text,
    status character varying DEFAULT 'FECHADO'::character varying NOT NULL,
    "criadoEm" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fechamentos_caixa OWNER TO postgres;

--
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funcionarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying NOT NULL,
    email character varying NOT NULL,
    senha character varying NOT NULL,
    cargo public.funcionarios_cargo_enum DEFAULT 'GARCOM'::public.funcionarios_cargo_enum NOT NULL,
    empresa_id uuid,
    ambiente_id uuid,
    status character varying DEFAULT 'ATIVO'::character varying
);


ALTER TABLE public.funcionarios OWNER TO postgres;

--
-- Name: itens_pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.itens_pedido (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quantidade integer NOT NULL,
    "precoUnitario" numeric(10,2) NOT NULL,
    observacao character varying(255),
    status public.itens_pedido_status_enum DEFAULT 'FEITO'::public.itens_pedido_status_enum NOT NULL,
    "motivoCancelamento" character varying(255),
    "pedidoId" uuid,
    "produtoId" uuid,
    ambiente_retirada_id uuid,
    "iniciadoEm" timestamp without time zone,
    quase_pronto_em timestamp without time zone,
    "prontoEm" timestamp without time zone,
    retirado_em timestamp without time zone,
    "entregueEm" timestamp without time zone,
    "canceladoEm" timestamp without time zone,
    tempo_preparo_minutos numeric(5,2),
    responsavel_inicio_id uuid,
    responsavel_pronto_id uuid,
    responsavel_cancelamento_id uuid,
    retirado_por_garcom_id uuid,
    garcom_entrega_id uuid,
    tempo_reacao_minutos numeric(5,2),
    tempo_entrega_final_minutos numeric(5,2),
    tempoentregaminutos numeric(5,2),
    tempo_entrega_minutos integer
);


ALTER TABLE public.itens_pedido OWNER TO postgres;

--
-- Name: mesas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mesas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero integer NOT NULL,
    status public.mesas_status_enum DEFAULT 'LIVRE'::public.mesas_status_enum NOT NULL,
    ambiente_id uuid,
    posicao json,
    tamanho json,
    rotacao integer DEFAULT 0
);


ALTER TABLE public.mesas OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: movimentacoes_caixa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimentacoes_caixa (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    abertura_caixa_id uuid NOT NULL,
    tipo character varying NOT NULL,
    data date NOT NULL,
    hora time without time zone NOT NULL,
    valor numeric(10,2) NOT NULL,
    "formaPagamento" character varying,
    descricao text NOT NULL,
    funcionario_id uuid NOT NULL,
    comanda_id uuid,
    comanda_numero character varying,
    "criadoEm" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.movimentacoes_caixa OWNER TO postgres;

--
-- Name: paginas_evento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paginas_evento (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titulo character varying(100) NOT NULL,
    url_imagem text,
    ativa boolean DEFAULT true NOT NULL,
    criado_em timestamp without time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.paginas_evento OWNER TO postgres;

--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    status public.pedidos_status_enum DEFAULT 'FEITO'::public.pedidos_status_enum NOT NULL,
    total numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    data timestamp without time zone DEFAULT now() NOT NULL,
    "motivoCancelamento" character varying(255),
    "comandaId" uuid,
    criado_por_id uuid,
    criado_por_tipo character varying,
    entregue_por_id uuid,
    entregue_em timestamp without time zone,
    tempo_total_minutos numeric(5,2)
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- Name: pontos_entrega; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pontos_entrega (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    ambiente_preparo_id uuid NOT NULL,
    mesa_proxima_id uuid,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    posicao json,
    tamanho json,
    empresa_id uuid,
    ambiente_atendimento_id uuid
);


ALTER TABLE public.pontos_entrega OWNER TO postgres;

--
-- Name: produtos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produtos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying NOT NULL,
    descricao character varying,
    preco numeric(10,2) NOT NULL,
    categoria character varying NOT NULL,
    "urlImagem" character varying(512),
    ativo boolean DEFAULT true NOT NULL,
    "ambienteId" uuid
);


ALTER TABLE public.produtos OWNER TO postgres;

--
-- Name: sangrias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sangrias (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    abertura_caixa_id uuid NOT NULL,
    turno_funcionario_id uuid NOT NULL,
    funcionario_id uuid NOT NULL,
    "dataSangria" date NOT NULL,
    "horaSangria" time without time zone NOT NULL,
    valor numeric(10,2) NOT NULL,
    motivo character varying(255) NOT NULL,
    observacao text,
    "autorizadoPor" character varying(255),
    "autorizadoCargo" character varying(50),
    "criadoEm" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sangrias OWNER TO postgres;

--
-- Name: turnos_funcionario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.turnos_funcionario (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    funcionario_id uuid NOT NULL,
    "checkIn" timestamp without time zone NOT NULL,
    "checkOut" timestamp without time zone,
    "horasTrabalhadas" integer,
    ativo boolean DEFAULT true NOT NULL,
    evento_id uuid,
    "criadoEm" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.turnos_funcionario OWNER TO postgres;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: aberturas_caixa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aberturas_caixa (id, turno_funcionario_id, funcionario_id, "dataAbertura", "horaAbertura", "valorInicial", observacao, status, "criadoEm", "atualizadoEm") FROM stdin;
5d0947da-b540-4bcf-a0a4-a5d082c5e98d	185b7a4c-e29f-46ae-a62e-f42a570dbe32	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12	16:43:54	50.00	\N	ABERTO	2025-11-12 16:43:54.421347	2025-11-12 16:43:54.421347
ffcd8397-7d46-4b6c-9299-8e24efd885e7	c0141c7a-fadf-4756-926f-c241e7db3ee6	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12	16:57:18	50.00	\N	FECHADO	2025-11-12 16:57:18.297543	2025-11-12 17:41:05.189421
472eb987-1c0e-4758-97a3-aac35f42b725	0eba337a-383e-4d7e-b2a7-37643efb9aef	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-14	00:30:15	0.00	\N	FECHADO	2025-11-14 00:30:15.233107	2025-11-14 01:11:09.087568
ef089ada-3bad-4df8-8d7f-39ada7ab9a8c	807e853b-c578-405a-b237-f80a32e34d7b	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-14	01:11:43	0.00	\N	ABERTO	2025-11-14 01:11:43.37329	2025-11-14 01:11:43.37329
c5bdc7f6-d16e-435c-b62a-e4ed626d2de0	cfbf92fd-ba79-46ba-a306-c91d6cf42208	205f8da5-3942-4d1e-9a3f-4d443c404dd2	2025-12-09	18:06:19	100.00	Teste automatizado - Fluxo Financeiro	ABERTO	2025-12-09 21:06:19.37829	2025-12-09 21:06:19.37829
\.


--
-- Data for Name: ambientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ambientes (id, nome, descricao, tipo, is_ponto_de_retirada) FROM stdin;
97ec65b9-2952-4635-be83-882e30117582	Cozinha Quente	Preparo de pratos quentes, grelhados e frituras	PREPARO	f
e6f3566d-44f9-4948-8cdb-131a2bbd61a9	Cozinha Fria	Preparo de saladas, frios e sobremesas	PREPARO	f
d11fc8be-074b-4f56-9b76-73e5f877209e	Bar Principal	Preparo de bebidas e drinks	PREPARO	f
18caff78-bad0-43e9-a852-5282dab09a96	Churrasqueira	Preparo de carnes na brasa	PREPARO	f
ef5f3912-a59c-4e7b-871d-3e396231e274	Confeitaria	Preparo de doces e bolos	PREPARO	f
2cd8b3c3-6215-482b-991c-0de6770945f2	Salão Principal	Área de atendimento principal	ATENDIMENTO	f
71c4703e-1f1c-4f33-af5f-3e2330e93581	Varanda	Área externa coberta	ATENDIMENTO	f
4213bd71-d99c-405c-9782-67a86b866982	Área VIP	Espaço reservado premium	ATENDIMENTO	f
\.


--
-- Data for Name: avaliacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.avaliacoes (id, "comandaId", "clienteId", nota, comentario, "tempoEstadia", "valorGasto", "criadoEm") FROM stdin;
b7ccab8f-c055-47f8-b0bb-7d29b2882d3f	64ecbe00-9c08-477c-b34d-b28b1e727fd0	e30b5749-6d38-43ab-a932-b4a6f124f71b	5	\N	14	21.00	2025-11-12 17:29:01.183096
f5b7c3ff-65f9-46c9-8ec8-8b3d84bfed0f	f3fc2941-c33f-4b5c-8851-c2228d99ca7e	edd1f2d9-f099-4f7b-87c6-69fb1251162b	5	\N	59	50.00	2025-11-14 01:09:57.331501
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id, cpf, nome, email, celular, ambiente_id, ponto_entrega_id) FROM stdin;
90ee4483-a2cf-4165-8727-4c08f67bcd43	12345678900	João Silva	joao.silva@email.com	11987654321	\N	\N
913b58b8-18c3-4c04-bb8b-97ccba7c6f22	98765432100	Maria Santos	maria.santos@email.com	11976543210	\N	\N
3e92a0db-b149-4db2-bbac-3ff87bd94308	11122233344	Pedro Oliveira	pedro.oliveira@email.com	11965432109	\N	\N
e3fbeb6e-7fa4-49ce-863a-0951055e3921	55566677788	Ana Costa	ana.costa@email.com	11954321098	\N	\N
94d165aa-7b2a-44e7-82cc-a753407ea5bc	99988877766	Carlos Pereira	carlos.pereira@email.com	11943210987	\N	\N
edd1f2d9-f099-4f7b-87c6-69fb1251162b	11111111111	zeee	\N	\N	\N	\N
e30b5749-6d38-43ab-a932-b4a6f124f71b	12345678909	sssssssss	\N	\N	\N	\N
\.


--
-- Data for Name: comanda_agregados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comanda_agregados (id, comanda_id, nome, cpf, ordem, created_at) FROM stdin;
\.


--
-- Data for Name: comandas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comandas (id, status, "mesaId", "clienteId", "dataAbertura", "paginaEventoId", ponto_entrega_id, criado_por_id, criado_por_tipo) FROM stdin;
a2ddb0ca-5433-4d3d-9150-838605be449a	FECHADA	\N	edd1f2d9-f099-4f7b-87c6-69fb1251162b	2025-11-12 02:59:31.177359	0f01d977-300d-4d89-92c9-7f8f5247eacb	52288d7e-7292-435a-b4c9-777294227622	\N	\N
64ecbe00-9c08-477c-b34d-b28b1e727fd0	FECHADA	\N	e30b5749-6d38-43ab-a932-b4a6f124f71b	2025-11-12 17:15:00.126625	0f01d977-300d-4d89-92c9-7f8f5247eacb	36345db0-20f6-4c82-b7b3-9b6840192b06	\N	\N
b24b0f1e-f537-4ddd-9be6-a9166c711271	FECHADA	5f80a72c-2bc4-4886-b66e-a2ec37ee96ac	\N	2025-11-12 17:38:04.681401	\N	\N	\N	\N
f3fc2941-c33f-4b5c-8851-c2228d99ca7e	FECHADA	\N	edd1f2d9-f099-4f7b-87c6-69fb1251162b	2025-11-14 00:10:41.793332	0f01d977-300d-4d89-92c9-7f8f5247eacb	36345db0-20f6-4c82-b7b3-9b6840192b06	\N	\N
522f904d-0971-403c-9eb7-926fb7df19eb	ABERTA	5f80a72c-2bc4-4886-b66e-a2ec37ee96ac	\N	2025-12-09 20:53:44.517624	\N	\N	\N	\N
04ef74be-8391-4618-ada7-cd09d8cc3ae5	ABERTA	ec2268c7-d62c-4855-92ef-bc2aa9461e2d	\N	2025-12-09 21:02:24.13669	\N	\N	\N	\N
9c58aa5d-2dbf-4a15-a46e-96ccad7b96e1	ABERTA	9e35e71c-3a96-49be-8a1d-dee454fe5958	\N	2025-12-09 21:03:40.121193	\N	\N	\N	\N
dd6e290c-abaa-41e0-b122-db3ce441034c	ABERTA	5256389e-9ef3-4e21-9d4a-00a975d0c194	\N	2025-12-09 21:04:45.371422	\N	\N	\N	\N
151ed5ac-486c-4dc4-9408-9b300490c6c9	ABERTA	6cd96263-7cd6-4251-b5f5-a3dcb6538164	\N	2025-12-09 21:05:38.986347	\N	\N	\N	\N
82a41380-a359-4802-8935-1c0a23257f2e	ABERTA	ef5404e2-3eb2-40b0-8ea1-8f55e6802c1b	\N	2025-12-09 21:05:56.612721	\N	\N	\N	\N
4c9e56c1-99ef-4644-857c-1e9e4b00ede6	ABERTA	495e66a4-8a60-4e33-b887-1de6d608ae5e	\N	2025-12-09 21:06:19.484485	\N	\N	\N	\N
\.


--
-- Data for Name: empresas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.empresas (id, cnpj, "nomeFantasia", "razaoSocial", telefone, endereco) FROM stdin;
48ac7710-2f39-497b-8d29-a70952054221	15929437000181	Hebert O Pereira	teste	24998285751	Rua Professor João de Deus, 544
ded57eb9-7c67-4a31-a39d-3b289a1fe28f	00.000.000/0000-00	Pub System - Demo	Pub System Demonstração LTDA	(11) 99999-9999	Rua Demo, 123 - São Paulo, SP
\.


--
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos (id, titulo, descricao, valor, ativo, criado_em, atualizado_em, "paginaEventoId", "dataEvento", "urlImagem") FROM stdin;
d654faa6-f687-4837-917a-ae336d89e8eb	Forró		15.00	t	2025-11-12 02:07:00.084657	2025-11-12 02:08:31.166854	0f01d977-300d-4d89-92c9-7f8f5247eacb	2025-11-19 22:00:00	https://storage.googleapis.com/pub-system-media-storage/eventos/1762913310918-hamburguer-artesanal.jpg
\.


--
-- Data for Name: fechamentos_caixa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fechamentos_caixa (id, abertura_caixa_id, turno_funcionario_id, funcionario_id, "dataFechamento", "horaFechamento", "valorEsperadoDinheiro", "valorEsperadoPix", "valorEsperadoDebito", "valorEsperadoCredito", "valorEsperadoValeRefeicao", "valorEsperadoValeAlimentacao", "valorEsperadoTotal", "valorInformadoDinheiro", "valorInformadoPix", "valorInformadoDebito", "valorInformadoCredito", "valorInformadoValeRefeicao", "valorInformadoValeAlimentacao", "valorInformadoTotal", "diferencaDinheiro", "diferencaPix", "diferencaDebito", "diferencaCredito", "diferencaValeRefeicao", "diferencaValeAlimentacao", "diferencaTotal", "totalSangrias", "quantidadeSangrias", "quantidadeVendas", "quantidadeComandasFechadas", "ticketMedio", observacao, status, "criadoEm") FROM stdin;
abf1dd4b-56d0-4b16-b4de-11e7af5468b2	ffcd8397-7d46-4b6c-9299-8e24efd885e7	c0141c7a-fadf-4756-926f-c241e7db3ee6	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12	17:41:05	28.00	0.00	0.00	0.00	0.00	0.00	28.00	28.00	0.00	0.00	0.00	0.00	0.00	28.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	50.00	1	1	1	28.00	\N	FECHADO	2025-11-12 17:41:05.173417
a3ac318f-0ef6-46d0-9e9d-bdcabc1f8976	472eb987-1c0e-4758-97a3-aac35f42b725	0eba337a-383e-4d7e-b2a7-37643efb9aef	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-14	01:11:09	50.00	0.00	0.00	0.00	0.00	0.00	50.00	50.00	0.00	0.00	0.00	0.00	0.00	50.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	1	1	50.00	\N	FECHADO	2025-11-14 01:11:09.064322
\.


--
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.funcionarios (id, nome, email, senha, cargo, empresa_id, ambiente_id, status) FROM stdin;
205f8da5-3942-4d1e-9a3f-4d443c404dd2	Administrador Padrão	admin@admin.com	$2b$10$//0VV/w8w2G0iHUv.l44je.9/ZmVz9ny5h0g98onulPISSabkYSwK	ADMIN	\N	\N	ATIVO
d7255eba-ffcd-4bfd-ac42-2b44d89bb82c	cozinheiro 2	tecnologiacloudmmc@gmail.com	$2b$10$rWVvaUDSb3BvbFQRqTgk3ulrsuIi7GahTktBYZB7jUgbEoQ9Zg2Je	COZINHA	\N	\N	ATIVO
bc8d5a96-9b55-4ef8-8f6b-310cd21debfe	Hebert	pereira_hebert@msn.com	$2b$10$Pu4hnSZJ2kDolb4fU20J2uTkZdd0bJ0zgQbmCMxNrZF.CqGUILEp2	GARCOM	\N	\N	ATIVO
f2af19a9-f40b-4061-9fd8-f43b9a36938c	kelly	oreihebert@gmail.com	$2b$10$tmDe5rjdamD72ljI9rIV..1LAhqmhF7f4lk5IJIzij9i7GWL5JrPq	GARCOM	\N	\N	ATIVO
2d88a7b9-00c6-4045-9dda-afc1fbd2d8bc	cozinheiro 1	codeechips@gmail.com	$2b$10$Gg/3dDcSYOtf5BBndQ8VQetZ6t6UhYHSnqxOLtMg8Ue6LStQHC17q	COZINHA	\N	\N	ATIVO
17ba3fe1-e08c-4e03-a565-93f25f4835e1	caixa1	hebertopereira@outlook.com	$2b$10$7mYKLzsnKg5s6nvu8Fsw8.3qiBzykjhpYhiRIKht9La6tWpO6JQDa	CAIXA	\N	\N	INATIVO
\.


--
-- Data for Name: itens_pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.itens_pedido (id, quantidade, "precoUnitario", observacao, status, "motivoCancelamento", "pedidoId", "produtoId", ambiente_retirada_id, "iniciadoEm", quase_pronto_em, "prontoEm", retirado_em, "entregueEm", "canceladoEm", tempo_preparo_minutos, responsavel_inicio_id, responsavel_pronto_id, responsavel_cancelamento_id, retirado_por_garcom_id, garcom_entrega_id, tempo_reacao_minutos, tempo_entrega_final_minutos, tempoentregaminutos, tempo_entrega_minutos) FROM stdin;
b1a1e351-3b95-419c-b8a7-8b83fd2c3512	1	15.00	Couvert Artístico - Forró	ENTREGUE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2e7108b0-d11d-475a-bc89-391f7686600c	1	15.00	Couvert Artístico - Forró	ENTREGUE	\N	82908c4e-1748-427f-b32f-911d91c88fcb	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
857bcd7a-0499-4e9c-bc02-ae0a93da5ec7	1	35.00		RETIRADO	\N	5e0ad8b6-cd8b-4e3b-84dc-ef9a4331dfb6	7476fc70-f03d-4ffb-b165-0674de42f4f8	97ec65b9-2952-4635-be83-882e30117582	2025-11-12 03:22:18.666	2025-11-12 03:26:30.222	2025-11-12 03:28:44.466	2025-11-12 03:30:03.63	\N	\N	\N	\N	\N	\N	f2af19a9-f40b-4061-9fd8-f43b9a36938c	\N	1.00	\N	\N	\N
6200a070-0d47-4959-95d3-7413936fa9c8	1	8.00		RETIRADO	\N	5e0ad8b6-cd8b-4e3b-84dc-ef9a4331dfb6	01831cd4-d06a-41f1-8bab-edf0671be954	d11fc8be-074b-4f56-9b76-73e5f877209e	2025-11-12 03:19:46.766	2025-11-12 03:24:00.114	2025-11-12 03:29:12.184	2025-11-12 03:30:25.338	\N	\N	\N	\N	\N	\N	f2af19a9-f40b-4061-9fd8-f43b9a36938c	\N	1.00	\N	\N	\N
d16d9b12-731f-4332-81d0-e829113a59cf	1	6.00		ENTREGUE	\N	6f1df4d5-ab4c-4bf7-ba8e-7cf02d413ef6	0fd26f4b-c8c9-4c8f-9ff8-e2d82ed398b6	d11fc8be-074b-4f56-9b76-73e5f877209e	2025-11-12 03:29:15.687	2025-11-12 03:33:30.052	2025-11-12 03:36:12.554	2025-11-12 03:36:36.266	2025-11-12 03:39:06.842	\N	\N	\N	\N	\N	f2af19a9-f40b-4061-9fd8-f43b9a36938c	f2af19a9-f40b-4061-9fd8-f43b9a36938c	0.00	3.00	3.00	\N
06894017-1004-4aaf-8a4a-588f839a5554	1	15.00	Couvert Artístico - Forró	ENTREGUE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d3072c9d-b376-4620-a736-b6ddb39244fe	1	15.00	Couvert Artístico - Forró	ENTREGUE	\N	e81018d1-c510-46aa-8a0f-08e7f733b9d2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
01861e25-5332-49e4-8b48-42ae116689c3	1	6.00		ENTREGUE	\N	52aa0d37-93f1-4b14-9e27-245a3d1b6d71	0fd26f4b-c8c9-4c8f-9ff8-e2d82ed398b6	\N	2025-11-12 17:16:15.417	\N	2025-11-12 17:17:06.812	\N	2025-11-12 17:17:09.062	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
87020e8c-d7ed-418a-86bb-cc189fda6cde	1	28.00	\N	ENTREGUE	\N	bc088fa5-769c-415a-a2e2-d012943a6da6	6960cc17-019f-4a3c-b8ab-ed93b4452c50	\N	2025-11-12 17:39:05.928	\N	2025-11-12 17:39:16.494	\N	2025-11-12 17:39:20.229	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e00f979b-d0e7-422e-bcc2-d30f0ac8453d	1	15.00	Couvert Artístico - Forró	ENTREGUE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6d4efa1d-70aa-4405-9e94-fe8bfe50a28a	1	15.00	Couvert Artístico - Forró	ENTREGUE	\N	d8b55b6f-0a07-4622-8a65-dc1e843a7ae7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
655f6277-fdd9-4054-bb09-0384709a5394	1	35.00		ENTREGUE	\N	e341c1df-9532-4bad-9a72-651557b535bd	7476fc70-f03d-4ffb-b165-0674de42f4f8	97ec65b9-2952-4635-be83-882e30117582	2025-11-14 00:13:56.375	2025-11-14 00:18:00.069	2025-11-14 00:21:02.364	2025-11-14 00:26:12.328	2025-11-14 00:26:12.717	\N	\N	\N	\N	\N	bc8d5a96-9b55-4ef8-8f6b-310cd21debfe	bc8d5a96-9b55-4ef8-8f6b-310cd21debfe	5.00	0.00	5.00	\N
4ebf4b3e-8263-4e21-a5a2-e98f06358fda	2	28.00	Teste automatizado	FEITO	\N	066c27ce-4716-4b8d-9e30-d813aca35c67	6960cc17-019f-4a3c-b8ab-ed93b4452c50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f66a167c-7454-46d2-a1b4-73277bd8f98f	2	28.00	Teste automatizado	FEITO	\N	cb462be9-982e-4e07-a890-dc13f9448a61	6960cc17-019f-4a3c-b8ab-ed93b4452c50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
962fc91a-95c9-4f30-a73c-7721e72618c5	2	28.00	Teste automatizado	FEITO	\N	4b2e1f1a-42a6-4a1c-a2eb-9d56db360e8c	6960cc17-019f-4a3c-b8ab-ed93b4452c50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
eef6468d-eb59-475f-b70e-8684d31f3920	2	28.00	Teste automatizado	FEITO	\N	0690071d-ba7e-458c-b0fc-9769b8ee8f59	6960cc17-019f-4a3c-b8ab-ed93b4452c50	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mesas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mesas (id, numero, status, ambiente_id, posicao, tamanho, rotacao) FROM stdin;
6ef7b059-4eb5-4137-8fd8-46ac3a57cb78	11	LIVRE	71c4703e-1f1c-4f33-af5f-3e2330e93581	\N	\N	0
4897d298-4ecf-4b4f-afee-5724dda080b7	12	LIVRE	71c4703e-1f1c-4f33-af5f-3e2330e93581	\N	\N	0
c57e781c-cfd7-46aa-9278-078b45968bcb	13	LIVRE	71c4703e-1f1c-4f33-af5f-3e2330e93581	\N	\N	0
6c335c6f-caac-436c-ab10-89be16fd0693	14	LIVRE	71c4703e-1f1c-4f33-af5f-3e2330e93581	\N	\N	0
65403bc1-fb98-4b0f-b3c7-550ea9172821	15	LIVRE	71c4703e-1f1c-4f33-af5f-3e2330e93581	\N	\N	0
e3fc5b16-5b12-44e4-bf49-6701097a6bff	16	LIVRE	71c4703e-1f1c-4f33-af5f-3e2330e93581	\N	\N	0
ca3220d1-61cd-496e-bea9-ceb08b4b95fa	17	LIVRE	71c4703e-1f1c-4f33-af5f-3e2330e93581	\N	\N	0
5bbc886e-2a13-4ad5-8697-de551262ceab	18	LIVRE	71c4703e-1f1c-4f33-af5f-3e2330e93581	\N	\N	0
30907f8d-b103-4e03-8ff2-1e8c4cc6386a	19	LIVRE	4213bd71-d99c-405c-9782-67a86b866982	\N	\N	0
42a98b86-c3b3-40ed-a693-76ead8e57274	20	LIVRE	4213bd71-d99c-405c-9782-67a86b866982	\N	\N	0
a2d95044-efb9-4ed7-ac23-53b03dc24e68	21	LIVRE	4213bd71-d99c-405c-9782-67a86b866982	\N	\N	0
261d8f63-8cab-4859-b748-a53ce607758d	22	LIVRE	4213bd71-d99c-405c-9782-67a86b866982	\N	\N	0
d8c451a4-662c-432d-b574-5c9ac4d4a3da	8	LIVRE	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":520,"y":320}	{"width":80,"height":80}	0
e0592763-4670-43ee-b07d-59b67bd8fdf1	9	LIVRE	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":520,"y":180}	{"width":80,"height":80}	0
c374f543-c849-4908-b12d-88eaa62251b7	10	LIVRE	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":520,"y":40}	{"width":80,"height":80}	0
5f80a72c-2bc4-4886-b66e-a2ec37ee96ac	1	OCUPADA	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":0,"y":60}	{"width":80,"height":80}	0
ec2268c7-d62c-4855-92ef-bc2aa9461e2d	2	OCUPADA	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":0,"y":160}	{"width":80,"height":80}	0
9e35e71c-3a96-49be-8a1d-dee454fe5958	3	OCUPADA	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":0,"y":300}	{"width":80,"height":80}	0
5256389e-9ef3-4e21-9d4a-00a975d0c194	4	OCUPADA	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":0,"y":420}	{"width":80,"height":80}	0
6cd96263-7cd6-4251-b5f5-a3dcb6538164	5	OCUPADA	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":180,"y":560}	{"width":80,"height":80}	0
ef5404e2-3eb2-40b0-8ea1-8f55e6802c1b	6	OCUPADA	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":320,"y":560}	{"width":80,"height":80}	0
495e66a4-8a60-4e33-b887-1de6d608ae5e	7	OCUPADA	2cd8b3c3-6215-482b-991c-0de6770945f2	{"x":440,"y":560}	{"width":80,"height":80}	0
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1700000000000	InitialSchema1700000000000
2	1759808901232	UpdateEventoEntity1759808901232
3	1760047542018	AddPaginaEventoIdToComandas1760047542018
4	1760052372683	AddPaginaEventoToEvento1760052372683
5	1760060000000	CreatePontoEntregaTable1760060000000
6	1760060100000	CreateComandaAgregadoTable1760060100000
7	1760060200000	AddPontoEntregaToComanda1760060200000
8	1760060300000	AddDeixadoNoAmbienteStatus1760060300000
9	1760070000000	AddMapaVisualFields1760070000000
10	1760080000000	AddMissingColumns1760080000000
11	1760090000000	AddAmbienteAtendimentoToPontoEntrega1760090000000
12	1760100000000	AddMissingColumnsFromOldMigrations1760100000000
13	1731431000000	CreateCaixaTables1731431000000
15	1730770000000	AddMapaVisualFields1730770000000
\.


--
-- Data for Name: movimentacoes_caixa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimentacoes_caixa (id, abertura_caixa_id, tipo, data, hora, valor, "formaPagamento", descricao, funcionario_id, comanda_id, comanda_numero, "criadoEm") FROM stdin;
fcf38af4-bcbf-4ea7-a6c3-051059a80814	5d0947da-b540-4bcf-a0a4-a5d082c5e98d	ABERTURA	2025-11-12	16:43:54	50.00	\N	Abertura de caixa - Valor inicial: R$ 50.00	17ba3fe1-e08c-4e03-a565-93f25f4835e1	\N	\N	2025-11-12 16:43:54.438126
726ffe13-966f-44a6-8271-fe9f002397a6	ffcd8397-7d46-4b6c-9299-8e24efd885e7	ABERTURA	2025-11-12	16:57:18	50.00	\N	Abertura de caixa - Valor inicial: R$ 50.00	17ba3fe1-e08c-4e03-a565-93f25f4835e1	\N	\N	2025-11-12 16:57:18.307953
28398686-3e22-4821-89b8-7f38b42b7dfa	ffcd8397-7d46-4b6c-9299-8e24efd885e7	VENDA	2025-11-12	17:40:13	28.00	DINHEIRO	Comanda Mesa 1	17ba3fe1-e08c-4e03-a565-93f25f4835e1	b24b0f1e-f537-4ddd-9be6-a9166c711271	\N	2025-11-12 17:40:13.614284
412b541a-a292-4be9-9d9f-4d80b1c45bcc	ffcd8397-7d46-4b6c-9299-8e24efd885e7	SANGRIA	2025-11-12	17:40:37	50.00	\N	Sangria: Depositar em cofre	17ba3fe1-e08c-4e03-a565-93f25f4835e1	\N	\N	2025-11-12 17:40:37.344096
82429f61-9be4-47d3-be3b-a0eb7fed4719	ffcd8397-7d46-4b6c-9299-8e24efd885e7	FECHAMENTO	2025-11-12	17:41:05	28.00	\N	Fechamento de caixa - Diferença: R$ 0.00	17ba3fe1-e08c-4e03-a565-93f25f4835e1	\N	\N	2025-11-12 17:41:05.197919
e0a54302-ee3a-490c-8271-3e3c3c7bb3ad	472eb987-1c0e-4758-97a3-aac35f42b725	ABERTURA	2025-11-14	00:30:15	0.00	\N	Abertura de caixa - Valor inicial: R$ 0.00	17ba3fe1-e08c-4e03-a565-93f25f4835e1	\N	\N	2025-11-14 00:30:15.246911
cb081339-f822-47f4-a031-547391cc9a84	472eb987-1c0e-4758-97a3-aac35f42b725	VENDA	2025-11-14	01:09:52	50.00	DINHEIRO	Comanda Mesa Avulsa	17ba3fe1-e08c-4e03-a565-93f25f4835e1	f3fc2941-c33f-4b5c-8851-c2228d99ca7e	\N	2025-11-14 01:09:52.727995
b32f3bd0-b305-4574-a921-296642a57b54	472eb987-1c0e-4758-97a3-aac35f42b725	FECHAMENTO	2025-11-14	01:11:09	50.00	\N	Fechamento de caixa - Diferença: R$ 0.00	17ba3fe1-e08c-4e03-a565-93f25f4835e1	\N	\N	2025-11-14 01:11:09.10501
83c28e3d-e660-49d8-8dc6-63710f6948ab	ef089ada-3bad-4df8-8d7f-39ada7ab9a8c	ABERTURA	2025-11-14	01:11:43	0.00	\N	Abertura de caixa - Valor inicial: R$ 0.00	17ba3fe1-e08c-4e03-a565-93f25f4835e1	\N	\N	2025-11-14 01:11:43.385658
fad93928-b532-4470-9f04-30b845d0a9eb	c5bdc7f6-d16e-435c-b62a-e4ed626d2de0	ABERTURA	2025-12-09	18:06:19	100.00	\N	Abertura de caixa - Valor inicial: R$ 100.00	205f8da5-3942-4d1e-9a3f-4d443c404dd2	\N	\N	2025-12-09 21:06:19.391917
\.


--
-- Data for Name: paginas_evento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paginas_evento (id, titulo, url_imagem, ativa, criado_em, atualizado_em) FROM stdin;
0f01d977-300d-4d89-92c9-7f8f5247eacb	Noite da Haburguer	https://storage.googleapis.com/pub-system-media-storage/1762913133693-images.jpeg	t	2025-11-12 02:05:04.732746	2025-11-12 02:05:56.60537
\.


--
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, status, total, data, "motivoCancelamento", "comandaId", criado_por_id, criado_por_tipo, entregue_por_id, entregue_em, tempo_total_minutos) FROM stdin;
82908c4e-1748-427f-b32f-911d91c88fcb	ENTREGUE	15.00	2025-11-12 02:59:31.177359	\N	a2ddb0ca-5433-4d3d-9150-838605be449a	\N	\N	\N	\N	\N
5e0ad8b6-cd8b-4e3b-84dc-ef9a4331dfb6	FEITO	43.00	2025-11-12 03:01:33.034483	\N	a2ddb0ca-5433-4d3d-9150-838605be449a	\N	\N	\N	\N	\N
6f1df4d5-ab4c-4bf7-ba8e-7cf02d413ef6	FEITO	6.00	2025-11-12 03:21:29.773196	\N	a2ddb0ca-5433-4d3d-9150-838605be449a	\N	\N	\N	\N	\N
e81018d1-c510-46aa-8a0f-08e7f733b9d2	ENTREGUE	15.00	2025-11-12 17:15:00.126625	\N	64ecbe00-9c08-477c-b34d-b28b1e727fd0	\N	\N	\N	\N	\N
52aa0d37-93f1-4b14-9e27-245a3d1b6d71	FEITO	6.00	2025-11-12 17:15:58.894415	\N	64ecbe00-9c08-477c-b34d-b28b1e727fd0	\N	\N	\N	\N	\N
bc088fa5-769c-415a-a2e2-d012943a6da6	FEITO	28.00	2025-11-12 17:38:37.194607	\N	b24b0f1e-f537-4ddd-9be6-a9166c711271	\N	\N	\N	\N	\N
d8b55b6f-0a07-4622-8a65-dc1e843a7ae7	ENTREGUE	15.00	2025-11-14 00:10:41.793332	\N	f3fc2941-c33f-4b5c-8851-c2228d99ca7e	\N	\N	\N	\N	\N
e341c1df-9532-4bad-9a72-651557b535bd	FEITO	35.00	2025-11-14 00:12:31.841837	\N	f3fc2941-c33f-4b5c-8851-c2228d99ca7e	\N	\N	\N	\N	\N
066c27ce-4716-4b8d-9e30-d813aca35c67	FEITO	56.00	2025-12-09 21:04:45.434885	\N	dd6e290c-abaa-41e0-b122-db3ce441034c	\N	\N	\N	\N	\N
cb462be9-982e-4e07-a890-dc13f9448a61	FEITO	56.00	2025-12-09 21:05:39.041656	\N	151ed5ac-486c-4dc4-9408-9b300490c6c9	\N	\N	\N	\N	\N
4b2e1f1a-42a6-4a1c-a2eb-9d56db360e8c	FEITO	56.00	2025-12-09 21:05:56.669448	\N	82a41380-a359-4802-8935-1c0a23257f2e	\N	\N	\N	\N	\N
0690071d-ba7e-458c-b0fc-9769b8ee8f59	FEITO	56.00	2025-12-09 21:06:19.540991	\N	4c9e56c1-99ef-4644-857c-1e9e4b00ede6	\N	\N	\N	\N	\N
\.


--
-- Data for Name: pontos_entrega; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pontos_entrega (id, nome, descricao, ambiente_preparo_id, mesa_proxima_id, ativo, created_at, updated_at, posicao, tamanho, empresa_id, ambiente_atendimento_id) FROM stdin;
36345db0-20f6-4c82-b7b3-9b6840192b06	Bar	\N	d11fc8be-074b-4f56-9b76-73e5f877209e	\N	t	2025-11-12 02:14:47.075006	2025-11-12 02:56:28.107458	{"x":240,"y":680}	{"width":100,"height":60}	48ac7710-2f39-497b-8d29-a70952054221	2cd8b3c3-6215-482b-991c-0de6770945f2
52288d7e-7292-435a-b4c9-777294227622	Palco	\N	d11fc8be-074b-4f56-9b76-73e5f877209e	\N	t	2025-11-12 02:13:40.906131	2025-11-12 02:56:28.139316	{"x":180,"y":40}	{"width":100,"height":60}	48ac7710-2f39-497b-8d29-a70952054221	2cd8b3c3-6215-482b-991c-0de6770945f2
\.


--
-- Data for Name: produtos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produtos (id, nome, descricao, preco, categoria, "urlImagem", ativo, "ambienteId") FROM stdin;
01831cd4-d06a-41f1-8bab-edf0671be954	Chopp Pilsen 300ml	Chopp cremoso e refrescante	8.00	Bebidas	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
fd4627aa-a085-4b6a-9cf6-368df0b182e5	Chopp Pilsen 500ml	Chopp cremoso e refrescante	12.00	Bebidas	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
2d3c7bc0-a47b-4cfd-876f-10291c49356d	Caipirinha de Limão	Cachaça, limão, açúcar e gelo	15.00	Drinks	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
e6c926d7-4e90-45fa-907f-ad05be2be191	Caipirinha de Morango	Cachaça, morango, açúcar e gelo	16.00	Drinks	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
e94424a2-a67c-4dad-aa87-47663fb19796	Mojito	Rum, hortelã, limão e água com gás	18.00	Drinks	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
07115c8a-cd26-45fc-9d0e-36074f59a363	Gin Tônica	Gin, tônica e limão siciliano	22.00	Drinks	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
2ed19d27-a924-438d-912c-7725cabad4b7	Suco de Laranja 500ml	Suco natural feito na hora	10.00	Bebidas	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
55d13f4f-110e-4ce7-a510-6dace5b6f1e5	Suco de Abacaxi 500ml	Suco natural feito na hora	10.00	Bebidas	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
a5eb6b08-e06a-4f3c-82cf-8887081b20a8	Água com Gás 300ml	Garrafa	5.00	Bebidas	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
c5216a20-02be-4815-b13f-9078469e8785	Água sem Gás 300ml	Garrafa	5.00	Bebidas	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
0fd26f4b-c8c9-4c8f-9ff8-e2d82ed398b6	Coca-Cola Lata 350ml	Gelada	6.00	Bebidas	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
66d3df03-a993-4525-bbf0-3d2a81832426	Guaraná Lata 350ml	Gelado	6.00	Bebidas	\N	t	d11fc8be-074b-4f56-9b76-73e5f877209e
7476fc70-f03d-4ffb-b165-0674de42f4f8	Batata Frita com Cheddar e Bacon	Porção generosa para 2 pessoas	35.00	Porções	\N	t	97ec65b9-2952-4635-be83-882e30117582
7125bc45-f9a9-40a3-b86b-e7c9842b02d5	Frango a Passarinho	Pedaços de frango fritos com alho e salsinha	40.00	Porções	\N	t	97ec65b9-2952-4635-be83-882e30117582
e87f1ff3-8ac3-4f6d-bdd3-1f38901cf25a	Mandioca Frita	Acompanha maionese da casa	25.00	Porções	\N	t	97ec65b9-2952-4635-be83-882e30117582
6960cc17-019f-4a3c-b8ab-ed93b4452c50	Anéis de Cebola	Anéis de cebola empanados e fritos	28.00	Porções	\N	t	97ec65b9-2952-4635-be83-882e30117582
e36d1d25-e996-4ad4-82b4-1a095b071242	Hambúrguer da Casa	Pão brioche, blend de 180g, queijo, bacon e salada	42.00	Lanches	\N	t	97ec65b9-2952-4635-be83-882e30117582
9b66a24f-2121-423d-9782-4ba245a1021f	Picanha na Chapa	Acompanha arroz, farofa e vinagrete	95.00	Pratos Principais	\N	t	97ec65b9-2952-4635-be83-882e30117582
ff1e796c-1c89-4302-a3c1-eb635101d804	File de Frango Grelhado	Com legumes e arroz integral	48.00	Pratos Principais	\N	t	97ec65b9-2952-4635-be83-882e30117582
384862a2-1dc8-4272-b4ab-8a3259050c64	Batata Rústica	Batata em gomos assada	22.00	Porções	\N	t	97ec65b9-2952-4635-be83-882e30117582
4c880b84-d328-4de3-a58c-f16c2afd2548	Tábua de Frios	Seleção de queijos e embutidos	55.00	Porções	\N	t	e6f3566d-44f9-4948-8cdb-131a2bbd61a9
247fcfef-0f32-494c-9b78-719099097ca7	Salada Caesar	Alface romana, croutons, parmesão e molho caesar	32.00	Saladas	\N	t	e6f3566d-44f9-4948-8cdb-131a2bbd61a9
75f90362-4ec8-4cc2-9e20-5b2b82fd366c	Salada Caprese	Tomate, mussarela de búfala, manjericão e azeite	35.00	Saladas	\N	t	e6f3566d-44f9-4948-8cdb-131a2bbd61a9
b95058d0-99a9-40a6-88c9-c240990fcc77	Carpaccio de Salmão	Lâminas de salmão com alcaparras e molho especial	65.00	Entradas	\N	t	e6f3566d-44f9-4948-8cdb-131a2bbd61a9
54ab30a9-32d8-47b8-9541-f80c8375f748	Sorvete de Creme 3 Bolas	Escolha os sabores	15.00	Sobremesas	\N	t	e6f3566d-44f9-4948-8cdb-131a2bbd61a9
97592452-b35a-4a15-a031-4351209e1236	Picanha na Brasa 400g	Picanha mal passada com alho e sal grosso	110.00	Carnes	\N	t	18caff78-bad0-43e9-a852-5282dab09a96
4ed11fe6-8592-437b-b0ca-c52ca399bc57	Costela BBQ	Costela suína glaceada com molho barbecue	85.00	Carnes	\N	t	18caff78-bad0-43e9-a852-5282dab09a96
2ef268b3-4ac4-4309-ad18-268b1263e484	Linguiça Artesanal	Linguiça toscana defumada	38.00	Carnes	\N	t	18caff78-bad0-43e9-a852-5282dab09a96
b201c370-0236-4606-a431-2645f6bdf641	Espetinho Misto	3 espetos de carne, frango e linguiça	45.00	Carnes	\N	t	18caff78-bad0-43e9-a852-5282dab09a96
40e78a0d-76e8-4903-9ff1-1dfedb810a70	Fraldinha na Brasa	Acompanha farofa e vinagrete	95.00	Carnes	\N	t	18caff78-bad0-43e9-a852-5282dab09a96
5ec8c32a-cda2-4a32-bde0-7d5108036576	Pudim de Leite	Pudim de leite condensado cremoso	12.00	Sobremesas	\N	t	ef5f3912-a59c-4e7b-871d-3e396231e274
356a0e2e-c04d-4419-94ef-398bcab2e338	Petit Gâteau	Bolo de chocolate com recheio cremoso e sorvete	22.00	Sobremesas	\N	t	ef5f3912-a59c-4e7b-871d-3e396231e274
e2db8c53-d1ae-485d-9a43-d07767bcce7e	Torta Holandesa	Fatia generosa de torta holandesa	18.00	Sobremesas	\N	t	ef5f3912-a59c-4e7b-871d-3e396231e274
1e5e3192-ae8e-4f90-893f-46e8b7ce0409	Brownie com Sorvete	Brownie quente com sorvete de creme	20.00	Sobremesas	\N	t	ef5f3912-a59c-4e7b-871d-3e396231e274
c559bd41-ac37-41cc-87a8-746d792e8982	Cheesecake de Frutas Vermelhas	Fatia cremosa com calda	24.00	Sobremesas	\N	t	ef5f3912-a59c-4e7b-871d-3e396231e274
7f0faee9-4db1-4864-be63-7b66238ddb6f	Bolo de Cenoura com Chocolate	Fatia do bolo tradicional	15.00	Sobremesas	\N	t	ef5f3912-a59c-4e7b-871d-3e396231e274
2d8601d5-b2ff-4172-af37-702055f4831f	Tiramisu	Sobremesa italiana clássica	26.00	Sobremesas	\N	t	ef5f3912-a59c-4e7b-871d-3e396231e274
\.


--
-- Data for Name: sangrias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sangrias (id, abertura_caixa_id, turno_funcionario_id, funcionario_id, "dataSangria", "horaSangria", valor, motivo, observacao, "autorizadoPor", "autorizadoCargo", "criadoEm") FROM stdin;
303dd438-fc65-4ae4-a16f-08d5540823be	ffcd8397-7d46-4b6c-9299-8e24efd885e7	c0141c7a-fadf-4756-926f-c241e7db3ee6	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12	17:40:37	50.00	Depositar em cofre	\N	\N	\N	2025-11-12 17:40:37.329055
\.


--
-- Data for Name: turnos_funcionario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.turnos_funcionario (id, funcionario_id, "checkIn", "checkOut", "horasTrabalhadas", ativo, evento_id, "criadoEm") FROM stdin;
657400ca-117f-4e08-844f-0966b5facfda	bc8d5a96-9b55-4ef8-8f6b-310cd21debfe	2025-11-12 03:11:17.993	2025-11-12 15:01:53.599	711	f	\N	2025-11-12 03:11:18.00167
4821c1d2-3679-4d39-8a5e-3785d7cafdd6	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12 15:11:04.425	2025-11-12 15:32:10.379	21	f	\N	2025-11-12 15:11:04.427963
61a95c85-2352-42b5-8463-080730ba0c50	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12 15:52:28.279	2025-11-12 15:52:42.627	0	f	\N	2025-11-12 15:52:28.284051
7f822d8d-81b7-4469-9229-d6f4cc1af002	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12 16:04:48.815	2025-11-12 16:04:57.308	0	f	\N	2025-11-12 16:04:48.817305
937217bb-4748-46af-af83-a0e22f95fe5c	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12 16:13:29.408	2025-11-12 16:14:43.602	1	f	\N	2025-11-12 16:13:29.409767
185b7a4c-e29f-46ae-a62e-f42a570dbe32	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12 16:42:55.713	2025-11-12 16:46:16.209	3	f	\N	2025-11-12 16:42:55.719023
c0141c7a-fadf-4756-926f-c241e7db3ee6	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-12 16:57:10.372	2025-11-12 17:41:10.368	44	f	\N	2025-11-12 16:57:10.378297
98757497-d0bd-42e4-a422-6de0fa4b24de	bc8d5a96-9b55-4ef8-8f6b-310cd21debfe	2025-11-13 22:57:25.132	\N	\N	t	\N	2025-11-13 22:57:25.13746
7fe3ea13-9bf6-458c-a62d-df86287f1acd	f2af19a9-f40b-4061-9fd8-f43b9a36938c	2025-11-12 03:11:49.12	2025-11-13 23:00:53.473	2629	f	\N	2025-11-12 03:11:49.121809
d3add92d-07de-4d64-886b-565794c8967e	f2af19a9-f40b-4061-9fd8-f43b9a36938c	2025-11-13 23:01:10.13	\N	\N	t	\N	2025-11-13 23:01:10.131375
a6076d41-3c65-4754-a808-b4c26812cfdb	2d88a7b9-00c6-4045-9dda-afc1fbd2d8bc	2025-11-13 23:54:17.833	2025-11-14 00:03:15.636	9	f	\N	2025-11-13 23:54:17.846247
c57dafef-d7c0-4772-96f9-ce3f7ea53ef0	2d88a7b9-00c6-4045-9dda-afc1fbd2d8bc	2025-11-14 00:06:50.79	2025-11-14 00:07:01.756	0	f	\N	2025-11-14 00:06:50.791565
71030818-ea65-4bc2-9fa2-d92e91110327	2d88a7b9-00c6-4045-9dda-afc1fbd2d8bc	2025-11-14 00:07:45.072	\N	\N	t	\N	2025-11-14 00:07:45.07415
0eba337a-383e-4d7e-b2a7-37643efb9aef	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-13 22:58:23.102	2025-11-14 01:11:13.952	133	f	\N	2025-11-13 22:58:23.103896
807e853b-c578-405a-b237-f80a32e34d7b	17ba3fe1-e08c-4e03-a565-93f25f4835e1	2025-11-14 01:11:38.404	2025-11-14 01:11:53.788	0	f	\N	2025-11-14 01:11:38.406448
cfbf92fd-ba79-46ba-a306-c91d6cf42208	205f8da5-3942-4d1e-9a3f-4d443c404dd2	2025-12-09 17:53:44.469	\N	\N	t	\N	2025-12-09 20:53:44.473524
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 19, true);


--
-- Name: movimentacoes_caixa PK_0b1f15ea93e657fd1c512258629; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_caixa
    ADD CONSTRAINT "PK_0b1f15ea93e657fd1c512258629" PRIMARY KEY (id);


--
-- Name: fechamentos_caixa PK_3274e49515343f73282c3e2a1ca; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fechamentos_caixa
    ADD CONSTRAINT "PK_3274e49515343f73282c3e2a1ca" PRIMARY KEY (id);


--
-- Name: itens_pedido PK_34ba752329a604381e367c431ff; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT "PK_34ba752329a604381e367c431ff" PRIMARY KEY (id);


--
-- Name: eventos PK_40d4a3c6a4bfd24280cb97a509e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT "PK_40d4a3c6a4bfd24280cb97a509e" PRIMARY KEY (id);


--
-- Name: aberturas_caixa PK_5b10db9126cb1729b2425e01f78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aberturas_caixa
    ADD CONSTRAINT "PK_5b10db9126cb1729b2425e01f78" PRIMARY KEY (id);


--
-- Name: pontos_entrega PK_68df8520a28d09d8a72f37442f3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pontos_entrega
    ADD CONSTRAINT "PK_68df8520a28d09d8a72f37442f3" PRIMARY KEY (id);


--
-- Name: sangrias PK_8b06fa757851ce63aac62ae5c46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sangrias
    ADD CONSTRAINT "PK_8b06fa757851ce63aac62ae5c46" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: paginas_evento PK_9cd8a83a55186b10f83ffea76bc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paginas_evento
    ADD CONSTRAINT "PK_9cd8a83a55186b10f83ffea76bc" PRIMARY KEY (id);


--
-- Name: produtos PK_a5d976312809192261ed96174f3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT "PK_a5d976312809192261ed96174f3" PRIMARY KEY (id);


--
-- Name: funcionarios PK_a6ee7c0e30d968db531ad073337; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT "PK_a6ee7c0e30d968db531ad073337" PRIMARY KEY (id);


--
-- Name: ambientes PK_a90809c19133ae8e8739e6a0038; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ambientes
    ADD CONSTRAINT "PK_a90809c19133ae8e8739e6a0038" PRIMARY KEY (id);


--
-- Name: mesas PK_ccff054bd3dad6539869d03350c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT "PK_ccff054bd3dad6539869d03350c" PRIMARY KEY (id);


--
-- Name: empresas PK_ce7b122b37c6499bfd6520873e1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "PK_ce7b122b37c6499bfd6520873e1" PRIMARY KEY (id);


--
-- Name: comanda_agregados PK_d3c32f25ada31514da3507e9a7a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comanda_agregados
    ADD CONSTRAINT "PK_d3c32f25ada31514da3507e9a7a" PRIMARY KEY (id);


--
-- Name: clientes PK_d76bf3571d906e4e86470482c08; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT "PK_d76bf3571d906e4e86470482c08" PRIMARY KEY (id);


--
-- Name: pedidos PK_ebb5680ed29a24efdc586846725; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT "PK_ebb5680ed29a24efdc586846725" PRIMARY KEY (id);


--
-- Name: comandas PK_f2a79c4679e1b8f6342d758f964; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comandas
    ADD CONSTRAINT "PK_f2a79c4679e1b8f6342d758f964" PRIMARY KEY (id);


--
-- Name: funcionarios UQ_5536df94d421db7d1a1ba832f0f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT "UQ_5536df94d421db7d1a1ba832f0f" UNIQUE (email);


--
-- Name: mesas UQ_de482eb027afeca7f01c967e236; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT "UQ_de482eb027afeca7f01c967e236" UNIQUE (numero, ambiente_id);


--
-- Name: empresas UQ_f5ed71aeb4ef47f95df5f8830b8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "UQ_f5ed71aeb4ef47f95df5f8830b8" UNIQUE (cnpj);


--
-- Name: clientes UQ_fd1214820b9f05720b26a917630; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT "UQ_fd1214820b9f05720b26a917630" UNIQUE (cpf);


--
-- Name: ambientes UQ_fe6aee014c0235d9a1aaaa0245f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ambientes
    ADD CONSTRAINT "UQ_fe6aee014c0235d9a1aaaa0245f" UNIQUE (nome);


--
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: turnos_funcionario turnos_funcionario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos_funcionario
    ADD CONSTRAINT turnos_funcionario_pkey PRIMARY KEY (id);


--
-- Name: mesas FK_12bb24cf56933ea8077059a09d8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT "FK_12bb24cf56933ea8077059a09d8" FOREIGN KEY (ambiente_id) REFERENCES public.ambientes(id);


--
-- Name: fechamentos_caixa FK_2df797d5e40e519f337118d2cc7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fechamentos_caixa
    ADD CONSTRAINT "FK_2df797d5e40e519f337118d2cc7" FOREIGN KEY (abertura_caixa_id) REFERENCES public.aberturas_caixa(id) ON DELETE CASCADE;


--
-- Name: movimentacoes_caixa FK_315d05477347317e500c76ab851; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_caixa
    ADD CONSTRAINT "FK_315d05477347317e500c76ab851" FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: pedidos FK_361c6c207367cbe221559bec811; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT "FK_361c6c207367cbe221559bec811" FOREIGN KEY ("comandaId") REFERENCES public.comandas(id);


--
-- Name: sangrias FK_363c2c9891a7ed129d65484a6b2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sangrias
    ADD CONSTRAINT "FK_363c2c9891a7ed129d65484a6b2" FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: sangrias FK_394c0e8c1c7d436db9cb0351ea5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sangrias
    ADD CONSTRAINT "FK_394c0e8c1c7d436db9cb0351ea5" FOREIGN KEY (turno_funcionario_id) REFERENCES public.turnos_funcionario(id) ON DELETE CASCADE;


--
-- Name: itens_pedido FK_496c47b9befb817d2595f65a901; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT "FK_496c47b9befb817d2595f65a901" FOREIGN KEY ("produtoId") REFERENCES public.produtos(id) ON DELETE SET NULL;


--
-- Name: fechamentos_caixa FK_497dc6b4fedac5912eb3d2fffbd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fechamentos_caixa
    ADD CONSTRAINT "FK_497dc6b4fedac5912eb3d2fffbd" FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: comandas FK_679e9e0345e54f981b51034b4cf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comandas
    ADD CONSTRAINT "FK_679e9e0345e54f981b51034b4cf" FOREIGN KEY ("paginaEventoId") REFERENCES public.paginas_evento(id);


--
-- Name: aberturas_caixa FK_72d24fcf7e83a0c2fa4ccf3e33b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aberturas_caixa
    ADD CONSTRAINT "FK_72d24fcf7e83a0c2fa4ccf3e33b" FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: comandas FK_7f075e9a5fb43047f0b86c52142; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comandas
    ADD CONSTRAINT "FK_7f075e9a5fb43047f0b86c52142" FOREIGN KEY ("clienteId") REFERENCES public.clientes(id);


--
-- Name: itens_pedido FK_ab2b96858c45196d22cce672215; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT "FK_ab2b96858c45196d22cce672215" FOREIGN KEY ("pedidoId") REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: aberturas_caixa FK_ad88632548e78c5fe2a136f54fa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aberturas_caixa
    ADD CONSTRAINT "FK_ad88632548e78c5fe2a136f54fa" FOREIGN KEY (turno_funcionario_id) REFERENCES public.turnos_funcionario(id) ON DELETE CASCADE;


--
-- Name: comanda_agregados FK_agregado_comanda; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comanda_agregados
    ADD CONSTRAINT "FK_agregado_comanda" FOREIGN KEY (comanda_id) REFERENCES public.comandas(id) ON DELETE CASCADE;


--
-- Name: fechamentos_caixa FK_cfef48411b29c88b74bebc80069; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fechamentos_caixa
    ADD CONSTRAINT "FK_cfef48411b29c88b74bebc80069" FOREIGN KEY (turno_funcionario_id) REFERENCES public.turnos_funcionario(id) ON DELETE CASCADE;


--
-- Name: comandas FK_comanda_ponto_entrega; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comandas
    ADD CONSTRAINT "FK_comanda_ponto_entrega" FOREIGN KEY (ponto_entrega_id) REFERENCES public.pontos_entrega(id) ON DELETE SET NULL;


--
-- Name: sangrias FK_d30159995ed0c6bb83d989e9e87; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sangrias
    ADD CONSTRAINT "FK_d30159995ed0c6bb83d989e9e87" FOREIGN KEY (abertura_caixa_id) REFERENCES public.aberturas_caixa(id) ON DELETE CASCADE;


--
-- Name: comandas FK_daefbeebfbc0738515616077aa3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comandas
    ADD CONSTRAINT "FK_daefbeebfbc0738515616077aa3" FOREIGN KEY ("mesaId") REFERENCES public.mesas(id);


--
-- Name: produtos FK_daf6d14dbfbb283e0a7741a3ba0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT "FK_daf6d14dbfbb283e0a7741a3ba0" FOREIGN KEY ("ambienteId") REFERENCES public.ambientes(id);


--
-- Name: movimentacoes_caixa FK_ed394fea8cc946ff7d9b5b0365f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_caixa
    ADD CONSTRAINT "FK_ed394fea8cc946ff7d9b5b0365f" FOREIGN KEY (abertura_caixa_id) REFERENCES public.aberturas_caixa(id) ON DELETE CASCADE;


--
-- Name: eventos FK_f0449752922ac3048bf729d8615; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT "FK_f0449752922ac3048bf729d8615" FOREIGN KEY ("paginaEventoId") REFERENCES public.paginas_evento(id);


--
-- Name: itens_pedido FK_item_pedido_ambiente_retirada; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT "FK_item_pedido_ambiente_retirada" FOREIGN KEY (ambiente_retirada_id) REFERENCES public.ambientes(id) ON DELETE SET NULL;


--
-- Name: itens_pedido FK_item_pedido_garcom_entrega; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT "FK_item_pedido_garcom_entrega" FOREIGN KEY (garcom_entrega_id) REFERENCES public.funcionarios(id) ON DELETE SET NULL;


--
-- Name: itens_pedido FK_item_pedido_retirado_por_garcom; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT "FK_item_pedido_retirado_por_garcom" FOREIGN KEY (retirado_por_garcom_id) REFERENCES public.funcionarios(id) ON DELETE SET NULL;


--
-- Name: pontos_entrega FK_ponto_entrega_ambiente_atendimento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pontos_entrega
    ADD CONSTRAINT "FK_ponto_entrega_ambiente_atendimento" FOREIGN KEY (ambiente_atendimento_id) REFERENCES public.ambientes(id) ON DELETE RESTRICT;


--
-- Name: pontos_entrega FK_ponto_entrega_ambiente_preparo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pontos_entrega
    ADD CONSTRAINT "FK_ponto_entrega_ambiente_preparo" FOREIGN KEY (ambiente_preparo_id) REFERENCES public.ambientes(id) ON DELETE CASCADE;


--
-- Name: pontos_entrega FK_ponto_entrega_mesa_proxima; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pontos_entrega
    ADD CONSTRAINT "FK_ponto_entrega_mesa_proxima" FOREIGN KEY (mesa_proxima_id) REFERENCES public.mesas(id) ON DELETE SET NULL;


--
-- Name: turnos_funcionario FK_turno_evento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos_funcionario
    ADD CONSTRAINT "FK_turno_evento" FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE SET NULL;


--
-- Name: turnos_funcionario FK_turno_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos_funcionario
    ADD CONSTRAINT "FK_turno_funcionario" FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: avaliacoes fk_avaliacao_cliente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT fk_avaliacao_cliente FOREIGN KEY ("clienteId") REFERENCES public.clientes(id) ON DELETE SET NULL;


--
-- Name: avaliacoes fk_avaliacao_comanda; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT fk_avaliacao_comanda FOREIGN KEY ("comandaId") REFERENCES public.comandas(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KcVgyVQGWpmtK1hZmJoyqWmCHjElBmuPLhERx1J4hVDkav1FBlOTZ1vpv2s79cm

