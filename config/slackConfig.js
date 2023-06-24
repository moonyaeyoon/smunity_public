const Slack = require('@slack/bolt');

const App = new Slack.App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
});

module.exports = App;
