import PokemonDetailsPage from "@/app/components/PokemonDetailsPage"; // renamed from page

export default function Page({ params }: { params: { number: string } }) {
  return <PokemonDetailsPage number={params.number} />;
}