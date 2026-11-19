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
        const applicationsCollection = db.collection("applications");
        const plansCollection = db.collection("plans");
        const subscriptionCollection = db.collection("subscriptions");
        const sessionCollection = db.collection("session");

        // middleware verification related
        const verifyToken = async (req, res, next) => {
            // console.log(req.headers);
            const authHeader = req.headers?.authorization;
            if (!authHeader) {
                return res.status(401).json({ message: "Unauthorized access." });
            }

            const token = authHeader.split(" ")[1];
            // console.log(token);
            if (!token) {
                return res.status(401).json({ message: "Unauthorized access." });
            }

            const query = { token: token };
            const session = await sessionCollection.findOne(query);
            // console.log(session);
            const userId = session.userId;

            const userQuery = { _id: userId };

            const user = await usersCollection.findOne(userQuery);
            // console.log(user);

            req.user = user;
            next();
        };

        const verifySeeker = async (req, res, next) => {
            if (req.user?.role !== "seeker") {
                return res.status(403).json({ message: "Forbidden access." });
            }
            next();
        };

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

        // applications related APIs

        app.get("/api/applications", verifyToken, verifySeeker, async (req, res) => {
            const query = {};
            if (req.query.applicantId) {
                query.applicantId = req.query.applicantId;

                // check whether asking for user information or someone else
                if (req.user._id.toString() !== req.query.applicantId) {
                    return res.status(403).json({ message: "Forbidden access." });
                }
            }

            if (req.query.jobId) {
                query.jobId = req.query.jobId;
            }
            const cursor = applicationsCollection.find(query);
            const result = await cursor.toArray();
            res.json(result);
        });

        app.post("/api/applications", async (req, res) => {
            const application = req.body;
            const newApplication = {
                ...application,
                createdAt: new Date(),
            };
            const result = await applicationsCollection.insertOne(newApplication);
            res.json(result);
        });

        // Plans related APIs

        app.get("/api/plans", async (req, res) => {
            const query = {};
            if (req.query.plan_id) {
                query.id = req.query.plan_id;
            }
            const result = await plansCollection.findOne(query);
            res.json(result);
        });

        // subscriptions related APIs

        app.post("/api/subscriptions", async (req, res) => {
            const data = req.body;
            const subsInfo = {
                ...data,
                createdAt: new Date(),
            };
            const result = await subscriptionCollection.insertOne(subsInfo);

            // update the user plan information:
            const filter = {
                email: data.email,
            };
            const updateUser = {
                $set: {
                    plan: data.planId,
                },
            };
            const updateResult = await usersCollection.updateOne(filter, updateUser);
            res.json(updateResult);
        });

        // Company related APIs

        /* app.get("/api/companies", async (req, res) => {
            const cursor = companyCollection.find();
            const result = await cursor.toArray();
            res.json(result);
        }); */
        // inefficient way to join/ aggregate collection
        app.get("/api/companies", verifyToken, async (req, res) => {
            const cursor = companyCollection.find();
            const companies = await cursor.toArray();

            for (const company of companies) {
                const filter = {
                    companyId: company._id.toString(),
                };
                const jobCount = await jobsCollection.countDocuments(filter);
                company.jobCount = jobCount;
            }
            res.json(companies);
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

        app.patch("/api/companies/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedCompany = req.body;
            const filter = {
                _id: new ObjectId(id),
            };
            const updatedDoc = {
                $set: updatedCompany,
            };
            const result = await companyCollection.updateOne(filter, updatedDoc);
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
