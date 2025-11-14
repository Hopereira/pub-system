# Sons do Sistema

Este diretório contém os arquivos de áudio usados para notificações do sistema.

## Arquivos de Som

### item-quase-pronto.mp3
Som leve e curto para alertar que um item está quase pronto (30-60s antes).
- Duração: ~1s
- Volume: médio
- Tom: agradável, não intrusivo

### item-pronto.mp3
Som mais forte e chamativo para alertar que um item está pronto para retirada.
- Duração: ~2s
- Volume: alto
- Tom: urgente, mas profissional

### item-retirado.mp3
Som de confirmação quando um item é retirado.
- Duração: ~0.5s
- Volume: médio-baixo
- Tom: confirmação positiva

### item-entregue.mp3
Som de sucesso quando um item é entregue ao cliente.
- Duração: ~1s
- Volume: médio
- Tom: conclusão, satisfação

## Uso

Os sons são reproduzidos via API Web Audio ou HTMLAudioElement.
Um hook `useNotificationSound` gerencia reprodução, volume e mute.

## Alternativa Temporária

Enquanto os arquivos de som reais não estiverem disponíveis, o sistema:
1. Usa Web Audio API para gerar tons sintéticos
2. Ou simplesmente vibra no mobile (navigator.vibrate)
3. Ou reproduz sons do sistema via Notification API

## Implementação

```typescript
// Exemplo de uso
const { playSound, toggleMute } = useNotificationSound();

// Ao receber evento WebSocket
socket.on('item_pronto', () => {
  playSound('item-pronto');
  showToast('Item pronto!');
});
```
