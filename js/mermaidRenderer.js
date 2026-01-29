export async function renderMermaid(containerId, code) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Xóa cũ
    
    try {
        // Mermaid cần một ID duy nhất cho mỗi lần render
        const id = `mermaid-${Date.now()}`;
        // Sử dụng API render của mermaid 10+
        const { svg } = await mermaid.render(id, code);
        container.innerHTML = svg;
        return true;
    } catch (error) {
        console.error('Mermaid Error:', error);
        container.innerHTML = `<div style="color:red">Lỗi cú pháp Mermaid!<br>${error.message}</div>`;
        return false;
    }
}

export function initMermaid() {
    mermaid.initialize({ 
        startOnLoad: true, 
        theme: 'default',
        securityLevel: 'loose'
    });
}
