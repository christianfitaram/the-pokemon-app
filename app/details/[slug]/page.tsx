import PokemonDetailsPage from "@/app/components/PokemonDetailsPage";

interface PageProps {
  params: { number: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  console.log(slug)

  return <PokemonDetailsPage number={slug} />;
}

// Tell Next.js to treat this as a dynamic route
export const dynamic = 'force-static';
export const dynamicParams = true;