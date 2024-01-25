//runs solely on localhost at the minute
//will deploy to AWS EC2 once a more runnable version is up

//express and body-parser imports
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

//example router for testing purposes
const branchesRouter = require('./routes/branches');
const atmRouter = require('./routes/atms');

const app = express ();
const PORT = process.env.port || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/branches', branchesRouter);
app.use('/atm', atmRouter);


app.listen(PORT, () => {
    console.log("Server listening on port: ", PORT);
});

