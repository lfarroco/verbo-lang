
export const openai = (key: string) => async (prompt: string): Promise<string> => {

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${key}`
		},
		body: JSON.stringify({
			model: "gpt-4o", // TODO: add "model" param
			messages: [
				{ role: "user", content: prompt }
			]
		})
	})

	const data = await response.json()

	// check validity of response

	if (!data.choices || !data.choices[0].message) {
		throw new Error(`Invalid response from OpenAI: ${JSON.stringify(data, null)}`)
	}

	return data.choices[0].message.content

}