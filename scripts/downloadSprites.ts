// @ts-ignore
const fs = require("fs");
// @ts-ignore
const path = require("path");

// ✅ Use native fetch (Node 18+)
const SPRITE_DIR = path.join(__dirname, "../public/sprites/official-artwork");
const TOTAL_POKEMON = 1303;

async function downloadImage(id:number) {
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    const filePath = path.join(SPRITE_DIR, `${id}.png`);

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);

        const buffer = await res.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`✅ Downloaded ${id}.png`);
    } catch (error) {
        if (error instanceof Error) {
            console.warn(`❌ Failed for ${id}:`, error.message);
        } else {
            console.warn(`❌ Failed for ${id}:`, error);
        }
    }
}

async function downloadAll() {
    if (!fs.existsSync(SPRITE_DIR)) {
        fs.mkdirSync(SPRITE_DIR, { recursive: true });
    }

    for (let id = 1; id <= TOTAL_POKEMON; id++) {
        await downloadImage(id);
    }

    console.log("🎉 All sprites downloaded.");
}

downloadAll();
