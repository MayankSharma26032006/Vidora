import fs from "fs"


import { vi } from "vitest"

export function cloudinaryMockFactory() {
  return {
    uploadOnCloudinary: vi.fn(async (filePath) => {
      if (!filePath) return null
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      } catch {
        
      }
      const name = filePath.split(/[\\/]/).pop()
      return {
        url: `https://res.cloudinary.com/test/${name}`,
        public_id: `test_${name}`,
        duration: 42.5,
      }
    }),
    deleteFromCloudinary: vi.fn(async () => ({ result: "ok" })),
  }
}
