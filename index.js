const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();

const port = 8000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_CONNECTION_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // await client.connect();

        const db = client.db("hireloop");
        const jobsCollection = db.collection("jobs");

        app.get("/api/jobs", async (req, res) => {
            const query = {}
            if(req.query.companyId){
                query.companyId = req.query.companyId
            }
            if(req.query.status){
                query.status = req.query.status
            }
            const cursor = jobsCollection.find(query)
            const result = await cursor.toArray()
            res.json(result)
        });

        app.post("/api/jobs", async (req, res) => {
            const job = req.body;
            const result = await jobsCollection.insertOne(job);
            res.json(result);
        });
    } finally {
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
