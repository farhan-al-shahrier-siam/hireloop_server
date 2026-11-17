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
        const companyCollection = db.collection("companies");
        const usersCollection = db.collection("user");

        app.get("/api/users", async (req, res) => {
            const cursor = usersCollection.find().skip(2);
            const result = await cursor.toArray();
            res.json(result);
        });

        app.get("/api/jobs", async (req, res) => {
            const query = {};
            if (req.query.companyId) {
                query.companyId = req.query.companyId;
            }
            if (req.query.status) {
                query.status = req.query.status;
            }
            const cursor = jobsCollection.find(query);
            const result = await cursor.toArray();
            res.json(result);
        });

        app.get("/api/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id),
            };
            const result = await jobsCollection.findOne(query);
            res.json(result);
        });

        app.post("/api/jobs", async (req, res) => {
            const job = req.body;
            const newJob = {
                ...job,
                createdAt: new Date(),
            };
            const result = await jobsCollection.insertOne(newJob);
            res.json(result);
        });

        // Company related APIs

        app.get("/api/companies", async (req, res) => {
            const cursor = companyCollection.find();
            const result = await cursor.toArray();
            res.json(result);
        });

        app.get("/api/my/companies", async (req, res) => {
            const query = {};
            if (req.query.recruiterId) {
                query.recruiterId = req.query.recruiterId;
            }
            const result = await companyCollection.findOne(query);
            res.json(result);
        });

        app.post("/api/companies", async (req, res) => {
            const company = req.body;
            const newCompany = {
                ...company,
                createdAt: new Date(),
            };
            const result = await companyCollection.insertOne(newCompany);
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
