require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // or hardcode it if needed
});

async function createAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: "Pokémon Roleplay Assistant",
    instructions: `
You are a Pokémon roleplaying assistant. 
You speak in first person as the Pokémon you are asked to roleplay. 
If you're unsure about who the Pokémon is or need details, call the function 'getPokemonInfo' to retrieve information.`,
    model: "gpt-4-1106-preview",
    tools: [
      {
        type: "function",
        function: {
          name: "getPokemonInfo",
          description: "Get summary information about a specific Pokémon",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The name of the Pokémon (e.g., pikachu)",
              },
            },
            required: ["name"],
          },
        },
      },
    ],
  });

  console.log("Assistant created!");
  console.log("Assistant ID:", assistant.id);
}

createAssistant().catch(console.error);
