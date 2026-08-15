import { useCallback, useState } from 'react';

export interface FilterOptions {
  categories: string[];
  levels: string[];
  subjects: string[];
  priceRange: [number, number];
}

export function useCourseFilters(initialFilters?: Partial<FilterOptions>) {
  const [filters, setFilters] = useState<FilterOptions>({
    categories: ['all', 'Science', 'Mathematics', 'English', 'Arts', 'Commercial'],
    levels: ['all', 'Primary', 'JSS', 'SS', 'Tertiary', 'Professional'],
    subjects: ['all', 'Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', ' Economics', 'Government'],
    priceRange: [0, 50000],
    ...initialFilters,
  });

  const updateFilter = useCallback((key: keyof FilterOptions, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      categories: ['all', 'Science', 'Mathematics', 'English', 'Arts', 'Commercial'],
      levels: ['all', 'Primary', 'JSS', 'SS', 'Tertiary', 'Professional'],
      subjects: ['all', 'Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Economics', 'Government'],
      priceRange: [0, 50000],
    });
  }, []);

  return { filters, updateFilter, resetFilters };
}

export function useCourseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return { searchQuery, debouncedQuery, handleSearch };
}
