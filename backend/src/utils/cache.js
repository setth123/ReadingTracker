// Small in-memory cache with a TTL and a size limit.
// It stores the Promise instead of the result, so concurrent requests for the same key share one call.
export const createCache = ({ ttl, maxSize }) => {
  const entries = new Map();

  return (key, load) => {
    const cached = entries.get(key);
    entries.delete(key);

    if (cached && Date.now() - cached.createdAt < ttl) {
      // Re-insert to mark it as recently used (Map keeps insertion order)
      entries.set(key, cached);
      return cached.promise;
    }

    const promise = load();
    entries.set(key, { promise, createdAt: Date.now() });

    // Drop the least recently used entries
    while (entries.size > maxSize) {
      entries.delete(entries.keys().next().value);
    }

    // A failed request must not stay cached
    promise.catch(() => {
      if (entries.get(key)?.promise === promise) {
        entries.delete(key);
      }
    });

    return promise;
  };
};
