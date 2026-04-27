export const EQUIPOS = [
  { id: 0, nombre: "Láminas Especiales", grupo: "FWC", esEspecial: true },
  { id: 1, nombre: "Mexico", grupo: "A" },
  { id: 2, nombre: "Sudafrica", grupo: "A" },
  { id: 3, nombre: "Corea del Sur", grupo: "A" },
  { id: 4, nombre: "Republica Checa", grupo: "A" },
  { id: 5, nombre: "Canada", grupo: "B" },
  { id: 6, nombre: "Bosnia y Herzegovina", grupo: "B" },
  { id: 7, nombre: "Qatar", grupo: "B" },
  { id: 8, nombre: "Suiza", grupo: "B" },
  { id: 9, nombre: "Brasil", grupo: "C" },
  { id: 10, nombre: "Marruecos", grupo: "C" },
  { id: 11, nombre: "Haiti", grupo: "C" },
  { id: 12, nombre: "Escocia", grupo: "C" },
  { id: 13, nombre: "Estados Unidos", grupo: "D" },
  { id: 14, nombre: "Paraguay", grupo: "D" },
  { id: 15, nombre: "Australia", grupo: "D" },
  { id: 16, nombre: "Turquia", grupo: "D" },
  { id: 17, nombre: "Alemania", grupo: "E" },
  { id: 18, nombre: "Curazao", grupo: "E" },
  { id: 19, nombre: "Costa de Marfil", grupo: "E" },
  { id: 20, nombre: "Ecuador", grupo: "E" },
  { id: 21, nombre: "Paises Bajos", grupo: "F" },
  { id: 22, nombre: "Japon", grupo: "F" },
  { id: 23, nombre: "Suecia", grupo: "F" },
  { id: 24, nombre: "Tunez", grupo: "F" },
  { id: 25, nombre: "Belgica", grupo: "G" },
  { id: 26, nombre: "Egipto", grupo: "G" },
  { id: 27, nombre: "Iran", grupo: "G" },
  { id: 28, nombre: "Nueva Zelanda", grupo: "G" },
  { id: 29, nombre: "Espana", grupo: "H" },
  { id: 30, nombre: "Cabo Verde", grupo: "H" },
  { id: 31, nombre: "Arabia Saudita", grupo: "H" },
  { id: 32, nombre: "Uruguay", grupo: "H" },
  { id: 33, nombre: "Francia", grupo: "I" },
  { id: 34, nombre: "Senegal", grupo: "I" },
  { id: 35, nombre: "Irak", grupo: "I" },
  { id: 36, nombre: "Noruega", grupo: "I" },
  { id: 37, nombre: "Argentina", grupo: "J" },
  { id: 38, nombre: "Argelia", grupo: "J" },
  { id: 39, nombre: "Austria", grupo: "J" },
  { id: 40, nombre: "Jordania", grupo: "J" },
  { id: 41, nombre: "Portugal", grupo: "K" },
  { id: 42, nombre: "R.D. del Congo", grupo: "K" },
  { id: 43, nombre: "Uzbekistan", grupo: "K" },
  { id: 44, nombre: "Colombia", grupo: "K" },
  { id: 45, nombre: "Inglaterra", grupo: "L" },
  { id: 46, nombre: "Croacia", grupo: "L" },
  { id: 47, nombre: "Ghana", grupo: "L" },
  { id: 48, nombre: "Panama", grupo: "L" },
  { id: 49, nombre: "FIFA World Cup History", grupo: "FWC", esEspecial: true }
];

// Laminas especiales al inicio del album
const LAMINAS_ESPECIALES_INICIO = [
  "00 - Logo Panini",
  "FWC 1 - Logo Mundial - Parte Superior",
  "FWC 2 - Logo Mundial - Parte Inferior",
  "FWC 3 - Official Mascots",
  "FWC 4 - Official Slogan",
  "FWC 5 - Official Ball",
  "FWC 6 - Canadá - Host Country Emblem",
  "FWC 7 - México - Host Country Emblem",
  "FWC 8 - USA - Host Country Emblem"
];

// Laminas especiales de historia al final del album
const LAMINAS_HISTORIA = [
  "FWC 9 - Italia - Mundial Italia 1934",
  "FWC 10 - Uruguay - Mundial Brasil 1950",
  "FWC 11 - Alemania - Mundial Suiza 1954",
  "FWC 12 - Brasil - Mundial Chile 1962",
  "FWC 13 - Alemania - Mundial Alemania 1974",
  "FWC 14 - Argentina - Mundial México 1986",
  "FWC 15 - Brasil - Mundial USA 1994",
  "FWC 16 - Brasil - Mundial Corea - Japón 2002",
  "FWC 17 - Italia - Mundial Alemania 2006",
  "FWC 18 - Alemania - Mundial Brasil 2014",
  "FWC 19 - Argentina - Mundial Catar 2022"
];

export function getTeamStickers(teamName) {
  if (teamName === "Láminas Especiales") {
    return LAMINAS_ESPECIALES_INICIO;
  }
  
  if (teamName === "FIFA World Cup History") {
    return LAMINAS_HISTORIA;
  }

  return [
    `Escudo ${teamName}`,
    "Equipo Completo",
    "Jugador 1",
    "Jugador 2",
    "Jugador 3",
    "Jugador 4",
    "Jugador 5",
    "Jugador 6",
    "Jugador 7",
    "Jugador 8",
    "Jugador 9",
    "Jugador 10",
    "Jugador 11",
    "Jugador 12",
    "Jugador 13",
    "Jugador 14",
    "Jugador 15",
    "Jugador 16",
    "Jugador 17",
    "Jugador 18"
  ];
}

// Calcula el total de laminas dinamicamente
export function getTotalStickers() {
  let total = 0;
  for (const team of EQUIPOS) {
    total += getTeamStickers(team.nombre).length;
  }
  return total;
}

export function createInitialStickerState() {
  const initialState = {};
  const totalStickers = getTotalStickers();

  for (let index = 1; index <= totalStickers; index += 1) {
    initialState[index] = 0;
  }

  return initialState;
}

export function getAllCollectionStickers() {
  let currentNumber = 1;
  
  return EQUIPOS.flatMap((team) => {
    const stickers = getTeamStickers(team.nombre);

    return stickers.map((lamina) => {
      const sticker = {
        numero: currentNumber,
        lamina,
        equipo: team.nombre,
        grupo: team.grupo
      };
      currentNumber++;
      return sticker;
    });
  });
}
