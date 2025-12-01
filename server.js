import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.static(path.join(__dirname, 'dist')))

app.get('.', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = 4321
app.listen(PORT, () => {
  console.log(`Server launched on http://localhost:${PORT}`)
})
