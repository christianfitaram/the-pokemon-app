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
        const start = Math.floor(safeCurrent / batchSize) * batchSize;
        if (start !== batchStart) {
            setBatchStart(start);
        }
    }, [safeCurrent, batchSize, batchStart]);

    const batchEnd = Math.min(batchStart + batchSize, safeTotal);

    const goToBatch = (direction: 'prev' | 'next') => {
        const newStart =
            direction === 'prev'
                ? Math.max(0, batchStart - batchSize)
                : Math.min(safeTotal - batchSize, batchStart + batchSize);
        setBatchStart(newStart);
    };

    return (
        <div className="flex flex-row w-full items-center justify-center gap-4 p-4 flex-wrap">
            {/* Page-by-page left */}
            <ChevronLeft
                className="cursor-pointer"
                onClick={() => {
                    if (setCurrentPage && safeCurrent > 0) {
                        setCurrentPage(safeCurrent - 1);
                    }
                }}
                data-testid="prev-page"
            />

            {/* Batch left arrow */}
            {batchStart > 0 && (
                <button
                    className="px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => goToBatch('prev')}
                    data-testid="prev-batch"
                >
                    &laquo;
                </button>
            )}

            {/* Page numbers for current batch */}
            {Array.from({length: batchEnd - batchStart}, (_, index) => {
                const pageIndex = batchStart + index;
                return (
                    <div
                        onClick={() => setCurrentPage?.(pageIndex)}
                        key={pageIndex}
                        className="mx-1 min-w-10"
                        data-testid={`page-${pageIndex}`}
                    >
                        <span className={
                            (safeCurrent === pageIndex
                                ? ' dark:bg-gray-700 bg-gray-200 rounded-full '
                                : ' ') +
                            ' cursor-pointer px-2 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-full transition-colors'
                        }>
            {pageIndex + 1}
                        </span>
                    </div>
                );
            })}

            {/* Batch right arrow */}
            {batchEnd < safeTotal && (
                <button
                    className="px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => goToBatch('next')}
                    data-testid="next-batch"
                >
                    &raquo;
                </button>
            )}

            {/* Page-by-page right */}
            <ChevronRight
                className="cursor-pointer"
                onClick={() => {
                    if (setCurrentPage && safeCurrent < safeTotal - 1) {
                        setCurrentPage(safeCurrent + 1);
                    }
                }}
                data-testid="next-page"
            />
        </div>
    );
}
