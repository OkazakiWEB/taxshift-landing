// ─── TaxShift Tax Reform Calculator ───────────────────────────────────────────
// Based on EC 132/2023 — Brazilian Tax Reform
// IVA Dual: CBS (federal) + IBS (states/municipalities)

export interface TaxInput {
  regime: 'SN' | 'LP' | 'LR' | 'MEI'
  sector: string
  revenue: number // annual in BRL
  state?: string
  hasCredits?: boolean // does the company generate IPI/ICMS credits
}

export interface YearlyImpact {
  year: number
  currentBurden: number // R$
  newBurden: number // R$
  delta: number // R$
  deltaPercent: number // %
  cbs: number // R$ CBS contribution
  ibs: number // R$ IBS contribution
  totalEffectiveRate: number // %
}

export interface ScenarioResult {
  name: string
  effectiveRate2033: number
  annualBurden2033: number
  pros: string[]
  cons: string[]
  recommended: boolean
}

export interface SimulationResult {
  input: TaxInput
  currentAnnualBurden: number
  currentEffectiveRate: number
  newAnnualBurden2033: number
  newEffectiveRate2033: number
  totalImpact: number // R$ per year difference in 2033
  totalImpactPercent: number
  recommendation: 'maintain' | 'migrate_lr' | 'holding' | 'review'
  yearlyProjection: YearlyImpact[] // 2025-2033
  scenarios: {
    current: ScenarioResult
    lucroReal: ScenarioResult
    holding: ScenarioResult
  }
  savings: {
    vsLucroReal: number // R$/year
    vsHolding: number // R$/year
    bestOption: string
    bestSavings: number
  }
}

// ─── Sector multipliers for new IVA Dual ──────────────────────────────────────
const SECTOR_MULTIPLIERS: Record<string, number> = {
  servicos: 1.2,
  tecnologia: 1.15,
  construcao: 1.1,
  saude: 0.85,
  educacao: 0.7,
  agronegocio: 0.75,
  comercio: 0.95,
  industria: 0.9,
  alimentacao: 0.6,
}

// ─── Transition factors per year ──────────────────────────────────────────────
const TRANSITION_FACTORS: Record<number, number> = {
  2025: 0.0,
  2026: 0.01,
  2027: 0.10,
  2028: 0.15,
  2029: 0.25,
  2030: 0.40,
  2031: 0.60,
  2032: 0.80,
  2033: 1.0,
}

// CBS rates per year
const CBS_RATES: Record<number, number> = {
  2025: 0.0,
  2026: 0.009,
  2027: 0.088,
  2028: 0.088,
  2029: 0.088,
  2030: 0.088,
  2031: 0.088,
  2032: 0.088,
  2033: 0.088,
}

// IBS rates per year
const IBS_RATES: Record<number, number> = {
  2025: 0.0,
  2026: 0.001,
  2027: 0.001,
  2028: 0.002,
  2029: 0.030,
  2030: 0.065,
  2031: 0.105,
  2032: 0.145,
  2033: 0.177,
}

// ─── Current burden calculation ────────────────────────────────────────────────
function getSectorKey(sector: string): string {
  const map: Record<string, string> = {
    'Serviços': 'servicos',
    'Tecnologia': 'tecnologia',
    'Saúde': 'saude',
    'Educação': 'educacao',
    'Construção': 'construcao',
    'Comércio': 'comercio',
    'Indústria': 'industria',
    'Agronegócio': 'agronegocio',
    'Alimentação': 'alimentacao',
    servicos: 'servicos',
    tecnologia: 'tecnologia',
    saude: 'saude',
    educacao: 'educacao',
    construcao: 'construcao',
    comercio: 'comercio',
    industria: 'industria',
    agronegocio: 'agronegocio',
    alimentacao: 'alimentacao',
  }
  return map[sector] ?? 'servicos'
}

function getSectorMultiplier(sector: string): number {
  const key = getSectorKey(sector)
  return SECTOR_MULTIPLIERS[key] ?? 1.0
}

// Calculate current effective tax burden based on regime
function calculateCurrentBurden(input: TaxInput): number {
  const { regime, sector, revenue } = input
  const sectorKey = getSectorKey(sector)

  switch (regime) {
    case 'MEI': {
      // MEI pays fixed monthly: ~R$66 (INSS) + small ISS/ICMS
      // Effective rate is very low, around 2-3%
      const fixedAnnual = 792 // approx annual DAS MEI
      const issApprox = sectorKey === 'servicos' || sectorKey === 'tecnologia' ? revenue * 0.02 : 0
      return Math.min(fixedAnnual + issApprox, revenue * 0.04)
    }

    case 'SN': {
      // Simples Nacional — services annexo III/V ~16% effective
      // PIS/COFINS included in DAS, ISS ~3%
      const snRates: Record<string, number> = {
        servicos: 0.155,
        tecnologia: 0.155,
        saude: 0.14,
        educacao: 0.12,
        construcao: 0.14,
        comercio: 0.085,
        industria: 0.075,
        agronegocio: 0.07,
        alimentacao: 0.07,
      }
      const rate = snRates[sectorKey] ?? 0.15
      // Progressive adjustment for revenue size
      let adjustedRate = rate
      if (revenue > 1_800_000) adjustedRate = rate * 1.05
      if (revenue > 3_600_000) adjustedRate = rate * 1.1
      return revenue * adjustedRate
    }

    case 'LP': {
      // Lucro Presumido — services
      const pis = 0.0065
      const cofins = 0.03
      // IRPJ: 15% on 32% presumption = 4.8%; +10% above 20k/month additional
      const presuncao = 0.32
      const irpj = presuncao * 0.15
      const irpjAdditional = revenue > 240_000 ? Math.min((revenue * presuncao - 240_000) * 0.1 / revenue, 0.02) : 0
      const csll = presuncao * 0.09
      // ISS varies by sector
      const issRates: Record<string, number> = {
        servicos: 0.04,
        tecnologia: 0.04,
        saude: 0.03,
        educacao: 0.03,
        construcao: 0.03,
        comercio: 0.0,
        industria: 0.0,
        agronegocio: 0.0,
        alimentacao: 0.02,
      }
      const iss = issRates[sectorKey] ?? 0.035
      const effectiveRate = pis + cofins + irpj + irpjAdditional + csll + iss
      return revenue * effectiveRate
    }

    case 'LR': {
      // Lucro Real — non-cumulative PIS/COFINS
      const pis = 0.0165
      const cofins = 0.076
      // Credit assumption: ~30% of PIS/COFINS can be credited
      const creditRate = input.hasCredits ? 0.30 : 0.15
      const netPisCofins = (pis + cofins) * (1 - creditRate)
      // IRPJ/CSLL varies but estimate 8-12% effective on revenue
      const irpjCsll = 0.10 // 10% effective combined
      const issRates: Record<string, number> = {
        servicos: 0.04,
        tecnologia: 0.04,
        saude: 0.03,
        educacao: 0.03,
        construcao: 0.03,
        comercio: 0.0,
        industria: 0.0,
        agronegocio: 0.0,
        alimentacao: 0.02,
      }
      const iss = issRates[sectorKey] ?? 0.035
      const effectiveRate = netPisCofins + irpjCsll + iss
      return revenue * effectiveRate
    }

    default:
      return revenue * 0.15
  }
}

// Calculate estimated credits for IVA Dual
function estimateCredits(input: TaxInput): number {
  const { regime, sector, revenue } = input
  const sectorKey = getSectorKey(sector)

  // Credit percentages depend on sector and regime
  const creditRates: Record<string, number> = {
    industria: 0.35,
    comercio: 0.30,
    agronegocio: 0.25,
    construcao: 0.20,
    alimentacao: 0.20,
    tecnologia: 0.10,
    saude: 0.08,
    educacao: 0.06,
    servicos: 0.05,
  }

  const baseCreditRate = creditRates[sectorKey] ?? 0.05
  // LR and LP companies get better credit access
  const regimeMultiplier = regime === 'LR' ? 1.2 : regime === 'LP' ? 1.0 : 0.7

  return revenue * 0.265 * baseCreditRate * regimeMultiplier
}

// Calculate new 2033 burden under IVA Dual
function calculateNewBurden2033(input: TaxInput): number {
  const { revenue } = input
  const sectorMultiplier = getSectorMultiplier(input.sector)
  const grossIVA = revenue * 0.265 * sectorMultiplier
  const credits = estimateCredits(input)
  // IRPJ/CSLL remain — approximately same effective rate
  const irpjCsll = calculateIRPJCSLL(input)
  return Math.max(grossIVA - credits + irpjCsll, 0)
}

function calculateIRPJCSLL(input: TaxInput): number {
  const { regime, revenue } = input
  switch (regime) {
    case 'MEI': return 0
    case 'SN': return 0 // included in DAS
    case 'LP': {
      const presuncao = 0.32
      const irpj = revenue * presuncao * 0.15
      const additional = Math.max(revenue * presuncao - 240_000, 0) * 0.1
      const csll = revenue * presuncao * 0.09
      return irpj + additional + csll
    }
    case 'LR': return revenue * 0.10 // 10% effective combined
    default: return 0
  }
}

// Calculate new burden for a specific year during transition
function calculateYearlyBurden(
  currentBurden: number,
  newBurden2033: number,
  year: number
): number {
  const factor = TRANSITION_FACTORS[year] ?? 1.0
  return currentBurden * (1 - factor) + newBurden2033 * factor
}

// Calculate CBS and IBS contributions for a given year
function calculateYearlyComponents(
  input: TaxInput,
  year: number
): { cbs: number; ibs: number } {
  const { revenue } = input
  const sectorMultiplier = getSectorMultiplier(input.sector)
  const credits = estimateCredits(input)
  const creditFactor = TRANSITION_FACTORS[year] ?? 0

  const grossRevenue = revenue * sectorMultiplier

  const cbsRate = CBS_RATES[year] ?? 0
  const ibsRate = IBS_RATES[year] ?? 0

  const cbsGross = grossRevenue * cbsRate
  const ibsGross = grossRevenue * ibsRate

  // Credits are proportional to transition factor
  const totalGross = cbsGross + ibsGross
  const totalCreditsApplied = credits * creditFactor

  // Distribute credits proportionally
  const cbsProportion = totalGross > 0 ? cbsGross / totalGross : 0
  const ibsProportion = totalGross > 0 ? ibsGross / totalGross : 0

  return {
    cbs: Math.max(cbsGross - totalCreditsApplied * cbsProportion, 0),
    ibs: Math.max(ibsGross - totalCreditsApplied * ibsProportion, 0),
  }
}

// ─── Scenario calculations ─────────────────────────────────────────────────────

function calculateScenarioCurrent(input: TaxInput): ScenarioResult {
  const newBurden = calculateNewBurden2033(input)
  const effectiveRate = (newBurden / input.revenue) * 100

  const sectorKey = getSectorKey(input.sector)

  const prosByRegime: Record<string, string[]> = {
    MEI: ['Simplicidade fiscal', 'Custo fixo previsível', 'Baixa burocracia'],
    SN: ['Apuração simplificada', 'Guia única (DAS)', 'Menor burocracia contábil'],
    LP: ['Presunção de lucro fixa', 'Planejamento previsível', 'Menos obrigações acessórias'],
    LR: ['Creditamento amplo de PIS/COFINS', 'Melhor aproveitamento de créditos', 'Ideal para margens baixas'],
  }

  const consByRegime: Record<string, string[]> = {
    MEI: ['Limite R$81k/ano', 'Sem créditos IVA', 'Transição obrigatória para SN/LP'],
    SN: ['Sem aproveitamento de créditos IVA', 'Limite R$4,8M', 'Tributação mista pode ser desvantajosa'],
    LP: ['Sem não-cumulatividade IVA', 'IRPJ/CSLL sobre presunção', 'Pode ser desvantajoso com créditos altos'],
    LR: ['Alta complexidade contábil', 'Mais obrigações acessórias', 'Custo de conformidade elevado'],
  }

  const multiplier = getSectorMultiplier(input.sector)
  const isHighBurden = multiplier >= 1.1

  return {
    name: getRegimeName(input.regime),
    effectiveRate2033: effectiveRate,
    annualBurden2033: newBurden,
    pros: prosByRegime[input.regime] ?? ['Regime atual mantido', 'Sem custo de migração'],
    cons: consByRegime[input.regime] ?? ['Avaliar impacto da reforma'],
    recommended: !isHighBurden,
  }
}

function calculateScenarioLucroReal(input: TaxInput): ScenarioResult {
  const lrInput: TaxInput = { ...input, regime: 'LR', hasCredits: true }
  const newBurden = calculateNewBurden2033(lrInput)
  const effectiveRate = (newBurden / input.revenue) * 100

  return {
    name: 'Lucro Real',
    effectiveRate2033: effectiveRate,
    annualBurden2033: newBurden,
    pros: [
      'Máximo aproveitamento de créditos IVA',
      'Não-cumulatividade ampla',
      'Ideal para setores com cadeia longa',
    ],
    cons: [
      'Alta complexidade operacional',
      'IRPJ/CSLL sobre lucro efetivo',
      'Exige contabilidade detalhada',
    ],
    recommended: false,
  }
}

function calculateScenarioHolding(input: TaxInput): ScenarioResult {
  // Holding + LP: operational company as LP/SN + holding for dividends
  // Main advantage: dividends tax-free (currently), IRPJ reduction through structure
  // Effective rate ~10-15% less than standalone LP/LR
  const holdingInput: TaxInput = { ...input, regime: 'LP' }
  const baseBurden = calculateNewBurden2033(holdingInput)

  // Holding structure provides ~15-20% reduction in overall burden
  // through: dividend extraction, IRPJ optimization, IP holding
  const holdingReduction = 0.18
  const newBurden = baseBurden * (1 - holdingReduction)
  const effectiveRate = (newBurden / input.revenue) * 100

  return {
    name: 'Holding + LP',
    effectiveRate2033: effectiveRate,
    annualBurden2033: newBurden,
    pros: [
      'Distribuição de lucros isenta de IR',
      'Planejamento sucessório otimizado',
      'Separação patrimonial e redução de risco',
    ],
    cons: [
      'Custo de estruturação inicial elevado',
      'Governança corporativa necessária',
      'Pode atrair atenção fiscal se mal estruturado',
    ],
    recommended: false,
  }
}

function getRegimeName(regime: string): string {
  const names: Record<string, string> = {
    MEI: 'MEI',
    SN: 'Simples Nacional',
    LP: 'Lucro Presumido',
    LR: 'Lucro Real',
  }
  return names[regime] ?? regime
}

function determineRecommendation(
  current: ScenarioResult,
  lucroReal: ScenarioResult,
  holding: ScenarioResult,
  input: TaxInput
): 'maintain' | 'migrate_lr' | 'holding' | 'review' {
  const currentBurden = current.annualBurden2033
  const lrBurden = lucroReal.annualBurden2033
  const holdingBurden = holding.annualBurden2033

  const minBurden = Math.min(currentBurden, lrBurden, holdingBurden)

  // Significant saving threshold: >5% or >R$10k/year
  const threshold = Math.max(currentBurden * 0.05, 10_000)

  if (holdingBurden < currentBurden - threshold) return 'holding'
  if (lrBurden < currentBurden - threshold) return 'migrate_lr'
  if (Math.abs(currentBurden - minBurden) < threshold) return 'maintain'
  return 'review'
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function calculateTax(input: TaxInput): SimulationResult {
  const currentAnnualBurden = calculateCurrentBurden(input)
  const currentEffectiveRate = (currentAnnualBurden / input.revenue) * 100

  const newAnnualBurden2033 = calculateNewBurden2033(input)
  const newEffectiveRate2033 = (newAnnualBurden2033 / input.revenue) * 100

  const totalImpact = newAnnualBurden2033 - currentAnnualBurden
  const totalImpactPercent = currentAnnualBurden > 0
    ? (totalImpact / currentAnnualBurden) * 100
    : 0

  // Year-by-year projection 2025-2033
  const years = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]
  const yearlyProjection: YearlyImpact[] = years.map((year) => {
    const yearBurden = calculateYearlyBurden(currentAnnualBurden, newAnnualBurden2033, year)
    const { cbs, ibs } = calculateYearlyComponents(input, year)
    const delta = yearBurden - currentAnnualBurden
    const deltaPercent = currentAnnualBurden > 0 ? (delta / currentAnnualBurden) * 100 : 0
    const totalEffectiveRate = (yearBurden / input.revenue) * 100

    return {
      year,
      currentBurden: currentAnnualBurden,
      newBurden: yearBurden,
      delta,
      deltaPercent,
      cbs,
      ibs,
      totalEffectiveRate,
    }
  })

  // Scenarios
  const currentScenario = calculateScenarioCurrent(input)
  const lucroRealScenario = calculateScenarioLucroReal(input)
  const holdingScenario = calculateScenarioHolding(input)

  // Mark recommended
  const recommendation = determineRecommendation(
    currentScenario,
    lucroRealScenario,
    holdingScenario,
    input
  )

  if (recommendation === 'holding') holdingScenario.recommended = true
  else if (recommendation === 'migrate_lr') lucroRealScenario.recommended = true
  else currentScenario.recommended = true

  // Savings calculations
  const vsLucroReal = currentScenario.annualBurden2033 - lucroRealScenario.annualBurden2033
  const vsHolding = currentScenario.annualBurden2033 - holdingScenario.annualBurden2033

  const options: Array<{ name: string; savings: number }> = [
    { name: getRegimeName(input.regime) + ' (manter)', savings: 0 },
    { name: 'Migrar para Lucro Real', savings: vsLucroReal },
    { name: 'Estrutura Holding + LP', savings: vsHolding },
  ]

  const best = options.reduce((a, b) => (b.savings > a.savings ? b : a))

  return {
    input,
    currentAnnualBurden,
    currentEffectiveRate,
    newAnnualBurden2033,
    newEffectiveRate2033,
    totalImpact,
    totalImpactPercent,
    recommendation,
    yearlyProjection,
    scenarios: {
      current: currentScenario,
      lucroReal: lucroRealScenario,
      holding: holdingScenario,
    },
    savings: {
      vsLucroReal,
      vsHolding,
      bestOption: best.name,
      bestSavings: best.savings,
    },
  }
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + '%'
}
