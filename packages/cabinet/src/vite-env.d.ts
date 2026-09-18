/// <reference types="vite/client" />

// Font package — CSS-only import, no type declarations.
declare module '@fontsource-variable/manrope'

interface ImportMetaEnv {
	readonly VITE_API_BASE?: string
}
