
export const supportedLanguages = {
	js: "JavaScript",
	py: "Python",
	ts: "TypeScript",
	hs: "Haskell",
	rs: "Rust",
	go: "Golang",
	c: "C",
	java: "Java",
	rb: "Ruby",
	cpp: "C++",
	cs: "C#",
	swift: "Swift",
	kt: "Kotlin",
	dart: "Dart",
	php: "PHP",
	jsx: "JSX",
	tsx: "TSX",
} as { [key: string]: string };

export type supportedLanguageCode = keyof typeof supportedLanguages;

export const supportedLanguageCodes = Object.keys(supportedLanguages) as supportedLanguageCode[];