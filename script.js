// --- CONSTANTS & STATE ---
const DEFAULT_CODE = `graph TD;
    Start((Bắt đầu)) --> Process[Xử lý];
    Process --> End((Kết thúc));
    style Start fill:#f9f,stroke:#333,stroke-width:2px`;

let currentCode = DEFAULT_CODE;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load API Key từ LocalStorage (Thay cho db.get_api_key)
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
        document.getElementById('apiKeyInput').value = savedKey;
    }

    // 2. Load History hoặc Default Code
    const savedHistory = localStorage.getItem('last_mermaid_code');
    if (savedHistory) {
        currentCode = savedHistory;
    }
    
    // 3. Render lần đầu
    updateUI(currentCode);
    
    // 4. Cleanup check (Giả lập logic xóa cũ)
    const lastCleanup = localStorage.getItem('last_cleanup_date');
    const now = new Date().getTime();
    if (!lastCleanup || now - lastCleanup > 30 * 24 * 60 * 60 * 1000) {
        // Thực hiện cleanup ảo
        localStorage.setItem('last_cleanup_date', now);
        document.getElementById('cleanupMsg').classList.remove('hidden');
    }
});

// --- CORE FUNCTIONS ---

// Lưu API Key
function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value;
    localStorage.setItem('openai_api_key', key);
    showToast('Đã lưu API Key vào trình duyệt!', '💾');
}

// Cập nhật giá trị thanh trượt
function updateTempDisplay() {
    document.getElementById('tempVal').innerText = document.getElementById('tempRange').value;
}

// Render Mermaid Diagram
async function renderMermaid(code) {
    const container = document.getElementById('mermaidContainer');
    const editor = document.getElementById('mermaidCodeEditor');
    
    // Update editor
    editor.value = code;
    
    try {
        // Reset container để mermaid render lại
        container.removeAttribute('data-mermaid-processed');
        container.innerHTML = `<div class="mermaid">${code}</div>`;
        
        // Gọi thư viện Mermaid để vẽ
        await window.mermaid.run({
            nodes: container.querySelectorAll('.mermaid')
        });
    } catch (e) {
        container.innerHTML = `<div style="color:red">Lỗi hiển thị: ${e.message}</div>`;
    }
}

// Hàm cập nhật toàn bộ UI và lưu state
function updateUI(code) {
    currentCode = code;
    localStorage.setItem('last_mermaid_code', code); // Thay cho db.save_history
    renderMermaid(code);
}

// Xử lý chỉnh sửa thủ công (Textarea)
function manualEdit() {
    const code = document.getElementById('mermaidCodeEditor').value;
    updateUI(code);
}

// Tải xuống file
function downloadCode() {
    const blob = new Blob([currentCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.mmd";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Reset App
function resetApp() {
    if(confirm("Bạn có chắc muốn reset không?")) {
        localStorage.removeItem('last_mermaid_code');
        location.reload();
    }
}

// --- FILE UPLOAD LOGIC ---
function handleFileUpload() {
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const ext = file.name.split('.').pop();
        
        const extracted = extractMermaidCode(text, ext);
        if (extracted) {
            updateUI(extracted);
            showToast("Đã nhập dữ liệu thành công!", "📥");
        } else {
            showToast("Không tìm thấy nội dung hợp lệ!", "⚠️");
        }
    };
    reader.readAsText(file);
    // Reset input để có thể chọn lại file cũ nếu muốn
    fileInput.value = '';
}

// Logic tách code (tương tự utils.extract_mermaid_code)
function extractMermaidCode(text, extension) {
    if (['md', 'markdown'].includes(extension)) {
        const match = text.match(/```mermaid([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    } else {
        // Loại bỏ markdown nếu user copy thừa
        return text.replace(/```mermaid/g, "").replace(/```/g, "").trim();
    }
}

// --- AI SERVICE (Client-side Fetch) ---
async function callAiUpdate() {
    const apiKey = document.getElementById('apiKeyInput').value;
    const userRequestInput = document.getElementById('userRequest');
    const userRequest = userRequestInput.value;
    const model = document.getElementById('modelSelect').value;
    const temp = parseFloat(document.getElementById('tempRange').value);

    if (!userRequest) return;
    if (!apiKey) {
        showToast("Vui lòng nhập API Key trong cài đặt!", "⚠️");
        return;
    }

    // UI Loading
    document.getElementById('spinner').classList.remove('hidden');

    const systemPrompt = `
    Bạn là một chuyên gia về Mermaid JS. Nhiệm vụ của bạn là cập nhật biểu đồ dựa trên yêu cầu của người dùng.
    QUY TẮC TUYỆT ĐỐI:
    1. Chỉ trả về mã Mermaid thuần túy.
    2. KHÔNG bao gồm markdown (\\\`\\\`\\\`mermaid), không giải thích, không lời chào.
    3. Giữ nguyên logic cũ, chỉ thêm hoặc sửa theo yêu cầu.
    `;

    const userContent = `Code hiện tại:\n${currentCode}\n\nYêu cầu thay đổi: ${userRequest}`;

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
                temperature: temp
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        let newCode = data.choices[0].message.content.trim();
        // Clean data (giống python)
        newCode = newCode.replace(/```mermaid/g, "").replace(/```/g, "").trim();
        
        updateUI(newCode);
        showToast("Cập nhật thành công!", "✨");
        
        // --- FEATURE REQUEST: CLEAR INPUT ---
        userRequestInput.value = ""; 

    } catch (e) {
        showToast(`Lỗi: ${e.message}`, "❌");
    } finally {
        document.getElementById('spinner').classList.add('hidden');
    }
}

// --- HELPER UI FUNCTIONS ---
function toggleExpander(header) {
    const parent = header.parentElement;
    parent.classList.toggle('collapsed');
    parent.classList.toggle('open');
}

function showToast(message, icon = '') {
    const toast = document.getElementById('toast');
    toast.innerHTML = `${icon} ${message}`;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
