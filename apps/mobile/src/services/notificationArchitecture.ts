/**
 * Notification architecture interface for Phase 1.
 * Full local/push scheduling belongs to Phase 8 — do not fake delivery success here.
 */
export const notificationArchitecture = {
  describe() {
    return 'interface ready (push/local delivery not asserted)';
  },
  async requestPermissionLater() {
    return {
      status: 'not_requested' as const,
      note: 'Permission must be requested just-in-time in a later phase',
    };
  },
};
