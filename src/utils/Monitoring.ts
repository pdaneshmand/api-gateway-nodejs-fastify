import * as client from 'prom-client';

client.collectDefaultMetrics({ register: client.register });

export const createConter = async (metricName: string) => {
  const pMetric = await getMetricIfExists(metricName);
  if (pMetric) {
    return client.register.getSingleMetric(
      metricName,
    ) as client.Counter<string>;
  }
  return new client.Counter({
    name: metricName,
    help: 'The total number of processed requests',
  });
};

export const createHistogram = async (metricName: string) => {
  const pMetric = await getMetricIfExists(metricName);
  if (pMetric) {
    return client.register.getSingleMetric(
      metricName,
    ) as client.Histogram<string>;
  }
  return new client.Histogram({
    name: metricName,
    help: 'Histogram for the duration in seconds.',
    buckets: [1, 2, 5, 6, 10],
  });
};

const getMetricIfExists = async (metricName: string) => {
  const allMetricsName = await getAllMetrics();
  if (allMetricsName.find((m) => m.startsWith(metricName))) {
    return client.register.getSingleMetric(metricName);
  }
  return null;
};

export const metrics = async () => client.register.metrics();

export const contentType = client.register.contentType;

const getAllMetrics = async () => {
  const data = await client.register.metrics();
  const result: string[] = [];
  data.split('\n').forEach((m) => {
    if (!m.startsWith('#') && m !== '') result.push(m);
  });
  return result;
};
