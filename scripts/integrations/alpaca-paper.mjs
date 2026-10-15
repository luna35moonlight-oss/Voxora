/** Read-only paper-account adapter. No order, transfer or live endpoint exists here. */
export const ALPACA_PAPER_ORIGIN = 'https://paper-api.alpaca.markets';

export async function checkAlpacaPaper({ env = process.env, fetchImpl = fetch } = {}) {
  const key = env.ALPACA_PAPER_KEY_ID?.trim();
  const secret = env.ALPACA_PAPER_SECRET_KEY?.trim();
  if (!key || !secret) {
    return {
      provider: 'alpaca-paper',
      status: 'not_configured',
      missing: [
        ...(!key ? ['ALPACA_PAPER_KEY_ID'] : []),
        ...(!secret ? ['ALPACA_PAPER_SECRET_KEY'] : []),
      ],
    };
  }
  try {
    const response = await fetchImpl(`${ALPACA_PAPER_ORIGIN}/v2/account`, {
      method: 'GET',
      headers: { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret },
      // Never forward credentials to a redirect target.
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return {
        provider: 'alpaca-paper',
        status:
          response.status === 401 || response.status === 403
            ? 'authentication_or_access_denied'
            : 'provider_error',
        httpStatus: response.status,
      };
    }
    const account = await response.json();
    if (
      !account ||
      typeof account !== 'object' ||
      Array.isArray(account) ||
      typeof account.id !== 'string' ||
      !account.id ||
      typeof account.status !== 'string' ||
      !account.status ||
      typeof account.currency !== 'string' ||
      !/^[A-Z]{3}$/.test(account.currency) ||
      typeof account.trading_blocked !== 'boolean'
    ) {
      return { provider: 'alpaca-paper', status: 'invalid_response' };
    }
    // Do not expose credentials, IDs, balances or raw provider responses in logs.
    return {
      provider: 'alpaca-paper',
      status: 'connected_read_only',
      accountStatus: account.status,
      currency: account.currency,
      tradingBlocked: account.trading_blocked,
      executionEnabled: false,
    };
  } catch {
    return { provider: 'alpaca-paper', status: 'connection_failed' };
  }
}
