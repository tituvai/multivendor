"use client";
import Link from "next/link";
import { clsx } from "clsx";

// ════════════════════════════════════════════════════
// BUTTON
// ════════════════════════════════════════════════════
export function Button({ children, variant = "primary", size = "md", loading, className, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:   "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300",
    danger:    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400",
    success:   "bg-green-600 text-white hover:bg-green-700 focus:ring-green-400",
    warning:   "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400",
    ghost:     "text-gray-600 hover:bg-gray-100 focus:ring-gray-300",
    vendor:    "bg-teal-700 text-white hover:bg-teal-600 focus:ring-teal-400",
    admin:     "bg-indigo-900 text-white hover:bg-indigo-800 focus:ring-indigo-400",
  };
  const sizes = {
    xs: "px-2.5 py-1.5 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size="sm" color="white" />}
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════
// INPUT
// ════════════════════════════════════════════════════
export function Input({ label, error, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <input
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 bg-white placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2",
          error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-blue-200 focus:border-blue-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════
// SELECT
// ════════════════════════════════════════════════════
export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <select
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white transition-all focus:outline-none focus:ring-2",
          error ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200 focus:border-blue-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════
// TEXTAREA
// ════════════════════════════════════════════════════
export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <textarea
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 resize-none",
          error ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200 focus:border-blue-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════
// BADGE
// ════════════════════════════════════════════════════
const badgeVariants = {
  success:   "bg-green-50 text-green-700 ring-1 ring-green-600/20",
  warning:   "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  danger:    "bg-red-50 text-red-700 ring-1 ring-red-600/20",
  info:      "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  gray:      "bg-gray-100 text-gray-600 ring-1 ring-gray-500/20",
  purple:    "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20",
  teal:      "bg-teal-50 text-teal-700 ring-1 ring-teal-600/20",
};

export function Badge({ children, variant = "gray", className }) {
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", badgeVariants[variant], className)}>
      {children}
    </span>
  );
}

// ════════════════════════════════════════════════════
// SPINNER
// ════════════════════════════════════════════════════
export function Spinner({ size = "md", color = "blue", className }) {
  const sizes  = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10", xl: "h-14 w-14" };
  const colors = { blue: "border-blue-600", white: "border-white", gray: "border-gray-400", teal: "border-teal-600" };
  return (
    <div className={clsx("animate-spin rounded-full border-2 border-t-transparent", sizes[size], colors[color], className)} />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <Spinner size="xl" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// CARD
// ════════════════════════════════════════════════════
export function Card({ children, className, hover }) {
  return (
    <div className={clsx(
      "bg-white rounded-xl border border-gray-100 shadow-sm",
      hover && "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
      className
    )}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════
export function StatCard({ title, value, icon: Icon, change, color = "blue", loading }) {
  const colors = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-100" },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-100" },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  border: "border-amber-100" },
    red:    { bg: "bg-red-50",    icon: "text-red-600",    border: "border-red-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
    teal:   { bg: "bg-teal-50",   icon: "text-teal-600",   border: "border-teal-100" },
  };
  const c = colors[color] || colors.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="skeleton h-4 w-24 mb-3 rounded" />
        <div className="skeleton h-8 w-16 rounded" />
      </div>
    );
  }

  return (
    <div className={clsx("bg-white rounded-xl border shadow-sm p-5", c.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={clsx("text-xs mt-1 font-medium", change >= 0 ? "text-green-600" : "text-red-600")}>
              {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% this month
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx("p-3 rounded-xl", c.bg)}>
            <Icon className={clsx("w-5 h-5", c.icon)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// PAGINATION
// ════════════════════════════════════════════════════
export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const getPages = () => {
    const arr = [];
    const delta = 2;
    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) arr.push(i);
    if (page - delta > 2)   arr.unshift("...");
    if (page + delta < pages - 1) arr.push("...");
    arr.unshift(1);
    if (pages > 1) arr.push(pages);
    return [...new Set(arr)];
  };

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        ← Prev
      </button>
      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={i} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx(
              "w-9 h-9 rounded-lg text-sm font-medium transition",
              p === page ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Next →
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════════════
export function Modal({ open, onClose, title, children, size = "md" }) {
  if (!open) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx("relative bg-white rounded-2xl shadow-2xl w-full", sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════════════════
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ════════════════════════════════════════════════════
// CONFIRM DIALOG
// ════════════════════════════════════════════════════
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Confirm", variant = "danger", loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════
// ORDER STATUS BADGE
// ════════════════════════════════════════════════════
export function OrderStatusBadge({ status }) {
  const map = {
    pending:            { label: "Pending",           variant: "warning" },
    processing:         { label: "Processing",        variant: "info"    },
    partially_shipped:  { label: "Part. Shipped",     variant: "purple"  },
    shipped:            { label: "Shipped",           variant: "teal"    },
    delivered:          { label: "Delivered",         variant: "success" },
    cancelled:          { label: "Cancelled",         variant: "danger"  },
    refunded:           { label: "Refunded",          variant: "gray"    },
  };
  const cfg = map[status] || { label: status, variant: "gray" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ════════════════════════════════════════════════════
// PRODUCT STATUS BADGE
// ════════════════════════════════════════════════════
export function ProductStatusBadge({ status }) {
  const map = {
    active:   { label: "Active",   variant: "success" },
    pending:  { label: "Pending",  variant: "warning" },
    rejected: { label: "Rejected", variant: "danger"  },
    draft:    { label: "Draft",    variant: "gray"    },
    archived: { label: "Archived", variant: "gray"    },
  };
  const cfg = map[status] || { label: status, variant: "gray" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ════════════════════════════════════════════════════
// VENDOR STATUS BADGE
// ════════════════════════════════════════════════════
export function VendorStatusBadge({ status }) {
  const map = {
    approved:  { label: "Approved",  variant: "success" },
    pending:   { label: "Pending",   variant: "warning" },
    rejected:  { label: "Rejected",  variant: "danger"  },
    suspended: { label: "Suspended", variant: "gray"    },
  };
  const cfg = map[status] || { label: status, variant: "gray" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ════════════════════════════════════════════════════
// SEARCH INPUT
// ════════════════════════════════════════════════════
export function SearchInput({ value, onChange, placeholder = "Search...", className }) {
  return (
    <div className={clsx("relative", className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
      />
    </div>
  );
}




export function SectionHeader({ title, subtitle, viewAllHref, accent = false }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <div className={clsx("flex items-center gap-2 mb-1", accent && "")}>
          {accent && <span className="w-1 h-6 bg-orange-500 rounded-full block" />}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className="text-sm font-medium text-orange-500 hover:text-orange-600 whitespace-nowrap flex items-center gap-0.5 transition">
          View all <span>→</span>
        </Link>
      )}
    </div>
  );
}

export function ProductGrid({ children, cols = 5 }) {
  const colMap = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4", 5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4" };
  return <div className={clsx("grid gap-3 sm:gap-4", colMap[cols] || colMap[5])}>{children}</div>;
}

// export function Pagination({ page, pages, onChange }) {
//   if (pages <= 1) return null;
//   const getPages = () => {
//     const arr = []; const d = 2;
//     for (let i = Math.max(2, page - d); i <= Math.min(pages - 1, page + d); i++) arr.push(i);
//     if (page - d > 2)      arr.unshift("...");
//     if (page + d < pages - 1) arr.push("...");
//     arr.unshift(1); if (pages > 1) arr.push(pages);
//     return [...new Set(arr)];
//   };
//   return (
//     <div className="flex items-center justify-center gap-1.5 py-6">
//       <button onClick={() => onChange(page - 1)} disabled={page === 1}
//         className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">← Prev</button>
//       {getPages().map((p, i) => p === "..." ? (
//         <span key={i} className="px-1 text-gray-400">...</span>
//       ) : (
//         <button key={p} onClick={() => onChange(p)}
//           className={clsx("w-9 h-9 rounded-lg text-sm font-medium transition", p === page ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 border border-gray-200")}>
//           {p}
//         </button>
//       ))}
//       <button onClick={() => onChange(page + 1)} disabled={page === pages}
//         className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">Next →</button>
//     </div>
//   );
// }

// export function EmptyState({ icon = "📭", title, description, action }) {
//   return (
//     <div className="text-center py-16">
//       <div className="text-5xl mb-4">{icon}</div>
//       <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
//       {description && <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">{description}</p>}
//       {action}
//     </div>
//   );
// }

// export function Spinner({ size = "md" }) {
//   const s = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
//   return <div className={clsx("animate-spin rounded-full border-2 border-orange-500 border-t-transparent", s[size])} />;
// }

// export function Badge({ children, color = "gray" }) {
//   const c = { gray: "bg-gray-100 text-gray-600", orange: "bg-orange-100 text-orange-700", green: "bg-green-100 text-green-700", red: "bg-red-100 text-red-700", blue: "bg-blue-100 text-blue-700", purple: "bg-purple-100 text-purple-700", teal: "bg-teal-100 text-teal-700", amber: "bg-amber-100 text-amber-700" };
//   return <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", c[color] || c.gray)}>{children}</span>;
// }

// export function OrderStatusBadge({ status }) {
//   const m = { pending: ["Pending","amber"], processing: ["Processing","blue"], partially_shipped: ["Part. Shipped","purple"], shipped: ["Shipped","teal"], delivered: ["Delivered","green"], cancelled: ["Cancelled","red"], refunded: ["Refunded","gray"] };
//   const [label, color] = m[status] || [status, "gray"];
//   return <Badge color={color}>{label}</Badge>;
// }

export function StarRating({ rating = 0, count, size = "sm" }) {
  const s = size === "lg" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" className={clsx(s, n <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200")}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {count !== undefined && <span className="text-xs text-gray-400 ml-1">({count})</span>}
    </div>
  );
}