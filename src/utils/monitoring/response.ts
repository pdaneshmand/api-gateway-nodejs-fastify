import { FastifyReply } from 'fastify';
import { resMetric } from './@types';
import { inc } from './metrics';
import { execute, pathToMetricName, pushToRecords } from './monitoring';

export const monitorResponses = async (
  resMap: Map<string, resMetric>,
  reply: FastifyReply,
  prefix = '',
) => {
  prefix = prefix ? prefix + '_' : '';
  const request = reply.request;
  const metricGaugeName = prefix + 'response_gauge_' + pathToMetricName(reply.request.url);
  const metricCountName = prefix + 'response_counter_' + pathToMetricName(reply.request.url);

  const reqMetric = resMap.get(metricGaugeName);
  const prevCPM = reqMetric?.countPM || 0;
  const newRecord = prevCPM + 1;
  const records = pushToRecords(reqMetric?.records || [], newRecord);

  resMap.set(metricGaugeName, {
    countPM: newRecord,
    records,
    statusCode: reply.statusCode,
    method: request.method,
    url: request.url,
    host: request.headers.host,
  });
  inc(metricCountName)

  execute(resMap);
};
