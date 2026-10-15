#!/usr/bin/env node
import { checkAlpacaPaper } from './integrations/alpaca-paper.mjs';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--probe') || args.length > 1) {
  console.error('Usage: node scripts/integration-readiness.mjs [--probe]');
  process.exitCode = 2;
} else {
  const required = ['ALPACA_PAPER_KEY_ID', 'ALPACA_PAPER_SECRET_KEY'];
  const configured = required.every((name) => Boolean(process.env[name]?.trim()));
  const report = {
    // Configuration is not evidence of a successful provider connection.
    alpacaPaper: args.includes('--probe')
      ? await checkAlpacaPaper()
      : {
          status: configured ? 'configured_unverified' : 'not_configured',
          missing: required.filter((name) => !process.env[name]?.trim()),
        },
    liveTrading: 'not_implemented',
    otherIntegrations: 'not_implemented',
  };
  console.log(JSON.stringify(report, null, 2));
  if (!args.includes('--probe') || report.alpacaPaper.status !== 'connected_read_only') {
    process.exitCode = 1;
  }
}
