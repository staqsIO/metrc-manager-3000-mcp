/** METRC Basic auth header: base64("<vendorKey>:<userKey>"). Edge- and Node-safe. */
export function encodeBasicAuth(vendorKey, userKey) {
  const raw = `${vendorKey}:${userKey}`;
  const b64 = typeof Buffer !== 'undefined' ? Buffer.from(raw, 'utf8').toString('base64') : btoa(raw);
  return `Basic ${b64}`;
}
