//SENTRY
const Sentry = require('@sentry/node');
const initbeforeStart = (expressApp) => {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Express.js middleware tracing
            new Sentry.Integrations.Express({ expressApp }),
            // Automatically instrument Node.js libraries and frameworks
            ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
        ],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0,
    });
    // RequestHandler creates a separate execution context, so that all
    // transactions/spans/breadcrumbs are isolated across requests
    expressApp.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    expressApp.use(Sentry.Handlers.tracingHandler());
};

const initErrorHandler = Sentry.Handlers.errorHandler();
// The error handler must be before any other error middleware and after all controllers

module.exports = { initbeforeStart, initErrorHandler };
