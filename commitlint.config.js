import { defineConfig } from 'cz-git'

export default defineConfig({
	extends: ['@commitlint/config-conventional'],
	prompt: {
		useEmoji: false,
		allowEmptyScopes: true,
		allowCustomScopes: true,
		allowBreakingChanges: ['feat', 'fix'],
	},
})
