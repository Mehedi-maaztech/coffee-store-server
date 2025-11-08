const express = require('express');
const cors = require('cors');
require('dotenv').config();
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const serviceAccount = require('./coffee-store-adminsdk.json')
fs.writeFileSync('/tmp/coffee-store-adminsdk.json', process.env.GOOGLE_CREDENTIALS);
//var serviceAccount = require("path/to/serviceAccountKey.json");
const app = express();
const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`Hello World! from port ${port} get ready`);
});



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//const uri = "mongodb://localhost:27017";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.acg4kiv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect before using the client
    await client.connect();
    console.log("MongoDB Connected Successfully");

    // Get the database and collection
    //const database = 
    const coffeeCollection = client.db("coffeeDB").collection("coffee");
    const usersCollection = client.db("coffeeDB").collection("users");
    // console.log("user collection created", usersCollection);

    // Define your route *after* connecting
    app.post("/coffee", async (req, res) => {
      try {
        const user = req.body;
        console.log("Received user:", user);
        const result = await coffeeCollection.insertOne(user);
        res.send(result);
      } catch (err) {
        console.error(" Insert Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // fetch all 
    app.get('/coffee', async (req, res) => {
      const users = await coffeeCollection.find().toArray()
      res.send(users);
    })

    // fetch one 
    app.get('/coffee/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const coffee = await coffeeCollection.findOne(query)
      res.send(coffee);
    })

    // update 
    app.put('/coffee/:id', async (req, res) => {
      const id = req.params.id;
      const coffee = req.body;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updatedCoffee = {
        $set: {
          name: coffee.name,
          chef: coffee.chef,
          supplier: coffee.supplier,
          taste: coffee.taste,
          category: coffee.category,
          details: coffee.details,
          photourl: coffee.photourl
        }
      };
      const result = await coffeeCollection.updateOne(filter, updatedCoffee, options);
      res.send(result);
    })

    // delete 
    app.delete('/coffee/:id', async (req, res) => {
      const id = req.params.id;
      console.log(`deleted id ${id}`);
      const query = { _id: new ObjectId(id) };
      const result = await coffeeCollection.deleteOne(query);
      res.send(result);
      console.log(result);
    });

    // users related api 
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      console.log(newUser);
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    })

    app.get('/users', async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    })

    app.patch('/users', async (req, res) => {
      // const email = req.params.email;
      const email = req.body.email;
      const filter = { email }
      const updatedDoc = {
        $set: {
          lastSignInTime : req.body?.lastSignInTime
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id', async (req,res) => {
      const id = req.params.id;
      
      const user = await usersCollection.findOne({ _id : new ObjectId(id)})
      const query = { _id : new ObjectId(id)}
      const result = await usersCollection.deleteOne(query)
      //const fireResult = await admin.auth().deleteUser(id);

      if(user.fireid){
        await admin.auth().deleteUser(user.fireid);
      }
      res.send(result , user);
    })
    // Start the server only after Mongo is ready
    app.listen(5000, () => console.log("Server running on port 5000"));
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
run().catch(console.dir);





// {
//   "type": "process.env.FIRE_type",
//   "project_id": "process.env.FIRE_project_id",
//   "private_key_id": "process.env.FIRE_private_key_id",
//   "private_key": "process.env.FIRE_private_key",
//   "client_email": "process.env.FIRE_client_email",
//   "client_id": "process.env.FIRE_client_id",
//   "auth_uri": "process.env.FIRE_auth_uri",
//   "token_uri": "process.env.FIRE_token_uri",
//   "auth_provider_x509_cert_url": "process.env.FIRE_auth_provider_x509_cert_url",
//   "client_x509_cert_url": "process.env.FIRE_client_x509_cert_url",
//   "universe_domain": "process.env.FIRE_universe_domain"
// }