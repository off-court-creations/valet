# `<ParallaxScroll />`, `<ParallaxBackground />`, `<ParallaxLayer />`

valet’s lightweight **parallax scrolling system**.  
Compose a scroll‑aware root (`ParallaxScroll`) with any number of layers:

* **Background media** (`ParallaxBackground`) – JPG/WEBP image or WEBM video that spans the viewport  
* **Any layer** (`ParallaxLayer`) – Moves at a configurable speed on the *x* or *y* axis  
* Works seamlessly inside a `<Surface>` (auto‑detects the scroll parent)  
* Fully themeable via `preset` – no extra dependencies

---

## Props

### `<ParallaxScroll />`

| Name      | Type                      | Default | Description                                         |
|-----------|---------------------------|---------|-----------------------------------------------------|
| `trackX`  | `boolean`                 | `false` | Also track horizontal scroll for `axis="x"` layers. |
| `preset`  | `string - string[]`     | —       | Style preset(s) from `definePreset()`.              |
| *(rest)*  | Native `<div>` props      | —       | Forwarded to the wrapper element.                   |

### `<ParallaxBackground />`

| Name        | Type                                      | Default | Description                                                         |
|-------------|-------------------------------------------|---------|---------------------------------------------------------------------|
| `src`       | `string`                                  | —       | Image (JPG/WEBP) or video (WEBM) source.                           |
| `mediaType` | `'image' - 'video'`                     | auto    | Force media interpretation (otherwise guessed from extension).      |
| `poster`    | `string`                                  | —       | Poster frame for videos.                                            |
| `speed`     | `number`                                  | `0.5`   | Scroll speed multiplier (0.2–0.6 typical for backgrounds).          |
| `axis`      | `'y' - 'x'`                             | `'y'`   | Scroll axis used to offset the layer.                               |
| Video attrs | `loop`, `muted`, `autoPlay`, `preload`    | `true`, `true`, `true`, `'auto'` | Passed straight to `<video>` when `mediaType="video"`. |
| `preset`    | `string - string[]`                     | —       | Style preset(s).                                                    |
| *(rest)*    | Native `<div>` props                      | —       | Forwarded to the underlying layer container.                        |

### `<ParallaxLayer />`

| Name      | Type                          | Default | Description                                               |
|-----------|-------------------------------|---------|-----------------------------------------------------------|
| `speed`   | `number`                      | `0.5`   | Scroll speed multiplier (1 = native, &lt;1 = slower).      |
| `axis`    | `'y' - 'x'`                 | `'y'`   | Axis used for movement.                                   |
| `preset`  | `string - string[]`         | —       | Style preset(s).                                          |
| *(rest)*  | Native `<div>` props          | —       | Forwarded to the underlying container.                    |

---

> **Tip:** Keep background speeds ≤ 0.6 and foreground speeds ≥ 1.1 for convincing depth without motion sickness.

