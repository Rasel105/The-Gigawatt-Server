const express = require('express');
const cors = require("cors")
const app = express();
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// app is called instane 
const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.v59jk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const productCollection = client.db("gigawatt").collection("products");
        const purchaseCollection = client.db("gigawatt").collection("purchase");

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
