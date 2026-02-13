import { Investment, categoryLabels } from '@/types/investment';
import type { IncomePayment, IncomeStats } from '@/hooks/useIncomePayments';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function generateInvestmentsPDF(
  investments: Investment[],
  userName: string,
  incomeStats?: IncomeStats,
  payments?: IncomePayment[]
) {
  // Group investments by category
  const byCategory = investments.reduce((acc, inv) => {
    const label = categoryLabels[inv.category] || inv.category;
    if (!acc[label]) acc[label] = [];
    acc[label].push(inv);
    return acc;
  }, {} as Record<string, Investment[]>);

  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  const now = new Date();

  let categorySections = '';
  for (const [catLabel, invs] of Object.entries(byCategory).sort((a, b) => a[0].localeCompare(b[0]))) {
    const catTotal = invs.reduce((s, i) => s + i.currentValue, 0);
    const catInvested = invs.reduce((s, i) => s + i.investedAmount, 0);
    const catPL = catTotal - catInvested;

    categorySections += `
      <div class="category">
        <div class="cat-header">
          <span>${catLabel}</span>
          <span>${formatCurrency(catTotal)}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Ativo</th>
              <th>Qtd</th>
              <th>Preço Médio</th>
              <th>Preço Atual</th>
              <th>Investido</th>
              <th>Atual</th>
              <th>Lucro/Prejuízo</th>
            </tr>
          </thead>
          <tbody>
            ${invs.map(inv => `
              <tr>
                <td style="text-align:left;font-weight:600">${inv.ticker || inv.name}</td>
                <td>${inv.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 8 })}</td>
                <td>${formatCurrency(inv.averagePrice)}</td>
                <td>${formatCurrency(inv.currentPrice)}</td>
                <td>${formatCurrency(inv.investedAmount)}</td>
                <td>${formatCurrency(inv.currentValue)}</td>
                <td class="${inv.profitLoss >= 0 ? 'positive' : 'negative'}">
                  ${formatCurrency(inv.profitLoss)} (${formatPercent(inv.profitLossPercent)})
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td style="text-align:left;font-weight:700">Subtotal</td>
              <td></td><td></td><td></td>
              <td style="font-weight:700">${formatCurrency(catInvested)}</td>
              <td style="font-weight:700">${formatCurrency(catTotal)}</td>
              <td class="${catPL >= 0 ? 'positive' : 'negative'}" style="font-weight:700">
                ${formatCurrency(catPL)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  // Build projected passive income section from investments with dividends field
  const investmentsWithIncome = investments.filter(inv => inv.dividends && inv.dividends > 0);
  let projectedIncomeSection = '';
  if (investmentsWithIncome.length > 0) {
    const totalMonthlyProjected = investmentsWithIncome.reduce((s, inv) => s + (inv.dividends || 0), 0);
    const projectedRows = investmentsWithIncome.map(inv => `
      <tr>
        <td style="text-align:left;font-weight:600">${inv.ticker || inv.name}</td>
        <td>${categoryLabels[inv.category] || inv.category}</td>
        <td>${formatCurrency(inv.dividends || 0)}</td>
        <td>${formatCurrency((inv.dividends || 0) * 12)}</td>
      </tr>
    `).join('');

    projectedIncomeSection = `
      <div class="category" style="margin-top:24px;">
        <div class="cat-header">
          <span>🏠 Renda Passiva Projetada (Mensal)</span>
          <span>${formatCurrency(totalMonthlyProjected)}/mês</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Ativo</th>
              <th>Categoria</th>
              <th>Mensal</th>
              <th>Anual</th>
            </tr>
          </thead>
          <tbody>
            ${projectedRows}
          </tbody>
          <tfoot>
            <tr>
              <td style="text-align:left;font-weight:700">Total</td>
              <td></td>
              <td style="font-weight:700">${formatCurrency(totalMonthlyProjected)}</td>
              <td style="font-weight:700">${formatCurrency(totalMonthlyProjected * 12)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  // Build income section from income_payments
  let incomeSection = '';
  if (incomeStats) {
    const monthlyRows = incomeStats.last12Months.map(m => `
      <tr>
        <td style="text-align:left;text-transform:capitalize">${m.month}</td>
        <td>${formatCurrency(m.amount)}</td>
      </tr>
    `).join('');

    incomeSection = `
      <div class="category" style="margin-top:24px;">
        <div class="cat-header">
          <span>💰 Rendimentos Recebidos (Últimos 12 meses)</span>
          <span>${formatCurrency(incomeStats.totalReceived)}</span>
        </div>

        <div class="income-summary">
          <div class="income-item">
            <span class="label">Total Recebido</span>
            <span class="value">${formatCurrency(incomeStats.totalReceived)}</span>
          </div>
          <div class="income-item">
            <span class="label">Média Mensal</span>
            <span class="value">${formatCurrency(incomeStats.monthlyAverage)}</span>
          </div>
          <div class="income-item">
            <span class="label">Dividendos</span>
            <span class="value">${formatCurrency(incomeStats.byType.dividend)}</span>
          </div>
          <div class="income-item">
            <span class="label">Aluguéis</span>
            <span class="value">${formatCurrency(incomeStats.byType.rent)}</span>
          </div>
          <div class="income-item">
            <span class="label">Juros</span>
            <span class="value">${formatCurrency(incomeStats.byType.interest)}</span>
          </div>
        </div>

        <table style="margin-top:8px">
          <thead>
            <tr>
              <th style="text-align:left">Mês</th>
              <th>Valor Recebido</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyRows}
          </tbody>
        </table>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Investimentos - ${userName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 24px; font-size: 11px; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #00e676; padding-bottom: 16px; }
        .header h1 { font-size: 20px; color: #00e676; margin-bottom: 4px; }
        .header p { color: #666; font-size: 12px; }
        .summary { display: flex; justify-content: space-around; margin-bottom: 24px; padding: 12px; background: #f5f5f5; border-radius: 8px; }
        .summary-item { text-align: center; }
        .summary-item .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-item .value { font-size: 16px; font-weight: 700; margin-top: 2px; }
        .positive { color: #00c853; }
        .negative { color: #ff1744; }
        .category { margin-bottom: 20px; page-break-inside: avoid; }
        .cat-header { display: flex; justify-content: space-between; align-items: center; background: #1a1a2e; color: #00e676; padding: 6px 12px; border-radius: 4px; font-weight: 700; font-size: 12px; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #f0f0f0; padding: 5px 6px; text-align: right; font-weight: 600; border-bottom: 1px solid #ddd; }
        td { padding: 4px 6px; text-align: right; border-bottom: 1px solid #eee; }
        tfoot td { border-top: 2px solid #ccc; background: #fafafa; }
        .income-summary { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 0; }
        .income-item { flex: 1 1 120px; background: #f5f5f5; border-radius: 6px; padding: 8px 12px; text-align: center; }
        .income-item .label { display: block; font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .income-item .value { display: block; font-size: 13px; font-weight: 700; margin-top: 2px; }
        .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; color: #999; font-size: 9px; }
        @media print {
          body { padding: 12px; }
          .category { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Relatório de Investimentos</h1>
        <p>${userName} • Gerado em ${formatDate(now)} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="label">Total Investido</div>
          <div class="value">${formatCurrency(totalInvested)}</div>
        </div>
        <div class="summary-item">
          <div class="label">Valor Atual</div>
          <div class="value">${formatCurrency(totalCurrent)}</div>
        </div>
        <div class="summary-item">
          <div class="label">Lucro / Prejuízo</div>
          <div class="value ${totalPL >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalPL)} (${formatPercent(totalPLPercent)})</div>
        </div>
        <div class="summary-item">
          <div class="label">Nº de Ativos</div>
          <div class="value">${investments.length}</div>
        </div>
      </div>

      ${categorySections}

      ${projectedIncomeSection}

      ${incomeSection}

      <div class="footer">
        Relatório gerado pelo My Invest • ${formatDate(now)}
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Permita pop-ups para baixar o PDF.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
