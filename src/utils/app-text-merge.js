function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function deepClone(value) {
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deepClone(item)]),
    );
  }
  return value;
}

function setByPath(target, path, value) {
  const keys = path.split('.');
  let node = target;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const nextKey = keys[index + 1];
    const nextIsIndex = /^\d+$/.test(nextKey);

    if (Array.isArray(node)) {
      const arrayIndex = Number(key);
      if (!node[arrayIndex]) {
        node[arrayIndex] = nextIsIndex ? [] : {};
      }
      node = node[arrayIndex];
      continue;
    }

    if (!isPlainObject(node[key]) && !Array.isArray(node[key])) {
      node[key] = nextIsIndex ? [] : {};
    }
    node = node[key];
  }

  const lastKey = keys[keys.length - 1];
  if (Array.isArray(node)) {
    node[Number(lastKey)] = value;
    return;
  }

  node[lastKey] = value;
}

export function mergeTextTree(defaults, overrides = {}) {
  const result = deepClone(defaults);

  Object.entries(overrides).forEach(([path, value]) => {
    if (typeof value !== 'string') return;
    const normalizedPath = path.replace(/^(admin|site)\./, '');
    setByPath(result, normalizedPath, value);
  });

  return result;
}

export function buildOverridesFromDraft(fields, draft) {
  return fields.reduce((acc, field) => {
    const value = draft[field.id];
    if (typeof value === 'string' && value !== field.defaultValue) {
      acc[field.id] = value;
    }
    return acc;
  }, {});
}

export function buildDraftFromOverrides(fields, overrides = {}) {
  return fields.reduce((acc, field) => {
    acc[field.id] = typeof overrides[field.id] === 'string'
      ? overrides[field.id]
      : field.defaultValue;
    return acc;
  }, {});
}
