const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem danh sách lệnh và hướng dẫn sử dụng bot Liễu Như Yên'),

    async execute(interaction) {
        // Cho bot suy nghĩ ẩn
        await interaction.deferReply();

        try {
            const guildData = await Guild.findOne({ guildId: interaction.guildId });
            const currentPrefix = guildData?.prefix || '!';

            // Đóng gói nội dung vào Container V2
            const helpContainer = ComponentBuilder.container(0x00FFFF,
                '🛡️ **HƯỚNG DẪN SỬ DỤNG BOT**',
                `Prefix tin nhắn hiện tại: \`${currentPrefix}\``,
                ComponentBuilder.separator(),
                `📍 **Quản lý bẫy:** \`/add-channel\`, \`/remove-channel\`\n⚙️ **Cài đặt:** \`/mode\`, \`/reason\`, \`/prefix\`, \`/whitelist\`, \`/set-log\`\n📢 **Thông báo:** \`/broadcast\`\n🧹 **Dọn rác:** \`/scan-now\`\n📋 **Thống kê:** \`/ban-list\``
            );

            // Trả về UI V2 Native
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2, // Cờ V2
                components: [helpContainer]         // Không dùng embeds nữa
            });

        } catch (error) {
            console.error('LỖI HELP:', error);
            const errContainer = ComponentBuilder.container(line, '❌ Có lỗi xảy ra khi tải hướng dẫn!', line);
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [errContainer]
            });
        }
    }
};