import type React from "react";
import "./pagination.scss";

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

/** Previous / "Page x of y" / Next. Shows nothing when everything fits on one page. */
const Pagination: React.FC<PaginationProps> = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  const atStart = page <= 1;
  const atEnd = page >= pages;

  return (
    <nav className="pmu-pagination" aria-label="Pages">
      <button
        type="button"
        className="pmu-pagination__arrow"
        onClick={() => onChange(page - 1)}
        disabled={atStart}
        aria-label="Previous page"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <span className="pmu-pagination__text">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        className="pmu-pagination__arrow"
        onClick={() => onChange(page + 1)}
        disabled={atEnd}
        aria-label="Next page"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
        </svg>
      </button>
    </nav>
  );
};

export default Pagination;
