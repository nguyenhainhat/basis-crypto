import * as Sentry from '@sentry/nestjs';

let nodeProfilingIntegration: (() => unknown) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const profiling = require('@sentry/profiling-node') as typeof import('@sentry/profiling-node');
  nodeProfilingIntegration = profiling.nodeProfilingIntegration as () => unknown;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn('[Sentry] Native profiling integration could not be loaded. Profiling is disabled:', message);
}

Sentry.init({
  dsn: "https://fee0952a3e99a942bc198a04aef08776@o4511536379330560.ingest.us.sentry.io/4511553796308992",
  integrations: nodeProfilingIntegration
    ? [nodeProfilingIntegration() as ReturnType<typeof import('@sentry/profiling-node').nodeProfilingIntegration>]
    : [],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

