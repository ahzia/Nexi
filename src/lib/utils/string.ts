export function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function ensureMaxLength(value: string, max = 64): string {
  if (value.length <= max) return value;
  return value.slice(0, max);
}

export function fallbackOperationId(method: string, path: string): string {
  const sanitizedPath = path.replace(/[^a-zA-Z0-9]+/g, '-');
  return `${method.toLowerCase()}${sanitizedPath}`.replace(/-+/g, '-').replace(/^-|-$/g, '');
}


