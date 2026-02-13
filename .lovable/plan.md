
## Corrigir Estimativa Anual no Relatorio PDF

### Problema
O relatorio PDF nao inclui os rendimentos de **renda fixa** (CDB, LCI, LCA, Tesouro, etc.) que sao calculados a partir da taxa de juros (`interestRate`) dos investimentos. O app calcula esses valores dinamicamente usando a taxa do investimento multiplicada pelo valor atual, mas o PDF so considera o campo `dividends` (usado para alugueis) e os pagamentos historicos (`income_payments`).

### Solucao
Replicar no PDF a mesma logica de calculo do componente `PassiveIncome`, incluindo:

1. **Renda fixa com taxa direta** (CDB, LCI, LCA, debentures, etc.): `currentValue * interestRate / 100`
2. **Renda fixa atrelada ao CDI** (poupanca, caixa): `currentValue * (interestRate/100 * CDI)`

### Detalhes Tecnicos

**Arquivo: `src/lib/generateInvestmentsPDF.ts`**
- Adicionar parametro `economicRates` (com taxa CDI) na funcao `generateInvestmentsPDF`
- Replicar as listas de categorias do `PassiveIncome`:
  - `interestCategories`: `['cdb', 'lci', 'lca', 'lcilca', 'treasury', 'debentures', 'cricra']`
  - `cdiPercentageCategories`: `['savings', 'cash']`
  - `rentCategories`: `['realestate']`
- Calcular juros projetados para cada investimento de renda fixa e adicioná-los a `allIncomeAssets` com tipo "Juros" e fonte "Projetado"

**Arquivo: `src/pages/Profile.tsx`**
- Importar `useEconomicRates` e passar `economicRates` para `generateInvestmentsPDF`

**Arquivo: `src/components/PassiveIncome.tsx`**
- Extrair as listas de categorias (`interestCategories`, `cdiPercentageCategories`, `rentCategories`) para um arquivo compartilhado ou constantes exportadas, para evitar duplicacao

Isso garantira que o valor de "Estimativa Anual" no PDF seja identico ao mostrado na secao de Renda Passiva do app.
