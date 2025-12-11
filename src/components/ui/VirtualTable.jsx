// src/components/VirtualTable.jsx
import React, { useRef } from "react";
import { useVirtual } from "@tanstack/react-virtual";

export default function VirtualTable({ data, rowHeight, children }) {
  const parentRef = useRef();

  const rowVirtualizer = useVirtual({
    size: data.length,
    parentRef,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: rowHeight * 14, overflowY: "auto" }}>
      <table className="w-full border shadow rounded-xl text-center min-w-[500px]">
        <thead className="bg-red-800 text-white text-lg sticky top-0">
          {children.header}
        </thead>
        <tbody>
          {rowVirtualizer.virtualItems.map(virtualRow => {
            const row = data[virtualRow.index];
            return (
              <tr
                key={row.id}
                className={`even:bg-gray-100 hover:bg-gray-200 transition`}
                style={{
                  height: rowHeight,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {children.row(row, virtualRow.index)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
