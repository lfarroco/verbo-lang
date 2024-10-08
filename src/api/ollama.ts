
export const ollama = (model: string) => async (prompt: string): Promise<string> => {

	const response = await fetch("http://localhost:11434/api/generate", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			prompt,
			stream: false,
		})
	})

	const data = await response.json()

	// check validity of response

	if (!data.response) {
		throw new Error(`Invalid response from Ollama: ${JSON.stringify(data, null)}`)
	}

	return data.response

}