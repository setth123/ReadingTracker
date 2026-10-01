// src/services/search-history.service.js

const SEARCH_HISTORY_TTL = 24 * 60 * 60 * 1000;
const MAX_HISTORY_SIZE = 50;

const searchHistory = new Map();

const cleanupHistory = () => {
  const now = Date.now();

  for (const [keyword, timestamp] of searchHistory.entries()) {
    if (now - timestamp > SEARCH_HISTORY_TTL) {
      searchHistory.delete(keyword);
    }
  }
};

export const saveSearchHistory = (keyword) => {
  cleanupHistory();

  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return;
  }

  // Nếu đã tồn tại thì xóa trước để đưa nó lên cuối Map
  searchHistory.delete(normalizedKeyword);

  searchHistory.set(normalizedKeyword, Date.now());

  // Chỉ giữ tối đa 50 keyword
  while (searchHistory.size > MAX_HISTORY_SIZE) {
    const oldestKeyword = searchHistory.keys().next().value;
    searchHistory.delete(oldestKeyword);
  }
};

export const getSearchHistory = (keyword = "") => {
  cleanupHistory();

  const normalizedKeyword = keyword.trim().toLowerCase();

  return [...searchHistory.entries()]
    .reverse()
    .filter(([historyKeyword]) => {
      if (!normalizedKeyword) {
        return true;
      }

      return historyKeyword.toLowerCase().includes(normalizedKeyword);
    })
    .slice(0, 5)
    .map(([historyKeyword]) => historyKeyword);
};