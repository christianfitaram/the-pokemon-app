import PokemonDetailsPage from "@/app/components/pokemon-details/PokemonDetailsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <PokemonDetailsPage number={slug} />;
}

// Tell Next.js to treat this as a dynamic route
export const dynamic = 'force-static';
export const dynamicParams = true;