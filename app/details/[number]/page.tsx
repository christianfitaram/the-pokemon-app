"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PokemonDetails } from '@/types/types';

interface PageProps {
  params: {
    number: string;
  };
}

const PokemonDetailsPage: React.FC<PageProps> = ({ params }) => {
  const { number } = params; 
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!number) return;

    const fetchPokemonDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${number}`);
        if (!res.ok) {
          throw new Error('Failed to fetch Pokémon details');
        }
        const data = await res.json();
        setPokemon(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemonDetails();
  }, [number]); 

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className='flex flex-col items-center space-y-6 gradientTop'>
      {pokemon ? (
        <div className="flex flex-col space-y-6 gradientTop w-full max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {pokemon.name}
          </h5>
          <p>Imagen 1:</p>
          <img src={pokemon.sprites.other['official-artwork'].front_default} alt={pokemon.name} />
          <p>Imagen 2:</p>
          <img src={pokemon.sprites.other['official-artwork'].front_shiny} alt={pokemon.name} />
          <p>Height: {pokemon.height}</p>
          <p>Weight: {pokemon.weight}</p>
          <p>Base experience: {pokemon.base_experience}</p>
          <p>Types: {pokemon.types.map(type => type.type.name).join(', ')}</p>
          <button onClick={() => router.push('/')} className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">
            Back to Home
          </button>
        </div>
      ) : (
        <div>Pokémon not found.</div>
      )}
    </div>
  )
}

export default PokemonDetailsPage;