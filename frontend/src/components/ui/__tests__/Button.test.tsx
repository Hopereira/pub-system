import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../button';
import { axe } from 'jest-axe'; // Importa a função do axe

describe('Button Component', () => {

  test('deve renderizar o botão com o texto correto', () => {
    render(<Button>Clique aqui</Button>);
    const buttonElement = screen.getByRole('button', { name: /Clique aqui/i });
    expect(buttonElement).toBeInTheDocument();
  });

  // NOVO TESTE DE ACESSIBILIDADE
  test('não deve ter violações de acessibilidade', async () => {
    // Renderiza o componente
    const { container } = render(<Button>Botão Acessível</Button>);

    // Executa o axe no HTML renderizado
    const results = await axe(container);

    // Verifica se não há nenhuma violação
    expect(results).toHaveNoViolations();
  });

});