// ─────────────────────────────────────────────────────────────
// src/pages/FabricatorDemo.tsx | valet
// Interactive image export with PixiJS
// ─────────────────────────────────────────────────────────────
import * as React from 'react'
import { Application, Sprite, Graphics } from 'pixi.js'
import { Surface, Stack, Typography, Button, Dropzone } from '@archway/valet'
import { useNavigate } from 'react-router-dom'
import NavDrawer from '../components/NavDrawer'

export default function FabricatorDemoPage() {
  const navigate = useNavigate()
  const pixiRef = React.useRef<HTMLDivElement>(null)
  const appRef = React.useRef<Application | null>(null)
  const [file, setFile] = React.useState<File | null>(null)

  const handleFilesChange = React.useCallback((files: File[]) => {
    setFile(files[0] ?? null)
  }, [])

  React.useEffect(() => {
    if (!pixiRef.current || !file) return

    const url = URL.createObjectURL(file)
    const app = new Application({ backgroundAlpha: 0 })
    appRef.current = app
    pixiRef.current.innerHTML = ''
    pixiRef.current.appendChild(app.view as HTMLCanvasElement)

    const sprite = Sprite.from(url)
    sprite.anchor.set(0.5)
    sprite.texture.baseTexture.once('loaded' as any, () => {
      app.renderer.resize(sprite.width, sprite.height)
      sprite.position.set(sprite.width / 2, sprite.height / 2)
      const size = Math.min(sprite.width, sprite.height) * 0.2
      const rect = new Graphics()
      rect.beginFill(0x00ff00)
      rect.drawRect((sprite.width - size) / 2, (sprite.height - size) / 2, size, size)
      rect.endFill()
      app.stage.addChild(sprite)
      app.stage.addChild(rect)
    })

    return () => {
      app.destroy(true, { children: true })
      URL.revokeObjectURL(url)
    }
  }, [file])

  const handleExport = React.useCallback(() => {
    if (!appRef.current) return
    const canvas = (appRef.current.renderer as any).plugins.extract.canvas(appRef.current.stage)
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'fabricator.png'
    link.click()
  }, [])

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>Fabricator</Typography>
        <Typography variant="subtitle">Upload an image and export it with a green square.</Typography>
        <Dropzone
          accept={{ 'image/*': [] }}
          multiple={false}
          onFilesChange={handleFilesChange}
          showPreviews
        />
        <div ref={pixiRef} />
        {file && (
          <Button onClick={handleExport} variant="contained">
            Export Image
          </Button>
        )}
        <Button size="lg" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  )
}
