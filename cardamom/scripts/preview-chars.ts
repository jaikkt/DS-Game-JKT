import { Img, hex } from './art/pixel';
import { playerSheet, npcSheet, catSheet, FW, FH, NpcLook } from './art/characters';
const looks: NpcLook[] = [
  { hair: '#5a3a28', skin: '#e8b890', outer: '#d04848', inner: '#f8f0e0', pants: '#384868', shoes: '#603828', style: 'cap', accent: '#3060c0' },
  { hair: '#202028', skin: '#a86840', outer: '#f0c040', inner: '#f8f0e0', pants: '#406040', shoes: '#302020', style: 'long', skirt: true },
  { hair: '#c8c8c8', skin: '#e0a878', outer: '#7090c0', inner: '#ffffff', pants: '#504838', shoes: '#302820', style: 'bald' },
  { hair: '#302018', skin: '#8a5434', outer: '#40a070', inner: '#f8f0e0', pants: '#303040', shoes: '#f0f0f0', style: 'curly' },
  { hair: '#e0b050', skin: '#f0c8a0', outer: '#8858b0', inner: '#f8f0e0', pants: '#283048', shoes: '#c04040', style: 'pony' },
  { hair: '#302018', skin: '#c08050', outer: '#f8f8f8', inner: '#f8f8f8', pants: '#806040', shoes: '#402818', style: 'scarf', accent: '#e05080', skirt: true },
  { hair: '#2a2020', skin: '#c88858', outer: '#e8e0d0', inner: '#e8e0d0', pants: '#e8e0d0', shoes: '#806040', style: 'short' },
  { hair: '#402820', skin: '#f0c8a0', outer: '#4070c0', inner: '#f0f0f0', pants: '#202830', shoes: '#202020', style: 'bun' },
];
const sheets = [playerSheet(), ...looks.map(npcSheet), catSheet()];
const out = new Img(FW * 12 + 8, sheets.length * (FH + 4) + 4);
out.rect(0, 0, out.w, out.h, hex('#70d8a8'));
sheets.forEach((s, i) => out.blit(s, 4, 4 + i * (FH + 4)));
out.scaled(4).save('.preview/chars.png');
