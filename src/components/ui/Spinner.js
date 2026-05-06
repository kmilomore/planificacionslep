import clsx from 'clsx';

export default function Spinner({ fullscreen = false, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

  const spinner = (
    <svg
      className={clsx('animate-spin text-blue', sizes[size])}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        {spinner}
      </div>
    );
  }

  return spinner;
}
