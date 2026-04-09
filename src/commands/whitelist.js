const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Quản lý danh sách người dùng được tin cậy (Bot sẽ bỏ qua không quét)')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Thêm người dùng vào whitelist')
                .addUserOption(opt => opt.setName('user').setDescription('Chọn người dùng').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Xóa người dùng khỏi whitelist')
                .addUserOption(opt => opt.setName('user').setDescription('Chọn người dùng').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Xem danh sách whitelist hiện tại')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');

        try {
            let guildData = await Guild.findOne({ guildId: interaction.guildId });
            if (!guildData) {
                guildData = new Guild({ guildId: interaction.guildId, whitelistedUsers: [] });
            }

            if (subcommand === 'add') {
                if (guildData.whitelistedUsers.includes(user.id)) {
                    const container = ComponentBuilder.container(null, line, `⚠️ Người dùng <@${user.id}> đã có trong Whitelist rồi!`, line);
                    return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
                }

                guildData.whitelistedUsers.push(user.id);
                await guildData.save();

                const container = ComponentBuilder.container(null, line, `✅ Đã thêm <@${user.id}> vào Whitelist thành công.`, line);
                return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
            }

            if (subcommand === 'remove') {
                if (!guildData.whitelistedUsers.includes(user.id)) {
                    const container = ComponentBuilder.container(null, line, `⚠️ Người dùng <@${user.id}> không có trong Whitelist.`, line);
                    return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
                }

                guildData.whitelistedUsers = guildData.whitelistedUsers.filter(id => id !== user.id);
                await guildData.save();

                const container = ComponentBuilder.container(null, line, `✅ Đã xóa <@${user.id}> khỏi Whitelist.`, line);
                return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
            }

            if (subcommand === 'list') {
                if (!guildData.whitelistedUsers || guildData.whitelistedUsers.length === 0) {
                    const container = ComponentBuilder.container(null, line, '📄 **WHITELIST TRỐNG**\nServer chưa có ai trong danh sách tin cậy.', line);
                    return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
                }

                const list = guildData.whitelistedUsers.map((id, index) => `**${index + 1}.** <@${id}>`).join('\n');
                const container = ComponentBuilder.container(null, line,
                    '📄 **DANH SÁCH WHITELIST**',
                    ComponentBuilder.separator(),
                    list
                );

                return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
            }

        } catch (error) {
            console.error('LỖI WHITELIST:', error);
            const container = ComponentBuilder.container(null, line, '❌ Lỗi hệ thống khi xử lý Whitelist.', line);
            return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
        }
    }
};