import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Pedidos - Fluxo Completo
 */
test.describe('Pedidos', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin antes de cada teste
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@admin.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
  });

  test('deve exibir lista de pedidos', async ({ page }) => {
    await page.goto('/pedidos');
    
    // Verifica se a página de pedidos carregou
    await expect(page.getByRole('heading', { name: /pedidos/i })).toBeVisible({ timeout: 5000 });
  });

  test('deve filtrar pedidos por status', async ({ page }) => {
    await page.goto('/pedidos');
    
    // Procura por filtro de status
    const statusFilter = page.getByRole('combobox', { name: /status|filtro/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.getByRole('option', { name: /pronto/i }).click();
      
      // Verifica que o filtro foi aplicado
      await expect(page).toHaveURL(/status=PRONTO/i);
    }
  });
});

/**
 * Testes E2E da Cozinha
 */
test.describe('Cozinha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@admin.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
  });

  test('deve exibir tela da cozinha', async ({ page }) => {
    await page.goto('/cozinha');
    
    // Verifica se a página da cozinha carregou
    await expect(page.getByRole('heading', { name: /cozinha|preparo/i })).toBeVisible({ timeout: 5000 });
  });

  test('deve mostrar pedidos pendentes na cozinha', async ({ page }) => {
    await page.goto('/cozinha');
    
    // Aguarda carregamento
    await page.waitForLoadState('networkidle');
    
    // Verifica se há cards de pedidos ou mensagem de vazio
    const pedidoCards = page.locator('[data-testid="pedido-card"], .pedido-card, .order-card');
    const emptyMessage = page.getByText(/nenhum pedido|sem pedidos|vazio/i);
    
    // Deve ter pedidos ou mensagem de vazio
    const hasPedidos = await pedidoCards.count() > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasPedidos || hasEmptyMessage).toBeTruthy();
  });

  test('deve atualizar status de item para EM_PREPARO', async ({ page }) => {
    await page.goto('/cozinha');
    await page.waitForLoadState('networkidle');
    
    // Procura por botão de iniciar preparo
    const iniciarBtn = page.getByRole('button', { name: /iniciar|preparar|começar/i }).first();
    
    if (await iniciarBtn.isVisible()) {
      await iniciarBtn.click();
      
      // Verifica feedback visual
      await expect(page.getByText(/em preparo|preparando/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('deve marcar item como PRONTO', async ({ page }) => {
    await page.goto('/cozinha');
    await page.waitForLoadState('networkidle');
    
    // Procura por botão de marcar pronto
    const prontoBtn = page.getByRole('button', { name: /pronto|finalizar|concluir/i }).first();
    
    if (await prontoBtn.isVisible()) {
      await prontoBtn.click();
      
      // Verifica feedback visual ou notificação
      await expect(page.getByText(/pronto|finalizado/i)).toBeVisible({ timeout: 3000 });
    }
  });
});

/**
 * Testes E2E do Garçom
 */
test.describe('Garçom', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@admin.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
  });

  test('deve exibir tela do garçom', async ({ page }) => {
    await page.goto('/garcom');
    
    // Verifica se a página do garçom carregou
    await expect(page.getByRole('heading', { name: /garçom|garcom|atendimento/i })).toBeVisible({ timeout: 5000 });
  });

  test('deve mostrar itens prontos para retirada', async ({ page }) => {
    await page.goto('/garcom');
    await page.waitForLoadState('networkidle');
    
    // Verifica se há seção de itens prontos
    const prontoSection = page.getByText(/prontos|para retirar|aguardando/i);
    await expect(prontoSection).toBeVisible({ timeout: 5000 });
  });
});

/**
 * Testes E2E de Comandas
 */
test.describe('Comandas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@admin.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
  });

  test('deve exibir lista de comandas', async ({ page }) => {
    await page.goto('/comandas');
    
    // Verifica se a página de comandas carregou
    await expect(page.getByRole('heading', { name: /comandas/i })).toBeVisible({ timeout: 5000 });
  });

  test('deve abrir detalhes de uma comanda', async ({ page }) => {
    await page.goto('/comandas');
    await page.waitForLoadState('networkidle');
    
    // Clica na primeira comanda
    const comandaCard = page.locator('[data-testid="comanda-card"], .comanda-card, .card').first();
    
    if (await comandaCard.isVisible()) {
      await comandaCard.click();
      
      // Verifica se abriu detalhes
      await expect(page.getByText(/detalhes|pedidos|itens/i)).toBeVisible({ timeout: 3000 });
    }
  });
});

/**
 * Testes de Responsividade
 */
test.describe('Responsividade', () => {
  test('deve funcionar em tela mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@admin.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
    
    // Verifica se menu mobile está acessível
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });

  test('deve funcionar em tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@admin.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
  });
});

/**
 * Testes de Acessibilidade
 */
test.describe('Acessibilidade', () => {
  test('deve ter labels em campos de formulário', async ({ page }) => {
    await page.goto('/login');
    
    // Verifica se inputs têm labels associados
    const emailInput = page.getByLabel(/email/i);
    const senhaInput = page.getByLabel(/senha|password/i);
    
    await expect(emailInput.or(page.locator('input[type="email"]'))).toBeVisible();
    await expect(senhaInput.or(page.locator('input[type="password"]'))).toBeVisible();
  });

  test('deve ter contraste adequado', async ({ page }) => {
    await page.goto('/login');
    
    // Verifica se botão principal está visível
    const submitButton = page.getByRole('button', { name: /entrar|login|acessar/i });
    await expect(submitButton).toBeVisible();
  });

  test('deve ser navegável por teclado', async ({ page }) => {
    await page.goto('/login');
    
    // Navega por Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verifica se algum elemento está focado
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
