"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowUpRight, Check, LoaderCircle } from "lucide-react";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Status({ value }: { value: string }) {
  const tone = [
    "approved",
    "confirmed",
    "completed",
    "accepted",
    "simulated",
    "resolved",
    "published",
  ].includes(value)
    ? "green"
    : [
          "requested",
          "pending",
          "submitted",
          "awaiting_payment",
          "cancel_requested",
          "changes_requested",
        ].includes(value)
      ? "amber"
      : ["rejected", "cancelled", "declined", "suspended"].includes(value)
        ? "red"
        : "neutral";
  return <Badge tone={tone}>{value.replaceAll("_", " ")}</Badge>;
}
export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-flower">✳</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-top">
        <div>
          <span className="eyebrow">A LITTLE CLOSER TO YOUR CELEBRATION</span>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string | number;
  required?: boolean;
  min?: number | string;
  max?: number;
  hint?: string;
};
export function Form({
  fields,
  submit,
  onSubmit,
  busy,
  error,
  children,
}: {
  fields: Field[];
  submit: string;
  onSubmit: (data: Record<string, any>) => void;
  busy?: boolean;
  error?: string;
  children?: ReactNode;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Object.fromEntries(new FormData(e.currentTarget)));
      }}
      className="form"
    >
      <div className="form-fields">
        {fields.map((f) => (
          <label
            key={f.name}
            className={f.type === "textarea" ? "field full" : "field"}
          >
            <span>{f.label}</span>
            {f.options ? (
              <select
                aria-label={f.label}
                name={f.name}
                defaultValue={f.value}
                required={f.required !== false}
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                aria-label={f.label}
                name={f.name}
                defaultValue={f.value}
                placeholder={f.placeholder}
                required={f.required !== false}
                rows={4}
                maxLength={4000}
              />
            ) : (
              <input
                aria-label={f.label}
                name={f.name}
                type={f.type || "text"}
                defaultValue={f.value}
                placeholder={f.placeholder}
                required={f.required !== false}
                min={f.min}
                max={f.max}
                minLength={f.type === "password" ? 12 : undefined}
                maxLength={f.type === "password" ? 128 : 500}
              />
            )}{" "}
            {f.hint && <small>{f.hint}</small>}
          </label>
        ))}
      </div>
      {children}
      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}
      <button className="button primary" disabled={busy} type="submit">
        {busy ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <Check size={17} />
        )}{" "}
        {busy ? "Saving…" : submit}
      </button>
    </form>
  );
}
export function SectionTitle({
  label,
  title,
  action,
}: {
  label: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{label}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={16} />
    </button>
  );
}
