export async function askAI(prompt: string, apiKey: string): Promise<string> {
  const model = "llama-3.3-70b-versatile"; // Updated to current active model
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "You are an expert tender submission assistant. You help users understand what documents they are missing and how to prepare them correctly. Be concise, polite, and helpful." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to fetch AI response");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error(error.message || "An unknown error occurred while contacting AI.");
  }
}
