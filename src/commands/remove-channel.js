const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-channel')
        .setDescription('Gỡ bẫy (Xóa channel khỏi danh sách quét lừa đảo)')
        .addStringOption(option =>
            option.setName('id-channel')
                .setDescription('ID channel (Bỏ trống = kênh hiện tại)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetChannelId = interaction.options.getString('id-channel') || interaction.channelId;

        // Cho bot suy nghĩ ẩn
        await interaction.deferReply();

        try {
            let guildData = await Guild.findOne({ guildId: interaction.guildId });

            if (!guildData || !guildData.detectChannels || !guildData.detectChannels.includes(targetChannelId)) {
                const warnContainer = ComponentBuilder.container(ComponentBuilder.separator(), `⚠️ Kênh <#${targetChannelId}> chưa được đặt bẫy nên không thể gỡ!`, ComponentBuilder.separator());
                return interaction.editReply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [warnContainer]
                });
            }

            // Lọc bỏ cái ID cần xóa ra khỏi mảng
            guildData.detectChannels = guildData.detectChannels.filter(id => id !== targetChannelId);
            await guildData.save();

            const successContainer = ComponentBuilder.container(ComponentBuilder.separator(), `✅ **Thành công!** Đã gỡ bẫy an toàn tại <#${targetChannelId}>.`, ComponentBuilder.separator());
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [successContainer]
            });

        } catch (error) {
            console.error('LỖI REMOVE-CHANNEL:', error);
            const errContainer = ComponentBuilder.container(ComponentBuilder.separator(), '❌ Lỗi hệ thống khi gỡ kênh.', ComponentBuilder.separator());
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [errContainer]
            });
        }
    },
};