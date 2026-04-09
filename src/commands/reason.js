const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');
const line = ComponentBuilder.separator();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reason')
        .setDescription('Cài đặt lý do hiển thị khi phạt user')
        .addStringOption(opt =>
            opt.setName('text')
                .setDescription('Nhập nội dung lý do')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const newReason = interaction.options.getString('text');

        // Cho bot suy nghĩ ẩn
        await interaction.deferReply();

        try {
            await Guild.updateOne(
                { guildId: interaction.guildId },
                { $set: { reason: newReason } },
                { upsert: true }
            );

            // Đóng gói thông báo vào Container V2 chuẩn
            const reasonContainer = ComponentBuilder.container(line,
                `✅ **Đã cập nhật Lý do:**`,
                `\`${newReason}\``,
                line
            );

            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [reasonContainer]
            });
        } catch (error) {
            console.error('LỖI REASON:', error);
            const errContainer = ComponentBuilder.container(line, '❌ Lỗi Database khi lưu lý do.', line);
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [errContainer]
            });
        }
    }
};