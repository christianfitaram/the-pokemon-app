import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaClipboardCheck } from "react-icons/fa";
import {SelectedTypesProps} from "@/types/interfaces";

export const SelectedTypes: React.FC<SelectedTypesProps> = ({
    selectedTypes,
    removeType,
}) => {
    if (selectedTypes.length === 0) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                    height: { duration: 0.4 },
                }}
                className="flex flex-col items-center my-8 gap-4 overflow-hidden"
            >
                <div className="flex flex-wrap justify-center gap-2">
                    {selectedTypes.map((type, index) => (
                        <motion.span
                            key={type}
                            initial={{ opacity: 0, scale: 0.8, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 20 }}
                            transition={{
                                duration: 0.2,
                                delay: index * 0.1,
                                ease: "easeOut",
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center"
                        >
                            {type}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeType(type)}
                                className="ml-2 text-white hover:text-red-900/50 transition-colors"
                            >
                                ✕
                            </motion.button>
                        </motion.span>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2"
                >
                    <Link
                        href={`/pokemon-type/${selectedTypes.join('/')}`}
                        className="text-blue-400 hover:text-blue-300 text-sm underline flex items-center gap-1"
                    >
                        <span><FaClipboardCheck className="size-5"/></span>
                        Share this type combination
                    </Link>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
