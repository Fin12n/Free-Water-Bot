const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mode')
        .setDescription('Cài đặt hình phạt khi phát hiện lừa đảo')
        .addIntegerOption(opt =>
            opt.setName('type')
                .setDescription('Chọn mức độ trừng phạt')
                .setRequired(true)
                .addChoices(
                    { name: '1. Kick (Đuổi khỏi server)', value: 1 },
                    { name: '2. Ban (Cấm vĩnh viễn)', value: 2 },
                    { name: '3. Mute (Tắt tiếng 7 ngày)', value: 3 },
                    { name: '4. Cảnh báo (Chỉ xóa tin, không phạt)', value: 4 }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const modeValue = interaction.options.getInteger('type');

        // Cho bot suy nghĩ ẩn
        await interaction.deferReply();

        const modeNames = {
            1: 'Kick (Đuổi khỏi server)',
            2: 'Ban (Cấm vĩnh viễn)',
            3: 'Mute (Tắt tiếng 7 Ngày)',
            4: 'Cảnh báo (Chỉ xóa tin)'
        };

        try {
            await Guild.updateOne(
                { guildId: interaction.guildId },
                { $set: { mode: modeValue } },
                { upsert: true }
            );

            const modeContainer = ComponentBuilder.container(line, `✅ **Đã cập nhật Mode:** Hình phạt hiện tại là **${modeNames[modeValue]}**.`, line);

            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [modeContainer]
            });
        } catch (error) {
            console.error('LỖI MODE:', error);
            const errContainer = ComponentBuilder.container(line, '❌ Lỗi Database khi lưu hình phạt.', line);
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [errContainer]
            });
        }
    }
};