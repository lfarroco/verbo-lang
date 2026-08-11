
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
			// Disable chain-of-thought: reasoning tokens count against
			// max_tokens, and with them enabled the model can burn the whole
			// budget thinking and return empty content (finish_reason
			// "length"). Disabling them makes extraction ~40x faster and
			// ~16x cheaper with equal quality on the fixtures; the repair
			// loop catches any regression.
			thinking: { type: "disabled" },
			// Generous headroom; the API ceiling is 393216 (probed 2026-08).
			max_tokens: 32768
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
		const reason = choice?.finish_reason
			? ` (finish_reason "${choice.finish_reason}")`
			: "";
		const hint = choice?.message?.reasoning_content
			? " The model spent its token budget on reasoning and returned no content."
			: "";
		throw new Error(`Invalid response from DeepSeek: empty content${reason}.${hint}`)
	}

	if (choice.finish_reason === "length") {
		throw new Error(`DeepSeek response truncated (finish_reason "length"); content may be incomplete`)
	}

	return choice.message.content

}
