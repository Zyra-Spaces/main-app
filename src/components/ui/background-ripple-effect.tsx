"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const BackgroundRippleEffect = ({
  rows: rowsProp,
  cols: colsProp,
  cellSize = 56,
  borderColor = "#262626",
  fillColor = "rgba(255,255,255,0.08)",
  fill = false,
  className,
}: {
  rows?: number;
  cols?: number;
  cellSize?: number;
  borderColor?: string;
  fillColor?: string;
  fill?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ cols: colsProp ?? 27, rows: rowsProp ?? 8 });

  useEffect(() => {
    if (!fill || !containerRef.current) return;
    const el = containerRef.current;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setDimensions({
        cols: Math.ceil(width / cellSize) + 2,
        rows: Math.ceil(height / cellSize) + 2,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fill, cellSize]);

  const cols = fill ? dimensions.cols : (colsProp ?? 27);
  const rows = fill ? dimensions.rows : (rowsProp ?? 8);

  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);

  return (
    <div ref={containerRef} className={cn("absolute inset-0 w-full overflow-hidden", className)}>
      <DivGrid
        key={rippleKey}
        rows={rows}
        cols={cols}
        cellSize={cellSize}
        borderColor={borderColor}
        fillColor={fillColor}
        clickedCell={clickedCell}
        onCellClick={(row, col) => {
          setClickedCell({ row, col });
          setRippleKey((k) => k + 1);
        }}
        interactive
      />
    </div>
  );
};

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number;
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  borderColor = "#262626",
  fillColor = "rgba(255,255,255,0.08)",
  clickedCell = null,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols]
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
  };

  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
      }}
    >
      <div style={gridStyle}>
        {cells.map((idx) => {
          const rowIdx = Math.floor(idx / cols);
          const colIdx = idx % cols;
          const distance = clickedCell
            ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
            : 0;
          const delay = clickedCell ? Math.max(0, distance * 55) : 0;
          const duration = 200 + distance * 80;

          const style: CellStyle = clickedCell
            ? {
                ["--delay"]: `${delay}ms`,
                ["--duration"]: `${duration}ms`,
              }
            : {};

          return (
            <div
              key={idx}
              className="animate-cell-ripple cursor-pointer border border-solid transition-colors hover:border-neutral-500"
              style={{
                ...style,
                borderColor,
                backgroundColor: fillColor,
              }}
              onClick={() =>
                interactive ? onCellClick?.(rowIdx, colIdx) : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
};
