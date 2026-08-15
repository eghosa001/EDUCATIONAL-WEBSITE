'use client';

import { useState, useCallback } from 'react';

export function useLibrarySearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  });

  const search = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/library/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      setResults(data.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { query, debouncedQuery, results, isLoading, search };
}

export function useLibraryFilters() {
  const [resourceType, setResourceType] = useState<string>('all');
  const [level, setLevel] = useState<string>('all');
  const [subject, setSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'title'>('newest');

  const filters = { resourceType, level, subject, sortBy };

  const applyFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setResourceType(newFilters.resourceType || 'all');
    setLevel(newFilters.level || 'all');
    setSubject(newFilters.subject || 'all');
    setSortBy(newFilters.sortBy || 'newest');
  }, []);

  const resetFilters = useCallback(() => {
    setResourceType('all');
    setLevel('all');
    setSubject('all');
    setSortBy('newest');
  }, []);

  return { filters, applyFilters, resetFilters, setResourceType, setLevel, setSubject, setSortBy };
}
