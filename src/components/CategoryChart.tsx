import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { InvestmentCategory, categoryLabels, categoryColors } from '@/types/investment';

interface CategoryChartProps {
  categoryTotals: Record<InvestmentCategory, number>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function CategoryChart({ categoryTotals }: CategoryChartProps) {
  const data = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: categoryLabels[category as InvestmentCategory],
      value,
      color: categoryColors[category as InvestmentCategory],
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
        </div>
      );
    }
    return null;
  };

  return (
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
  );
}
