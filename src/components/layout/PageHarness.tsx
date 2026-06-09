import type { FormEventHandler, ReactNode } from 'react';
import { Paper } from '@mui/material';
import { Link, type LinkProps } from 'react-router-dom';

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const;

type PageHarnessMaxWidth = keyof typeof maxWidthClasses;

type PageHarnessProps = {
  children: ReactNode;
  maxWidth?: PageHarnessMaxWidth;
};

/** Full-viewport shell with a centered theme card — use as the root wrapper for auth and similar pages. */
export function PageHarness({ children, maxWidth = 'md' }: PageHarnessProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Paper
        elevation={3}
        className={`w-full ${maxWidthClasses[maxWidth]} border border-border p-8`}
      >
        <div className="flex flex-col gap-8">{children}</div>
      </Paper>
    </main>
  );
}

type PageHarnessHeaderProps = {
  title: string;
  description?: string;
};

export function PageHarnessHeader({ title, description }: PageHarnessHeaderProps) {
  return (
    <header className="flex flex-col gap-2 text-left">
      <h1 className="text-2xl font-semibold text-primary">{title}</h1>
      {description ? (
        <p className="text-sm text-secondary">{description}</p>
      ) : null}
    </header>
  );
}

type PageHarnessFormProps = {
  children: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function PageHarnessForm({ children, onSubmit }: PageHarnessFormProps) {
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      {children}
    </form>
  );
}

type PageHarnessFooterProps = {
  children: ReactNode;
};

export function PageHarnessFooter({ children }: PageHarnessFooterProps) {
  return <p className="text-center text-sm text-secondary">{children}</p>;
}

export function PageHarnessLink({ className, ...props }: LinkProps) {
  const linkClassName = [
    'font-medium text-primary underline-offset-2 hover:underline',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Link className={linkClassName} {...props} />;
}
