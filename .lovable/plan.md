

## Plano: Renomear "Preço Médio" para "Preço de Compra" em Formulários de Cadastro

### Resumo
O usuário deseja mudar o rótulo "Preço Médio" para "Preço de Compra" em todos os formulários de cadastro de ativos. Atualmente, o campo está auto-preenchido com a cotação atual em tempo real, o que é confuso para o usuário que precisa inserir o preço que realmente pagou.

### Contexto do Problema
- O formulário atualmente preenche automaticamente o campo com o preço de mercado em tempo real
- O rótulo "Preço Médio" é impreciso, pois o campo deveria ser o "Preço de Compra"
- Múltiplos formulários têm essa inconsistência

### Arquivos Afetados (14 formulários)
1. **src/components/forms/StockForm.tsx** - Linha 271: "Preço Médio (R$)" / "Preço Venda (R$)"
2. **src/components/forms/FIIForm.tsx** - Linha 274: "Preço Médio (R$)"
3. **src/components/forms/CryptoForm.tsx** - Linhas ~500+: "Preço Médio" (múltiplas ocorrências)
4. **src/components/forms/BitcoinForm.tsx** - Linhas 189: "Preço de Compra (USD)" / "Preço de Venda (USD)" ✓ (já está correto)
5. **src/components/forms/AltcoinForm.tsx** - Linhas ~500+: "Preço Médio" (múltiplas ocorrências)
6. **src/components/forms/StablecoinForm.tsx** - Linhas 341: "Preço de Compra (USD)" / "Preço de Venda (USD)" ✓ (já está correto)
7. **src/components/forms/USAStockForm.tsx** - Arquivo inteiro (precisa revisar)
8. **src/components/forms/REITsForm.tsx** - Arquivo inteiro (precisa revisar)
9. **src/components/forms/BDRForm.tsx** - Arquivo inteiro (precisa revisar)
10. **src/components/forms/ETFForm.tsx** - Linha 265: "Preço Médio (R$)"
11. **src/components/forms/FixedIncomeForm.tsx** - Arquivo grande com múltiplos campos
12. **src/components/forms/RealEstateForm.tsx** - Precisa revisar
13. **src/components/forms/GoldForm.tsx** - Precisa revisar
14. **src/components/forms/CashForm.tsx** - Precisa revisar

### Mudanças Necessárias

#### Padrão de Mudança
**Antes:**
```tsx
<Label htmlFor="averagePrice">{mode === 'buy' ? 'Preço Médio (R$)' : 'Preço Venda (R$)'}</Label>
```

**Depois:**
```tsx
<Label htmlFor="averagePrice">{mode === 'buy' ? 'Preço de Compra (R$)' : 'Preço de Venda (R$)'}</Label>
```

#### Formulários a Atualizar
1. **StockForm.tsx** - Mudar "Preço Médio (R$)" → "Preço de Compra (R$)"
2. **FIIForm.tsx** - Mudar "Preço Médio (R$)" → "Preço de Compra (R$)"
3. **CryptoForm.tsx** - Mudar "Preço Médio" → "Preço de Compra (USD)" na seção do formulário
4. **AltcoinForm.tsx** - Mudar "Preço Médio" → "Preço de Compra (USD)" na seção do formulário
5. **ETFForm.tsx** - Mudar "Preço Médio (R$)" → "Preço de Compra (R$)"
6. **USAStockForm.tsx** - Verificar e atualizar se necessário
7. **REITsForm.tsx** - Verificar e atualizar se necessário
8. **BDRForm.tsx** - Verificar e atualizar se necessário
9. **FixedIncomeForm.tsx** - Verificar e atualizar (campo de valor investido)
10. **RealEstateForm.tsx** - Verificar e atualizar
11. **GoldForm.tsx** - Verificar e atualizar
12. **CashForm.tsx** - Verificar e atualizar

### Nota Importante
- **BitcoinForm.tsx** e **StablecoinForm.tsx** já estão corretos com "Preço de Compra"
- O código da lógica não precisa mudar, apenas os rótulos (labels) dos campos
- As variáveis internas (`averagePrice`) mantêm seu nome para não quebrar a lógica

### Ordem de Execução
1. Atualizar StockForm.tsx
2. Atualizar FIIForm.tsx
3. Atualizar CryptoForm.tsx
4. Atualizar AltcoinForm.tsx
5. Atualizar ETFForm.tsx
6. Atualizar USAStockForm.tsx
7. Atualizar REITsForm.tsx
8. Atualizar BDRForm.tsx
9. Atualizar FixedIncomeForm.tsx
10. Atualizar RealEstateForm.tsx
11. Atualizar GoldForm.tsx
12. Atualizar CashForm.tsx

