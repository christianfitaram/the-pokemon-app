
// Add useRef to the imports at the top
import {useEffect, useState, useRef} from "react";

// ... other imports remain the same

const Search: React.FC<SearchProps> = ({
                                           // ... other props remain the same
                                       }) => {
    // ... other state declarations remain the same

    // Add refs for the dropdown and input
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Add useEffect for handling clicks outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // ... other code remains the same until the return statement

    return (
        <div className="background-muted bg-gray-400 flex flex-col items-center w-full mb-4 py-4 relative gap-4">
            {/* Search by Name */}
            <input
                ref={searchInputRef} // Add ref to input
                type="text"
                name="search"
                placeholder="Search Pokémon by name..."
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(
                        e.target.value.length > 0 && selectedTypes.length === 0
                    );
                    setHighlightedIndex(0);
                }}
                // ... rest of input props remain the same
            />

            {/* Dropdown menu for name matches */}
            <AnimatePresence>
                {showDropdown && filteredDropdown.length > 0 && (
                    <motion.ul
                        ref={dropdownRef} // Add ref to dropdown
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -10}}
                        transition={{duration: 0.2}}
                        className="absolute top-[92px] max-w-sm w-full bg-white rounded-md shadow-md z-10 border max-h-64 overflow-y-auto overscroll-contain"
                    >
                        {/* ... rest of dropdown content remains the same */}
                    </motion.ul>
                )}
            </AnimatePresence>

            {/* ... rest of the component remains the same */}
        </div>
    );
};
