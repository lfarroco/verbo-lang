
export const ollama = (model: string) => async (prompt: string): Promise<string> => {

	// The Ollama base URL is configurable so the tool works from inside a
	// container (e.g. the `ollama` service in docker-compose.yml).
	const baseUrl = (Deno.env.get("OLLAMA_URL") ?? "http://localhost:11434").replace(/\/+$/, "");

	const response = await fetch(`${baseUrl}/api/generate`, {
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