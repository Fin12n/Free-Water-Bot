const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    detectChannels: { type: [String], default: [] },
    mode: { type: Number, default: 3 },
    reason: { type: String, default: 'Phát hiện hành vi đáng ngờ/Tài khoản bị hack' },
    prefix: { type: String, default: '!' },
    punishedUsers: { type: Array, default: [] },
    logChannel: { type: String, default: null },
    customRegexes: { type: [String], default: ['discord\\.gg\\/|discord\\.com\\/invite\\/'] },
    whitelistedRoles: { type: [String], default: [] },
    whitelistedUsers: { type: [String], default: [] }
});

module.exports = mongoose.model('Guild', guildSchema);