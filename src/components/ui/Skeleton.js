import clsx from 'clsx';

export default function Skeleton({ className, rounded = 'rounded-xl' }) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]',
        rounded,
        className
      )}
    />
  );
}