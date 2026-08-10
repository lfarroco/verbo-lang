
export const deepseek = (key: string, model: string) => async (prompt: string): Promise<string> => {

	const response = await fetch("https://api.deepseek.com/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${key}`
		},
		body: JSON.stringify({
			model,
			messages: [
				{ role: "user", content: prompt }
			],
			// Reasoning models can emit long chains of thought; without a large
			// max_tokens the final `content` gets truncated (finish_reason "length").
			max_tokens: 8192
		})
	})

	// Surface auth / quota / unknown-model errors from the API envelope before
	// assuming the body is a valid completion.
	if (!response.ok) {
		const body = await response.text();
		throw new Error(`DeepSeek API error (${response.status}): ${body.slice(0, 500)}`)
	}

	const data = await response.json()

	const choice = data.choices?.[0]

	// check validity of response

	if (!choice?.message?.content) {
		throw new Error(`Invalid response from DeepSeek: ${JSON.stringify(data)}`)
	}

	if (choice.finish_reason === "length") {
		throw new Error(`DeepSeek response truncated (finish_reason "length"); content may be incomplete`)
	}

	return choice.message.content

}
