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

  const data = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: categoryLabels[category as InvestmentCategory],
      value,
      color: categoryColors[category as InvestmentCategory],
      category: category as InvestmentCategory,
    }));

  if (data.length === 0) {
    return (
      <div className="investment-card h-[300px] flex items-center justify-center animate-fade-in">
        <p className="text-muted-foreground">Nenhum investimento cadastrado</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="text-card-foreground font-medium">{payload[0].name}</p>
          <p className="text-primary font-mono">{formatCurrency(payload[0].value)}</p>
          <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
        </div>
      );
    }
    return null;
  };

  const handlePieClick = (data: any) => {
    if (data && data.category) {
      setSelectedCategory(data.category);
    }
  };

  return (
    <>
      <div className="investment-card animate-fade-in">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Distribuição por Categoria</h3>
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
                onClick={handlePieClick}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{
                      filter: 'drop-shadow(0 0 8px ' + entry.color + ')',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value) => (
                  <span className="text-card-foreground text-sm">{value}</span>
                )}
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
