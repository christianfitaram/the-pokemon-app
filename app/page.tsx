'use client';
import { useEffect, useState, useRef } from 'react';
import { Response, Pokemon} from '@/types/types';;
import Link from 'next/link';

const HomePage: React.FC = () => {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>('https://pokeapi.co/api/v2/pokemon/');
  const initialFetchDone = useRef<boolean>(false);

  const fetchPokemon = async (url: string) => {
    try {
      setLoading(true);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const data: Response = await res.json();
      setPokemonList(prevList => [...prevList, ...data.results]);
      setNextUrl(data.next);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

// This extra steps at useffect are added to make sure data isnt fetched twice in the first rendering

  useEffect(() => {
    if (initialFetchDone.current) return;  
    initialFetchDone.current = true;       
    fetchPokemon('https://pokeapi.co/api/v2/pokemon/');
  }, []); 


  const handleLoadMore = () => {
    if (nextUrl) {
      fetchPokemon(nextUrl);
    }
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <div className='flex flex-col items-center space-y-4 gradientTop'>
      <h1 className='max-w-sm'>This a list of amazing pokemons. Click to see details.  </h1>
      {pokemonList.map((pokemon, index) => ( 
        <Link href={`/details/${index+1}`} className="flex flex-col space-y-6 gradientTop w-full max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
        <div key={index}>
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {pokemon.name}
          </h5>
           Read more
        </div> </Link>
      ))}
      {loading && <div className="flex flex-col space-y-6 gradientTop w-full max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">Loading...</div>}
      <div className=''>
        {nextUrl && !loading && (
          <button type={'button'} onClick={handleLoadMore} className='w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center'>Load More</button>
        )}
        {!nextUrl && !loading && <div>No more Pokémon to load.</div>}
      </div>
    </div>
  );
};

export default HomePage;
