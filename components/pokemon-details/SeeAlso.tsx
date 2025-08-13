import {EvolutionCardProps, LinkCardProps, PokemonType} from "@/types/interfaces";
import Link from "next/link";
import {FaHome, FaRandom, FaSearch} from "react-icons/fa";
import {Title} from "@/components/layout/GeneralLayout";


export const SeeAlso: React.FC<EvolutionCardProps> = ({types}) => {
    let url: string[] = []
    if (types) {
        {
            types.map((item) => (
                url.push(item.type.name)
            ))
        }
    }
    const urlString = url.join('/')
    return (
        <div className="flex flex-col lg:flex-row gap-4">
            <Title>
                See Also:
            </Title>
            <LinkCard url="/random-pokemon">
                <FaRandom className="h-5 w-5"/>
                Random Pokemon
            </LinkCard>
            <LinkCard url={`/pokemon-type/${urlString}`}>
                <FaSearch className="h-5 w-5"/>
                Similar Pokemon
            </LinkCard>
            <LinkCard url="/">
                <FaHome className="h-5 w-5"/>
                Go Home
            </LinkCard>
        </div>

    );
};

export const LinkCard: React.FC<LinkCardProps> = ({children, url}) => {
    return (
        <Link
            href={url}
            className="p-6 rounded-tr-3xl rounded-bl-3xl shadow flex flex-row gap-2 items-center justify-center background-muted border border-gray-600 min-w-62 max-w-62 h-20  hover:bg-gray-600 -hidden transition-transform duration-300 ease-in-out hover:scale-105">
            {children}
        </Link>
    );
};
