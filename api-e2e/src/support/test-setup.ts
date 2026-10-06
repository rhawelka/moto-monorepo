import axios from 'axios';
import { E2E_DATABASE_URL, E2E_HOST, E2E_PORT } from './e2e-config';

module.exports = async function () {
  // Configure axios for tests to use.
  process.env.DATABASE_URL = E2E_DATABASE_URL;
  axios.defaults.baseURL = `http://${E2E_HOST}:${E2E_PORT}`;
};
