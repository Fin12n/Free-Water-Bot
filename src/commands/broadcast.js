const { SlashCommandBuilder, PermissionFlagsBits, TextInputStyle, MessageFlags } = require('discord.js');
const ComponentBuilder = require('../utils/ComponentV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('Phát sóng thông báo toàn server (Sử dụng giao diện V2)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // 1. Tạo Form nhập liệu (Modal)
        const modal = ComponentBuilder.modal({
            id: 'broadcast_modal',
            title: '📢 SOẠN THÔNG BÁO SERVER',
            inputs: [
                { id: 'bc_title', label: 'Tiêu đề thông báo', style: TextInputStyle.Short, placeholder: 'VD: THÔNG BÁO BẢO TRÌ...', required: true },
                { id: 'bc_content', label: 'Nội dung chi tiết', style: TextInputStyle.Paragraph, placeholder: 'Nhập nội dung thông báo tại đây...', required: true },
                { id: 'bc_color', label: 'Mã màu Hex (Tùy chọn)', style: TextInputStyle.Short, placeholder: 'VD: 00FF00', required: false }
            ]
        });

        // 2. Hiện Pop-up lên cho Admin (Lưu ý: Modal không dùng deferReply)
        await interaction.showModal(modal);

        try {
            // 3. Đợi admin nhấn nút Gửi (Thời gian chờ 5 phút)
            const submitted = await interaction.awaitModalSubmit({
                filter: i => i.user.id === interaction.user.id && i.customId === 'broadcast_modal',
                time: 300000
            });

            const titleText = submitted.fields.getTextInputValue('bc_title');
            const contentText = submitted.fields.getTextInputValue('bc_content');
            let colorInput = submitted.fields.getTextInputValue('bc_color') || '00FFFF';

            // Xử lý mã màu
            const finalColor = colorInput.startsWith('0x') ? parseInt(colorInput, 16) : parseInt(colorInput.replace('#', ''), 16);

            // 4. Đóng gói thông báo vào Container V2 xịn xò
            const broadcastContainer = ComponentBuilder.container(finalColor,
                `📢 **${titleText.toUpperCase()}**`,
                ComponentBuilder.separator(),
                contentText
            );

            // 5. Gửi thông báo ra kênh (Dùng cờ IsComponentsV2 chuẩn Auth)
            await submitted.channel.send({
                flags: [MessageFlags.IsComponentsV2],
                components: [broadcastContainer]
            });

            // Phản hồi riêng cho Admin biết đã gửi thành công
            await submitted.reply({ content: '✅ Đã phát loa thành công!' });

        } catch (error) {
            console.log('Hết hạn nhập form hoặc lỗi Broadcast:', error.message);
        }
    }
};