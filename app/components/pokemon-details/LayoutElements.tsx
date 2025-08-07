import { motion } from "framer-motion";

interface SubContainerProps {
  children: React.ReactNode;
}

export const SubContainer: React.FC<SubContainerProps> = ({ children }) => {
  return (
    <div className="w-full max-w-6xl px-4 flex flex-col items-center justify-center">
      <div className="flex flex-col gap-10 justify-center items-center">
        {children}
      </div>
    </div>
  );
};

export const PokemonDetailsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center space-y-6 min-h-[85vh] py-6 gap-6">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-5xl w-full px-4">
        {/* Image Placeholder */}
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-1/2 h-64 bg-gray-700 rounded-xl"
        />

        {/* Info Placeholder */}
        <div className="flex flex-col flex-1 background-muted w-1/2 p-8 rounded-3xl gap-4">
          <div className="flex flex-row w-full items-center justify-between gap-2">
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
              className="w-40 h-10 bg-gray-600 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-32 h-10 bg-gray-600 rounded-full"
            />
          </div>

          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            className="h-10 w-1/3 bg-gray-600 rounded self-center"
          />

          <div className="grid grid-cols-1 w-1/3 gap-2 mt-2">
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="h-10 bg-gray-700 rounded"
            />
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="h-10 bg-gray-700 rounded"
            />
          </div>

          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            className="h-4 w-1/4 bg-gray-700 rounded"
          />

          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
            className="h-4 w-1/4 bg-gray-700 rounded mt-4"
          />

          <div className="flex flex-row gap-2 mt-2">
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
              className="w-16 h-10 bg-gray-700 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
              className="w-16 h-10 bg-gray-700 rounded-full"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mb-2 h-8 w-32 bg-gray-600 rounded-lg"
          />
        </div>
        {Array(3)
          .fill(null)
          .map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.1,
              }}
              className="relative flex flex-col items-center justify-center text-center 
      h-full p-6 rounded-tr-3xl rounded-bl-3xl shadow 
      background-muted overflow-hidden border border-gray-600 w-60 max-w-60"
            >
              <div className="absolute left-0 top-0 w-full h-1/4 bg-gradient-to-l from-gray-700 to-gray-900 opacity-40 rounded-tr-3xl rounded-bl-3xl"></div>
              <div className="absolute left-0 top-0 w-full h-full bg-black opacity-5 rounded-l-lg"></div>

              <div className="flex flex-col items-center justify-center h-full relative z-10 gap-4">
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-40 h-40 bg-gray-700 rounded-xl"
                />

                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  className="w-24 h-4 bg-gray-600 rounded"
                />

                <div className="flex gap-2 flex-wrap justify-center">
                  <motion.div
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-16 h-4 bg-gray-700 rounded"
                  />
                  <motion.div
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    className="w-14 h-4 bg-gray-700 rounded"
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                  className="w-28 h-4 bg-gray-800 rounded"
                />
              </div>
            </motion.div>
          ))}
      </div>
      <SeeAlsoSkeleton />
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
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mb-2 h-8 w-32 bg-gray-600 rounded-lg"
          />
        </div>

        {/* Link cards skeletons */}
        <LinkCardSkeleton />
        <LinkCardSkeleton />
        <LinkCardSkeleton />
      </div>
    </div>
  );
};

const LinkCardSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      className="p-6 rounded-tr-3xl rounded-bl-3xl shadow flex flex-row gap-2 items-center justify-center
          background-muted border border-gray-600
          w-60 h-20 min-w-60 min-h-20 max-w-48 max-h-20"
    >
      {/* Icon skeleton */}
      <div className="h-5 w-5 bg-gray-500 rounded" />

      {/* Text skeleton */}
      <div className="h-4 w-24 bg-gray-500 rounded" />
    </motion.div>
  );
};
