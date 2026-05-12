import { useEffect, useState } from 'react';

export function useTypewriter(text: string, speedMs = 6) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      const resetId = window.setTimeout(() => {
        setDisplayed('');
        setDone(false);
      }, 0);
      return () => window.clearTimeout(resetId);
    }
    let i = 0;
    const resetId = window.setTimeout(() => {
      setDisplayed('');
      setDone(false);
    }, 0);
    const id = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speedMs);
    return () => {
      window.clearTimeout(resetId);
      clearInterval(id);
    };
  }, [text, speedMs]);

  return { displayed, done };
}
