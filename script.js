// --- CONSTANTS & STATE ---
const DEFAULT_CODE = `graph TD;\n  Start((Bắt đầu)) --> Process[Xử lý];\n  Process --> End((Kết thúc));\n  style Start fill:#f9f,stroke:#333`;
let currentCode = DEFAULT_CODE;

document.addEventListener('DOMContentLoaded', () => {
    // Load Settings
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) document.getElementById('apiKeyInput').value = savedKey;

    const savedHistory = localStorage.getItem('last_mermaid_code');
    if (savedHistory) currentCode = savedHistory;

    updateUI(currentCode);
});

// --- UI LOGIC ---
function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.toggle('hidden');
}

function closeSettings(e) {
    if (e.target.id === 'settingsModal') {
        toggleSettings();
    }
}

function updateParamsDisplay() {
    document.getElementById('tempVal').innerText = document.getElementById('tempRange').value;
    document.getElementById('topKVal').innerText = document.getElementById('topKRange').value;
}

function toggleCodeEditor() {
    const panel = document.getElementById('codeEditorPanel');
    panel.classList.toggle('hidden');
    // Sync nội dung khi mở
    if(!panel.classList.contains('hidden')) {
        document.getElementById('mermaidCodeEditor').value = currentCode;
    }
}

// --- CORE FUNCTIONS ---
function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value;
    localStorage.setItem('openai_api_key', key);
    showToast('Đã lưu API Key!', '💾');
}

async function renderMermaid(code) {
    const container = document.getElementById('mermaidContainer');
    try {
        container.innerHTML = `<div class="mermaid">${code}</div>`;
        await window.mermaid.run({ nodes: container.querySelectorAll('.mermaid') });
    } catch (e) {
        container.innerHTML = `<div style="color:red; padding:20px">Lỗi hiển thị: ${e.message}</div>`;
    }
}

function updateUI(code) {
    currentCode = code;
    localStorage.setItem('last_mermaid_code', code);
    renderMermaid(code);
    document.getElementById('mermaidCodeEditor').value = code;
}

function manualEdit() {
    const code = document.getElementById('mermaidCodeEditor').value;
    updateUI(code);
}

// --- AI SERVICE ---
async function callAiUpdate() {
    const apiKey = document.getElementById('apiKeyInput').value;
    const userRequestInput = document.getElementById('userRequest');
    const userRequest = userRequestInput.value;
    const model = document.getElementById('modelSelect').value;
    
    // Lấy params mới
    const temp = parseFloat(document.getElementById('tempRange').value);
    const topK = parseInt(document.getElementById('topKRange').value); // [Top K added]

    if (!userRequest) return;
    if (!apiKey) {
        toggleSettings(); // Mở setting nếu chưa có key
        showToast("Cần nhập API Key trước!", "⚠️");
        return;
    }

    document.getElementById('spinner').classList.remove('hidden');

    const systemPrompt = `Bạn là chuyên gia Mermaid JS. CHỈ trả về code mermaid thuần túy. KHÔNG markdown.`;
    const userContent = `Code cũ:\n${currentCode}\n\nYêu cầu: ${userRequest}`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                temperature: temp,
                top_k: topK // Gửi tham số Top K
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let newCode = data.choices[0].message.content.replace(/```mermaid/g, "").replace(/```/g, "").trim();
        updateUI(newCode);
        showToast("Đã vẽ xong!", "✨");
        userRequestInput.value = "";

    } catch (e) {
        showToast(`Lỗi: ${e.message}`, "❌");
    } finally {
        document.getElementById('spinner').classList.add('hidden');
    }
}

// --- UTILS ---
function downloadCode() {
    const blob = new Blob([currentCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "diagram.mmd";
    a.click(); URL.revokeObjectURL(url);
}

function showToast(msg, icon) {
    const toast = document.getElementById('toast');
    toast.innerHTML = `${icon} ${msg}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function handleFileUpload() {
    const file = document.getElementById('fileUpload').files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        updateUI(e.target.result); // Simplified logic
        showToast("Đã tải file!", "📂");
        toggleSettings(); // Đóng modal sau khi chọn
    };
    reader.readAsText(file);
}

function resetApp() {
    if(confirm("Xóa toàn bộ dữ liệu?")) {
        localStorage.clear();
        location.reload();
    }
}
