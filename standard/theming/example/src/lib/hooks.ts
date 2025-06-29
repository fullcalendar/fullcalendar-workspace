import { useState, useEffect } from 'react';

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T),
  allowedValues: readonly T[]
): [T, (value: T | ((prev: T) => T)) => void] {
  const getValidatedValue = (): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (allowedValues.includes(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn(`Error reading localStorage key "${key}":`, err);
    }

    return typeof defaultValue === 'function'
      ? (defaultValue as () => T)()
      : defaultValue;
  };

  const [value, setValue] = useState<T>(getValidatedValue);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Error writing to localStorage key "${key}":`, err);
    }
  }, [key, value]);

  const setAndStore = (newValue: T | ((prev: T) => T)) => {
    setValue(prev =>
      typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev)
        : newValue
    );
  };

  return [value, setAndStore];
}
