import { X } from "lucide-react";
import "../../styles/barbero/barbero-modal.css";

export default function BarberoModal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="bm-overlay" role="presentation" onMouseDown={onClose}>
      <section className="bm-dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button></header>
        <div className="bm-content">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  );
}
