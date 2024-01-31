//runs solely on localhost at the minute
//will deploy to AWS EC2 once a more runnable version is up

//express and body-parser imports
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

//example router for testing purposes
const branchesRouter = require('./routes/branches');
const atmRouter = require('./routes/atms');



const app = express ();
app.get('/api-docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'ProximDocumentation.html'));
})


const PORT = process.env.port || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/branches', branchesRouter);
app.use('/atms', atmRouter);


app.listen(PORT, () => {
    console.log("Server listening on port: ", PORT);
});

