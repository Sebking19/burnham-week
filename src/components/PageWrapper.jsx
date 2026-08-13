/**
 * PageWrapper — consistent top-level page container.
 * Provides uniform vertical spacing and max-width across all pages.
 *
 * Usage:
 *   import PageWrapper from "@/components/PageWrapper";
 *   <PageWrapper title="My Page" subtitle="Optional subtitle">…</PageWrapper>
 */
export default function PageWrapper({ title, subtitle, headerRight, children, className = "" }) {
  return (
    <div className={`py-6 space-y-5 ${className}`}>
      {(title || headerRight) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">{title}</h1>
            )}
            {subtitle && (
              <p className="text-white/45 text-sm mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight && (
            <div className="shrink-0 flex items-center gap-2">{headerRight}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * SectionCard — a consistent glass-style card block used across pages.
 */
export function SectionCard({ children, className = "", onClick }) {
  const base = "bg-white/[0.04] border border-white/10 rounded-2xl p-4";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} w-full text-left hover:bg-white/[0.07] hover:border-white/15 transition-all active:scale-[0.98] ${className}`}
      >
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}