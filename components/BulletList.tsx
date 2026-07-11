interface BulletListProps {
  items: string[];
  className?: string;
}

/** Shared bullet-list rendering used by both the before/during/after sections and safety recommendations. */
export function BulletList({ items, className = "space-y-2 text-sm text-slate-200" }: BulletListProps) {
  return (
    <ul className={className}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden="true" className="text-teal-400">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
