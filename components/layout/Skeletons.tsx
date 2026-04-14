import {motion} from "framer-motion";

export function SkeletonPokemonList() {
    return (<div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4  max-w-screen-xl gap-8 place-items-stretch">
        {Array(20)
            .fill(null)
            .map((_, index) => (
                <div
                    key={index}
                    className="relative flex flex-col items-center justify-center text-center
  w-full h-full p-6 rounded-tr-3xl rounded-bl-3xl shadow
  background-muted overflow-hidden animate-pulse"
                >
                    <div
                        className="absolute left-0 top-0 w-full h-1/4 bg-gradient-to-l from-gray-700 to-gray-900 opacity-40 rounded-tr-3xl rounded-bl-3xl"></div>
                    <div className="absolute left-0 top-0 w-full h-full bg-black opacity-5 rounded-l-lg"></div>

                    <div className="flex flex-col items-center justify-center h-full relative z-10 gap-4">
                        <div className="w-40 h-40 bg-gray-700 rounded-xl"></div>

                        <div className="w-24 h-4 bg-gray-600 rounded"></div>

                        <div className="flex gap-2 flex-wrap justify-center">
                            <div className="w-16 h-4 bg-gray-700 rounded"></div>
                            <div className="w-14 h-4 bg-gray-700 rounded"></div>
                        </div>

                        <div className="w-28 h-4 bg-gray-800 rounded"></div>
                    </div>
                </div>
            ))}
    </div>)
}


export const PokemonDetailsSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col items-center space-y-6 min-h-[85vh] py-6 gap-6 mt-8">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-5xl w-full px-4 flex-1">
                {/* Image Placeholder */}
                <motion.div
                    initial={{opacity: 0.6}}
                    animate={{opacity: [0.6, 1, 0.6]}}
                    transition={{duration: 1.5, repeat: Infinity}}
                    className="w-1/2 h-64 bg-gray-700 rounded-xl"
                />

                {/* Info Placeholder */}
                <div className="flex flex-col flex-1 background-muted w-1/2 p-8 rounded-3xl gap-4">
                    <div className="flex flex-row w-full items-center justify-between gap-2">
                        <motion.div
                            initial={{opacity: 0.6}}
                            animate={{opacity: [0.6, 1, 0.6]}}
                            transition={{duration: 1.5, repeat: Infinity, delay: 0.1}}
                            className="w-40 h-10 bg-gray-600 rounded-full"
                        />
                        <motion.div
                            initial={{opacity: 0.6}}
                            animate={{opacity: [0.6, 1, 0.6]}}
                            transition={{duration: 1.5, repeat: Infinity, delay: 0.2}}
                            className="w-32 h-10 bg-gray-600 rounded-full"
                        />
                    </div>

                    <motion.div
                        initial={{opacity: 0.6}}
                        animate={{opacity: [0.6, 1, 0.6]}}
                        transition={{duration: 1.5, repeat: Infinity, delay: 0.3}}
                        className="h-10 w-1/3 bg-gray-600 rounded self-center"
                    />

                    <div className="grid grid-cols-1 w-1/3 gap-2 mt-2">
                        <motion.div
                            initial={{opacity: 0.6}}
                            animate={{opacity: [0.6, 1, 0.6]}}
                            transition={{duration: 1.5, repeat: Infinity, delay: 0.4}}
                            className="h-10 bg-gray-700 rounded"
                        />
                        <motion.div
                            initial={{opacity: 0.6}}
                            animate={{opacity: [0.6, 1, 0.6]}}
                            transition={{duration: 1.5, repeat: Infinity, delay: 0.5}}
                            className="h-10 bg-gray-700 rounded"
                        />
                    </div>

                    <motion.div
                        initial={{opacity: 0.6}}
                        animate={{opacity: [0.6, 1, 0.6]}}
                        transition={{duration: 1.5, repeat: Infinity, delay: 0.6}}
                        className="h-4 w-1/4 bg-gray-700 rounded"
                    />

                    <motion.div
                        initial={{opacity: 0.6}}
                        animate={{opacity: [0.6, 1, 0.6]}}
                        transition={{duration: 1.5, repeat: Infinity, delay: 0.7}}
                        className="h-4 w-1/4 bg-gray-700 rounded mt-4"
                    />

                    <div className="flex flex-row gap-2 mt-2">
                        <motion.div
                            initial={{opacity: 0.6}}
                            animate={{opacity: [0.6, 1, 0.6]}}
                            transition={{duration: 1.5, repeat: Infinity, delay: 0.8}}
                            className="w-16 h-10 bg-gray-700 rounded-full"
                        />
                        <motion.div
                            initial={{opacity: 0.6}}
                            animate={{opacity: [0.6, 1, 0.6]}}
                            transition={{duration: 1.5, repeat: Infinity, delay: 0.9}}
                            className="w-16 h-10 bg-gray-700 rounded-full"
                        />
                    </div>
                </div>
            </div>
            <EvolutionSkeleton/>
            <SeeAlsoSkeleton/>
        </div>
    );
};

export const EvolutionSkeleton: React.FC = () => {
    return (
        <div className="flex gap-4 justify-start items-start w-full animate-pulse">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-center w-full">
                {/* Heading Skeleton */}
                <div className="mb-2 w-48 h-6 bg-gray-700 rounded"/>

                {/* Simulated cards (3 placeholders) */}
                {[...Array(3)].map((_, index) => (
                    <motion.div
                        key={index}
                        className="w-40 h-48 bg-gray-800 rounded-xl flex flex-col items-center justify-center shadow-md"
                    >
                        <div className="w-24 h-24 bg-gray-600 rounded-full mb-4"/>
                        <div className="w-20 h-4 bg-gray-600 rounded"/>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export const SeeAlsoSkeleton: React.FC = () => {
    return (
        <div className="flex gap-4 justify-center items-center w-full">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-center w-full">
                {/* Title skeleton */}
                <div>
                    <motion.div
                        initial={{opacity: 0.6}}
                        animate={{opacity: [0.6, 1, 0.6]}}
                        transition={{duration: 1.5, repeat: Infinity}}
                        className="mb-2 h-8 w-32 bg-gray-600 rounded-lg"
                    />
                </div>

                {/* Link cards skeletons */}
                <LinkCardSkeleton/>
                <LinkCardSkeleton/>
                <LinkCardSkeleton/>
            </div>
        </div>
    );
};

const LinkCardSkeleton: React.FC = () => {
    return (
        <motion.div
            initial={{opacity: 0.6}}
            animate={{opacity: [0.6, 1, 0.6]}}
            transition={{duration: 1.5, repeat: Infinity, delay: 0.2}}
            className="p-6 rounded-tr-3xl rounded-bl-3xl shadow flex flex-row gap-2 items-center justify-center background-muted border border-gray-600 min-w-48 max-w-60 h-20"

        >
            {/* Icon skeleton */}
            <div className="h-5 w-5 bg-gray-500 rounded"/>

            {/* Text skeleton */}
            <div className="h-4 w-24 bg-gray-500 rounded"/>
        </motion.div>
    );
};
