import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  message,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return createPortal(
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.dialog} role="alertdialog" onClick={(e) => e.stopPropagation()}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={styles.confirmButton}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
