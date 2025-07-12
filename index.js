require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const crypto = require("crypto");
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lwvml.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

     const collegeInformation = client.db("collegeBookingFacilities").collection("collegeInfo");
     const userCollection = client.db("collegeBookingFacilities").collection("users");
    //  get college info
       app.get("/collegeInfo", async (req, res) => {
      const cursor = collegeInformation.find();
      const result = await cursor.toArray();
      res.send(result);
    });
       app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });


    // post the users info in server
    app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ success: false, message: "Missing credentials" });
  }

  try {
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).send({ success: false, message: "User already exists" });
    }

    // No hashing, saving password as plain text
    const newUser = { name, email, password };

    const result = await userCollection.insertOne(newUser);

    return res.status(201).send({
      success: true,
      insertedId: result.insertedId.toString(),
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).send({ success: false, message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ success: false, message: "Missing credentials" });
  }

  try {
    const user = await userCollection.findOne({ email });

    if (!user) {
      return res.status(401).send({ success: false, message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).send({ success: false, message: "Invalid password" });
    }

    // Login success
    res.send({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({ success: false, message: "Server error" });
  }
});

app.post('/social-user', async (req, res) => {
  const { name, email, image } = req.body;

  try {
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.send({ success: true, message: 'User already exists' });
    }

    const result = await userCollection.insertOne({ name, email, image });
    res.send({ success: true, insertedId: result.insertedId });
  } catch (error) {
    console.error('Social user insert failed:', error);
    res.status(500).send({ success: false, message: 'Internal server error' });
  }
});


// password reset functionalities



// In-memory token store (use Redis/DB in production)
const resetTokens = {};

app.post("/request-reset", async (req, res) => {
  const { email } = req.body;

  const user = await userCollection.findOne({ email });
  if (!user) return res.status(404).send({ success: false, message: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 15 * 60 * 1000; // 15 min

  resetTokens[token] = { email, expires };

  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

 
  console.log("Password reset link:", resetLink);

  res.send({ success: true, message: "Reset link sent to your email." });
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  const data = resetTokens[token];
  if (!data || Date.now() > data.expires) {
    return res.status(400).send({ success: false, message: "Invalid or expired token" });
  }

  const { email } = data;

  const result = await userCollection.updateOne(
    { email },
    { $set: { password: newPassword } }
  );

  delete resetTokens[token];

  res.send({ success: true, message: "Password updated successfully" });
});



  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=> {
    res.send('college facilities is open now')
})

app.listen(port, ()=>{
    console.log(`Book Now at: ${port}`)
})