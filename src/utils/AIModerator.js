const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIModerator {
    static async analyze(messageContent, attachments = []) {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }
                ]
            });

            const prompt = `Bạn là hệ thống Auto-Mod. Phân tích tin nhắn và hình ảnh xem có chứa ý đồ lừa đảo, giả mạo người nổi tiếng, dụ dỗ crypto, link mã độc, hoặc lừa lấy tài khoản không. Chỉ trả về DUY NHẤT một chuỗi JSON: {"isMalicious": true/false, "reason": "Lý do bằng tiếng Việt"}. Nội dung text: "${messageContent || '(Không có text)'}"`;

            const aiParts = [prompt];

            for (const attachment of attachments) {
                if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                    try {
                        const response = await fetch(attachment.url);
                        const arrayBuffer = await response.arrayBuffer();
                        aiParts.push({
                            inlineData: { data: Buffer.from(arrayBuffer).toString("base64"), mimeType: attachment.contentType }
                        });
                    } catch (err) { }
                }
            }

            const result = await model.generateContent(aiParts);
            const cleanJsonStr = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJsonStr);

        } catch (error) {
            return { isMalicious: false, reason: "" };
        }
    }
}
module.exports = AIModerator;