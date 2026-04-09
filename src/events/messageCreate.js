const { Events, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const ComponentBuilder = require('../utils/ComponentV2Builder');
const AIModerator = require('../utils/AIModerator');

async function wipeUserMessages(guild, userId, minutes = 10) {
    const timeLimit = Date.now() - (minutes * 60 * 1000);
    const textChannels = guild.channels.cache.filter(c => c.isTextBased());
    for (const [channelId, channel] of textChannels) {
        try {
            const messages = await channel.messages.fetch({ limit: 50 });
            const target = messages.filter(m => m.author.id === userId && m.createdTimestamp > timeLimit);
            if (target.size > 0) await channel.bulkDelete(target, true);
        } catch (error) { continue; }
    }
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        let guildData = await Guild.findOne({ guildId: message.guild.id });
        if (!guildData) {
            guildData = new Guild({ guildId: message.guild.id });
            await guildData.save();
        }

        // WHITELIST KIM BÀI MIỄN TỬ
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
        const isWhitelistedUser = guildData.whitelistedUsers?.includes(message.author.id);
        const isWhitelistedRole = guildData.whitelistedRoles && message.member.roles.cache.some(role => guildData.whitelistedRoles.includes(role.id));
        const isSafe = isAdmin || isWhitelistedUser || isWhitelistedRole;
        const currentPrefix = guildData.prefix || '!';

        // 1. HONEYPOT (BẪY)
        if (guildData.detectChannels?.includes(message.channel.id)) {
            if (isSafe) return;
            try { await message.delete(); } catch (err) { }

            const mode = guildData.mode;
            const reason = guildData.reason;
            const member = message.member;
            let actionTaken = 'Không xác định';

            try {
                if (mode === 1 && member.kickable) { await member.kick(reason); actionTaken = 'Kick'; wipeUserMessages(message.guild, message.author.id); }
                else if (mode === 2 && member.bannable) { await member.ban({ deleteMessageSeconds: 600, reason: reason }); actionTaken = 'Ban'; }
                else if (mode === 3 && member.moderatable) { await member.timeout(7 * 24 * 60 * 60 * 1000, reason); actionTaken = 'Mute (7 Ngày)'; wipeUserMessages(message.guild, message.author.id); }
                else if (mode === 4) { actionTaken = 'Cảnh báo'; }

                if (mode !== 4 && actionTaken !== 'Không xác định') {
                    guildData.punishedUsers.push({ userId: message.author.id, action: actionTaken, timestamp: new Date().toISOString() });
                    await guildData.save();

                    if (guildData.logChannel) {
                        const logChan = message.guild.channels.cache.get(guildData.logChannel);
                        if (logChan) {
                            const embed = ComponentBuilder.container(0xFFAA00,
                                '⚠️ **HACKED DETECTED!**',
                                ComponentBuilder.separator(),
                                `- **User:** <@${message.author.id}>\n- **Kênh:** <#${message.channel.id}>\n- **Phạt:** ${actionTaken}\n- **Nội dung:**\n\`\`\`${message.content || 'Gửi ảnh'}\`\`\``
                            );
                            await logChan.send({ embeds: [embed] });
                        }
                    }
                }
            } catch (error) { }
            return;
        }

        // 2. AI QUÉT LỪA ĐẢO
        if (!guildData.detectChannels?.includes(message.channel.id)) {
            if (isSafe) return;

            const hasLink = message.content.includes('http://') || message.content.includes('https://') || message.content.includes('discord');
            const hasImage = message.attachments.some(att => att.contentType?.startsWith('image/'));

            if (hasLink || hasImage) {
                await message.react('👁️').catch(() => { });
                const aiResult = await AIModerator.analyze(message.content, Array.from(message.attachments.values()));
                await message.reactions.removeAll().catch(() => { });

                if (aiResult.isMalicious) {
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`🤖 🛡️ <@${message.author.id}>, AI phát hiện nội dung lừa đảo!`);
                        setTimeout(() => warning.delete().catch(() => { }), 7000);

                        if (guildData.logChannel) {
                            const logChan = message.guild.channels.cache.get(guildData.logChannel);
                            if (logChan) {
                                const embed = ComponentBuilder.container(0x8B0000,
                                    '🤖 **AI PHÁT HIỆN LỪA ĐẢO / MALWARE**',
                                    ComponentBuilder.separator(),
                                    `- **Kẻ tình nghi:** <@${message.author.id}>\n- **Kênh:** <#${message.channel.id}>\n- **Lý do AI:** ${aiResult.reason}\n- **Nội dung:**\n\`\`\`${message.content || 'Ảnh'}\`\`\``
                                );
                                await logChan.send({ embeds: [embed] });
                            }
                        }
                    } catch (err) { }
                }
            }
        }

        // 3. LỆNH PREFIX
        if (!message.content.startsWith(currentPrefix)) return;
        const args = message.content.slice(currentPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (commandName === 'help') {
            const embed = ComponentBuilder.container(0xFF0000,
                '🛡️ **HƯỚNG DẪN SỬ DỤNG BOT**',
                `Prefix hiện tại: \`${currentPrefix}\``,
                ComponentBuilder.separator(),
                `📍 **Quản lý bẫy:** \`${currentPrefix}add-channel\`, \`${currentPrefix}remove-channel\`\n⚙️ **Cài đặt:** \`${currentPrefix}mode\`, \`${currentPrefix}reason\`, \`${currentPrefix}prefix\`, \`${currentPrefix}whitelist\`, \`${currentPrefix}set-log\`\n📋 **Thống kê:** \`${currentPrefix}ban-list\``
            );
            return message.reply({ embeds: [embed] });
        }

        if (commandName === 'ban-list' || commandName === 'banlist') {
            if (!isSafe) return message.reply('❌ Bạn không có quyền!');
            if (!guildData.punishedUsers || guildData.punishedUsers.length === 0) return message.reply('📜 Chưa có ai lọt bẫy!');

            const recent = [...guildData.punishedUsers].reverse().slice(0, 15);
            let listStr = '';
            recent.forEach((r, i) => listStr += `**${i + 1}.** <@${r.userId}> | **${r.action}** | \`${new Date(r.timestamp).toLocaleString('vi-VN')}\`\n`);

            const embed = ComponentBuilder.container(0x2B2D31, `💀 **SỔ TỬ THẦN (${guildData.punishedUsers.length})**`, ComponentBuilder.separator(), listStr);
            return message.reply({ embeds: [embed] });
        }
    },
};