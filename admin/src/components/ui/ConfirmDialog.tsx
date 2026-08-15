'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone} onClick={handleConfirm} loading={busy || loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
