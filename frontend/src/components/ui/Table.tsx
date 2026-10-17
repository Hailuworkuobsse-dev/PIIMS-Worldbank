import {
  type HTMLAttributes,
  type ReactNode,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
} from "react";
import { cn } from "./utils/cn";

export function Table({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-md border border-neutral-300 bg-white">
      <table
        className={cn("w-full border-collapse text-body-sm", className)}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({
  className,
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "text-left bg-primary-700 text-white px-3 py-2.5 font-bold text-caption uppercase tracking-wide sticky top-0",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 border-t border-neutral-300 align-middle",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function Tr({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "even:bg-neutral-50 hover:bg-primary-100 transition-colors",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}