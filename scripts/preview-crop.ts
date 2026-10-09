import { PNG } from 'pngjs'; import fs from 'node:fs'; import { Img } from './art/pixel';
const [f, x, y, w, h, k, out] = process.argv.slice(2);
const png = PNG.sync.read(fs.readFileSync(f)); const im = new Img(png.width, png.height);
for (let i = 0; i < im.data.length; i++) im.data[i] = ((png.data[i*4]<<24)|(png.data[i*4+1]<<16)|(png.data[i*4+2]<<8)|png.data[i*4+3])>>>0;
im.crop(+x, +y, +w, +h).scaled(+k).save(out);
