import { redirect } from "next/navigation";
import HomePage from "@/components/home/HomePage";

function toZeroBasedPage(pageSegment: string): number | null {
    const parsed = Number(pageSegment);
    if (!Number.isInteger(parsed) || parsed < 1) return null;
    return parsed - 1;
}

export default async function Page({
    params,
}: {
    params: Promise<{ page: string }>;
}) {
    const { page } = await params;
    const zeroBasedPage = toZeroBasedPage(page);

    if (zeroBasedPage === null) {
        redirect("/pokedex/1");
    }

    return <HomePage currentPage={zeroBasedPage} />;
}
