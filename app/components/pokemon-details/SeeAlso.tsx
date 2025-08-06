import { PokemonType } from "@/types/types";
import Link from "next/link";
import { FaHome, FaRandom,FaSearch } from "react-icons/fa";

interface EvolutionCardProps {
  types: PokemonType[];
}
export const SeeAlso: React.FC<EvolutionCardProps> = ({ types }) => {
  const mainType = types[0].type.name
  let url : string[] = []
  if(types){
  {types.map((item) => (
    url.push(item.type.name)
  ))}
}
const urlString = url.join('/')

return (
    <div className="flex gap-4 justify-center items-center w-full">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-start w-full">
        <div>
          <h5
            className={`mb-2 text-2xl font-bold tracking-tight  text-white flex flex-row justify-center`}
          >
            See Also:
          </h5>
        </div>
       <LinkCard url="/random-pokemon">
         <FaRandom className="h-5 w-5" />
         Random Pokemon
       </LinkCard>
       <LinkCard url={`/pokemon-type/${urlString}`}>
         <FaSearch className="h-5 w-5" />
         Similar Pokemon
       </LinkCard>
       <LinkCard url="/">
         <FaHome className="h-5 w-5" />
         Go Home
       </LinkCard>
       </div>
    </div>
  );
};
interface LinkCardProps {
  url: string;
  children: React.ReactNode;
}

export const LinkCard: React.FC<LinkCardProps> = ({ children, url }) => {
  return (
    <Link
      href={url}
      className="p-6 rounded-tr-3xl rounded-bl-3xl shadow flex flex-row gap-2 items-center justify-center
       background-muted border-gray-700 hover:bg-gray-600 
        background-muted bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 font-medium
        w-60 h-20 min-w-60 min-h-20 max-w-48 max-h-20" 
    >
      {children}
    </Link>
  );
};
