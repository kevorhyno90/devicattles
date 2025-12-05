import React from 'react';
import { FixedSizeList } from 'react-window';

/**
 * VirtualizedList Component
 * 
 * High-performance list rendering for large datasets
 * Only renders visible items, dramatically improving performance
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
  className = ''
}) {
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
  const Row = ({ index, style }) => {
    const item = items[index];
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      className={className}
    >
      {Row}
    </FixedSizeList>
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
  width = '100%'
}) {
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

  const Row = ({ index, style }) => {
    const startIdx = index * columnCount;
    const rowItems = items.slice(startIdx, startIdx + columnCount);
    
    return (
      <div style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: '16px',
        paddingRight: '16px'
      }}>
        {rowItems.map((item, colIndex) => (
          <div key={item.id || (startIdx + colIndex)}>
            {renderItem(item, startIdx + colIndex)}
          </div>
        ))}
      </div>
    );
  };

  const rowCount = Math.ceil(items.length / columnCount);

  return (
    <FixedSizeList
      height={height}
      itemCount={rowCount}
      itemSize={itemHeight}
      width={width}
    >
      {Row}
    </FixedSizeList>
  );
}
