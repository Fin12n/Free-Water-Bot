const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: '❌ Có lỗi khi chạy lệnh!', ephemeral: true });
                } else {
                    await interaction.reply({ content: '❌ Có lỗi khi chạy lệnh!', ephemeral: true });
                }
            }
        }
        else if (interaction.isMessageComponent()) {
            return; // Cho phép đi qua để Collector xử lý
        }
    },
};