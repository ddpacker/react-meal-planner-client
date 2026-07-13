import type { FormEventHandler, ReactNode } from 'react';
import { Paper } from '@mui/material';
import { Link, type LinkProps } from 'react-router-dom';

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const;

type PageTemplateMaxWidth = keyof typeof maxWidthClasses;

type PageTemplateProps = {
  children: ReactNode;
  maxWidth?: PageTemplateMaxWidth;
};

/** Full-viewport shell with a centered theme card — use as the root wrapper for auth and similar pages. */
export function PageTemplate({ children, maxWidth = 'md' }: PageTemplateProps) {
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

type PageTemplateHeaderProps = {
  title: string;
  description?: string;
};

export function PageTemplateHeader({ title, description }: PageTemplateHeaderProps) {
  return (
    <header className="flex flex-col gap-2 text-left">
      <h1 className="text-2xl font-semibold text-primary">{title}</h1>
      {description ? (
        <p className="text-sm text-secondary">{description}</p>
      ) : null}
    </header>
  );
}

type PageTemplateSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function PageTemplateSection({ title, description, children }: PageTemplateSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        {description ? <p className="text-sm text-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

type PageTemplateFormProps = {
  children: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function PageTemplateForm({ children, onSubmit }: PageTemplateFormProps) {
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      {children}
    </form>
  );
}

type PageTemplateFooterProps = {
  children: ReactNode;
};

export function PageTemplateFooter({ children }: PageTemplateFooterProps) {
  return <p className="text-center text-sm text-secondary">{children}</p>;
}

export function PageTemplateLink({ className, ...props }: LinkProps) {
  const linkClassName = [
    'font-medium text-primary underline-offset-2 hover:underline',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Link className={linkClassName} {...props} />;
}
