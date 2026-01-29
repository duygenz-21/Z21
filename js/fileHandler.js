export function handleFileUpload(file, callback) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        // Trích xuất block mermaid nếu nằm trong markdown ```mermaid ... ```
        const mermaidMatch = content.match(/```mermaid([\s\S]*?)```/);
        
        if (mermaidMatch && mermaidMatch[1]) {
            callback(mermaidMatch[1].trim());
        } else {
            // Nếu không tìm thấy thẻ code, giả định toàn bộ file là mermaid code
            callback(content);
        }
    };
    reader.readAsText(file);
}
