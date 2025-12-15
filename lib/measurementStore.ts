let latestMeasurement: any = null;

export function setLatestMeasurement(data: any) {
  latestMeasurement = data;
}

export function getLatestMeasurement() {
  return latestMeasurement;
}
