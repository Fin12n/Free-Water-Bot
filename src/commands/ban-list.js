const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');
const line = ComponentBuilder.separator();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban-list')
        .setDescription('Xem danh sách những kẻ đã lọt bẫy (Sổ tử thần)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Cho bot suy nghĩ ẩn
        await interaction.deferReply();

        try {
            const guildData = await Guild.findOne({ guildId: interaction.guildId });

            // Check xem database có dữ liệu không
            if (!guildData || !guildData.punishedUsers || guildData.punishedUsers.length === 0) {
                const emptyContainer = ComponentBuilder.container(0x2B2D31, line, '📜 **Chưa có ai lọt bẫy cả!** Server hiện tại đang rất bình yên.', line);
                return interaction.editReply({
                    flags: MessageFlags.IsComponentsV2, // Cờ V2
                    components: [emptyContainer]        // Đổi từ embeds sang components
                });
            }

            // Lấy 15 thanh niên xui xẻo gần nhất (đảo ngược mảng để thằng mới nhất lên đầu)
            const recent = [...guildData.punishedUsers].reverse().slice(0, 15);
            let listStr = '';

            recent.forEach((r, i) => {
                const date = new Date(r.timestamp).toLocaleString('vi-VN');
                listStr += `**${i + 1}.** <@${r.userId}> | **${r.action}** | \`${date}\`\n`;
            });

            // Đóng gói bằng Components V2 
            const listContainer = ComponentBuilder.container(0x2B2D31,
                `💀 **SỔ TỬ THẦN (${guildData.punishedUsers.length} nạn nhân)**`,
                ComponentBuilder.separator(),
                listStr
            );

            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [listContainer]
            });

        } catch (error) {
            console.error('LỖI BAN-LIST:', error);
            const errContainer = ComponentBuilder.container(0xFF0000, line, '❌ Có lỗi khi tải danh sách. Sếp check log nhé!', line);
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [errContainer]
            });
        }
    }
};