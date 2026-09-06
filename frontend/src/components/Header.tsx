import type { ReactNode } from 'react';

type HeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-6 py-3">
        {/* Title */}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

          {description && (
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        {/* Optional Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}

export default Header;
