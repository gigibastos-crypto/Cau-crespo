import React from 'react'

export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="page-header">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="ghost small" onClick={onClose}>Fechar</button>
        </div>
        {children}
      </div>
    </div>
  )
}
