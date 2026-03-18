export const mergePreferRemoteDefined = <T extends object>(local: T, remote: Partial<T>): T => {
  const merged: Record<string, unknown> = { ...(local as Record<string, unknown>) };
  for (const [key, value] of Object.entries(remote as Record<string, unknown>)) {
    if (value !== undefined && value !== null) merged[key] = value;
  }
  return merged as T;
};

