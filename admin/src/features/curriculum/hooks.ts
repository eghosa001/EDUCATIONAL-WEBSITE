'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import {
  fetchSubjects, createSubject, updateSubject, deleteSubject,
  fetchTopics, createTopic, updateTopic, deleteTopic,
  type SubjectRow, type TopicRow,
} from '@/services/api/curriculumService';
import {
  fetchSystems, fetchLevels, createLevel,
  fetchPrograms, fetchClasses, createClass,
  type EducationSystemRow, type EducationLevelRow, type ClassRoomRow,
} from '@/services/api/educationService';

export function useSubjects() {
  const { token } = useAdminAuthStore();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchSubjects(token, { page: 1, limit: 200 })
      .then((res) => setSubjects(res.data.subjects || []))
      .catch((err: Error) => setError(err.message || 'Failed to load subjects'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (data: Record<string, unknown>) => {
      if (!token) return;
      await createSubject(token, data);
      await load();
    },
    [token, load]
  );

  const update = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      if (!token) return;
      await updateSubject(token, id, data);
      await load();
    },
    [token, load]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      await deleteSubject(token, id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    },
    [token]
  );

  return { subjects, loading, error, reload: load, add, update, remove };
}

export function useTopics() {
  const { token } = useAdminAuthStore();
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchTopics(token, { page: 1, limit: 200 })
      .then((res) => setTopics(res.data.topics || []))
      .catch((err: Error) => setError(err.message || 'Failed to load topics'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (data: Record<string, unknown>) => {
      if (!token) return;
      await createTopic(token, data);
      await load();
    },
    [token, load]
  );

  const update = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      if (!token) return;
      await updateTopic(token, id, data);
      await load();
    },
    [token, load]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      await deleteTopic(token, id);
      setTopics((prev) => prev.filter((t) => t.id !== id));
    },
    [token]
  );

  return { topics, loading, error, reload: load, add, update, remove };
}

export function useLevels() {
  const { token } = useAdminAuthStore();
  const [systems, setSystems] = useState<EducationSystemRow[]>([]);
  const [levels, setLevels] = useState<EducationLevelRow[]>([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSystems = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchSystems(token)
      .then((res) => {
        setSystems(res.data.systems || []);
        if (!res.data.systems?.length) setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load education systems');
        setLoading(false);
      });
  }, [token]);

  const loadLevels = useCallback(
    (systemId: string) => {
      if (!token || !systemId) return;
      setLoading(true);
      fetchLevels(token, systemId)
        .then((res) => setLevels(res.data.levels || []))
        .catch((err: Error) => setError(err.message || 'Failed to load levels'))
        .finally(() => setLoading(false));
    },
    [token]
  );

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  const add = useCallback(
    async (systemId: string, data: Record<string, unknown>) => {
      if (!token) return;
      await createLevel(token, systemId, data);
      await loadLevels(systemId);
    },
    [token, loadLevels]
  );

  return {
    systems,
    levels,
    selectedSystem,
    setSelectedSystem: (id: string) => {
      setSelectedSystem(id);
      loadLevels(id);
    },
    loading,
    error,
    reload: loadSystems,
    add,
  };
}

export function useClasses() {
  const { token } = useAdminAuthStore();
  const [systems, setSystems] = useState<EducationSystemRow[]>([]);
  const [levels, setLevels] = useState<EducationLevelRow[]>([]);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [classes, setClasses] = useState<ClassRoomRow[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchSystems(token)
      .then(async (res) => {
        const sys = res.data.systems || [];
        setSystems(sys);
        if (sys.length) {
          const lev = await fetchLevels(token, sys[0].id).catch(() => ({ data: { levels: [] } }));
          setLevels(lev.data.levels || []);
        } else {
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load education data');
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const selectLevel = useCallback(
    async (levelId: string) => {
      if (!token || !levelId) return;
      setLoading(true);
      const res = await fetchPrograms(token, levelId).catch(() => ({ data: { programs: [] } }));
      const prog = res.data.programs || [];
      setPrograms(prog);
      if (prog.length) {
        setSelectedProgram(prog[0].id);
        const cls = await fetchClasses(token, prog[0].id).catch(() => ({ data: { classes: [] } }));
        setClasses(cls.data.classes || []);
      } else {
        setClasses([]);
        setSelectedProgram('');
      }
      setLoading(false);
    },
    [token]
  );

  const selectProgram = useCallback(
    async (programId: string) => {
      if (!token || !programId) return;
      setLoading(true);
      setSelectedProgram(programId);
      const res = await fetchClasses(token, programId).catch(() => ({ data: { classes: [] } }));
      setClasses(res.data.classes || []);
      setLoading(false);
    },
    [token]
  );

  const add = useCallback(
    async (programId: string, data: Record<string, unknown>) => {
      if (!token) return;
      await createClass(token, programId, data);
      await selectProgram(programId);
    },
    [token, selectProgram]
  );

  return { systems, levels, programs, classes, loading, error, reload: load, selectLevel, selectProgram, add, selectedProgram };
}
