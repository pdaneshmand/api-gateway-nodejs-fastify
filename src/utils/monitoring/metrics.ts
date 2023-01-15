import {
  register,
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
} from 'prom-client';

// collectDefaultMetrics({ register: register });

const isMetricExists = async (metricName: string) => {
  const allMetricsName = await getAllMetrics();
  return !!allMetricsName.find((m) => m.startsWith(metricName));
};

const getMetric = async (metricName: string) => {
  if (isMetricExists(metricName)) return register.getSingleMetric(metricName);
  return null;
};

const getAllMetrics = async () => {
  const data = await register.metrics();
  const result: string[] = [];
  data.split('\n').forEach((m) => {
    if (!m.startsWith('#') && m !== '') result.push(m);
  });
  return result;
};

export const createCounter = async (metricName: string) => {
  const pMetric = await getMetric(metricName);
  if (pMetric) {
    return pMetric as Counter<string>;
  }
  return new Counter({
    name: metricName,
    help: 'The total number of processed requests',
  });
};

export const createHistogram = async (metricName: string) => {
  let metric = (await getMetric(metricName)) as Histogram<string>;
  if (!metric) {
    metric = new Histogram({
      name: metricName,
      help: 'Histogram for the duration in seconds.',
      buckets: [1, 2, 5, 6, 10],
    });
  }
  return metric;
};

export const createGauge = async (
  metricName: string,
  labels: string[] = [],
) => {
  let metric = (await getMetric(metricName)) as Gauge<string>;
  if (!metric)
    metric = new Gauge({
      name: metricName,
      help: 'test help for Gauge',
      labelNames: labels,
    });
  return metric;
};

export const setValueTogauge = async (
  metricName: string,
  value: number,
  labels?: { [key: string]: string },
) => {
  const gauge = await createGauge(
    metricName,
    labels ? Object.keys(labels) : null,
  );
  labels ? gauge.set({ ...labels }, value) : gauge.set(value);
};

export const inc = async (counterMetricName: string, value: number = 1) => {
  const counter = await createCounter(counterMetricName);
  counter.reset()
  counter.inc(value);
};

export const metrics = async () => register.metrics();
export const contentType = register.contentType;
