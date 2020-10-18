const fs = require('fs');
const Discord = require('discord.js');
const { token, dbConnection, adminChannel, reportsChannel, userChannel, emojiStart, emojiConclude, emojiReconsider, guildId } = require('./config.json');
const config = require('./config.json');
const mongoose = require('mongoose');
const Report = require('./models/Report');
const Id = require('./models/Id');
const PunishmentSchema = require('./models/Punishment');
const Punishments = require('./punishments');

const client = new Discord.Client();
let guild;
client.once('ready', () => {
    console.log('Discord client ready');
    Punishments.init(client, getUserFromMention);
    guild = client.guilds.cache.get(guildId);
});

// connect to DB
mongoose.connect(
    dbConnection,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log('database connected.')
);

function getDivider(str) {
    const dividers = [
        ".", ")", "-"
    ];

    for (let i = 0; i < dividers.length; i++) {
        let index = str.indexOf("1" + dividers[i], 0);
        if (index >= 0) {
            return dividers[i];
        }
    }
    return null;
}

const getUserFromMention = (mention) => {
	if (!mention) return;
	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return client.users.cache.get(mention);
	}
}

async function getIdIncremented() {
    let id = await Id.findOne();
    if (!id) {
        id = await new Id({}).save();
    }
    
    id.pool = id.pool + 1;

    try {
        const updatedId = await Id.updateOne({_id: id._id}, 
            { $set: 
                {
                pool: id.pool,
                }
            }
        );
        
        return id.pool;
    } catch (err) {
        console.log(err);
    }
}

async function resetConclusions(report) {
    const updatedReport = await Report.updateOne({_id: report.id}, 
        { $set: {
              conclusions: []
        }});
    return;
}

async function changeReportStatus(report, message, status, moderator, dontDeleteReactions) {
    const channel = client.channels.cache.get(adminChannel);
    if (!dontDeleteReactions)
        message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
    if (report.status != status && status == 1) {
        const channel = client.channels.cache.get(userChannel);
        if (report.status != 2) {
            channel.send(`${report.user}, вашу жалобу (#${report.uid}) начал рассматривать ${moderator}`);
        } else {
            channel.send(`${report.user}, начался пересмотр вашей жалобы (#${report.uid}) на игрока ${report.reportedUser}. Хелпер: ${moderator}`);
        }
    }


    try {
        const updatedReport = await Report.updateOne({messageId: message.id}, 
            { $set: {
                  status: status,
                  modUser: moderator
            }});
    } catch (err) {
        console.log(err);
    }

    let adminMessage = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .addField('Заявитель', report.user, true)
        .addField('Подозреваемый', report.reportedUser, true);
        if (report.modUser) {
            adminMessage.addField(`Хелпер`, `${moderator}`, true);
        }
        adminMessage.addField('Описание ситуации', report.desc, false);
        if (status != 2) {adminMessage.addField('Комната', report.room, true)};
    switch(status) {
        case 0:
            adminMessage.setTitle(`Новая жалоба (#${report.uid})`);
            adminMessage.addField('Начать рассмотрение', `Отреагируйте на это сообщение, чтобы начать рассмотрение`, false);
            message.react(emojiStart);
            break;
        case 1:
            adminMessage.setTitle(`Жалоба (#${report.uid}) рассматривается`);
            adminMessage.setDescription(`Необхдимо закрыть заявку после рассмотрения! Для этого нажмите на ${emojiConclude} после выбора всех подходящих наказаний.`);
            let msgReact = 'Отреагируйте на это сообщение, чтобы вынести решение\n';
            let punishmentTypes = [];
            await PunishmentSchema.find({user: getUserFromMention(report.reportedUser).id, cancelled: false, expired: false})
            .then ((p) => {
                for (let i=0; i<p.length; i++) {
                    if (p[i].reportId != report.uid) {
                        punishmentTypes.push(p[i].type);
                    }
                }
            }).catch((err) => {
                console.log(err);
            });
            for (let i=1; i<=Object.keys(Punishments.punishmentTypes).length; i++) {
                if (punishmentTypes.includes(i)) {
                    continue;
                }
                const p = Punishments.punishmentTypes[i.toString()]
                msgReact += `${p.emoji} - ${p.role} (${p.termSlug})\n`;
            }
            msgReact += `${emojiConclude} - Все решения вынесены, закрыть заявку`;
            adminMessage.addField('Вынесение решения', msgReact, false);
            for (let i=1; i <= Object.keys(Punishments.punishmentTypes).length; i++) {
                if (punishmentTypes.includes(i)) continue;
                message.react(Punishments.punishmentTypes[i.toString()].emoji);
            }
            message.react(emojiConclude);
            break;
        case 2:
            adminMessage.setTitle(`(#${report.uid}) Решение вынесено`);
            message.react(emojiReconsider);
            break;
        case 3:
            adminMessage.setTitle('Пересмотр');
            break;
    }

    const conclusions = report.conclusions;
    if (conclusions) {
        let strConclusions = "";
        for (let i=0; i<conclusions.length; i++) {
            const punishment = Punishments.punishmentTypes[conclusions[i].toString()];
            strConclusions += `${punishment.role} (${punishment.termSlug})\n`;
        }
        if (conclusions.length > 0)
            adminMessage.addField('Вывод', strConclusions, false);
        else {
            if (status == 2)
                adminMessage.addField('Вывод', 'Заявка закрыта без вынесения наказания.', false);
            else
                adminMessage.addField('Вывод', 'Наказание не будет применено', false);
        }
    }

    if (status == 2) {
        const channel = client.channels.cache.get(userChannel);
        channel.send(adminMessage);
    }

    //непосредственно выдача наказаний
    if (status == 2) {
        Punishments.conclude(report.uid, report.conclusions);
    }

    message.edit(adminMessage);

}

client.on('messageReactionAdd', async (reaction, user) => {
    let message = reaction.message, emoji = reaction.emoji;
    if (user.bot || message.channel.id != adminChannel) return;
    const report = await Report.findOne({messageId: message.id});
    if (!report) return;
    if (report.status == 1 && user.id != report.modUser) {
        return;
    }
    const member = guild.member(user);
    if (report.status == 2 && user.id != report.modUser && !member.roles.cache.some(role => config.reconsiderPermitted.includes(role.name)))
    {
        return;
    }

    if (report.status == 0) {
        if (emoji.name == emojiStart) {
            report.modUser = user;
            changeReportStatus(report, message, 1, user);
        }
        else {
            reaction.remove(user);
        }
        return;
    }
    if (report.status == 2 && emoji.name == emojiReconsider) {
        await resetConclusions(report);
        report.modUser = user;
        changeReportStatus(report, message, 1, user);
        return;
    }
    
    if (report.status == 1) {
        // message.react('1️⃣');
        let conclusion = 0;
        let isWhitelistedEmoji = false;
        for (let i=1; i<=Object.keys(Punishments.punishmentTypes).length; i++) {
            if (emoji.name == Punishments.punishmentTypes[i.toString()].emoji) {
                conclusion = i;
                isWhitelistedEmoji = true;
            }
        }
        if (emoji.name == emojiConclude) {
            changeReportStatus(report, message, 2, user);
            return;
        } else if (!isWhitelistedEmoji) {
            reaction.remove(user);
            return;
        }

        if (conclusion > 0) {
            try {
                report.conclusions.push(conclusion);
                const updatedReport = await Report.updateOne({messageId: message.id}, report);
                changeReportStatus(report, message, report.status, user, true);
            } catch (err) {
                console.log(err);
            }
        }
    }

    // Remove the user's reaction
    //reaction.remove(user);
});

client.on('messageReactionRemove', async (reaction, user) => {
    let message = reaction.message, emoji = reaction.emoji;
    if (user.bot || message.channel.id != adminChannel) return;
    const report = await Report.findOne({messageId: message.id});
    if (!report) return;
    if (report.status != 0 && user.id != report.modUser) return;
    if (report.status == 2) return;

    let conclusion = 0;
    for (let i=1; i<=Object.keys(Punishments.punishmentTypes).length; i++) {
        if (emoji.name == Punishments.punishmentTypes[i.toString()].emoji) {
            conclusion = i;
        }
    }

    if (conclusion > 0) {
        try {
            const index = report.conclusions.indexOf(conclusion);
            if (index > -1) {
                report.conclusions.splice(index, 1);
            }
            const updatedReport = await Report.updateOne({messageId: message.id}, report);
        } catch (err) {
            console.log(err);
        }
        changeReportStatus(report, message, report.status, user, true);
    } else {
        return;
    }
    
});

function wrongReport(message) {
    message.delete({timeout: 35000});
    message.channel.send(`${message.author}, отказ! Жалоба написана не по форме.`)
    .then((msg) => {
        msg.delete({timeout: 120000});
    });
}

client.on('message', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id != reportsChannel) return;
    
    const divider = getDivider(message.content);
    if (!divider)
    {
        wrongReport(message);
        return;
    }
        let args = [];

        const msg = message.content.replace(/(\r\n|\n|\r)/gm, "");
        for (let i=1; i<=3; i++) {
            let nextArg = msg.indexOf((i+1).toString() + divider);
            if (nextArg == -1) nextArg = msg.length;
            let arg = msg.substring(msg.indexOf(i.toString() + divider) + divider.length + 1, nextArg).trim();
            args.push(arg);
        }

    const reportedUser = getUserFromMention(args[0]);
    if (!reportedUser || !args || args.length < 3 || args[1].length == 0 || args[2].length == 0) {
        wrongReport(message);
        return;
    }

    const newUid = await getIdIncremented();

    message.delete();
    message.channel.send(`${message.author}, ваша жалоба принята! #${newUid} - номер жалобы, по которому можно отслеживать прогресс. \n Cледить за ходом рассмотрения можно в канале ${client.channels.cache.get(userChannel)}`)
    .then((msg) => {
        msg.delete({timeout: 120000});
    });
    const messageSender = message.author;
    const adminChannelMsg = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`Новая жалоба (#${newUid})`)
    .addField('Заявитель', messageSender, true)
    .addField('Подозреваемый', reportedUser, true)
    .addField('Описание ситуации', args[2], false)
    .addField('Комната', args[1], true)
    .addField('Начать рассмотрение', `Отреагируйте на это сообщение, чтобы начать рассмотрение`, false);
    const channel = client.channels.cache.get(adminChannel);
    channel.send(adminChannelMsg)
    .then((message) => {
        //console.log(messageSender);
        const report = new Report({
            user: messageSender,
            reportedUser: args[0],
            room: args[1],
            desc: args[2],
            messageId: message.id,
            status: 0,
            uid: newUid
        });
        report.save().then(() => {
            message.react(emojiStart);

        }).catch(err => {
            console.log(err);
            message.delete();
        })
    });
    return;

});

client.login(token);
