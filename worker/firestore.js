function decodeValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(decodeValue);
  }
  if ('mapValue' in value) {
    const result = {};
    for (const [key, nested] of Object.entries(value.mapValue.fields || {})) {
      result[key] = decodeValue(nested);
    }
    return result;
  }
  return null;
}

export function decodeFirestoreDocument(doc) {
  if (!doc?.name) return null;
  const id = doc.name.split('/').pop();
  const data = {};
  for (const [key, value] of Object.entries(doc.fields || {})) {
    data[key] = decodeValue(value);
  }
  return { id, ...data };
}

function getFirestoreConfig(env) {
  const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) {
    throw new Error('Missing FIREBASE_PROJECT_ID or FIREBASE_API_KEY for SSR.');
  }
  return { projectId, apiKey };
}

function firestoreBaseUrl(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

async function firestoreFetch(url, apiKey, init = {}) {
  const target = new URL(url);
  target.searchParams.set('key', apiKey);
  const response = await fetch(target.toString(), init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore request failed (${response.status}): ${text.slice(0, 200)}`);
  }
  return response.json();
}

export async function fetchFirestoreDocument(collectionId, docId, env) {
  const { projectId, apiKey } = getFirestoreConfig(env);
  const url = `${firestoreBaseUrl(projectId)}/${collectionId}/${encodeURIComponent(docId)}`;
  try {
    const doc = await firestoreFetch(url, apiKey);
    return decodeFirestoreDocument(doc);
  } catch (error) {
    if (String(error.message).includes('(404)')) return null;
    throw error;
  }
}

export async function fetchFirestoreCollection(collectionId, env) {
  const { projectId, apiKey } = getFirestoreConfig(env);
  const url = `${firestoreBaseUrl(projectId)}/${collectionId}`;
  const payload = await firestoreFetch(url, apiKey);
  return (payload.documents || [])
    .map(decodeFirestoreDocument)
    .filter(Boolean);
}

export async function queryFirestoreByField(collectionId, fieldPath, value, env, { limit = 1 } = {}) {
  const { projectId, apiKey } = getFirestoreConfig(env);
  const url = `${firestoreBaseUrl(projectId)}:runQuery`;

  const fieldValue = typeof value === 'boolean'
    ? { booleanValue: value }
    : typeof value === 'number'
      ? { integerValue: String(value) }
      : { stringValue: String(value) };

  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      where: {
        fieldFilter: {
          field: { fieldPath },
          op: 'EQUAL',
          value: fieldValue,
        },
      },
      limit,
    },
  };

  const payload = await firestoreFetch(url, apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return payload
    .map((row) => decodeFirestoreDocument(row.document))
    .filter(Boolean);
}
