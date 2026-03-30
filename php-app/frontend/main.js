import { openobserveRum } from '@openobserve/browser-rum';
import { openobserveLogs } from '@openobserve/browser-logs';

const config = window.__OPENOBSERVE_RUM__ || {};
const hasRequiredConfig = Boolean(
  config.enabled &&
  config.clientToken &&
  config.applicationId &&
  config.site &&
  config.organizationIdentifier
);

if (!hasRequiredConfig) {
  window.__OPENOBSERVE_RUM_STATE__ = {
    initialized: false,
    reason: 'missing-config',
    config,
  };
} else {
  const options = {
    clientToken: config.clientToken,
    applicationId: config.applicationId,
    site: config.site,
    service: config.service || 'php-storefront-web',
    env: config.env || 'poc',
    version: config.version || '0.0.1',
    organizationIdentifier: config.organizationIdentifier,
    insecureHTTP: Boolean(config.insecureHTTP),
    apiVersion: config.apiVersion || 'v1',
  };

  openobserveRum.init({
    applicationId: options.applicationId,
    clientToken: options.clientToken,
    site: options.site,
    organizationIdentifier: options.organizationIdentifier,
    service: options.service,
    env: options.env,
    version: options.version,
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
    apiVersion: options.apiVersion,
    insecureHTTP: options.insecureHTTP,
    defaultPrivacyLevel: 'mask-user-input',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
  });

  openobserveLogs.init({
    clientToken: options.clientToken,
    site: options.site,
    organizationIdentifier: options.organizationIdentifier,
    service: options.service,
    env: options.env,
    version: options.version,
    forwardErrorsToLogs: true,
    insecureHTTP: options.insecureHTTP,
    apiVersion: options.apiVersion,
  });

  window.__setOpenObserveUser = (user) => {
    if (!user || !user.email) {
      return;
    }

    openobserveRum.setUser({
      id: user.id || user.email,
      name: user.name || user.email,
      email: user.email,
    });

    openobserveLogs.logger.info('OpenObserve user context updated', {
      email: user.email,
      id: user.id || user.email,
    });
  };

  window.__setOpenObserveUser({
    id: 'anonymous',
    name: 'Anonymous Visitor',
    email: 'anonymous@example.local',
  });

  openobserveRum.startSessionReplayRecording();
  openobserveLogs.logger.info('OpenObserve browser SDK initialized', {
    applicationId: options.applicationId,
    service: options.service,
  });

  window.__OPENOBSERVE_RUM_STATE__ = {
    initialized: true,
    service: options.service,
    site: options.site,
    logsInitialized: true,
  };
}
