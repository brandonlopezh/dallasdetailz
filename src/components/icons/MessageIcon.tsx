export default function MessageIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8.5L4.5 20v-3.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
