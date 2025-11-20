import React from 'react'

/**
 * Lightweight Chart Components without external dependencies
 * Uses SVG for rendering charts
 */

/**
 * Line Chart Component
 */
export function LineChart({ data, width = 600, height = 300, title = '', xLabel = '', yLabel = '', color = '#059669' }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No data available</div>
  }

  const padding = { top: 40, right: 40, bottom: 50, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = data.map(d => d.value)
  const maxValue = Math.max(...values, 0)
  const minValue = Math.min(...values, 0)
  const valueRange = maxValue - minValue || 1

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth
    const y = padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight
    return { x, y, label: d.label, value: d.value }
  })

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div style={{ marginBottom: '20px' }}>
      {title && <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>{title}</h4>}
      <svg width={width} height={height} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * ratio
          const value = maxValue - (valueRange * ratio)
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value.toFixed(0)}
              </text>
            </g>
          )
        })}

        {/* X-axis labels */}
        {points.map((p, i) => {
          if (data.length > 10 && i % Math.ceil(data.length / 10) !== 0 && i !== data.length - 1) return null
          return (
            <text
              key={i}
              x={p.x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
            >
              {p.label}
            </text>
          )
        })}

        {/* Area under the line */}
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
            <title>{`${p.label}: ${p.value}`}</title>
          </g>
        ))}

        {/* Y-axis label */}
        {yLabel && (
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize="13"
            fill="#374151"
            fontWeight="600"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            {yLabel}
          </text>
        )}

        {/* X-axis label */}
        {xLabel && (
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="13"
            fill="#374151"
            fontWeight="600"
          >
            {xLabel}
          </text>
        )}
      </svg>
    </div>
  )
}

/**
 * Bar Chart Component
 */
export function BarChart({ data, width = 600, height = 300, title = '', xLabel = '', yLabel = '', color = '#3b82f6' }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No data available</div>
  }

  const padding = { top: 40, right: 40, bottom: 50, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = data.map(d => d.value)
  const maxValue = Math.max(...values, 0)
  const barWidth = chartWidth / data.length * 0.8

  return (
    <div style={{ marginBottom: '20px' }}>
      {title && <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>{title}</h4>}
      <svg width={width} height={height} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * ratio
          const value = maxValue - (maxValue * ratio)
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value.toFixed(0)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = padding.left + (i / data.length) * chartWidth + (chartWidth / data.length - barWidth) / 2
          const barHeight = (d.value / maxValue) * chartHeight
          const y = padding.top + chartHeight - barHeight

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="11"
                fill="#374151"
                fontWeight="600"
              >
                {d.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {d.label}
              </text>
            </g>
          )
        })}

        {/* Y-axis label */}
        {yLabel && (
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize="13"
            fill="#374151"
            fontWeight="600"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            {yLabel}
          </text>
        )}

        {/* X-axis label */}
        {xLabel && (
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="13"
            fill="#374151"
            fontWeight="600"
          >
            {xLabel}
          </text>
        )}
      </svg>
    </div>
  )
}

/**
 * Pie Chart Component
 */
export function PieChart({ data, width = 300, height = 300, title = '' }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No data available</div>
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 40

  const colors = [
    '#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]

  let currentAngle = -90

  const slices = data.map((d, i) => {
    const sliceAngle = (d.value / total) * 360
    const startAngle = currentAngle * (Math.PI / 180)
    const endAngle = (currentAngle + sliceAngle) * (Math.PI / 180)

    const x1 = centerX + radius * Math.cos(startAngle)
    const y1 = centerY + radius * Math.sin(startAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)

    const largeArc = sliceAngle > 180 ? 1 : 0

    const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    const labelAngle = (currentAngle + sliceAngle / 2) * (Math.PI / 180)
    const labelRadius = radius * 0.7
    const labelX = centerX + labelRadius * Math.cos(labelAngle)
    const labelY = centerY + labelRadius * Math.sin(labelAngle)

    currentAngle += sliceAngle

    return {
      path,
      color: colors[i % colors.length],
      label: d.label,
      value: d.value,
      percentage: ((d.value / total) * 100).toFixed(1),
      labelX,
      labelY
    }
  })

  return (
    <div style={{ marginBottom: '20px' }}>
      {title && <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>{title}</h4>}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={width} height={height}>
          {slices.map((slice, i) => (
            <g key={i}>
              <path d={slice.path} fill={slice.color} stroke="white" strokeWidth="2" />
              <text
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                fontSize="12"
                fill="white"
                fontWeight="600"
              >
                {slice.percentage}%
              </text>
            </g>
          ))}
        </svg>
        
        {/* Legend */}
        <div style={{ flex: '1', minWidth: '150px' }}>
          {slices.map((slice, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: slice.color, borderRadius: '4px' }}></div>
              <div style={{ fontSize: '13px' }}>
                <strong>{slice.label}</strong>: {slice.value} ({slice.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
