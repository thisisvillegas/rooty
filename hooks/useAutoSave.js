import { useState, useEffect, useRef } from 'react';
import { saveToStorage } from '../utils/storage.js';

export function useAutoSave(data, delay = 1000) {
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip saving on first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if data is null (not yet loaded)
    if (data === null) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      const success = saveToStorage(data);
      if (success) {
        setLastSaved(new Date());
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay]);

  return lastSaved;
}
