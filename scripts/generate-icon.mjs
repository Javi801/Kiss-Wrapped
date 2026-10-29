/**
 * Generates the Android launcher icons, the iOS app icons and the in-app icon images for every icon color.
 * Run: npm run gen:icon
 *
 * Reads assets/icons/{resource}/foreground.png and background.png (adaptive icon layers,
 * drawn on the 108dp canvas).
 *
 * Outputs to android/app/src/main/res/mipmap-* directories:
 *   ic_launcher_foreground_{resource}.webp — adaptive icon foreground (transparent)
 *   ic_launcher_background_{resource}.webp — adaptive icon background
 *   ic_launcher_{resource}.webp            — legacy icon for API < 26 (rounded square)
 *   ic_launcher*.webp                      — defaults, from the default color
 *
 * Outputs to ios/App/App/Assets.xcassets/:
 *   AppIcon.appiconset/                    — primary icon, from the default color
 *   AppIcon-{color}.appiconset/            — alternate icon for every other color
 *
 * Outputs to src/assets/icons/:
 *   {image}                                — composed square icon drawn inside the app
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// Colors and resource names are shared with the in-app icon so both stay in sync.
import {
  ICON_VARIANTS,
  DEFAULT_ICON_VARIANT,
} from '../src/components/shared/SparkleIcon.constants.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const SOURCES = resolve(__dir, '../assets/icons')
const RES = resolve(__dir, '../android/app/src/main/res')
const WEB = resolve(__dir, '../src/assets/icons')
const IOS = resolve(__dir, '../ios/App/App/Assets.xcassets')

// ─── Sizes ───────────────────────────────────────────────────────────────────
// Launchers show the central 72dp of the 108dp adaptive canvas.
const VIEWPORT_RATIO = 72 / 108

const DENSITIES = {
  'mipmap-mdpi': { legacy: 48, adaptive: 108 },
  'mipmap-hdpi': { legacy: 72, adaptive: 162 },
  'mipmap-xhdpi': { legacy: 96, adaptive: 216 },
  'mipmap-xxhdpi': { legacy: 144, adaptive: 324 },
  'mipmap-xxxhdpi': { legacy: 192, adaptive: 432 },
}

const WEB_SIZE = 512
const IOS_SIZE = 1024
const LEGACY_CORNER_RATIO = 0.2
const WEBP = { quality: 90 }

// ─── Rendering ───────────────────────────────────────────────────────────────
const layer = (resource, name, size) =>
  sharp(`${SOURCES}/${resource}/${name}.png`).resize(size, size).webp(WEBP)

// Foreground over background, cropped to the area a launcher shows.
async function compose(resource, size) {
  const canvas = Math.round(size / VIEWPORT_RATIO)
  const offset = Math.round((canvas - size) / 2)
  const foreground = await sharp(`${SOURCES}/${resource}/foreground.png`)
    .resize(canvas, canvas)
    .toBuffer()
  const full = await sharp(`${SOURCES}/${resource}/background.png`)
    .resize(canvas, canvas)
    .composite([{ input: foreground }])
    .png()
    .toBuffer()
  return sharp(full).extract({ left: offset, top: offset, width: size, height: size })
}

// Clips a square image to a rounded shape; a radius of half the size gives a circle.
function mask(image, size, radius) {
  const shape = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`
  )
  return image.composite([{ input: shape, blend: 'dest-in' }])
}

async function legacy(resource, size, radius) {
  const composed = await compose(resource, size)
  return mask(sharp(await composed.png().toBuffer()), size, radius).webp(WEBP)
}

// iOS rejects app icons with an alpha channel, and applies its own corner mask.
async function ios(color, resource) {
  const name = color === DEFAULT_ICON_VARIANT ? 'AppIcon' : `AppIcon-${color}`
  const dir = `${IOS}/${name}.appiconset`
  mkdirSync(dir, { recursive: true })
  await (await compose(resource, IOS_SIZE)).flatten().removeAlpha().png().toFile(`${dir}/icon.png`)
  const contents = {
    images: [{ filename: 'icon.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
    info: { author: 'xcode', version: 1 },
  }
  writeFileSync(`${dir}/Contents.json`, `${JSON.stringify(contents, null, 2)}\n`)
}

// ─── Generate ────────────────────────────────────────────────────────────────
// Drop earlier launcher images so a renamed or removed color leaves nothing behind.
for (const dir of Object.keys(DENSITIES)) {
  for (const file of readdirSync(`${RES}/${dir}`)) {
    if (/^ic_launcher.*\.(png|webp)$/.test(file)) rmSync(`${RES}/${dir}/${file}`)
  }
}
rmSync(WEB, { recursive: true, force: true })
for (const set of readdirSync(IOS)) {
  if (/^AppIcon.*\.appiconset$/.test(set)) rmSync(`${IOS}/${set}`, { recursive: true })
}
mkdirSync(WEB, { recursive: true })

for (const [color, { resource, image }] of Object.entries(ICON_VARIANTS)) {
  for (const [dir, { legacy: legacySize, adaptive }] of Object.entries(DENSITIES)) {
    const out = `${RES}/${dir}`
    const corner = Math.round(legacySize * LEGACY_CORNER_RATIO)

    await layer(resource, 'foreground', adaptive).toFile(
      `${out}/ic_launcher_foreground_${resource}.webp`
    )
    await layer(resource, 'background', adaptive).toFile(
      `${out}/ic_launcher_background_${resource}.webp`
    )
    await (await legacy(resource, legacySize, corner)).toFile(`${out}/ic_launcher_${resource}.webp`)

    // Default ic_launcher* files, used by the <application> tag.
    if (color === DEFAULT_ICON_VARIANT) {
      await layer(resource, 'foreground', adaptive).toFile(`${out}/ic_launcher_foreground.webp`)
      await layer(resource, 'background', adaptive).toFile(`${out}/ic_launcher_background.webp`)
      await (await legacy(resource, legacySize, corner)).toFile(`${out}/ic_launcher.webp`)
      await (
        await legacy(resource, legacySize, legacySize / 2)
      ).toFile(`${out}/ic_launcher_round.webp`)
    }
  }

  await (await compose(resource, WEB_SIZE)).webp(WEBP).toFile(`${WEB}/${image}`)
  await ios(color, resource)
  process.stdout.write(`  ${color}\n`)
}

process.stdout.write('Done! Run `npx cap sync` and rebuild.\n')
