import { FastifyRequest } from 'fastify';
import { reqMetric } from './@types';
import { inc } from './metrics';
import { execute, pathToMetricName, pushToRecords } from './monitoring';

export const monitorRequests = async (
  reqMap: Map<string, reqMetric>,
  request: FastifyRequest,
  prefix = '',
) => {
  prefix = prefix ? prefix + '_' : '';
  const metricGaugeName = prefix + 'request_Gauge_' + pathToMetricName(request.url);
  const metricCounterName = prefix + 'request_Counter_' + pathToMetricName(request.url);

  const reqMetric = reqMap.get(metricGaugeName);
  const prevCPM = reqMetric?.countPM || 0;
  const newRecord = prevCPM + 1;
  const records = pushToRecords(reqMetric?.records || [], newRecord);

  reqMap.set(metricGaugeName, {
    countPM: newRecord,
    records,
    method: request.method,
    url: request.url,
    host: request.headers.host,
  });
  inc(metricCounterName)

  execute(reqMap);
};
