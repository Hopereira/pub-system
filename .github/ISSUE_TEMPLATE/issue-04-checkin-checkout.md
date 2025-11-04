---
name: Check-in/Check-out de Garçons
about: Sistema de presença e controle de turnos
title: '[FEATURE] Check-in/Check-out de Garçons'
labels: feature, backend, frontend, garçom, priority-medium
assignees: ''
---

## ⏰ Descrição
Sistema de presença para registrar turnos de garçons.

## 🎯 Objetivo
Controlar presença, horas trabalhadas e disponibilidade.

## 📋 Tarefas

### Backend
- [ ] Criar entidade `TurnoFuncionario`
- [ ] Criar migration
- [ ] Implementar `TurnoService`
- [ ] Endpoint `POST /funcionario/check-in`
- [ ] Endpoint `POST /funcionario/check-out`
- [ ] Endpoint `GET /funcionario/ativos`
- [ ] Endpoint `GET /funcionario/:id/turnos`
- [ ] Validar check-in duplicado
- [ ] Calcular horas trabalhadas
- [ ] Fechar turno após 12h

### Frontend
- [ ] Botão check-in na tela inicial
- [ ] Botão check-out
- [ ] Status "Ativo" visível
- [ ] Tempo trabalhado em tempo real
- [ ] Lista de colegas ativos
- [ ] Confirmação de check-out

## 🏗️ Estrutura
```typescript
@Entity('turnos_funcionario')
export class TurnoFuncionario {
  funcionario: Funcionario;
  checkIn: Date;
  checkOut?: Date;
  horasTrabalhadas?: number;
  ativo: boolean;
  evento?: Evento;
}
```

## 🔄 Fluxo Check-in
```
1. Garçom abre app
2. Clica "Fazer Check-in"
3. Sistema registra horário
4. Status → "Ativo"
```

## 🔄 Fluxo Check-out
```
1. Clica "Fazer Check-out"
2. Confirma ação
3. Sistema registra saída
4. Calcula horas trabalhadas
5. Status → "Inativo"
```

## ✅ Critérios de Aceite
- [ ] Check-in funciona
- [ ] Impede check-in duplicado
- [ ] Status "Ativo" visível
- [ ] Tempo atualiza em tempo real
- [ ] Check-out funciona
- [ ] Horas calculadas corretamente
- [ ] Turno fecha após 12h
- [ ] Relatório de presença

## 📊 Relatórios
- Presença diária
- Horas por garçom
- Média de horas
- Garçons pontuais

## ⏱️ Estimativa
**3 dias**
