import { AlertService } from '../alert.service';
import { ObservabilityEvent } from '../events';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    service = new AlertService();
    delete process.env.ALERT_WEBHOOK_URL;
  });

  describe('recordEvent', () => {
    it('should not trigger alert below threshold', () => {
      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      // high_error_rate threshold is 5
      service.recordEvent(ObservabilityEvent.INTERNAL_SERVER_ERROR);
      service.recordEvent(ObservabilityEvent.INTERNAL_SERVER_ERROR);

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('ALERT TRIGGERED'),
      );
    });

    it('should trigger alert when threshold is reached', () => {
      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      // high_error_rate threshold is 5
      for (let i = 0; i < 5; i++) {
        service.recordEvent(ObservabilityEvent.INTERNAL_SERVER_ERROR);
      }

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERT TRIGGERED: high_error_rate'),
      );
    });

    it('should trigger RLS risk alert on first event (threshold=1)', () => {
      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      service.recordEvent(ObservabilityEvent.RLS_RISK);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERT TRIGGERED: rls_risk_detected'),
      );
    });

    it('should respect cooldown period', () => {
      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      // Trigger first alert
      service.recordEvent(ObservabilityEvent.RLS_RISK);
      expect(warnSpy).toHaveBeenCalledTimes(2); // warn message + JSON payload

      warnSpy.mockClear();

      // Try to trigger again immediately (within cooldown)
      service.recordEvent(ObservabilityEvent.RLS_RISK);
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('ALERT TRIGGERED'),
      );
    });

    it('should track different event types independently', () => {
      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      // Record events of different types
      service.recordEvent(ObservabilityEvent.INTERNAL_SERVER_ERROR);
      service.recordEvent(ObservabilityEvent.RLS_RISK);

      // RLS has threshold=1, so it should trigger
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('rls_risk_detected'),
      );
      // But error rate (threshold=5) should not
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('high_error_rate'),
      );
    });
  });

  describe('getCounterSnapshot', () => {
    it('should return zero counts initially', () => {
      const snapshot = service.getCounterSnapshot();

      expect(snapshot.high_error_rate).toBeDefined();
      expect(snapshot.high_error_rate.count).toBe(0);
      expect(snapshot.high_error_rate.threshold).toBe(5);
    });

    it('should reflect recorded events', () => {
      service.recordEvent(ObservabilityEvent.INTERNAL_SERVER_ERROR);
      service.recordEvent(ObservabilityEvent.INTERNAL_SERVER_ERROR);

      const snapshot = service.getCounterSnapshot();
      expect(snapshot.high_error_rate.count).toBe(2);
    });
  });

  describe('cleanupCounters', () => {
    it('should not throw', () => {
      expect(() => service.cleanupCounters()).not.toThrow();
    });
  });
});
