

export const anthropic = (key: string, model: string) => async (prompt: string): Promise<string> => {

	const response = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"anthropic-version": "2023-06-01",
			"x-api-key": key,
		},
		body: JSON.stringify({
			model,
			max_tokens: 4096,
			messages: [
				{ role: "user", content: prompt }
			]
		})

	})

	const data = await response.json()

	if (!data.content || !data.content[0]?.text) {
		throw new Error(`Invalid response from Anthropic: ${JSON.stringify(data, null)}`)
	}

	return data.content[0].text

}