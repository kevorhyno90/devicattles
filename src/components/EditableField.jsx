import React from 'react'
import { AppViewContext } from '../lib/AppViewContext.jsx'

export default function EditableField({ value, onChange, type='text', placeholder='', style={}, inputStyle={}, ...rest }) {
  const { editMode } = React.useContext(AppViewContext)

  if (!editMode) {
    return <span style={style} {...rest}>{String(value)}</span>
  }

  if (type === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', ...inputStyle }}
      />
    )
  }

  return (
    <input
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', ...inputStyle }}
      type={type}
    />
  )
}
