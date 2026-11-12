#!/usr/bin/env node
/**
 * iDo 品牌图标生成工具。
 *
 * 输入一张方形位图（默认 `docs/logo/logo.png`），描摹出矢量轮廓，再产出桌面端与
 * 文档站需要的全部图标资产：
 *   - apps/desktop/resources/icon.svg            1104 画布，圆角底板 + 图形（PWA 图标源）
 *   - apps/desktop/resources/icon-windows.svg    1024 画布，含 tray-glyph 组（托盘渲染源）
 *   - apps/desktop/resources/icon-macos.svg      1104 画布
 *   - apps/desktop/resources/icon*.png           对应位图
 *   - apps/desktop/resources/tray-windows.ico    16-64 多帧托盘图标
 *   - website/public/wordmark.svg                文档站字标（currentColor）
 *
 * 用法：
 *   node scripts/brand/render-icons.mjs
 *   node scripts/brand/render-icons.mjs --source docs/logo/logo.png --preview docs/logo
 *
 * sharp 从 `apps/desktop` 的依赖中解析；若该包尚未安装，可用 `--sharp <目录>` 指定。
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 仓库根目录，由本文件位置推导。 */
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** 默认输入与输出位置，均为仓库相对路径。 */
const DEFAULTS = {
  source: 'docs/logo/logo.png',
  output: 'apps/desktop/resources',
  wordmark: 'website/public/wordmark.svg',
  preview: 'docs/logo',
}

/** 像素判定为图形内部的透明度阈值。 */
const ALPHA_THRESHOLD = 40

/** 接近白色的像素视为背景，避免把白底位图整块描成图形。 */
const WHITE_THRESHOLD = 240

/** 轮廓抽稀允许的最大偏差，数值越大路径点越少。 */
const SIMPLIFY_EPSILON = 1.4

/** 图标底板尺寸与内缩，必须与 `apps/web/scripts/render-app-icons.ts` 的常量一致。 */
const TILE = { edge: 1024, insetX: 40, insetY: 32, radius: 192 }

/** 图形在底板内的缩放比例，留出安全边距供平台圆角遮罩裁切。 */
const GLYPH_SCALE = 0.78

/** 托盘图标打包的位图尺寸。 */
const TRAY_SIZES = [16, 20, 24, 32, 40, 48, 64]

/** 托盘渲染时对 tray-glyph 组的放大倍数，与 `render-tray-icon.ts` 保持一致。 */
const TRAY_ZOOM = 1.2

/** 解析命令行参数。 */
function parseArguments(argv) {
  const options = { ...DEFAULTS, sharp: undefined, help: false }
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') { options.help = true; continue }
    const match = /^--(source|output|wordmark|preview|sharp)=(.*)$/u.exec(argument)
    if (match !== null) { options[match[1]] = match[2]; continue }
    if (argument === '--source' || argument === '--output' || argument === '--wordmark'
      || argument === '--preview' || argument === '--sharp') {
      const key = argument.slice(2)
      const value = argv[index + 1]
      if (value === undefined || value.startsWith('--')) throw new Error(`参数 ${argument} 缺少取值`)
      options[key] = value
      index++
      continue
    }
    throw new Error(`无法识别的参数：${argument}`)
  }
  return options
}

/**
 * 解析 sharp 模块。
 * @param explicitPath 可选的 sharp 模块目录。
 * @returns sharp 模块实例。
 */
function loadSharp(explicitPath) {
  if (explicitPath !== undefined) {
    return createRequire(join(REPOSITORY_ROOT, 'package.json'))(resolve(explicitPath))
  }
  try {
    return createRequire(join(REPOSITORY_ROOT, 'apps/desktop/package.json'))('sharp')
  } catch (error) {
    throw new Error(`无法解析 sharp，请先在仓库根目录执行 pnpm install，或用 --sharp 指定模块目录：${String(error)}`)
  }
}

/**
 * 读取 PNG 并二值化为轮廓掩码。
 * @param sharp sharp 模块实例。
 * @param path 位图路径。
 * @returns 掩码、宽、高；掩码值 1 表示像素属于图形。
 */
async function readMask(sharp, path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const mask = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4
      const alpha = data[offset + 3]
      const red = data[offset]
      const green = data[offset + 1]
      const blue = data[offset + 2]
      const nearWhite = red > WHITE_THRESHOLD && green > WHITE_THRESHOLD && blue > WHITE_THRESHOLD
      mask[y * width + x] = alpha > ALPHA_THRESHOLD && !nearWhite ? 1 : 0
    }
  }
  return { mask, width, height }
}

/**
 * 用行进方块算法提取闭合轮廓，返回整数格点组成的多边形。
 * @param mask 二值掩码。
 * @param width 画布宽。
 * @param height 画布高。
 * @returns 每条闭合轮廓的点序列。
 */
function traceContours(mask, width, height) {
  const isInside = (x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === 1
  const segments = []
  for (let y = -1; y < height; y++) {
    for (let x = -1; x < width; x++) {
      const topLeft = isInside(x, y)
      const topRight = isInside(x + 1, y)
      const bottomRight = isInside(x + 1, y + 1)
      const bottomLeft = isInside(x, y + 1)
      const index = (topLeft ? 8 : 0) | (topRight ? 4 : 0) | (bottomRight ? 2 : 0) | (bottomLeft ? 1 : 0)
      if (index === 0 || index === 15) continue
      const top = [x + 0.5, y]
      const right = [x + 1, y + 0.5]
      const bottom = [x + 0.5, y + 1]
      const left = [x, y + 0.5]
      switch (index) {
        case 1: segments.push([left, bottom]); break
        case 2: segments.push([bottom, right]); break
        case 3: segments.push([left, right]); break
        case 4: segments.push([top, right]); break
        case 5: segments.push([top, right], [left, bottom]); break
        case 6: segments.push([top, bottom]); break
        case 7: segments.push([left, top]); break
        case 8: segments.push([top, left]); break
        case 9: segments.push([top, bottom]); break
        case 10: segments.push([top, left], [bottom, right]); break
        case 11: segments.push([top, right]); break
        case 12: segments.push([left, right]); break
        case 13: segments.push([bottom, right]); break
        case 14: segments.push([left, bottom]); break
        default: break
      }
    }
  }

  const pointKey = point => `${point[0]},${point[1]}`
  const adjacency = new Map()
  segments.forEach((segment, index) => {
    for (const point of segment) {
      const key = pointKey(point)
      const bucket = adjacency.get(key)
      if (bucket === undefined) adjacency.set(key, [index])
      else bucket.push(index)
    }
  })

  const visited = new Uint8Array(segments.length)
  const contours = []
  for (let start = 0; start < segments.length; start++) {
    if (visited[start] === 1) continue
    visited[start] = 1
    const points = [segments[start][0], segments[start][1]]
    let current = segments[start][1]
    for (;;) {
      const candidates = adjacency.get(pointKey(current)) ?? []
      const next = candidates.find(candidate => visited[candidate] === 0)
      if (next === undefined) break
      visited[next] = 1
      const segment = segments[next]
      const nextPoint = pointKey(segment[0]) === pointKey(current) ? segment[1] : segment[0]
      points.push(nextPoint)
      current = nextPoint
      if (pointKey(current) === pointKey(points[0])) break
    }
    if (points.length > 3) contours.push(points)
  }
  return contours
}

/** 计算闭合多边形的有向面积，符号表示绕向。 */
function signedArea(points) {
  let total = 0
  for (let index = 0; index < points.length; index++) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    total += current[0] * next[1] - next[0] * current[1]
  }
  return total / 2
}

/** 计算点到线段的垂直距离平方，供抽稀算法使用。 */
function squaredDistanceToSegment(point, start, end) {
  const deltaX = end[0] - start[0]
  const deltaY = end[1] - start[1]
  if (deltaX === 0 && deltaY === 0) {
    return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2
  }
  const projection = ((point[0] - start[0]) * deltaX + (point[1] - start[1]) * deltaY)
    / (deltaX * deltaX + deltaY * deltaY)
  const clamped = Math.max(0, Math.min(1, projection))
  const nearestX = start[0] + clamped * deltaX
  const nearestY = start[1] + clamped * deltaY
  return (point[0] - nearestX) ** 2 + (point[1] - nearestY) ** 2
}

/**
 * Ramer-Douglas-Peucker 抽稀。
 * @param points 折线点。
 * @param epsilon 允许的最大偏差。
 * @returns 抽稀后的折线点。
 */
function simplify(points, epsilon) {
  if (points.length < 3) return points
  const squaredEpsilon = epsilon * epsilon
  let maxDistance = 0
  let splitIndex = 0
  for (let index = 1; index < points.length - 1; index++) {
    const distance = squaredDistanceToSegment(points[index], points[0], points[points.length - 1])
    if (distance > maxDistance) {
      maxDistance = distance
      splitIndex = index
    }
  }
  if (maxDistance <= squaredEpsilon) return [points[0], points[points.length - 1]]
  const head = simplify(points.slice(0, splitIndex + 1), epsilon)
  const tail = simplify(points.slice(splitIndex), epsilon)
  return [...head.slice(0, -1), ...tail]
}

/**
 * 对闭合轮廓抽稀：先按最远点切成两段，再分别简化后拼接。
 * @param points 闭合轮廓点。
 * @param epsilon 允许的最大偏差。
 * @returns 抽稀后的闭合轮廓点。
 */
function simplifyClosed(points, epsilon) {
  const body = points.slice(0, -1)
  if (body.length < 4) return body
  let farthestIndex = 0
  let farthestDistance = -1
  for (let index = 1; index < body.length; index++) {
    const distance = (body[index][0] - body[0][0]) ** 2 + (body[index][1] - body[0][1]) ** 2
    if (distance > farthestDistance) {
      farthestDistance = distance
      farthestIndex = index
    }
  }
  const firstHalf = simplify(body.slice(0, farthestIndex + 1), epsilon)
  const secondHalf = simplify([...body.slice(farthestIndex), body[0]], epsilon)
  return [...firstHalf.slice(0, -1), ...secondHalf.slice(0, -1)]
}

/** 格式化坐标，最多保留两位小数以压缩路径体积。 */
function formatCoordinate(value) {
  return String(Math.round(value * 100) / 100)
}

/**
 * 把闭合折线转换为平滑的三次贝塞尔路径（Catmull-Rom 转 Bezier）。
 * @param points 闭合折线点。
 * @returns SVG 路径数据。
 */
function toSmoothPath(points) {
  const count = points.length
  if (count < 3) return ''
  const at = index => points[(index + count) % count]
  let path = `M${formatCoordinate(points[0][0])} ${formatCoordinate(points[0][1])}`
  for (let index = 0; index < count; index++) {
    const previous = at(index - 1)
    const current = at(index)
    const next = at(index + 1)
    const afterNext = at(index + 2)
    const controlOne = [
      current[0] + (next[0] - previous[0]) / 6,
      current[1] + (next[1] - previous[1]) / 6,
    ]
    const controlTwo = [
      next[0] - (afterNext[0] - current[0]) / 6,
      next[1] - (afterNext[1] - current[1]) / 6,
    ]
    path += `C${formatCoordinate(controlOne[0])} ${formatCoordinate(controlOne[1])}`
      + ` ${formatCoordinate(controlTwo[0])} ${formatCoordinate(controlTwo[1])}`
      + ` ${formatCoordinate(next[0])} ${formatCoordinate(next[1])}`
  }
  return `${path}Z`
}

/**
 * 组装带圆角底板的图标 SVG。
 *
 * 输出结构固定为：底板阴影组 → 底板矩形 → 图形组 → 图形。
 * `apps/web/scripts/render-app-icons.ts` 依赖 `filter0_d` 与 `filter1_ddi` 两个组的固定字符串
 * （分别用于裁掉窗口阴影、单独放大可遮罩图形），因此这里的组名与属性顺序不可随意调整。
 *
 * @param body 图形路径集合。
 * @param title 文档标题，同时用于辅助技术朗读。
 * @param options.canvas 画布边长。
 * @param options.wrapper 包裹内容的额外变换；用于把 1104 内容压进 1024 画布。
 * @param options.glyphId 图形组 id；托盘渲染要求为 `tray-glyph` 且该组不得自带 transform。
 * @returns 完整的 SVG 文本。
 */
function buildIconDocument(body, title, options) {
  const { canvas, wrapper, glyphId } = options
  const open = wrapper === undefined ? '' : `<g transform="${wrapper}">`
  const close = wrapper === undefined ? '' : '</g>'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}" role="img" aria-label="${title}">
<title>${title}</title>
<defs>
  <linearGradient id="ido-tile" x1="40" y1="1056" x2="1064" y2="32" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#F4F9FC"/>
    <stop offset="1" stop-color="#E3F0F8"/>
  </linearGradient>
  <linearGradient id="ido-brand" x1="120" y1="960" x2="904" y2="80" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#4180B5"/>
    <stop offset="0.45" stop-color="#4E9FC6"/>
    <stop offset="1" stop-color="#63B7D9"/>
  </linearGradient>
  <filter id="filter0_d_1637_371" x="0" y="0" width="100%" height="100%">
    <feOffset dx="0" dy="0"/>
  </filter>
  <filter id="filter1_ddi_1637_371" x="0" y="0" width="100%" height="100%">
    <feOffset dx="0" dy="0"/>
  </filter>
</defs>
${open}
<g filter="url(#filter0_d_1637_371)">
<rect x="${TILE.insetX}" y="${TILE.insetY}" width="${TILE.edge}" height="${TILE.edge}" rx="${TILE.radius}" fill="url(#ido-tile)"/>
<g filter="url(#filter1_ddi_1637_371)">
<g${glyphId === undefined ? '' : ` id="${glyphId}"`}>
<g transform="translate(${TILE.insetX + TILE.edge / 2} ${TILE.insetY + TILE.edge / 2}) scale(${GLYPH_SCALE}) translate(-512 -512)">
${body}
</g>
</g>
</g>
</g>
${close}
</svg>
`
}

/**
 * 组装文档站字标：图形与字母都用 currentColor，跟随站点文字颜色。
 * @param body 图形路径集合。
 * @returns 完整的 SVG 文本。
 */
function buildWordmarkDocument(body) {
  const monochrome = body.replaceAll('fill="url(#ido-brand)"', 'fill="currentColor"')
  const letters = `<g fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round">
  <path d="M76 26 V52"/>
  <path d="M95 39 H102"/>
  <circle cx="128" cy="39" r="13"/>
  <path d="M141 12 V52"/>
  <circle cx="168" cy="39" r="13"/>
</g>
<circle cx="76" cy="12" r="5" fill="currentColor"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="196" height="64" viewBox="0 0 196 64" role="img" aria-label="iDo">
<title>iDo</title>
<g transform="scale(0.0625)">
${monochrome}
</g>
${letters}
</svg>
`
}

/**
 * 按 tray-windows.ico 的目录格式打包 ICO，每个条目存放一张完整 PNG。
 * @param entries 位图条目，需按尺寸升序排列。
 * @returns ICO 字节。
 */
function packIco(entries) {
  const header = Buffer.alloc(6 + entries.length * 16)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  let offset = header.length
  entries.forEach((entry, index) => {
    const at = 6 + index * 16
    header.writeUInt8(entry.size % 256, at)
    header.writeUInt8(entry.size % 256, at + 1)
    header.writeUInt8(0, at + 2)
    header.writeUInt8(0, at + 3)
    header.writeUInt16LE(1, at + 4)
    header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(entry.png.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += entry.png.length
  })
  return Buffer.concat([header, ...entries.map(entry => entry.png)])
}

/**
 * 生成托盘图标：按 render-tray-icon 的规则放大 tray-glyph 后逐尺寸光栅化。
 * @param sharp sharp 模块实例。
 * @param windowsSvg icon-windows.svg 内容。
 * @returns ICO 字节。
 */
async function buildTrayIcon(sharp, windowsSvg) {
  const zoom = `translate(${TILE.insetX + TILE.edge / 2} ${TILE.insetY + TILE.edge / 2})`
    + ` scale(${TRAY_ZOOM}) translate(-${TILE.insetX + TILE.edge / 2} -${TILE.insetY + TILE.edge / 2})`
  const zoomed = windowsSvg.replace('<g id="tray-glyph"', `<g id="tray-glyph" transform="${zoom}"`)
  const entries = []
  for (const size of TRAY_SIZES) {
    entries.push({
      size,
      png: await sharp(Buffer.from(zoomed), { density: (72 * size) / 1024 }).resize(size, size).png().toBuffer(),
    })
  }
  return packIco(entries)
}

/**
 * 主流程：读取源图、描摹轮廓、写出全部资产与预览图。
 * @returns 无返回值；失败时抛出异常。
 */
async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    process.stdout.write('用法：node scripts/brand/render-icons.mjs [--source 位图] [--output 桌面资源目录] [--wordmark 字标路径] [--preview 预览目录] [--sharp sharp目录]\n')
    return
  }
  const sharp = loadSharp(options.sharp)
  const sourcePath = resolve(REPOSITORY_ROOT, options.source)
  const outputDirectory = resolve(REPOSITORY_ROOT, options.output)
  const previewDirectory = resolve(REPOSITORY_ROOT, options.preview)
  const wordmarkPath = resolve(REPOSITORY_ROOT, options.wordmark)

  const { mask, width, height } = await readMask(sharp, sourcePath)
  const shapes = traceContours(mask, width, height)
    .map(contour => {
      const points = simplifyClosed(contour, SIMPLIFY_EPSILON)
      return { points, area: Math.abs(signedArea(contour)), path: toSmoothPath(points) }
    })
    .filter(shape => shape.points.length >= 3)
    .sort((left, right) => right.area - left.area)
  if (shapes.length < 2) throw new Error(`描摹失败：只识别到 ${shapes.length} 个闭合轮廓，请检查源图是否透明背景`)
  const body = shapes
    .map(shape => `<path d="${shape.path}" fill="url(#ido-brand)" fill-rule="evenodd"/>`)
    .join('\n')

  const iconSvg = buildIconDocument(body, 'iDo', { canvas: 1104 })
  const macSvg = buildIconDocument(body, 'iDo', { canvas: 1104 })
  const windowsSvg = buildIconDocument(body, 'iDo', {
    canvas: 1024,
    wrapper: `translate(32 32) scale(0.9375) translate(-${TILE.insetX} -${TILE.insetY})`,
    glyphId: 'tray-glyph',
  })
  const wordmarkSvg = buildWordmarkDocument(body)

  await mkdir(outputDirectory, { recursive: true })
  await mkdir(previewDirectory, { recursive: true })
  await mkdir(dirname(wordmarkPath), { recursive: true })

  await writeFile(join(outputDirectory, 'icon.svg'), iconSvg)
  await writeFile(join(outputDirectory, 'icon-macos.svg'), macSvg)
  await writeFile(join(outputDirectory, 'icon-windows.svg'), windowsSvg)
  await writeFile(wordmarkPath, wordmarkSvg)

  const iconPng = await sharp(Buffer.from(iconSvg)).resize(1104, 1104).png().toBuffer()
  const windowsPng = await sharp(Buffer.from(windowsSvg)).resize(1024, 1024).png().toBuffer()
  const macPng = await sharp(Buffer.from(macSvg)).resize(1024, 1024).png().toBuffer()
  await writeFile(join(outputDirectory, 'icon.png'), iconPng)
  await writeFile(join(outputDirectory, 'icon-windows.png'), windowsPng)
  await writeFile(join(outputDirectory, 'icon-macos.png'), macPng)
  await writeFile(join(outputDirectory, 'tray-windows.ico'), await buildTrayIcon(sharp, windowsSvg))

  await writeFile(join(previewDirectory, 'preview-icon.png'), await sharp(iconPng).resize(512, 512).png().toBuffer())
  await writeFile(join(previewDirectory, 'preview-wordmark.png'),
    await sharp(Buffer.from(wordmarkSvg)).resize({ height: 160 }).png().toBuffer())

  process.stdout.write(`brand icons: 识别 ${shapes.length} 个轮廓，已写入 ${outputDirectory} 与 ${wordmarkPath}\n`)
}

await main()
