const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const AIModerator = require('../utils/AIModerator');
const ComponentBuilder = require('../utils/ComponentV2Builder');
const line = ComponentBuilder.separator();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scan-now')
        .setDescription('Cầm chổi quét sạch tin nhắn lừa đảo/độc hại trong kênh hiện tại.')
        .addIntegerOption(opt =>
            opt.setName('limit')
                .setDescription('Số lượng tin nhắn muốn quét (Tối đa 100, Mặc định 50)')
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const limit = interaction.options.getInteger('limit') || 50;

        // Cho bot suy nghĩ ẩn chuẩn V2
        await interaction.deferReply();

        const guildData = await Guild.findOne({ guildId: interaction.guildId });
        const regexList = guildData?.customRegexes || ['discord\\.gg\\/|discord\\.com\\/invite\\/'];
        const regexStr = regexList.join('|');
        const regex = new RegExp(regexStr, 'i');

        try {
            // Lấy tin nhắn
            const messages = await interaction.channel.messages.fetch({ limit: limit });
            let badMessages = [];
            let aiScannedCount = 0;

            const waitContainer = ComponentBuilder.container(line,
                '⏳ **ĐANG QUÉT HỆ THỐNG...**',
                `Bot đang soi **${messages.size}** tin nhắn gần nhất. Sếp đợi tí nhé...`,
                line
            );

            await interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [waitContainer]
            });

            for (const [id, msg] of messages) {
                if (msg.author.bot) continue;

                // 1. Quét Regex
                if (regex.test(msg.content)) {
                    badMessages.push(msg);
                    continue;
                }

                // 2. Quét AI (Gemini 2.5 Flash)
                const hasLink = msg.content.includes('http://') || msg.content.includes('https://') || msg.content.includes('discord');
                const hasImage = msg.attachments.some(att => att.contentType && att.contentType.startsWith('image/'));

                if (hasLink || hasImage) {
                    aiScannedCount++;
                    const aiResult = await AIModerator.analyze(msg.content, Array.from(msg.attachments.values()));
                    if (aiResult?.isMalicious) {
                        badMessages.push(msg);
                    }
                }
            }

            // 3. Tiêu diệt và báo cáo theo chuẩn V2
            if (badMessages.length > 0) {
                await interaction.channel.bulkDelete(badMessages, true);

                const successContainer = ComponentBuilder.container(line,
                    '🧹 **QUÉT HOÀN TẤT!**',
                    ComponentBuilder.separator(),
                    `- Đã quét tổng cộng: **${messages.size}** tin nhắn`,
                    `- Số tin nhắn gửi AI check: **${aiScannedCount}** tin`,
                    `- Đã tiêu diệt: **${badMessages.length}** mầm mống lừa đảo!`,
                    line
                );

                return interaction.editReply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [successContainer]
                });
            } else {
                const safeContainer = ComponentBuilder.container(line,
                    '✅ **QUÉT HOÀN TẤT! KHU VỰC AN TOÀN!**',
                    ComponentBuilder.separator(),
                    `- Đã quét tổng cộng: **${messages.size}** tin nhắn`,
                    `- Số tin nhắn gửi AI check: **${aiScannedCount}** tin`,
                    '- Không phát hiện tin nhắn nào vi phạm!',
                    line
                );

                return interaction.editReply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [safeContainer]
                });
            }

        } catch (error) {
            console.error('LỖI SCAN-NOW:', error);
            const errorContainer = ComponentBuilder.container(line, '❌ Có lỗi xảy ra khi quét tin nhắn. Sếp check log nhé!', line);
            return interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [errorContainer]
            });
        }
    }
};