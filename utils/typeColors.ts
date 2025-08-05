
// utils/typeColors.ts
export const typeColors: { [key: string]: string } = {
    electric: "#ca8a04",
    electricTW: "bg-yellow-600",
    electricCOLOR: "text-yellow-600",
  
    fire: "#f97316",
    fireTW: "bg-orange-400",
    fireCOLOR: "text-orange-400",
  
    water: "#22d3ee",
    waterTW: "bg-cyan-400",
    waterCOLOR: "text-cyan-400",
  
    grass: "#84cc16",
    grassTW: "bg-lime-400",
    grassCOLOR: "text-lime-400",
  
    psychic: "#a855f7",
    psychicTW: "bg-purple-500",
    psychicCOLOR: "text-purple-500",
  
    ice: "#7dd3fc",
    iceTW: "bg-blue-300",
    iceCOLOR: "text-blue-300",
  
    dragon: "#9333ea",
    dragonTW: "bg-purple-600",
    dragonCOLOR: "text-purple-600",
  
    dark: "#111827",
    darkTW: "bg-gray-900",
    darkCOLOR: "text-gray-900",
  
    fairy: "#f472b6",
    fairyTW: "bg-pink-400",
    fairyCOLOR: "text-pink-400",
  
    normal: "#d1d5db",
    normalTW: "bg-gray-300",
    normalCOLOR: "text-gray-300",
  
    fighting: "#ea580c",
    fightingTW: "bg-orange-700",
    fightingCOLOR: "text-orange-700",
  
    flying: "#bfdbfe",
    flyingTW: "bg-blue-200",
    flyingCOLOR: "text-blue-200",
  
    poison: "#7e22ce",
    poisonTW: "bg-purple-800",
    poisonCOLOR: "text-purple-800",
  
    ground: "#854d0e",
    groundTW: "bg-yellow-900",
    groundCOLOR: "text-yellow-900",
  
    rock: "#525252",
    rockTW: "bg-gray-600",
    rockCOLOR: "text-gray-600",
  
    bug: "#65a30d",
    bugTW: "bg-lime-600",
    bugCOLOR: "text-lime-600",
  
    ghost: "#1e40af",
    ghostTW: "bg-indigo-900",
    ghostCOLOR: "text-indigo-900",
  
    steel: "#9ca3af",
    steelTW: "bg-gray-400",
    steelCOLOR: "text-gray-400",
  };
  
// Mapping Pokémon types to gradient colors
export const  typeGradients: { [key: string]: string } = {
    fire: "from-orange-500 to-red-700",
    water: "from-blue-400 to-blue-800",
    grass: "from-green-400 to-green-700",
    electric: "from-yellow-400 to-yellow-700",
    psychic: "from-pink-400 to-purple-700",
    ice: "from-cyan-300 to-blue-500",
    dragon: "from-indigo-600 to-purple-900",
    dark: "from-gray-700 to-black",
    fairy: "from-pink-300 to-pink-600",
    normal: "from-gray-400 to-gray-600",
    rock: "from-yellow-600 to-gray-700",
    bug: "from-lime-400 to-green-600",
    ghost: "from-purple-600 to-indigo-900",
    steel: "from-gray-500 to-gray-900",
    ground: "from-yellow-700 to-brown-800",
    fighting: "from-red-600 to-red-900",
    poison: "from-purple-500 to-purple-800",
    flying: "from-blue-300 to-indigo-500",
  };
  
  export const typeAverageColor: { [key: string]: string } = {
    fire: "bg-orange-600",
    water: "bg-blue-600",
    grass: "bg-green-600",
    electric: "bg-yellow-600",
    psychic: "bg-fuchsia-600", // closest between pink and purple
    ice: "bg-cyan-400",         // middle between cyan-300 and blue-500
    dragon: "bg-purple-800",
    dark: "bg-gray-800",
    fairy: "bg-pink-500",
    normal: "bg-gray-500",
    rock: "bg-gray-600",
    bug: "bg-green-500",
    ghost: "bg-indigo-800",
    steel: "bg-gray-700",
    ground: "bg-amber-800",     // Tailwind has no "brown", closest is amber
    fighting: "bg-red-700",
    poison: "bg-purple-700",
    flying: "bg-indigo-400",
  };