const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ActionRowBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-log')
        .setDescription('Cài đặt kênh nhận thông báo an ninh')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Tạo giao diện chọn kênh bằng Components V2
        const container = ComponentBuilder.container(null,
            ComponentBuilder.separator(),
            '⚙️ **CÀI ĐẶT KÊNH LOG**',
            'Vui lòng chọn một kênh bên dưới để bot gửi báo cáo an ninh:',
            ComponentBuilder.separator()
        );

        const menu = ComponentBuilder.channelSelectMenu('select_log_channel', '📌 Chọn kênh lưu Log...');
        const row = new ActionRowBuilder().addComponents(menu);

        // 1. Gửi menu với cờ V2 chuẩn
        const response = await interaction.reply({
            flags: MessageFlags.IsComponentsV2, // Bắt buộc theo chuẩn V2
            components: [container, row]
        });

        try {
            // 2. Chờ Admin chọn kênh (Timeout 1 phút)
            const confirmation = await response.awaitMessageComponent({
                filter: i => i.customId === 'select_log_channel' && i.user.id === interaction.user.id,
                time: 60000
            });

            // 3. Phản hồi tín hiệu ngay để không bị lỗi "Interaction failed"
            await confirmation.deferUpdate();

            const selectedChannelId = confirmation.values[0];

            // 4. Lưu vào Database
            await Guild.updateOne(
                { guildId: interaction.guildId },
                { $set: { logChannel: selectedChannelId } },
                { upsert: true }
            );

            // 5. Cập nhật UI thông báo thành công theo chuẩn V2
            const successContainer = ComponentBuilder.container(null, line,
                `✅ **THÀNH CÔNG**`,
                `Kênh log đã được đặt tại <#${selectedChannelId}>.`,
                line
            );

            await confirmation.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [successContainer] // Xóa menu cũ, chỉ để lại thông báo
            });

        } catch (error) {
            console.log('Menu set-log đã hết hạn hoặc có lỗi:', error.message);
            // Nếu hết hạn thì xóa menu đi cho đỡ rối
            await interaction.editReply({ components: [] }).catch(() => null);
        }
    }
};