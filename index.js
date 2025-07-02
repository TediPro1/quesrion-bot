require('dotenv').config();

const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const PREFIX = '*';
const fs = require('fs');
const CHANNEL_ID = '1350797552701931682';
const SEND_HOUR = 7;
const SEND_MINUTE = 0;

// Helper function to send and move question
async function sendAndMoveQuestion() {
    try {
        let data = fs.readFileSync('questions.txt', 'utf8').split('\n').filter(Boolean);
        if (data.length === 0) return false;

        const question = data.shift();
        fs.writeFileSync('questions.txt', data.join('\n') + (data.length ? '\n' : ''));
        fs.appendFileSync('asked.txt', question + '\n');

        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel) {
            await channel.send(`<@&1350947161960873984>:\n${question}`);
        }
        return true;
    } catch (err) {
        console.error('Error sending question:', err);
        return false;
    }
}

async function sendQuestionAtNoon() {
    const now = new Date();
    const millisTillSend = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        SEND_HOUR, SEND_MINUTE, 0, 0
    ) - now;

    setTimeout(async function sendAndSchedule() {
        await sendAndMoveQuestion();
        setTimeout(sendAndSchedule, 24 * 60 * 60 * 1000);
    }, millisTillSend > 0 ? millisTillSend : 0);
}

client.on('ready', () => {
    console.log('bot is ready');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(PREFIX)) {
        const commandBody = message.content.slice(PREFIX.length).trim();

        // *add "content"
        const addMatch = commandBody.match(/^add\s+"([^"]+)"$/);
        if (addMatch) {
            const content = addMatch[1];
            fs.appendFileSync('questions.txt', `${content}\n`);
            await message.reply(`Added: "${content}"`);
            return;
        }

        // *questions
        if (commandBody === 'questions') {
            try {
                const data = fs.readFileSync('questions.txt', 'utf8');
                if (data.trim().length === 0) {
                    await message.reply('No questions found.');
                } else if (data.length > 1900) {
                    await message.reply('Too many questions to display.');
                } else {
                    await message.reply(`Questions:\n${data}`);
                }
            } catch (err) {
                await message.reply('No questions found.');
            }
            return;
        }

        // *ask
        if (commandBody === 'ask') {
            const sent = await sendAndMoveQuestion();
            if (sent) {
                await message.reply('Question sent!');
            } else {
                await message.reply('No questions to send.');
            }
            return;
        }

        // *asked
        if (commandBody === 'asked') {
            try {
                const data = fs.readFileSync('asked.txt', 'utf8');
                if (data.trim().length === 0) {
                    await message.reply('No asked questions found.');
                } else if (data.length > 1900) {
                    await message.reply('Too many asked questions to display.');
                } else {
                    await message.reply(`Asked questions:\n${data}`);
                }
            } catch (err) {
                await message.reply('No asked questions found.');
            }
            return;
        }

        // *help
        if (commandBody === 'help') {
            await message.reply(
                '**Available commands:**\n' +
                `${PREFIX}add "content" - Adds a question to the file\n` +
                `${PREFIX}questions - Displays all questions\n` +
                `${PREFIX}asked - Displays all asked questions\n` +
                `${PREFIX}ask - Sends the next question now\n` +
                `${PREFIX}help - Shows this help message`
            );
            return;
        }
    }
});

client.login('MTM4OTYxNjc4MjkwMTUxMDE4NA.GHcOzz.D3J9Kn2pFXFKXxhokyi80fhvISJeiIMDSH-Xls');
