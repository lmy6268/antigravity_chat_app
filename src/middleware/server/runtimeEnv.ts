import type { ServerResponse } from 'http';

export function applyRuntimeEnvHeader(res: ServerResponse) {
  const env = process.env.NODE_ENV || 'development';
  res.setHeader('x-runtime-env', env);
}
