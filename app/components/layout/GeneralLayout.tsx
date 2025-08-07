import {ChildrenAsProp} from "@/types/interfaces";

export const MainLayout: React.FC<ChildrenAsProp> = ({ children }) => {
  return <div className="flex flex-col min-h-[80vh] py-6">{children}</div>;
};



export const SubContainer: React.FC<ChildrenAsProp> = ({children}) => {
    return (
        <div className="w-full max-w-6xl px-4 flex flex-col items-center justify-center space-y-6 py-6 gap-6">
            <div className="flex flex-col gap-8 ">
                {children}
            </div>
        </div>
    );
}

export const PokemonCardWrapper: React.FC<ChildrenAsProp> = ({children,numOfEvolutions}) => {
    return (
        <div className={`${(numOfEvolutions != null && numOfEvolutions <= 3) ? ('min-w-62') : ('w-fit')}`}>
            {children}
        </div>
    )
}

export const Title: React.FC<ChildrenAsProp> = ({children}) => {
    return(
        <div>
            <h5
                className={`mb-2 text-2xl font-bold tracking-tight  text-white flex flex-row justify-center w-60`}
            >
                {children}
            </h5>
        </div>
    )
}
