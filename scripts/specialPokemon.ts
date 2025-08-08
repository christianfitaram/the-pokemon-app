
const fs = require("fs");
const path = require("path");

// ✅ Use native fetch (Node 18+)
const SPRITE_DIR = path.join(__dirname, "../public/sprites/official-artwork");

const pokemons = [
    {
        "name": "deoxys-attack",
        "url": "https://pokeapi.co/api/v2/pokemon/10001/"
    },
    {
        "name": "deoxys-defense",
        "url": "https://pokeapi.co/api/v2/pokemon/10002/"
    },
    {
        "name": "deoxys-speed",
        "url": "https://pokeapi.co/api/v2/pokemon/10003/"
    },
    {
        "name": "wormadam-sandy",
        "url": "https://pokeapi.co/api/v2/pokemon/10004/"
    },
    {
        "name": "wormadam-trash",
        "url": "https://pokeapi.co/api/v2/pokemon/10005/"
    },
    {
        "name": "shaymin-sky",
        "url": "https://pokeapi.co/api/v2/pokemon/10006/"
    },
    {
        "name": "giratina-origin",
        "url": "https://pokeapi.co/api/v2/pokemon/10007/"
    },
    {
        "name": "rotom-heat",
        "url": "https://pokeapi.co/api/v2/pokemon/10008/"
    },
    {
        "name": "rotom-wash",
        "url": "https://pokeapi.co/api/v2/pokemon/10009/"
    },
    {
        "name": "rotom-frost",
        "url": "https://pokeapi.co/api/v2/pokemon/10010/"
    },
    {
        "name": "rotom-fan",
        "url": "https://pokeapi.co/api/v2/pokemon/10011/"
    },
    {
        "name": "rotom-mow",
        "url": "https://pokeapi.co/api/v2/pokemon/10012/"
    },
    {
        "name": "castform-sunny",
        "url": "https://pokeapi.co/api/v2/pokemon/10013/"
    },
    {
        "name": "castform-rainy",
        "url": "https://pokeapi.co/api/v2/pokemon/10014/"
    },
    {
        "name": "castform-snowy",
        "url": "https://pokeapi.co/api/v2/pokemon/10015/"
    },
    {
        "name": "basculin-blue-striped",
        "url": "https://pokeapi.co/api/v2/pokemon/10016/"
    },
    {
        "name": "darmanitan-zen",
        "url": "https://pokeapi.co/api/v2/pokemon/10017/"
    },
    {
        "name": "meloetta-pirouette",
        "url": "https://pokeapi.co/api/v2/pokemon/10018/"
    },
    {
        "name": "tornadus-therian",
        "url": "https://pokeapi.co/api/v2/pokemon/10019/"
    },
    {
        "name": "thundurus-therian",
        "url": "https://pokeapi.co/api/v2/pokemon/10020/"
    },
    {
        "name": "landorus-therian",
        "url": "https://pokeapi.co/api/v2/pokemon/10021/"
    },
    {
        "name": "kyurem-black",
        "url": "https://pokeapi.co/api/v2/pokemon/10022/"
    },
    {
        "name": "kyurem-white",
        "url": "https://pokeapi.co/api/v2/pokemon/10023/"
    },
    {
        "name": "keldeo-resolute",
        "url": "https://pokeapi.co/api/v2/pokemon/10024/"
    },
    {
        "name": "meowstic-female",
        "url": "https://pokeapi.co/api/v2/pokemon/10025/"
    },
    {
        "name": "aegislash-blade",
        "url": "https://pokeapi.co/api/v2/pokemon/10026/"
    },
    {
        "name": "pumpkaboo-small",
        "url": "https://pokeapi.co/api/v2/pokemon/10027/"
    },
    {
        "name": "pumpkaboo-large",
        "url": "https://pokeapi.co/api/v2/pokemon/10028/"
    },
    {
        "name": "pumpkaboo-super",
        "url": "https://pokeapi.co/api/v2/pokemon/10029/"
    },
    {
        "name": "gourgeist-small",
        "url": "https://pokeapi.co/api/v2/pokemon/10030/"
    },
    {
        "name": "gourgeist-large",
        "url": "https://pokeapi.co/api/v2/pokemon/10031/"
    },
    {
        "name": "gourgeist-super",
        "url": "https://pokeapi.co/api/v2/pokemon/10032/"
    },
    {
        "name": "venusaur-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10033/"
    },
    {
        "name": "charizard-mega-x",
        "url": "https://pokeapi.co/api/v2/pokemon/10034/"
    },
    {
        "name": "charizard-mega-y",
        "url": "https://pokeapi.co/api/v2/pokemon/10035/"
    },
    {
        "name": "blastoise-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10036/"
    },
    {
        "name": "alakazam-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10037/"
    },
    {
        "name": "gengar-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10038/"
    },
    {
        "name": "kangaskhan-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10039/"
    },
    {
        "name": "pinsir-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10040/"
    },
    {
        "name": "gyarados-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10041/"
    },
    {
        "name": "aerodactyl-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10042/"
    },
    {
        "name": "mewtwo-mega-x",
        "url": "https://pokeapi.co/api/v2/pokemon/10043/"
    },
    {
        "name": "mewtwo-mega-y",
        "url": "https://pokeapi.co/api/v2/pokemon/10044/"
    },
    {
        "name": "ampharos-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10045/"
    },
    {
        "name": "scizor-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10046/"
    },
    {
        "name": "heracross-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10047/"
    },
    {
        "name": "houndoom-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10048/"
    },
    {
        "name": "tyranitar-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10049/"
    },
    {
        "name": "blaziken-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10050/"
    },
    {
        "name": "gardevoir-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10051/"
    },
    {
        "name": "mawile-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10052/"
    },
    {
        "name": "aggron-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10053/"
    },
    {
        "name": "medicham-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10054/"
    },
    {
        "name": "manectric-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10055/"
    },
    {
        "name": "banette-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10056/"
    },
    {
        "name": "absol-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10057/"
    },
    {
        "name": "garchomp-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10058/"
    },
    {
        "name": "lucario-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10059/"
    },
    {
        "name": "abomasnow-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10060/"
    },
    {
        "name": "floette-eternal",
        "url": "https://pokeapi.co/api/v2/pokemon/10061/"
    },
    {
        "name": "latias-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10062/"
    },
    {
        "name": "latios-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10063/"
    },
    {
        "name": "swampert-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10064/"
    },
    {
        "name": "sceptile-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10065/"
    },
    {
        "name": "sableye-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10066/"
    },
    {
        "name": "altaria-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10067/"
    },
    {
        "name": "gallade-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10068/"
    },
    {
        "name": "audino-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10069/"
    },
    {
        "name": "sharpedo-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10070/"
    },
    {
        "name": "slowbro-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10071/"
    },
    {
        "name": "steelix-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10072/"
    },
    {
        "name": "pidgeot-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10073/"
    },
    {
        "name": "glalie-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10074/"
    },
    {
        "name": "diancie-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10075/"
    },
    {
        "name": "metagross-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10076/"
    },
    {
        "name": "kyogre-primal",
        "url": "https://pokeapi.co/api/v2/pokemon/10077/"
    },
    {
        "name": "groudon-primal",
        "url": "https://pokeapi.co/api/v2/pokemon/10078/"
    },
    {
        "name": "rayquaza-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10079/"
    },
    {
        "name": "pikachu-rock-star",
        "url": "https://pokeapi.co/api/v2/pokemon/10080/"
    },
    {
        "name": "pikachu-belle",
        "url": "https://pokeapi.co/api/v2/pokemon/10081/"
    },
    {
        "name": "pikachu-pop-star",
        "url": "https://pokeapi.co/api/v2/pokemon/10082/"
    },
    {
        "name": "pikachu-phd",
        "url": "https://pokeapi.co/api/v2/pokemon/10083/"
    },
    {
        "name": "pikachu-libre",
        "url": "https://pokeapi.co/api/v2/pokemon/10084/"
    },
    {
        "name": "pikachu-cosplay",
        "url": "https://pokeapi.co/api/v2/pokemon/10085/"
    },
    {
        "name": "hoopa-unbound",
        "url": "https://pokeapi.co/api/v2/pokemon/10086/"
    },
    {
        "name": "camerupt-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10087/"
    },
    {
        "name": "lopunny-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10088/"
    },
    {
        "name": "salamence-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10089/"
    },
    {
        "name": "beedrill-mega",
        "url": "https://pokeapi.co/api/v2/pokemon/10090/"
    },
    {
        "name": "rattata-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10091/"
    },
    {
        "name": "raticate-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10092/"
    },
    {
        "name": "raticate-totem-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10093/"
    },
    {
        "name": "pikachu-original-cap",
        "url": "https://pokeapi.co/api/v2/pokemon/10094/"
    },
    {
        "name": "pikachu-hoenn-cap",
        "url": "https://pokeapi.co/api/v2/pokemon/10095/"
    },
    {
        "name": "pikachu-sinnoh-cap",
        "url": "https://pokeapi.co/api/v2/pokemon/10096/"
    },
    {
        "name": "pikachu-unova-cap",
        "url": "https://pokeapi.co/api/v2/pokemon/10097/"
    },
    {
        "name": "pikachu-kalos-cap",
        "url": "https://pokeapi.co/api/v2/pokemon/10098/"
    },
    {
        "name": "pikachu-alola-cap",
        "url": "https://pokeapi.co/api/v2/pokemon/10099/"
    },
    {
        "name": "raichu-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10100/"
    },
    {
        "name": "sandshrew-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10101/"
    },
    {
        "name": "sandslash-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10102/"
    },
    {
        "name": "vulpix-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10103/"
    },
    {
        "name": "ninetales-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10104/"
    },
    {
        "name": "diglett-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10105/"
    },
    {
        "name": "dugtrio-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10106/"
    },
    {
        "name": "meowth-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10107/"
    },
    {
        "name": "persian-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10108/"
    },
    {
        "name": "geodude-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10109/"
    },
    {
        "name": "graveler-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10110/"
    },
    {
        "name": "golem-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10111/"
    },
    {
        "name": "grimer-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10112/"
    },
    {
        "name": "muk-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10113/"
    },
    {
        "name": "exeggutor-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10114/"
    },
    {
        "name": "marowak-alola",
        "url": "https://pokeapi.co/api/v2/pokemon/10115/"
    },
    {
        "name": "greninja-battle-bond",
        "url": "https://pokeapi.co/api/v2/pokemon/10116/"
    },
    {
        "name": "greninja-ash",
        "url": "https://pokeapi.co/api/v2/pokemon/10117/"
    },
    {
        "name": "zygarde-10-power-construct",
        "url": "https://pokeapi.co/api/v2/pokemon/10118/"
    },
    {
        "name": "zygarde-50-power-construct",
        "url": "https://pokeapi.co/api/v2/pokemon/10119/"
    },
    {
        "name": "zygarde-complete",
        "url": "https://pokeapi.co/api/v2/pokemon/10120/"
    },
    {
        "name": "gumshoos-totem",
        "url": "https://pokeapi.co/api/v2/pokemon/10121/"
    },
    {
        "name": "vikavolt-totem",
        "url": "https://pokeapi.co/api/v2/pokemon/10122/"
    },
    {
        "name": "oricorio-pom-pom",
        "url": "https://pokeapi.co/api/v2/pokemon/10123/"
    },
    {
        "name": "oricorio-pau",
        "url": "https://pokeapi.co/api/v2/pokemon/10124/"
    },
    {
        "name": "oricorio-sensu",
        "url": "https://pokeapi.co/api/v2/pokemon/10125/"
    },
    {
        "name": "lycanroc-midnight",
        "url": "https://pokeapi.co/api/v2/pokemon/10126/"
    },
    {
        "name": "wishiwashi-school",
        "url": "https://pokeapi.co/api/v2/pokemon/10127/"
    },
    {
        "name": "lurantis-totem",
        "url": "https://pokeapi.co/api/v2/pokemon/10128/"
    },
    {
        "name": "salazzle-totem",
        "url": "https://pokeapi.co/api/v2/pokemon/10129/"
    },
    {
        "name": "minior-orange-meteor",
        "url": "https://pokeapi.co/api/v2/pokemon/10130/"
    },
    {
        "name": "minior-yellow-meteor",
        "url": "https://pokeapi.co/api/v2/pokemon/10131/"
    },
    {
        "name": "minior-green-meteor",
        "url": "https://pokeapi.co/api/v2/pokemon/10132/"
    },
    {
        "name": "minior-blue-meteor",
        "url": "https://pokeapi.co/api/v2/pokemon/10133/"
    },
    {
        "name": "minior-indigo-meteor",
        "url": "https://pokeapi.co/api/v2/pokemon/10134/"
    },
    {
        "name": "minior-violet-meteor",
        "url": "https://pokeapi.co/api/v2/pokemon/10135/"
    },
    {
        "name": "minior-red",
        "url": "https://pokeapi.co/api/v2/pokemon/10136/"
    },
    {
        "name": "minior-orange",
        "url": "https://pokeapi.co/api/v2/pokemon/10137/"
    },
    {
        "name": "minior-yellow",
        "url": "https://pokeapi.co/api/v2/pokemon/10138/"
    },
    {
        "name": "minior-green",
        "url": "https://pokeapi.co/api/v2/pokemon/10139/"
    },
    {
        "name": "minior-blue",
        "url": "https://pokeapi.co/api/v2/pokemon/10140/"
    },
    {
        "name": "minior-indigo",
        "url": "https://pokeapi.co/api/v2/pokemon/10141/"
    },
    {
        "name": "minior-violet",
        "url": "https://pokeapi.co/api/v2/pokemon/10142/"
    },
    {
        "name": "mimikyu-busted",
        "url": "https://pokeapi.co/api/v2/pokemon/10143/"
    },
    {
        "name": "mimikyu-totem-disguised",
        "url": "https://pokeapi.co/api/v2/pokemon/10144/"
    },
    {
        "name": "mimikyu-totem-busted",
        "url": "https://pokeapi.co/api/v2/pokemon/10145/"
    },
    {
        "name": "kommo-o-totem",
        "url": "https://pokeapi.co/api/v2/pokemon/10146/"
    },
    {
        "name": "magearna-original",
        "url": "https://pokeapi.co/api/v2/pokemon/10147/"
    },
    {
        "name": "pikachu-partner-cap",
        "url": "https://pokeapi.co/api/v2/pokemon/10148/"
    },
    {
        "name": "marowak-totem",
        "url": "https://pokeapi.co/api/v2/pokemon/10149/"
    },
    {
        "name": "ribombee-totem",
        "url": "https://pokeapi.co/api/v2/pokemon/10150/"
    },
    {
        "name": "rockruff-own-tempo",
        "url": "https://pokeapi.co/api/v2/pokemon/10151/"
    },
    {
        "name": "lycanroc-dusk",
        "url": "https://pokeapi.co/api/v2/pokemon/10152/"
    },
    {
        "name": "araquanid-totem",
        "url": "https://pokeapi.co/api/v2/pokemon/10153/"
    },
    {
        "name": "togedemaru-totem",
        "url": "https://pokeapi.co/api/v2/pokemon/10154/"
    },
    {
        "name": "necrozma-dusk",
        "url": "https://pokeapi.co/api/v2/pokemon/10155/"
    },
    {
        "name": "necrozma-dawn",
        "url": "https://pokeapi.co/api/v2/pokemon/10156/"
    },
    {
        "name": "necrozma-ultra",
        "url": "https://pokeapi.co/api/v2/pokemon/10157/"
    },
    {
        "name": "pikachu-starter",
        "url": "https://pokeapi.co/api/v2/pokemon/10158/"
    },
    {
        "name": "eevee-starter",
        "url": "https://pokeapi.co/api/v2/pokemon/10159/"
    },
    {
        "name": "pikachu-world-cap",
        "url": "https://pokeapi.co/api/v2/pokemon/10160/"
    },
    {
        "name": "meowth-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10161/"
    },
    {
        "name": "ponyta-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10162/"
    },
    {
        "name": "rapidash-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10163/"
    },
    {
        "name": "slowpoke-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10164/"
    },
    {
        "name": "slowbro-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10165/"
    },
    {
        "name": "farfetchd-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10166/"
    },
    {
        "name": "weezing-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10167/"
    },
    {
        "name": "mr-mime-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10168/"
    },
    {
        "name": "articuno-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10169/"
    },
    {
        "name": "zapdos-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10170/"
    },
    {
        "name": "moltres-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10171/"
    },
    {
        "name": "slowking-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10172/"
    },
    {
        "name": "corsola-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10173/"
    },
    {
        "name": "zigzagoon-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10174/"
    },
    {
        "name": "linoone-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10175/"
    },
    {
        "name": "darumaka-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10176/"
    },
    {
        "name": "darmanitan-galar-standard",
        "url": "https://pokeapi.co/api/v2/pokemon/10177/"
    },
    {
        "name": "darmanitan-galar-zen",
        "url": "https://pokeapi.co/api/v2/pokemon/10178/"
    },
    {
        "name": "yamask-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10179/"
    },
    {
        "name": "stunfisk-galar",
        "url": "https://pokeapi.co/api/v2/pokemon/10180/"
    },
    {
        "name": "zygarde-10",
        "url": "https://pokeapi.co/api/v2/pokemon/10181/"
    },
    {
        "name": "cramorant-gulping",
        "url": "https://pokeapi.co/api/v2/pokemon/10182/"
    },
    {
        "name": "cramorant-gorging",
        "url": "https://pokeapi.co/api/v2/pokemon/10183/"
    },
    {
        "name": "toxtricity-low-key",
        "url": "https://pokeapi.co/api/v2/pokemon/10184/"
    },
    {
        "name": "eiscue-noice",
        "url": "https://pokeapi.co/api/v2/pokemon/10185/"
    },
    {
        "name": "indeedee-female",
        "url": "https://pokeapi.co/api/v2/pokemon/10186/"
    },
    {
        "name": "morpeko-hangry",
        "url": "https://pokeapi.co/api/v2/pokemon/10187/"
    },
    {
        "name": "zacian-crowned",
        "url": "https://pokeapi.co/api/v2/pokemon/10188/"
    },
    {
        "name": "zamazenta-crowned",
        "url": "https://pokeapi.co/api/v2/pokemon/10189/"
    },
    {
        "name": "eternatus-eternamax",
        "url": "https://pokeapi.co/api/v2/pokemon/10190/"
    },
    {
        "name": "urshifu-rapid-strike",
        "url": "https://pokeapi.co/api/v2/pokemon/10191/"
    },
    {
        "name": "zarude-dada",
        "url": "https://pokeapi.co/api/v2/pokemon/10192/"
    },
    {
        "name": "calyrex-ice",
        "url": "https://pokeapi.co/api/v2/pokemon/10193/"
    },
    {
        "name": "calyrex-shadow",
        "url": "https://pokeapi.co/api/v2/pokemon/10194/"
    },
    {
        "name": "venusaur-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10195/"
    },
    {
        "name": "charizard-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10196/"
    },
    {
        "name": "blastoise-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10197/"
    },
    {
        "name": "butterfree-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10198/"
    },
    {
        "name": "pikachu-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10199/"
    },
    {
        "name": "meowth-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10200/"
    },
    {
        "name": "machamp-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10201/"
    },
    {
        "name": "gengar-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10202/"
    },
    {
        "name": "kingler-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10203/"
    },
    {
        "name": "lapras-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10204/"
    },
    {
        "name": "eevee-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10205/"
    },
    {
        "name": "snorlax-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10206/"
    },
    {
        "name": "garbodor-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10207/"
    },
    {
        "name": "melmetal-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10208/"
    },
    {
        "name": "rillaboom-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10209/"
    },
    {
        "name": "cinderace-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10210/"
    },
    {
        "name": "inteleon-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10211/"
    },
    {
        "name": "corviknight-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10212/"
    },
    {
        "name": "orbeetle-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10213/"
    },
    {
        "name": "drednaw-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10214/"
    },
    {
        "name": "coalossal-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10215/"
    },
    {
        "name": "flapple-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10216/"
    },
    {
        "name": "appletun-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10217/"
    },
    {
        "name": "sandaconda-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10218/"
    },
    {
        "name": "toxtricity-amped-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10219/"
    },
    {
        "name": "centiskorch-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10220/"
    },
    {
        "name": "hatterene-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10221/"
    },
    {
        "name": "grimmsnarl-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10222/"
    },
    {
        "name": "alcremie-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10223/"
    },
    {
        "name": "copperajah-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10224/"
    },
    {
        "name": "duraludon-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10225/"
    },
    {
        "name": "urshifu-single-strike-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10226/"
    },
    {
        "name": "urshifu-rapid-strike-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10227/"
    },
    {
        "name": "toxtricity-low-key-gmax",
        "url": "https://pokeapi.co/api/v2/pokemon/10228/"
    },
    {
        "name": "growlithe-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10229/"
    },
    {
        "name": "arcanine-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10230/"
    },
    {
        "name": "voltorb-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10231/"
    },
    {
        "name": "electrode-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10232/"
    },
    {
        "name": "typhlosion-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10233/"
    },
    {
        "name": "qwilfish-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10234/"
    },
    {
        "name": "sneasel-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10235/"
    },
    {
        "name": "samurott-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10236/"
    },
    {
        "name": "lilligant-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10237/"
    },
    {
        "name": "zorua-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10238/"
    },
    {
        "name": "zoroark-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10239/"
    },
    {
        "name": "braviary-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10240/"
    },
    {
        "name": "sliggoo-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10241/"
    },
    {
        "name": "goodra-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10242/"
    },
    {
        "name": "avalugg-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10243/"
    },
    {
        "name": "decidueye-hisui",
        "url": "https://pokeapi.co/api/v2/pokemon/10244/"
    },
    {
        "name": "dialga-origin",
        "url": "https://pokeapi.co/api/v2/pokemon/10245/"
    },
    {
        "name": "palkia-origin",
        "url": "https://pokeapi.co/api/v2/pokemon/10246/"
    },
    {
        "name": "basculin-white-striped",
        "url": "https://pokeapi.co/api/v2/pokemon/10247/"
    },
    {
        "name": "basculegion-female",
        "url": "https://pokeapi.co/api/v2/pokemon/10248/"
    },
    {
        "name": "enamorus-therian",
        "url": "https://pokeapi.co/api/v2/pokemon/10249/"
    },
    {
        "name": "tauros-paldea-combat-breed",
        "url": "https://pokeapi.co/api/v2/pokemon/10250/"
    },
    {
        "name": "tauros-paldea-blaze-breed",
        "url": "https://pokeapi.co/api/v2/pokemon/10251/"
    },
    {
        "name": "tauros-paldea-aqua-breed",
        "url": "https://pokeapi.co/api/v2/pokemon/10252/"
    },
    {
        "name": "wooper-paldea",
        "url": "https://pokeapi.co/api/v2/pokemon/10253/"
    },
    {
        "name": "oinkologne-female",
        "url": "https://pokeapi.co/api/v2/pokemon/10254/"
    },
    {
        "name": "dudunsparce-three-segment",
        "url": "https://pokeapi.co/api/v2/pokemon/10255/"
    },
    {
        "name": "palafin-hero",
        "url": "https://pokeapi.co/api/v2/pokemon/10256/"
    },
    {
        "name": "maushold-family-of-three",
        "url": "https://pokeapi.co/api/v2/pokemon/10257/"
    },
    {
        "name": "tatsugiri-droopy",
        "url": "https://pokeapi.co/api/v2/pokemon/10258/"
    },
    {
        "name": "tatsugiri-stretchy",
        "url": "https://pokeapi.co/api/v2/pokemon/10259/"
    },
    {
        "name": "squawkabilly-blue-plumage",
        "url": "https://pokeapi.co/api/v2/pokemon/10260/"
    },
    {
        "name": "squawkabilly-yellow-plumage",
        "url": "https://pokeapi.co/api/v2/pokemon/10261/"
    },
    {
        "name": "squawkabilly-white-plumage",
        "url": "https://pokeapi.co/api/v2/pokemon/10262/"
    },
    {
        "name": "gimmighoul-roaming",
        "url": "https://pokeapi.co/api/v2/pokemon/10263/"
    },
    {
        "name": "koraidon-limited-build",
        "url": "https://pokeapi.co/api/v2/pokemon/10264/"
    },
    {
        "name": "koraidon-sprinting-build",
        "url": "https://pokeapi.co/api/v2/pokemon/10265/"
    },
    {
        "name": "koraidon-swimming-build",
        "url": "https://pokeapi.co/api/v2/pokemon/10266/"
    },
    {
        "name": "koraidon-gliding-build",
        "url": "https://pokeapi.co/api/v2/pokemon/10267/"
    },
    {
        "name": "miraidon-low-power-mode",
        "url": "https://pokeapi.co/api/v2/pokemon/10268/"
    },
    {
        "name": "miraidon-drive-mode",
        "url": "https://pokeapi.co/api/v2/pokemon/10269/"
    },
    {
        "name": "miraidon-aquatic-mode",
        "url": "https://pokeapi.co/api/v2/pokemon/10270/"
    },
    {
        "name": "miraidon-glide-mode",
        "url": "https://pokeapi.co/api/v2/pokemon/10271/"
    },
    {
        "name": "ursaluna-bloodmoon",
        "url": "https://pokeapi.co/api/v2/pokemon/10272/"
    },
    {
        "name": "ogerpon-wellspring-mask",
        "url": "https://pokeapi.co/api/v2/pokemon/10273/"
    },
    {
        "name": "ogerpon-hearthflame-mask",
        "url": "https://pokeapi.co/api/v2/pokemon/10274/"
    },
    {
        "name": "ogerpon-cornerstone-mask",
        "url": "https://pokeapi.co/api/v2/pokemon/10275/"
    },
    {
        "name": "terapagos-terastal",
        "url": "https://pokeapi.co/api/v2/pokemon/10276/"
    },
    {
        "name": "terapagos-stellar",
        "url": "https://pokeapi.co/api/v2/pokemon/10277/"
    }

]


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

function dowloadSpritesSpecials(){
    pokemons.map(async ({name, url}) => {
        const id = url.split('/')[6]
        await downloadImage(Number(id));
    })
}

dowloadSpritesSpecials()
