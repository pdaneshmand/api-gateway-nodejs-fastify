import { FastifyReply, FastifyRequest } from 'fastify';
import { setValueTogauge } from './metrics';
import type { metricData, reqMetric, resMetric } from './@types';
import { monitorRequests } from './request';
import { monitorResponses } from './response';

const recordsLen = 3;
const reqMap = new Map<string, reqMetric>();
const resMap = new Map<string, resMetric>();

const removeExtraRecords = (records: number[]) => {
  let newRecords = [...records];
  const extraLen = newRecords.length - recordsLen;
  if (extraLen > 0) newRecords.splice(0, extraLen);
  return newRecords;
};

const recordAvg = (records: number[]) => {
  if (records.length - recordsLen < recordsLen)
    return (
      removeExtraRecords(records).reduce((a, b) => a + b, 0) / records.length
    );
  return removeExtraRecords(records).reduce((a, b) => a + b, 0) / recordsLen;
};
export const pushToRecords = (records: number[], record: number) => {
  records.push(record);
  return removeExtraRecords(records);
};

// send current metrics value to prometheus
export const execute = (objMap: Map<string, metricData>) => {
  objMap.forEach(async (value, metricName) => {
    const labels = { ...(value as any) };
    delete labels.records;
    delete labels.countPM;
    setValueTogauge(metricName, recordAvg(value.records), labels);
  });
};

// reset all requestsMetrics value to zero
const reset = () => {
  setInterval(() => {
    reqMap.forEach(async (_, key) => {
      const prevValue = reqMap.get(key);
      const newRecords = pushToRecords(prevValue.records, prevValue.countPM);
      reqMap.set(key, { ...prevValue, countPM: 0, records: newRecords });
      setValueTogauge(key, 0);
    });
  }, 10000);
};
reset();

export const pathToMetricName = (path: string) => {
  let result = path;
  if (result.endsWith('/')) result = path.slice(0, -1);
  if (result.startsWith('/')) result = path.slice(1);
  return result.replaceAll('/', '_').replaceAll('.', '_');
};

export const monitor = (request: FastifyRequest, reply: FastifyReply) => {
  monitorRequests(reqMap, request);
  monitorResponses(resMap, reply);
};

export default {
  monitorRequests,
  monitorResponses,
  monitor,
};
