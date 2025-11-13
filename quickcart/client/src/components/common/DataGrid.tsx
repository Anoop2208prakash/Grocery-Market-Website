import type { ReactNode } from 'react'; // Use "import type"
import EmptyState from './EmptyState';
import styles from './DataGrid.module.scss';

// ColumnDef is now more flexible
export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T; // Accessor is optional
  cell?: (row: T) => ReactNode; // 'cell' allows custom rendering
}

// Props for the DataGrid
interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  emptyTitle: string;
  emptyMessage: string;
  emptyAction?: ReactNode;
}

export const DataGrid = <T extends { id: string | number }>({
  data,
  columns,
  emptyTitle,
  emptyMessage,
  emptyAction,
}: DataGridProps<T>) => {
  if (data.length === 0) {
    return (
      <EmptyState title={emptyTitle} message={emptyMessage}>
        {emptyAction}
      </EmptyState>
    );
  }

  return (
    <table className={styles.dataGrid}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.header}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={`${row.id}-${col.header}`}>
                {/*
                  If a 'cell' function is provided, use it.
                  Otherwise, fall back to the accessorKey.
                */}
                {col.cell
                  ? col.cell(row)
                  : col.accessorKey
                  ? String(row[col.accessorKey])
                  : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataGrid;