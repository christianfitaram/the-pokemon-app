import type { Metadata } from "next";
import TeamBuilderPage from "../../components/team-builder/TeamBuilderPage";

export const metadata: Metadata = {
    title: "Team Builder | The Pokemon App",
    description: "Build a six-Pokémon roster, inspect coverage, and keep a local draft ready to share.",
};

export default function Page() {
    return <TeamBuilderPage />;
}
