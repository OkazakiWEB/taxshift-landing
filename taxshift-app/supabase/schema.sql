-- PROFILES (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  office_name text,
  cnpj text,
  phone text,
  address text,
  plan text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CLIENTS
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  cnpj text,
  regime text not null,
  sector text,
  revenue numeric default 0,
  tax_impact numeric default 0,
  status text default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- DOCUMENTS
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  client_name text,
  type text not null,
  period text,
  status text default 'pending',
  due_date date,
  value numeric default 0,
  notes text,
  created_at timestamptz default now()
);

-- ALERTS
create table if not exists alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  client_name text,
  type text not null,
  title text not null,
  description text,
  read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table clients enable row level security;
alter table documents enable row level security;
alter table alerts enable row level security;

create policy "own_profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own_clients" on clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_documents" on documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_alerts" on alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SIMULATIONS
create table if not exists simulations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  company_name text not null,
  regime text not null,
  sector text not null,
  revenue numeric not null,
  state text,
  impact_percent numeric,
  impact_annual numeric,
  current_burden numeric,
  new_burden_2033 numeric,
  recommendation text,
  created_at timestamptz default now()
);
alter table simulations enable row level security;
create policy "own_simulations" on simulations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- CHECKLIST TEMPLATES (predefined tasks for the reform)
create table if not exists checklist_templates (
  id uuid default gen_random_uuid() primary key,
  category text not null, -- diagnostico, sistemas, contratos, treinamento, documentacao, fiscal
  title text not null,
  description text,
  priority text default 'medium', -- low, medium, high, critical
  phase text, -- 2026, 2027, 2033, ongoing
  applicable_regimes text[], -- null = all regimes
  sort_order integer default 0
);

-- CLIENT CHECKLIST ITEMS (per-client task tracking)
create table if not exists checklist_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients(id) on delete cascade,
  template_id uuid references checklist_templates(id) on delete set null,
  category text not null,
  title text not null,
  description text,
  priority text default 'medium',
  status text default 'pending', -- pending, in_progress, done, not_applicable
  phase text,
  due_date date,
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table checklist_templates enable row level security;
alter table checklist_items enable row level security;

-- Templates are readable by all authenticated users
create policy "read_templates" on checklist_templates for select using (auth.role() = 'authenticated');

create policy "own_checklist_items" on checklist_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Insert predefined checklist templates
insert into checklist_templates (category, title, description, priority, phase, sort_order) values
-- DIAGNÓSTICO
('diagnostico', 'Mapeamento completo dos regimes tributários da carteira', 'Identificar todos os clientes por regime (SN, LP, LR, MEI) e classificar por nível de risco frente à reforma.', 'critical', '2026', 1),
('diagnostico', 'Simulação de impacto CBS/IBS para clientes Lucro Presumido', 'Rodar simulação do TaxShift para todos os clientes LP — os mais impactados pela reforma.', 'critical', '2026', 2),
('diagnostico', 'Análise de clientes Simples Nacional faixa 4-5', 'Clientes SN com faturamento próximo ao limite devem avaliar migração de regime.', 'high', '2026', 3),
('diagnostico', 'Identificação de clientes com IS (Imposto Seletivo) aplicável', 'Verificar se algum cliente produz ou comercializa bens sujeitos ao IS (tabaco, álcool, armas, veículos, etc.).', 'high', '2027', 4),
('diagnostico', 'Diagnóstico de créditos de PIS/COFINS acumulados', 'Mapear saldos credores antes da extinção do PIS/COFINS em 2027.', 'critical', '2026', 5),
-- SISTEMAS
('sistemas', 'Atualização do ERP para emissão com CBS/IBS', 'O sistema precisa emitir NF-e com os novos campos CBS e IBS a partir de 2026.', 'critical', '2026', 10),
('sistemas', 'Configuração do Split Payment no fluxo de caixa', 'O Split Payment recolhe o imposto na fonte — impacto direto no caixa do cliente.', 'critical', '2027', 11),
('sistemas', 'Teste de integração com SPED para novos leiautes', 'Os leiautes do SPED serão alterados para comportar CBS/IBS. Validar antes da vigência.', 'high', '2027', 12),
('sistemas', 'Registro no portal do Comitê Gestor do IBS', 'Empresas contribuintes do IBS precisarão ser cadastradas no sistema do CG-IBS.', 'medium', '2027', 13),
-- CONTRATOS
('contratos', 'Revisão de contratos de longo prazo — cláusulas tributárias', 'Incluir cláusulas de revisão de preço por variação tributária em contratos com vigência após 2027.', 'high', '2026', 20),
('contratos', 'Atualização de precificação para absorver Split Payment', 'O Split Payment pode reduzir o capital de giro — revisar preços e prazos de recebimento.', 'high', '2027', 21),
('contratos', 'Revisão de contratos com entidades sem fins lucrativos', 'Imunidade e isenções precisam ser revisadas conforme regulamentação do CG-IBS.', 'medium', '2028', 22),
-- TREINAMENTO
('treinamento', 'Capacitação da equipe em CBS e IBS', 'Treinamento técnico sobre a estrutura do IVA Dual, não-cumulatividade e split payment.', 'high', '2026', 30),
('treinamento', 'Treinamento em operações com Imposto Seletivo', 'Para escritórios com clientes em setores afetados pelo IS.', 'medium', '2027', 31),
('treinamento', 'Atualização contínua — acompanhamento da regulamentação do CG-IBS', 'O Comitê Gestor do IBS publicará regulamentações ao longo de 2025-2033. Monitorar sistematicamente.', 'high', 'ongoing', 32),
-- DOCUMENTAÇÃO
('documentacao', 'Emissão de NF-e com novos campos CBS/IBS', 'A partir de 2026, notas fiscais devem conter os campos separados de CBS e IBS.', 'critical', '2026', 40),
('documentacao', 'Guarda de documentos fiscais do período de transição', 'Manter documentos PIS/COFINS acessíveis para auditoria durante todo o período de transição.', 'medium', 'ongoing', 41),
('documentacao', 'Escrituração contábil adaptada ao novo regime', 'Plano de contas precisa refletir CBS, IBS e IS como tributos distintos.', 'high', '2027', 42),
-- FISCAL
('fiscal', 'Aproveitamento de créditos acumulados de PIS/COFINS antes de 2027', 'Última janela para utilizar créditos do regime não-cumulativo antes da extinção.', 'critical', '2026', 50),
('fiscal', 'Pedido de restituição/ressarcimento de IPI antes da transição', 'IPI será gradualmente substituído — aproveitar créditos acumulados.', 'high', '2026', 51),
('fiscal', 'Planejamento da transição de regime tributário', 'Para clientes LP com alto impacto, iniciar processo de migração para LR ou estrutura Holding.', 'high', '2026', 52),
('fiscal', 'Avaliação de benefícios fiscais vigentes e sua manutenção pós-reforma', 'Benefícios de ICMS e ISS têm previsão de extinção. Avaliar impacto e alternativas.', 'medium', '2029', 53),
('fiscal', 'Adequação ao recolhimento centralizado do IBS (2029+)', 'A partir de 2029, IBS será recolhido de forma centralizada pelo CG-IBS com distribuição automática.', 'high', '2029', 54)
on conflict do nothing;
