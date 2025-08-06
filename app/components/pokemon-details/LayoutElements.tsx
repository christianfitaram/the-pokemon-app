interface SubContainerProps {
    children: React.ReactNode;
  }
  
export const SubContainer: React.FC<SubContainerProps> = ({ children }) => {
    return(
        <div className="w-full max-w-6xl px-4 flex flex-col items-center justify-center">
            <div className="flex flex-col gap-10 justify-center items-center">
                {children}
            </div>
        </div>
    )
}

export const PokemonDetailsSkeleton: React.FC = () => {
    return (
      <div className="flex flex-col items-center space-y-6 min-h-screen animate-pulse py-6">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-6xl w-full px-4">
          {/* Image Placeholder */}
          <div className="w-64 h-64 bg-gray-700 rounded-xl" />
  
          {/* Info Placeholder */}
          <div className="flex flex-col flex-1  background-muted w-fit p-8 rounded-3xl gap-4">
            <div className="flex flex-row w-full items-center justify-between">
              <div className="w-10 h-10 bg-gray-600 rounded-full" />
              <div className="w-10 h-10 bg-gray-600 rounded-full" />
            </div>
  
            <div className="h-6 w-1/3 bg-gray-600 rounded" />
  
            <div className="grid grid-cols-1 w-1/3 gap-2 mt-2">
              <div className="h-10 bg-gray-700 rounded" />
              <div className="h-10 bg-gray-700 rounded" />
            </div>
  
            <div className="h-4 w-1/4 bg-gray-700 rounded" />
  
            <div className="h-4 w-1/4 bg-gray-700 rounded mt-4" />
  
            <div className="flex flex-row gap-2 mt-2">
              <div className="w-16 h-10 bg-gray-700 rounded-full" />
              <div className="w-16 h-10 bg-gray-700 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          {Array(3)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center justify-center text-center 
      w-full h-full p-6 rounded-tr-3xl rounded-bl-3xl shadow 
      background-muted overflow-hidden animate-pulse"
              >
                <div className="absolute left-0 top-0 w-full h-1/4 bg-gradient-to-l from-gray-700 to-gray-900 opacity-40 rounded-tr-3xl rounded-bl-3xl"></div>
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
        </div>
      </div>
    );
  };
  