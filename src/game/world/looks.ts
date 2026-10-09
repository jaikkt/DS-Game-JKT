/** NPC appearance presets (pure data; the generator turns these into sprite sheets). */
export interface Look {
  hair: string;
  skin: string;
  outer: string;
  inner: string;
  pants: string;
  shoes: string;
  style: 'short' | 'long' | 'bun' | 'cap' | 'bald' | 'pony' | 'curly' | 'scarf';
  accent?: string;
  sleeveless?: boolean;
  skirt?: boolean;
}

export const LOOKS: Record<string, Look> = {
  fisher: { hair: '#d8d8d0', skin: '#9a5c34', outer: '#e8e4d8', inner: '#e8e4d8', pants: '#3a7a68', shoes: '#5a3a22', style: 'bald', sleeveless: true },
  student: { hair: '#5a3a28', skin: '#f0c8a0', outer: '#861f41', inner: '#f8f0e0', pants: '#384868', shoes: '#f0f0f0', style: 'cap', accent: '#e5751f' },
  jogger: { hair: '#202028', skin: '#8a5434', outer: '#40b0d0', inner: '#f8f8f8', pants: '#303040', shoes: '#f04040', style: 'pony' },
  tourist: { hair: '#e0b050', skin: '#f4cca8', outer: '#f06850', inner: '#f8f0e0', pants: '#d8c8a0', shoes: '#806040', style: 'cap', accent: '#f8f8f8' },
  grandma: { hair: '#e8e8e8', skin: '#c88858', outer: '#f8f8f8', inner: '#f8f8f8', pants: '#806040', shoes: '#402818', style: 'scarf', accent: '#3a9a78', skirt: true },
  chaiwala: { hair: '#2a2020', skin: '#a86840', outer: '#f0ece0', inner: '#f0ece0', pants: '#f0ece0', shoes: '#806040', style: 'short' },
  vendor: { hair: '#302018', skin: '#c08050', outer: '#f8f8f8', inner: '#f8f8f8', pants: '#303848', shoes: '#202020', style: 'cap', accent: '#d03030' },
  kid: { hair: '#402820', skin: '#e8b890', outer: '#f0c040', inner: '#f8f0e0', pants: '#3858a8', shoes: '#d04040', style: 'short' },
  suit: { hair: '#202028', skin: '#e0a878', outer: '#3a4050', inner: '#f8f8f8', pants: '#2a3040', shoes: '#181818', style: 'short' },
  artist: { hair: '#302018', skin: '#8a5434', outer: '#40a070', inner: '#f8f0e0', pants: '#303040', shoes: '#f0f0f0', style: 'curly' },
  prof: { hair: '#b8b0a8', skin: '#f0c8a0', outer: '#806048', inner: '#e8e0f0', pants: '#4a4038', shoes: '#302820', style: 'short' },
  barista: { hair: '#202028', skin: '#a86840', outer: '#2a6a50', inner: '#f8f0e0', pants: '#303040', shoes: '#302020', style: 'bun' },
  reader: { hair: '#202028', skin: '#a86840', outer: '#f0c040', inner: '#f8f0e0', pants: '#406040', shoes: '#302020', style: 'long', skirt: true },
  musician: { hair: '#402820', skin: '#c88858', outer: '#504878', inner: '#f0f0f0', pants: '#202830', shoes: '#202020', style: 'curly' },
  guard: { hair: '#302018', skin: '#c08050', outer: '#3858a8', inner: '#f0f0f0', pants: '#283048', shoes: '#181818', style: 'cap', accent: '#283868' },
  duckfan: { hair: '#c84828', skin: '#f4cca8', outer: '#8858b0', inner: '#f8f0e0', pants: '#283048', shoes: '#c04040', style: 'long', skirt: true },
};
