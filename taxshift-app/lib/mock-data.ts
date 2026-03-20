export type ClientRegime = 'LP' | 'SN' | 'LR' | 'MEI'
export type ClientStatus = 'active' | 'warning' | 'urgent'

export interface MockClient {
  id: string
  name: string
  cnpj: string
  regime: ClientRegime
  sector: string
  revenue: number
  taxImpact: number
  status: ClientStatus
  createdAt: string
}

export interface MockDocument {
  id: string
  client: string
  type: 'NF-e' | 'SPED' | 'DCTF' | 'ECF'
  period: string
  status: 'emitted' | 'pending' | 'error'
  date: string
  value: number
}

export interface MockAlert {
  id: string
  type: 'deadline' | 'warning' | 'info'
  title: string
  description: string
  date: string
  clientName: string
  read: boolean
}

export interface MockKPIs {
  totalClients: number
  totalRevenue: number
  urgentClients: number
  avgCompliance: number
  monthlyGrowth: number
}

export const mockClients: MockClient[] = [
  {
    id: '1',
    name: 'Construtora Horizonte Ltda',
    cnpj: '12.345.678/0001-90',
    regime: 'LP',
    sector: 'Construção Civil',
    revenue: 8500000,
    taxImpact: 18.4,
    status: 'urgent',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Farmácia Bem Estar ME',
    cnpj: '23.456.789/0001-01',
    regime: 'SN',
    sector: 'Saúde',
    revenue: 1200000,
    taxImpact: -3.5,
    status: 'active',
    createdAt: '2024-02-08',
  },
  {
    id: '3',
    name: 'Indústria Metalúrgica São João',
    cnpj: '34.567.890/0001-12',
    regime: 'LR',
    sector: 'Indústria',
    revenue: 22000000,
    taxImpact: 7.2,
    status: 'warning',
    createdAt: '2023-11-20',
  },
  {
    id: '4',
    name: 'Distribuidora Central Comércio',
    cnpj: '45.678.901/0001-23',
    regime: 'LP',
    sector: 'Comércio',
    revenue: 5800000,
    taxImpact: 2.1,
    status: 'active',
    createdAt: '2024-03-01',
  },
  {
    id: '5',
    name: 'Fazenda Boa Vista Agro',
    cnpj: '56.789.012/0001-34',
    regime: 'LR',
    sector: 'Agronegócio',
    revenue: 14000000,
    taxImpact: -8.1,
    status: 'active',
    createdAt: '2023-09-14',
  },
  {
    id: '6',
    name: 'Clínica Médica Saúde Total',
    cnpj: '67.890.123/0001-45',
    regime: 'SN',
    sector: 'Saúde',
    revenue: 3200000,
    taxImpact: -2.8,
    status: 'active',
    createdAt: '2024-01-30',
  },
  {
    id: '7',
    name: 'Tech Solutions Serviços LTDA',
    cnpj: '78.901.234/0001-56',
    regime: 'LP',
    sector: 'Tecnologia',
    revenue: 6700000,
    taxImpact: 15.9,
    status: 'urgent',
    createdAt: '2023-12-05',
  },
  {
    id: '8',
    name: 'Padaria do Bairro MEI',
    cnpj: '89.012.345/0001-67',
    regime: 'MEI',
    sector: 'Alimentação',
    revenue: 81000,
    taxImpact: 1.3,
    status: 'active',
    createdAt: '2024-04-10',
  },
]

export const mockDocuments: MockDocument[] = [
  {
    id: 'doc-1',
    client: 'Construtora Horizonte Ltda',
    type: 'NF-e',
    period: 'Mar/2025',
    status: 'emitted',
    date: '2025-03-15',
    value: 125000,
  },
  {
    id: 'doc-2',
    client: 'Indústria Metalúrgica São João',
    type: 'SPED',
    period: 'Fev/2025',
    status: 'emitted',
    date: '2025-02-28',
    value: 0,
  },
  {
    id: 'doc-3',
    client: 'Farmácia Bem Estar ME',
    type: 'DCTF',
    period: 'Mar/2025',
    status: 'pending',
    date: '2025-03-20',
    value: 4800,
  },
  {
    id: 'doc-4',
    client: 'Fazenda Boa Vista Agro',
    type: 'ECF',
    period: '2024',
    status: 'pending',
    date: '2025-07-31',
    value: 0,
  },
  {
    id: 'doc-5',
    client: 'Distribuidora Central Comércio',
    type: 'NF-e',
    period: 'Mar/2025',
    status: 'error',
    date: '2025-03-18',
    value: 87500,
  },
  {
    id: 'doc-6',
    client: 'Tech Solutions Serviços LTDA',
    type: 'DCTF',
    period: 'Fev/2025',
    status: 'emitted',
    date: '2025-02-20',
    value: 22400,
  },
  {
    id: 'doc-7',
    client: 'Clínica Médica Saúde Total',
    type: 'NF-e',
    period: 'Mar/2025',
    status: 'emitted',
    date: '2025-03-10',
    value: 45600,
  },
  {
    id: 'doc-8',
    client: 'Construtora Horizonte Ltda',
    type: 'SPED',
    period: 'Fev/2025',
    status: 'error',
    date: '2025-03-01',
    value: 0,
  },
  {
    id: 'doc-9',
    client: 'Padaria do Bairro MEI',
    type: 'NF-e',
    period: 'Mar/2025',
    status: 'emitted',
    date: '2025-03-12',
    value: 6800,
  },
  {
    id: 'doc-10',
    client: 'Indústria Metalúrgica São João',
    type: 'ECF',
    period: '2024',
    status: 'pending',
    date: '2025-07-31',
    value: 0,
  },
  {
    id: 'doc-11',
    client: 'Tech Solutions Serviços LTDA',
    type: 'NF-e',
    period: 'Mar/2025',
    status: 'pending',
    date: '2025-03-25',
    value: 38900,
  },
  {
    id: 'doc-12',
    client: 'Fazenda Boa Vista Agro',
    type: 'DCTF',
    period: 'Mar/2025',
    status: 'emitted',
    date: '2025-03-14',
    value: 12300,
  },
]

export const mockAlerts: MockAlert[] = [
  {
    id: 'alert-1',
    type: 'deadline',
    title: 'DCTF vence em 3 dias',
    description: 'A Declaração de Débitos e Créditos Tributários Federais vence no dia 20/03/2025.',
    date: '2025-03-17',
    clientName: 'Farmácia Bem Estar ME',
    read: false,
  },
  {
    id: 'alert-2',
    type: 'warning',
    title: 'Erro na transmissão do SPED',
    description: 'O arquivo SPED Fiscal de Fevereiro/2025 retornou erro de validação (código E-310).',
    date: '2025-03-15',
    clientName: 'Construtora Horizonte Ltda',
    read: false,
  },
  {
    id: 'alert-3',
    type: 'deadline',
    title: 'ECF 2024 — prazo em 4 meses',
    description: 'A Escrituração Contábil Fiscal referente ao ano-base 2024 vence em 31/07/2025.',
    date: '2025-03-14',
    clientName: 'Fazenda Boa Vista Agro',
    read: false,
  },
  {
    id: 'alert-4',
    type: 'info',
    title: 'Nova instrução normativa publicada',
    description: 'IN RFB 2.228/2025 altera regras de compensação de créditos de PIS/COFINS para empresas do setor de saúde.',
    date: '2025-03-13',
    clientName: 'Clínica Médica Saúde Total',
    read: true,
  },
  {
    id: 'alert-5',
    type: 'warning',
    title: 'Risco de autuação identificado',
    description: 'Divergência entre SPED ECD e ECF 2023 pode gerar multa. Revisar lançamentos contábeis.',
    date: '2025-03-12',
    clientName: 'Indústria Metalúrgica São João',
    read: false,
  },
  {
    id: 'alert-6',
    type: 'info',
    title: 'Reforma Tributária: impacto estimado',
    description: 'Com base nos dados atuais, o cliente terá aumento de 15.9% na carga tributária após transição para IBS/CBS.',
    date: '2025-03-10',
    clientName: 'Tech Solutions Serviços LTDA',
    read: true,
  },
  {
    id: 'alert-7',
    type: 'deadline',
    title: 'NF-e com rejeição',
    description: 'A nota fiscal 001234 foi rejeitada pela SEFAZ com código 225 — falha no cálculo do ICMS ST.',
    date: '2025-03-09',
    clientName: 'Distribuidora Central Comércio',
    read: false,
  },
  {
    id: 'alert-8',
    type: 'info',
    title: 'Simples Nacional: limite de faturamento',
    description: 'O cliente atingiu 78% do limite anual do Simples Nacional. Avalie possível migração de regime.',
    date: '2025-03-07',
    clientName: 'Farmácia Bem Estar ME',
    read: true,
  },
]

export const mockKPIs: MockKPIs = {
  totalClients: 47,
  totalRevenue: 94000000,
  urgentClients: 12,
  avgCompliance: 68,
  monthlyGrowth: 8.3,
}
