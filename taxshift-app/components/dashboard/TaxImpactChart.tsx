'use client'

import React from 'react'

const sectors = [
  { name: 'Serviços', impact: 18.4, color: '#dc2626' },
  { name: 'Tecnologia', impact: 15.9, color: '#ef4444' },
  { name: 'Indústria', impact: 7.2, color: '#f97316' },
  { name: 'Comércio', impact: 2.1, color: '#f59e0b' },
  { name: 'Saúde', impact: -3.5, color: '#16a34a' },
  { name: 'Agronegócio', impact: -8.1, color: '#15803d' },
]

const maxAbsValue = Math.max(...sectors.map((s) => Math.abs(s.impact)))

export default function TaxImpactChart() {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[#0d0e11]">Impacto por Setor</h3>
        <span className="text-xs text-[#9ca3af]">Reforma Tributária 2026</span>
      </div>
      <p className="text-xs text-[#6b7280] mb-5">Variação estimada na carga tributária (IBS/CBS vs. atual)</p>

      <div className="space-y-3">
        {sectors.map((sector) => {
          const isPositive = sector.impact > 0
          const barWidth = (Math.abs(sector.impact) / maxAbsValue) * 100

          return (
            <div key={sector.name} className="flex items-center gap-3">
              <div className="w-20 flex-shrink-0">
                <span className="text-xs font-medium text-[#23252c]">{sector.name}</span>
              </div>

              <div className="flex-1 flex items-center gap-2">
                {/* Negative side (left) */}
                <div className="flex-1 flex justify-end">
                  {!isPositive && (
                    <div
                      className="h-5 rounded-l-sm rounded-r-sm flex items-center justify-end pr-1 transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: sector.color,
                        maxWidth: '100%',
                      }}
                    />
                  )}
                  {isPositive && <div className="h-5" />}
                </div>

                {/* Center divider */}
                <div className="w-px h-5 bg-[#e5e7eb] flex-shrink-0" />

                {/* Positive side (right) */}
                <div className="flex-1">
                  {isPositive && (
                    <div
                      className="h-5 rounded-l-sm rounded-r-sm transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: sector.color,
                        maxWidth: '100%',
                      }}
                    />
                  )}
                  {!isPositive && <div className="h-5" />}
                </div>
              </div>

              <div className="w-14 flex-shrink-0 text-right">
                <span
                  className="text-xs font-semibold font-mono"
                  style={{ color: sector.color }}
                >
                  {isPositive ? '+' : ''}{sector.impact.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f3f4f6]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#16a34a]" />
          <span className="text-xs text-[#6b7280]">Redução de carga</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#dc2626]" />
          <span className="text-xs text-[#6b7280]">Aumento de carga</span>
        </div>
      </div>
    </div>
  )
}
