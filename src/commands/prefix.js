const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Cài đặt Prefix cho các lệnh tin nhắn thường (VD: !help, ?help)')
        .addStringOption(opt =>
            opt.setName('symbol')
                .setDescription('Ký tự Prefix (VD: !, ?, -, /)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const newPrefix = interaction.options.getString('symbol');

        // Cho bot suy nghĩ ẩn
        await interaction.deferReply();

        try {
            await Guild.updateOne(
                { guildId: interaction.guildId },
                { $set: { prefix: newPrefix } },
                { upsert: true }
            );

            // Đóng gói thông báo vào Container V2
            const prefixContainer = ComponentBuilder.container(line, `✅ **Đã cập nhật Prefix:** Ký tự gọi lệnh hiện tại là \`${newPrefix}\``, line);

            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [prefixContainer]
            });
        } catch (error) {
            console.error('LỖI PREFIX:', error);
            const errContainer = ComponentBuilder.container(line, '❌ Lỗi Database khi lưu Prefix.', line);
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [errContainer]
            });
        }
    }
};