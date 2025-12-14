import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Autenticação
 */
test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve exibir página de login', async ({ page }) => {
    // Verifica se a página de login está visível
    await expect(page).toHaveURL(/\/(login)?$/);
    
    // Verifica elementos do formulário
    await expect(page.getByRole('heading', { name: /login|entrar|acesso/i })).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    // Preenche credenciais inválidas
    await page.fill('input[name="email"], input[type="email"]', 'usuario@invalido.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'senhaerrada');
    
    // Submete o formulário
    await page.click('button[type="submit"]');
    
    // Verifica mensagem de erro
    await expect(page.getByText(/credenciais|inválid|erro|incorret/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');
    
    // Preenche credenciais válidas (admin)
    await page.fill('input[name="email"], input[type="email"]', 'admin@admin.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'admin123');
    
    // Submete o formulário
    await page.click('button[type="submit"]');
    
    // Aguarda redirecionamento para dashboard
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
  });

  test('deve fazer logout', async ({ page }) => {
    // Primeiro faz login
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@admin.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguarda estar logado
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
    
    // Clica no botão de logout (pode estar em menu)
    const logoutButton = page.getByRole('button', { name: /sair|logout/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Tenta encontrar em menu de usuário
      const userMenu = page.getByRole('button', { name: /menu|usuário|perfil/i });
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.getByRole('menuitem', { name: /sair|logout/i }).click();
      }
    }
    
    // Verifica redirecionamento para login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});

/**
 * Testes de Proteção de Rotas
 */
test.describe('Proteção de Rotas', () => {
  test('deve redirecionar para login ao acessar rota protegida sem autenticação', async ({ page }) => {
    // Tenta acessar dashboard sem login
    await page.goto('/dashboard');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('deve permitir acesso a rotas protegidas após login', async ({ page }) => {
    // Faz login
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@admin.com');
    await page.fill('input[name="senha"], input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguarda login
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
    
    // Acessa dashboard
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/login/);
  });
});
