"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dataset, MAX_ROWS, numericColumns } from "@/lib/data";

export function DataTable({
  dataset,
  onEdit,
  onAdd,
  onDelete,
  onUndo,
  canUndo,
  onDownload,
}: {
  dataset: Dataset;
  onEdit: (row: number, column: string, value: string) => void;
  onAdd: () => void;
  onDelete: (row: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  onDownload: () => void;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(dataset.rows.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const numeric = new Set(numericColumns(dataset).map((column) => column.id));
  return (
    <section className="data-panel" aria-labelledby="data-heading">
      <div className="data-panel-header">
        <div>
          <h2 id="data-heading">
            The numbers behind the picture{" "}
            <span>{dataset.rows.length} rows</span>
          </h2>
          <p>Click any cell to edit. Your chart follows along.</p>
        </div>
        <div className="table-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last data change"
          >
            <Undo2 size={15} /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download size={14} />
            <span>CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={dataset.rows.length >= MAX_ROWS}
            onClick={() => {
              onAdd();
              setPage(Math.floor(dataset.rows.length / pageSize));
            }}
          >
            <Plus size={14} /> Add row
          </Button>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="row-number">#</th>
              {dataset.columns.map((column) => (
                <th key={column.id}>
                  <span className="column-type">
                    {numeric.has(column.id) ? "#" : "Aa"}
                  </span>
                  {column.name}
                </th>
              ))}
              <th className="row-delete">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {dataset.rows
              .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
              .map((row, localIndex) => {
                const rowIndex = currentPage * pageSize + localIndex;
                return (
                  <tr key={rowIndex}>
                    <td className="row-number">{rowIndex + 1}</td>
                    {dataset.columns.map((column) => (
                      <td key={column.id}>
                        <input
                          key={`${rowIndex}-${column.id}-${row[column.id]}`}
                          aria-label={`Row ${rowIndex + 1}, ${column.name}`}
                          defaultValue={row[column.id] ?? ""}
                          onBlur={(event) => {
                            if (event.target.value !== row[column.id])
                              onEdit(rowIndex, column.id, event.target.value);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter")
                              event.currentTarget.blur();
                            if (event.key === "Escape") {
                              event.currentTarget.value = row[column.id] ?? "";
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      </td>
                    ))}
                    <td className="row-delete">
                      <button
                        className="delete-row"
                        aria-label={`Delete row ${rowIndex + 1}`}
                        disabled={dataset.rows.length <= 1}
                        onClick={() => onDelete(rowIndex)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          Showing {currentPage * pageSize + 1}–
          {Math.min((currentPage + 1) * pageSize, dataset.rows.length)} of{" "}
          {dataset.rows.length} rows <span className="footer-separator">·</span>{" "}
          {dataset.columns.length} columns
        </span>
        <div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={15} />
          </Button>
          <span>
            {currentPage + 1} / {pages}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={currentPage >= pages - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
    </section>
  );
}
