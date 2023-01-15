export interface metricData {
  countPM: number; // count per min
  method: string;
  records: number[];
  url?: string;
  host?: string;
}

export interface reqMetric extends metricData {}

export interface resMetric extends metricData {
  statusCode: number;
  error?: string;
}
