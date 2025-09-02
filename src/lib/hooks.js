import { useEffect, useRef, useState } from 'react';
import { load, save } from './storage.js';

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => load(key, initialValue));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    save(key, state);
  }, [key, state]);
  return [state, setState];
}

export function useInterval(callback, delay) {
  const savedRef = useRef(callback);
  useEffect(() => { savedRef.current = callback; }, [callback]);
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => savedRef.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
