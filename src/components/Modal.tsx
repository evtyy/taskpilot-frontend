import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return createPortal(
        <div className="modal-backdrop" onMouseDown={onClose}>
            <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal-card__header">
                    <span className="modal-card__title">{title}</span>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}
