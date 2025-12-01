export const LOGIC_WIDTH = 580
export const LOGIC_HEIGHT = 900

export const GRAVITY = 0.7
export const MOVE_SPEED = 4.4
export const JUMP_FORCE = -13

export const PLATFORMS: Array<{ x: number; y: number; w: number; h: number }> = [
  // Ground
  { x: 0, y: 860, w: 580, h: 40 },

  // Progressive platforms (gaps ~110–130px max)
  { x: 60, y: 750, w: 160, h: 18 },
  { x: 300, y: 680, w: 180, h: 18 },

  { x: 90, y: 600, w: 150, h: 18 },
  { x: 320, y: 530, w: 160, h: 18 },

  { x: 120, y: 450, w: 160, h: 18 },
  { x: 280, y: 390, w: 180, h: 18 },

  { x: 100, y: 310, w: 160, h: 18 },
  { x: 340, y: 250, w: 160, h: 18 },

  // Boss zone
  { x: 180, y: 180, w: 220, h: 18 },
]
