import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Investment, InvestmentCategory, categoryLabels, categoryColors } from '@/types/investment';
import { CategoryDetailModal } from './CategoryDetailModal';

interface CategoryChartProps {
  categoryTotals: Record<InvestmentCategory, number>;
  investments: Investment[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function CategoryChart({ categoryTotals, investments }: CategoryChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<InvestmentCategory | null>(null);

  const totalValue = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  const data = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: categoryLabels[category as InvestmentCategory],
      value,
      color: categoryColors[category as InvestmentCategory],
      category: category as InvestmentCategory,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));

  if (data.length === 0) {
    return (
      <div className="investment-card h-[300px] flex items-center justify-center animate-fade-in">
        <p className="text-muted-foreground">Nenhum investimento cadastrado</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }
    return (
      <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg pointer-events-none">
        <p className="text-card-foreground font-medium">{payload[0].name}</p>
        <p className="text-primary font-mono">{formatCurrency(payload[0].value)}</p>
        <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
      </div>
    );
  };

  const handlePieClick = (slice: any, index: number, e?: any) => {
    // Evita que o click seja interpretado como "click outside" por overlays/portais
    e?.stopPropagation?.();

    // Recharts pode passar o objeto direto ou dentro de payload
    const category: InvestmentCategory | undefined = slice?.category || slice?.payload?.category;
    if (category) {
      console.log('[CategoryChart] click slice', { category, index });
      setSelectedCategory(category);
    } else {
      console.log('[CategoryChart] click slice (no category)', { slice, index });
    }
  };

  return (
    <>
      <div className="investment-card animate-fade-in">
        <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">Distribuição por Categoria</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                stroke="transparent"
                isAnimationActive={false}
                onClick={handlePieClick}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => {
                  const isSelected = selectedCategory === entry.category;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      onMouseDown={(e) => handlePieClick(entry, index, e)}
                      style={{
                        filter: isSelected 
                          ? 'drop-shadow(0 0 12px ' + entry.color + ') brightness(1.2)'
                          : 'drop-shadow(0 0 8px ' + entry.color + ')',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'transform 0.2s ease-out, filter 0.2s ease-out',
                      }}
                    />
                  );
                })}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ pointerEvents: 'none' }}
              />
              <Legend 
                formatter={(value, entry: any) => {
                  const item = data.find(d => d.name === value);
                  const percent = item ? item.percent.toFixed(1) : '0.0';
                  return (
                    <span className="text-card-foreground text-sm">
                      {value} <span className="text-muted-foreground font-mono">({percent}%)</span>
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {selectedCategory && (
        <CategoryDetailModal
          category={selectedCategory}
          investments={investments}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </>
  );
}
