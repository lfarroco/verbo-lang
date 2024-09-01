

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
};

export type supportedLanguageCode = keyof typeof supportedLanguages;

export const supportedLanguageCodes = Object.keys(supportedLanguages) as supportedLanguageCode[];