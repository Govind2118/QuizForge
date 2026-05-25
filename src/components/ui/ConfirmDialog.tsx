import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon, TrashIcon } from '@radix-ui/react-icons';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" aria-describedby="confirm-dialog-description">
          <div className="dialog-header">
            <div className="dialog-icon" aria-hidden="true"><TrashIcon /></div>
            <Dialog.Title className="title-md dialog-title">{title}</Dialog.Title>
          </div>
          <Dialog.Description className="muted text-sm dialog-description" id="confirm-dialog-description">
            {description}
          </Dialog.Description>
          <div className="dialog-actions">
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
            </Dialog.Close>
          </div>
          <Dialog.Close asChild>
            <button className="dialog-close" aria-label="Close"><Cross2Icon /></button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
