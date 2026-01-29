export const CONFIG_KEYS = {
    API_KEY: 'or_api_key',
    MODEL: 'or_model',
    TOP_P: 'or_top_p',
    TEMP: 'or_temp'
};

export function saveConfig(data) {
    localStorage.setItem(CONFIG_KEYS.API_KEY, data.apiKey);
    localStorage.setItem(CONFIG_KEYS.MODEL, data.model);
    localStorage.setItem(CONFIG_KEYS.TOP_P, data.topP);
    localStorage.setItem(CONFIG_KEYS.TEMP, data.temperature);
    alert('✅ Cấu hình đã được lưu!');
}

export function loadConfig() {
    return {
        apiKey: localStorage.getItem(CONFIG_KEYS.API_KEY) || '',
        model: localStorage.getItem(CONFIG_KEYS.MODEL) || 'google/gemini-2.0-flash-exp',
        topP: localStorage.getItem(CONFIG_KEYS.TOP_P) || '0.9',
        temperature: localStorage.getItem(CONFIG_KEYS.TEMP) || '0.7'
    };
}
