import { waitForPortOpen } from '@nx/node/utils';
import { E2E_HOST, E2E_PORT } from './e2e-config';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function () {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up...\n');

  await waitForPortOpen(E2E_PORT, { host: E2E_HOST });

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
