const geminiURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

export const gemini = (key: string) => async (prompt: string): Promise<string> => {

	const response = await fetch(
		`${geminiURL}?key=${key}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{
								text: prompt,
							},
						],
					},
				],
			}),
		}
	);

	const json = await response.json();

	// check if the response is valid (should have candidates and parts)
	if (!json.candidates || !json.candidates[0].content.parts) {
		throw new Error(`Invalid response from the AI: ${JSON.stringify(json, null, 2)}`)
	}

	let { text } = json.candidates[0].content.parts[0];

	return text;

}