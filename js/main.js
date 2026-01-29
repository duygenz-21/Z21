import { saveConfig, loadConfig } from './config.js';
import { handleFileUpload } from './fileHandler.js';
import { renderMermaid, initMermaid } from './mermaidRenderer.js';
import { callAI } from './aiService.js';
import * as UI from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    initMermaid();
    const dom = UI.getDOM();

    // 1. Load cấu hình cũ
    const config = loadConfig();
    dom.apiKey.value = config.apiKey;
    dom.model.value = config.model;
    dom.topP.value = config.topP;
    dom.temperature.value = config.temperature;

    // 2. Sự kiện lưu cấu hình
    dom.saveConfigBtn.addEventListener('click', () => {
        saveConfig({
            apiKey: dom.apiKey.value,
            model: dom.model.value,
            topP: dom.topP.value,
            temperature: dom.temperature.value
        });
    });

    // 3. Sự kiện Upload file
    dom.fileInput.addEventListener('change', (e) => {
        handleFileUpload(e.target.files[0], (code) => {
            dom.mermaidCode.value = code;
            renderMermaid('diagramContainer', code);
        });
    });

    // 4. Sự kiện Render thủ công
    dom.renderBtn.addEventListener('click', () => {
        renderMermaid('diagramContainer', dom.mermaidCode.value);
    });

    // 5. Sự kiện gọi AI
    dom.generateBtn.addEventListener('click', async () => {
        const currentCode = dom.mermaidCode.value;
        const prompt = dom.aiPrompt.value;

        if (!prompt) {
            UI.showError("⚠️ Vui lòng nhập yêu cầu cho AI!");
            return;
        }

        UI.toggleLoading(true);
        try {
            const config = {
                apiKey: dom.apiKey.value,
                model: dom.model.value,
                topP: dom.topP.value,
                temperature: dom.temperature.value
            };

            const newCode = await callAI(currentCode, prompt, config);
            dom.mermaidCode.value = newCode; // Cập nhật code vào ô input
            await renderMermaid('diagramContainer', newCode); // Vẽ lại
        } catch (error) {
            UI.showError(`❌ Lỗi: ${error.message}`);
        } finally {
            UI.toggleLoading(false);
        }
    });
});
