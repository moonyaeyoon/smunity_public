const { MongoClient } = require('mongodb');
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = `mongodb://${process.env.MONGODB_IP}:27017`;
const client = new MongoClient(url);

// Database Name
const dbName = 'school_notice';
exports.getSchoolNotice = async () => {
    try {
        await client.connect();
        console.log('Connected successfully to server');
        const db = client.db(dbName);
        const noticeCollection = db.collection('seoul_new_100');

        // the following code examples can be pasted here...
        const notices = await noticeCollection.find();

        // if ((await notices.estimatedDocumentCount()) === 0) {
        //     console.log('No documents found!');
        // }
        return await notices.toArray();
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
};
