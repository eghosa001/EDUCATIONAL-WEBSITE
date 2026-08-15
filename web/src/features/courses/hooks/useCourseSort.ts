import { useState, useMemo } from 'react';

export function useCourseSort() {
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating' | 'price'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleSort = useMemo(() => {
    return (newSortBy: typeof sortBy) => {
      if (sortBy === newSortBy) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(newSortBy);
        setSortOrder('desc');
      }
    };
  }, [sortBy]);

  const sortOptions = useMemo(() => [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price', label: 'Price: Low to High' },
  ], []);

  return { sortBy, sortOrder, toggleSort, sortOptions };
}
