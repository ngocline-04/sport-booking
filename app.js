const express = require('express');
const cors = require('cors');
require('dotenv').config();

const fieldRoutes = require('./src/routes/field.routes');
const authRoutes = require('./src/routes/auth.routes');
const locationRoutes = require('./src/routes/location.routes');

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/fields', fieldRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);

app.listen(3000, () => {
    console.log("Server chạy tại http://localhost:3000");
});
