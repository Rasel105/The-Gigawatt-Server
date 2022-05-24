const express = require('express');
const cors = require("cors")
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// app is called instane 
const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.v59jk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Fobidden" });
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const productCollection = client.db("gigawatt").collection("products");
        const purchaseCollection = client.db("gigawatt").collection("purchase");
        const userCollection = client.db("gigawatt").collection("users");


        app.get('/users', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const users = await userCollection.find(query).toArray();
            res.send(users);
        });

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, accessToken: token });
        });


        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.findOne(query);
            res.send(result);
        });

        app.post("/purchase", async (req, res) => {
            const newPurchase = req.body;
            const result = await purchaseCollection.insertOne(newPurchase);
            res.send(result);
        });


        app.get("/myorders", verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = purchaseCollection.find(query);
                const myorders = await cursor.toArray();
                return res.send(myorders);
            }
            else {
                return res.status(403).send({ message: "Forbidden access" });
            }
        });

        app.delete('/myorder/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await purchaseCollection.deleteOne(filter);
            // console.log(result);
            res.send(result);
        })

        // app.get('/myorders', async (req, res) => {
        //     // const decodedEmail = req.decoded.email;
        //     const email = req.query.email;
        //     if (email === decodedEmail) {
        //         const query = { email };
        //         const cursor = purchaseCollection.find(query);
        //         const myorders = await cursor.toArray();
        //         res.send(myorders);
        //     } else {
        //         res.status(403).send({ message: "Forbidden" })
        //     }

        // });

    } finally {

    }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
    res.send("I am ready");
})

app.listen(port, () => {
    console.log("The Gigawat is running", port)
})
