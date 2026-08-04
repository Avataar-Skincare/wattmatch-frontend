import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import 'vite-react-ssg'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  ssgOptions: {
    // '/foo' -> '/foo/index.html', matching directory-style hosting on S3.
    dirStyle: 'nested',
  },
})
