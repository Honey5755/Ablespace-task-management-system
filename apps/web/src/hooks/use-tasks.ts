'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Label, Task, TaskQuery } from '@/lib/types';

interface UseTasksResult {
  tasks: Task[];
  labels: Label[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Applies a server update to local state without a full refetch. */
  applyUpdate: (task: Task) => void;
  removeLocal: (id: string) => void;
}

export function useTasks(query: TaskQuery): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialised so the effect depends on the query's value, not its identity.
  const queryKey = JSON.stringify(query);
  // Guards against a slow earlier request overwriting a newer result.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    try {
      const next = await api.listTasks(JSON.parse(queryKey) as TaskQuery);
      if (id === requestId.current) {
        setTasks(next);
        setError(null);
      }
    } catch (loadError) {
      if (id === requestId.current) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load tasks');
      }
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api
      .listLabels()
      .then(setLabels)
      .catch(() => setLabels([]));
  }, []);

  const applyUpdate = useCallback((updated: Task) => {
    setTasks((current) =>
      current.map((task) => (task.id === updated.id ? { ...task, ...updated } : task)),
    );
  }, []);

  const removeLocal = useCallback((id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  return { tasks, labels, isLoading, error, refresh: load, applyUpdate, removeLocal };
}
