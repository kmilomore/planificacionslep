import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

export default function NavigationProgress() {
  const location = useLocation();
  const isFetching = useIsFetching();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(16);
  }, [location.pathname]);

  useEffect(() => {
    if (!visible) return undefined;

    let intervalId;
    let completeId;
    let hideId;

    if (isFetching > 0) {
      intervalId = window.setInterval(() => {
        setProgress((current) => {
          if (current >= 84) return current;
          return current + Math.max(4, (84 - current) * 0.18);
        });
      }, 120);
    } else {
      completeId = window.setTimeout(() => {
        setProgress((current) => Math.max(current, 100));
      }, 140);

      hideId = window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 420);
    }

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(completeId);
      window.clearTimeout(hideId);
    };
  }, [isFetching, visible, location.pathname]);

  return (
    <div
      className={[
        'pointer-events-none fixed inset-x-0 top-0 z-[80] h-1 transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      aria-hidden="true"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-sky-400 via-blue to-navy shadow-[0_0_18px_rgba(0,107,185,0.45)] transition-[width] duration-200 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}