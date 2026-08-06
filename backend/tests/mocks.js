import fs from "fs"

/**
 * Factory for mocking "../src/utils/cloudinary.js". Every upload-dependent test
 * file must call it through the lazy wrapper to dodge Vitest's hoisting:
 *
 *   vi.mock("../src/utils/cloudinary.js", () => cloudinaryMockFactory())
 *
 * (Passing the function reference directly fails with
 * "Cannot access '__vi_import_1__' before initialization".)
 *
 * Mirrors the real util's behavior: returns null for missing paths, unlinks the
 * local multer temp file, and provides a duration so publishAVideo can store it.
 */
export function cloudinaryMockFactory() {
  return {
    uploadOnCloudinary: async (filePath) => {
      if (!filePath) return null
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      } catch {
        /* best-effort cleanup */
      }
      const name = filePath.split(/[\\/]/).pop()
      return {
        url: `https://res.cloudinary.com/test/${name}`,
        public_id: `test_${name}`,
        duration: 42.5,
      }
    },
    deleteFromCloudinary: async () => ({ result: "ok" }),
  }
}
