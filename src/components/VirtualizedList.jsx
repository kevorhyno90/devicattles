import React, { useState, useEffect, useRef } from 'react';

/**
 * VirtualizedList Component
 * 
 * High-performance list rendering for large datasets using native React
 * Only renders visible items, dramatically improving performance
 * No external dependencies - pure React implementation
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function to render each item (item, index) => JSX
 * @param {number} itemHeight - Height of each item in pixels (default: 120)
 * @param {number} height - Total height of the list container (default: 600)
 * @param {string} width - Width of the list (default: '100%')
 * 
 * @example
 * <VirtualizedList
 *   items={animals}
 *   renderItem={(animal, index) => (
 *     <div className="card">
 *       <h4>{animal.name}</h4>
 *       <p>{animal.breed}</p>
 *     </div>
 *   )}
 *   itemHeight={140}
 *   height={600}
 * />
 */
export default function VirtualizedList({ 
  items = [], 
  renderItem, 
  itemHeight = 120, 
  height = 600,
  width = '100%',
  className = '',
  overscan = 3 // Number of extra items to render above/below viewport
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // If list is small, just render normally (no need for virtualization)
  if (items.length < 20) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={item.id || index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // For large lists, use virtualization
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Total height for scrollbar
  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{
        height: `${height}px`,
        width,
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      {/* Spacer to maintain scroll height */}
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {/* Visible items */}
        <div
          style={{
            position: 'absolute',
            top: `${startIndex * itemHeight}px`,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, i) => {
            const index = startIndex + i;
            return (
              <div
                key={item.id || index}
                style={{
                  height: `${itemHeight}px`,
                  overflow: 'hidden'
                }}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * VirtualizedGrid Component
 * 
 * High-performance grid rendering for large datasets
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Function to render each item
 * @param {number} columnCount - Number of columns (default: 3)
 * @param {number} itemHeight - Height of each row in pixels (default: 200)
 * @param {number} height - Total height of the grid container (default: 600)
 */
export function VirtualizedGrid({
  items = [],
  renderItem,
  columnCount = 3,
  itemHeight = 200,
  height = 600,
  width = '100%',
  overscan = 2
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  if (items.length < 20) {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: '16px'
      }}>
        {items.map((item, index) => (
          <div key={item.id || index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Calculate rows
  const rowCount = Math.ceil(items.length / columnCount);
  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endRow = Math.min(
    rowCount - 1,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );

  const visibleRows = [];
  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
    const startIdx = rowIndex * columnCount;
    const rowItems = items.slice(startIdx, startIdx + columnCount);
    if (rowItems.length > 0) {
      visibleRows.push({ rowIndex, items: rowItems, startIdx });
    }
  }

  const totalHeight = rowCount * itemHeight;

  return (
    <div
      onScroll={handleScroll}
      style={{
        height: `${height}px`,
        width,
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: `${startRow * itemHeight}px`,
            left: 0,
            right: 0
          }}
        >
          {visibleRows.map(({ rowIndex, items: rowItems, startIdx }) => (
            <div
              key={rowIndex}
              style={{
                height: `${itemHeight}px`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                gap: '16px',
                marginBottom: '0'
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={item.id || (startIdx + colIndex)}>
                  {renderItem(item, startIdx + colIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
