const SEARCH_HISTORY_TTL = 7 * 24 * 60 * 60 * 1000;
const MAX_HISTORY_SIZE = 50;
const MAX_SUGGESTIONS = 5;

// Key: lowercase keyword, so "Harry" and "harry" count as one entry.
// Value: the keyword as last typed + when it was searched.
// Map keeps insertion order, so the newest search is always at the end.
const searchHistory = new Map();

const removeExpired = () => {
  const now = Date.now();

  for (const [key, { searchedAt }] of searchHistory) {
    if (now - searchedAt > SEARCH_HISTORY_TTL) {
      searchHistory.delete(key);
    }
  }
};

export const saveSearchHistory = (keyword) => {
  const key = keyword.toLowerCase();

  // Delete first so the keyword moves to the end of the Map
  searchHistory.delete(key);
  searchHistory.set(key, { keyword, searchedAt: Date.now() });

  if (searchHistory.size > MAX_HISTORY_SIZE) {
    searchHistory.delete(searchHistory.keys().next().value);
  }
};

export const getSearchHistory = (keyword = "") => {
  removeExpired();

  const query = keyword.toLowerCase();

  return [...searchHistory]
    .reverse()
    .filter(([key]) => key.includes(query))
    .slice(0, MAX_SUGGESTIONS)
    .map(([, { keyword: historyKeyword }]) => historyKeyword);
};
