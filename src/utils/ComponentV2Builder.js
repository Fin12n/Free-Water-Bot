const {
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder
} = require('discord.js');

class ComponentV2Builder {

    // 1. TextDisplay V2
    static text(content) {
        return new TextDisplayBuilder().setContent(content);
    }

    // 2. Separator V2 (Line phân cách chuẩn từ tài liệu của sếp)
    static separator() {
        return new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Large);
    }

    // 3. Container V2 Xịn (Tự động nhận diện và nhét component vào đúng lỗ)
    static container(colorHex, ...items) {
        const container = new ContainerBuilder();

        if (colorHex) {
            // Đảm bảo truyền vào là số nguyên (VD: 0x2B2D31)
            container.setAccentColor(colorHex);
        }

        items.forEach(item => {
            if (typeof item === 'string') {
                // Nếu sếp truyền chữ thuần, nó tự bọc thành TextDisplay
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(item));
            } else if (item instanceof TextDisplayBuilder) {
                container.addTextDisplayComponents(item);
            } else if (item instanceof SeparatorBuilder) {
                container.addSeparatorComponents(item);
            } else if (item instanceof SectionBuilder) {
                container.addSectionComponents(item);
            }
        });

        return container;
    }

    // --- CÁC COMPONENT DÀNH CHO MENU VÀ POP-UP GIỮ NGUYÊN ---
    static channelSelectMenu(customId, placeholder) {
        return new ChannelSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .addChannelTypes(ChannelType.GuildText);
    }

    static row(component) {
        return new ActionRowBuilder().addComponents(component);
    }

    static modal({ id, title, inputs }) {
        const modal = new ModalBuilder().setCustomId(id).setTitle(title);
        const rows = inputs.map(input => {
            const textInput = new TextInputBuilder()
                .setCustomId(input.id)
                .setLabel(input.label)
                .setStyle(input.style)
                .setRequired(input.required);

            if (input.placeholder) textInput.setPlaceholder(input.placeholder);
            return new ActionRowBuilder().addComponents(textInput);
        });

        modal.addComponents(...rows);
        return modal;
    }
}

module.exports = ComponentV2Builder;