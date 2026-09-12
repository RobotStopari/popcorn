import { useCallback, useEffect, useRef, useState } from 'react';
import { snapshotsEqual } from '../utils/autosave';

export function useAutosaveRunner() {
  const lastSnapshotRef = useRef(undefined);
  const chainRef = useRef(Promise.resolve());
  const savedTimerRef = useRef(0);
  const [status, setStatus] = useState('idle');

  useEffect(() => () => window.clearTimeout(savedTimerRef.current), []);

  const remember = useCallback((snapshot) => {
    lastSnapshotRef.current = snapshot;
  }, []);

  const run = useCallback((snapshot, save) => {
    if (lastSnapshotRef.current !== undefined && snapshotsEqual(snapshot, lastSnapshotRef.current)) {
      return Promise.resolve(true);
    }

    chainRef.current = chainRef.current.then(async () => {
      if (lastSnapshotRef.current !== undefined && snapshotsEqual(snapshot, lastSnapshotRef.current)) {
        return true;
      }

      setStatus('saving');
      try {
        const ok = await save(snapshot);
        if (ok === false) {
          setStatus('error');
          return false;
        }
        lastSnapshotRef.current = snapshot;
        setStatus('saved');
        window.clearTimeout(savedTimerRef.current);
        savedTimerRef.current = window.setTimeout(() => setStatus('idle'), 2200);
        return true;
      } catch {
        setStatus('error');
        return false;
      }
    });

    return chainRef.current;
  }, []);

  return { run, remember, status };
}
