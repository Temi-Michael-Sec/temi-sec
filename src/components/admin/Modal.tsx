"use client";

import { useEffect, useId, useRef } from "react";
import { buttonGhost, buttonPrimary, buttonDanger, inputClass } from "./styles";

/**
 * Modal primitives for the admin — replacing the browser's native
 * window.alert / confirm / prompt with in-page dialogs that match the terminal
 * aesthetic.
 *
 * Built on the native <dialog> element via showModal(), so we get the top-layer
 * render, backdrop, Esc-to-dismiss and focus trapping for free rather than
 * hand-rolling (and getting wrong) an accessibility layer. The element is driven
 * from React state: we call showModal()/close() in an effect and keep our state
 * in sync with the dialog's own `cancel`/`close` events.
 */

function Modal({
  open,
  onClose,
  titleId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Esc fires `cancel`; keep React state authoritative so the dialog can't
      // desync from `open`.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click that lands on the dialog element itself (not the card inside) is
      // a backdrop click — dismiss.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] border-0 bg-transparent p-0 text-foreground backdrop:bg-black/60"
    >
      <div className="rounded-md border border-border bg-background p-5 shadow-xl">
        {children}
      </div>
    </dialog>
  );
}

// ── Confirm ──────────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  return (
    <Modal open={open} onClose={onCancel} titleId={titleId}>
      <h2 id={titleId} className="text-sm font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={buttonGhost} autoFocus>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={tone === "danger" ? buttonDanger : buttonPrimary}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ── Alert (single acknowledge button) ────────────────────────────────────────

export function AlertDialog({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  const titleId = useId();
  return (
    <Modal open={open} onClose={onClose} titleId={titleId}>
      <h2 id={titleId} className="text-sm font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onClose} className={buttonPrimary} autoFocus>
          OK
        </button>
      </div>
    </Modal>
  );
}

// ── Prompt (single text input) ───────────────────────────────────────────────

export function PromptDialog({
  open,
  title,
  label,
  placeholder,
  defaultValue = "",
  confirmLabel = "Insert",
  onSubmit,
  onCancel,
}: {
  open: boolean;
  title: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = () => onSubmit(inputRef.current?.value ?? "");

  // Deliberately NOT a <form>: this dialog is rendered inside the editor's own
  // <form>, and a nested <form> is invalid HTML (it throws a hydration error).
  // Enter-to-submit is wired on the input instead.
  return (
    <Modal open={open} onClose={onCancel} titleId={titleId}>
      <h2 id={titleId} className="text-sm font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      <label htmlFor={inputId} className="mt-3 block text-xs text-faint">
        {label}
      </label>
      {/* Uncontrolled + keyed on `open` so each opening starts fresh from
          defaultValue without a state-sync effect. */}
      <input
        key={open ? "open" : "closed"}
        id={inputId}
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className={inputClass}
      />
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={buttonGhost}>
          Cancel
        </button>
        <button type="button" onClick={submit} className={buttonPrimary}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
