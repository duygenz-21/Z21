export async function callAI(currentCode, userPrompt, config) {
    if (!config.apiKey) throw new Error("Chưa nhập API Key!");

    // System prompt để định hướng AI chỉ trả về code
    const systemInstruction = `
    You are an expert in Mermaid JS diagrams.
    Task: Update the provided Mermaid code based on the user's request.
    Rules:
    1. Return ONLY the raw Mermaid code. No markdown formatting (\`\`\`), no explanations.
    2. Maintain the existing logic and flow unless asked to change.
    `;

    const userMessage = `
    Current Code:
    ${currentCode}

    User Request:
    ${userPrompt}
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userMessage }
            ],
            top_p: parseFloat(config.topP),
            temperature: parseFloat(config.temperature)
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Lỗi kết nối OpenRouter");
    }

    const data = await response.json();
    let newCode = data.choices[0].message.content;
    
    // Làm sạch code nếu AI lỡ thêm markdown
    newCode = newCode.replace(/```mermaid/g, '').replace(/```/g, '').trim();
    
    return newCode;
}
