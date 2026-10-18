"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel = "Се зачувува...",
  className = "button button-solid",
  form,
  name,
  value,
  disabled,
  title,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  form?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      type="submit"
      form={form}
      name={name}
      value={value}
      title={title}
      disabled={disabled || pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
