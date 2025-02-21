/* eslint-disable @typescript-eslint/naming-convention */
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '~/src': path.resolve(__dirname, './src'),
      '~/lib': path.resolve(__dirname, './lib'),
    },
  },
})
