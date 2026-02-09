import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export function createTelemetry(serviceName: string, options: { otlpEndpoint?: string } = {}) {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    ...(options.otlpEndpoint
      ? { otlpMetricExporterOptions: { url: options.otlpEndpoint }, otlpTraceExporterOptions: { url: options.otlpEndpoint } }
      : {}),
  });
  return sdk;
}
