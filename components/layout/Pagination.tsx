import {useEffect, useState} from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";

export function PaginationBar({
                                  totalPages,
                                  currentPage,
                                  setCurrentPage,
                              }: {
    totalPages?: number;
    currentPage?: number;
    setCurrentPage?: (page: number) => void;
}) {
    const safeTotal = totalPages ?? 1;
    const safeCurrent = currentPage ?? 0;

    const [batchSize, setBatchSize] = useState(10);
    const [batchStart, setBatchStart] = useState(0);
    const [jumpTarget, setJumpTarget] = useState(String(safeCurrent + 1));

    // Adjust batch size based on screen width
    useEffect(() => {
        const updateBatchSize = () => {
            const width = window.innerWidth;
            if (width < 768) {
                // Tailwind 'sm'
                setBatchSize(3);
            } else if (width < 1024) {
                // Tailwind 'md'
                setBatchSize(5);
            } else {
                // Tailwind 'lg+' and up
                setBatchSize(10);
            }
        };

        updateBatchSize(); // initial check
        window.addEventListener('resize', updateBatchSize);
        return () => window.removeEventListener('resize', updateBatchSize);
    }, []);

    // Ensure current page is visible in current batch
    useEffect(() => {
        // Recenter only when page or viewport batch size changes.
        // Do not recenter on manual batch browsing (<< / >> clicks).
        const start = Math.floor(safeCurrent / batchSize) * batchSize;
        setBatchStart(start);
        setJumpTarget(String(safeCurrent + 1));
    }, [safeCurrent, batchSize]);

    const batchEnd = Math.min(batchStart + batchSize, safeTotal);

    const goToBatch = (direction: 'prev' | 'next') => {
        const lastBatchStart = Math.max(0, Math.floor((safeTotal - 1) / batchSize) * batchSize);
        const newStart =
            direction === 'prev'
                ? Math.max(0, batchStart - batchSize)
                : Math.min(lastBatchStart, batchStart + batchSize);
        setBatchStart(newStart);
    };

    const commitJump = () => {
        const parsed = Number(jumpTarget);
        if (!Number.isInteger(parsed)) return;
        const nextPage = parsed - 1;
        if (nextPage >= 0 && nextPage < safeTotal) {
            setCurrentPage?.(nextPage);
        }
    };

    return (
        <div className="flex w-full flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-slate-950/30 p-4 shadow-lg">
            <div className="flex w-full flex-wrap items-center justify-between gap-3 px-2 text-sm text-slate-200">
                <p>Page {safeCurrent + 1} of {safeTotal}</p>
                <div className="flex items-center gap-2">
                    <label htmlFor="pagination-jump" className="text-slate-300">Jump to</label>
                    <input
                        id="pagination-jump"
                        type="number"
                        min={1}
                        max={safeTotal}
                        value={jumpTarget}
                        onChange={(event) => setJumpTarget(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                commitJump();
                            }
                        }}
                        className="w-20 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-center text-white outline-none ring-0 focus:border-sky-400"
                    />
                    <button
                        type="button"
                        onClick={commitJump}
                        className="rounded-full border border-sky-400/40 px-3 py-1 text-sky-200 transition hover:bg-sky-400/10"
                    >
                        Go
                    </button>
                </div>
            </div>

            <div className="flex flex-row w-full items-center justify-center gap-4 flex-wrap">
            {/* Page-by-page left */}
            <button
                type="button"
                aria-label="Previous page"
                disabled={!setCurrentPage || safeCurrent <= 0}
                className="rounded p-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => {
                    if (setCurrentPage && safeCurrent > 0) {
                        setCurrentPage(safeCurrent - 1);
                    }
                }}
                data-testid="prev-page"
            >
                <ChevronLeft aria-hidden="true" />
            </button>

            {/* Batch left arrow */}
            {batchStart > 0 && (
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => goToBatch('prev')}
                    data-testid="prev-batch"
                    aria-label="Previous page group"
                >
                    &laquo;
                </button>
            )}

            {/* Page numbers for current batch */}
            {Array.from({length: batchEnd - batchStart}, (_, index) => {
                const pageIndex = batchStart + index;
                return (
                    <button
                        type="button"
                        onClick={() => setCurrentPage?.(pageIndex)}
                        key={pageIndex}
                        className="mx-1 min-w-10"
                        data-testid={`page-${pageIndex}`}
                        aria-label={`Go to page ${pageIndex + 1}`}
                        aria-current={safeCurrent === pageIndex ? "page" : undefined}
                    >
                        <span className={
                            (safeCurrent === pageIndex
                                ? ' dark:bg-gray-700 bg-gray-200 rounded-full '
                                : ' ') +
                            ' cursor-pointer px-2 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-full transition-colors'
                        }>
            {pageIndex + 1}
                        </span>
                    </button>
                );
            })}

            {/* Batch right arrow */}
            {batchEnd < safeTotal && (
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => goToBatch('next')}
                    data-testid="next-batch"
                    aria-label="Next page group"
                >
                    &raquo;
                </button>
            )}

            {/* Page-by-page right */}
            <button
                type="button"
                aria-label="Next page"
                disabled={!setCurrentPage || safeCurrent >= safeTotal - 1}
                className="rounded p-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => {
                    if (setCurrentPage && safeCurrent < safeTotal - 1) {
                        setCurrentPage(safeCurrent + 1);
                    }
                }}
                data-testid="next-page"
            >
                <ChevronRight aria-hidden="true" />
            </button>
            </div>
        </div>
    );
}
