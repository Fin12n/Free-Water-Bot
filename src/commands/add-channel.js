const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');
const line = ComponentBuilder.separator();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-channel')
        .setDescription('Thêm channel để detect lừa đảo')
        .addStringOption(option =>
            option.setName('id-channel')
                .setDescription('ID channel (Bỏ trống = kênh hiện tại)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetChannelId = interaction.options.getString('id-channel') || interaction.channelId;

        // Cho bot vào trạng thái suy nghĩ ẩn
        await interaction.deferReply();

        try {
            // Tìm hoặc tạo mới data cho server
            let guildData = await Guild.findOne({ guildId: interaction.guildId });
            if (!guildData) {
                guildData = new Guild({ guildId: interaction.guildId, detectChannels: [] });
            }
            if (!guildData.detectChannels) guildData.detectChannels = [];

            // Kiểm tra xem kênh đã có trong danh sách chưa
            if (guildData.detectChannels.includes(targetChannelId)) {
                const warnContainer = ComponentBuilder.container(line, `⚠️ Kênh <#${targetChannelId}> đã có trong bẫy!`, line);
                return interaction.editReply({
                    flags: MessageFlags.IsComponentsV2, // Cờ báo hiệu đây là UI V2
                    components: [warnContainer]         // Đưa container vào mảng components
                });
            }

            // Thêm ID kênh vào mảng và lưu lại
            guildData.detectChannels.push(targetChannelId);
            await guildData.save();

            const successContainer = ComponentBuilder.container(line, `✅ **Thành công!** Đã đặt bẫy tại <#${targetChannelId}>.`, line);
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [successContainer]
            });

        } catch (error) {
            console.error('LỖI ADD-CHANNEL:', error);
            const errContainer = ComponentBuilder.container(line, '❌ Lỗi hệ thống khi lưu kênh.', line);
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [errContainer]
            });
        }
    },
};