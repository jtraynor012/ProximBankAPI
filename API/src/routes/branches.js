const express = require('express');
const router = express.Router();
const db = require('../database/db.js');

//EXAMPLE END POINT - USED FOR PREVIEW PURPOSES
//get /branches
router.get('/', async (req, res) => {
    try{
        const branches = await getAllBankBranches();
        res.json(branches);
    } catch(error){
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//Using /accessibility
//branches/accessibility?options=x1, x2, x3
//example => branches/accessibility?options=InternalRamp,AutomaticDoors
router.get('/accessibility', async (req, res) => {
    try{
        //Grab all filter options from request
        const accessibilityOptions = req.query.options;

        //if no filter options, throw error with info on how to ammend
        if(!accessibilityOptions){
            return res.status(400).json({error: 'Missing options parameter - use ?options=option1,option2,... after accessibility to specifiy accessibility filter(s)'});
        }

        //base query
        let query = 'SELECT * FROM BRANCH_ACCESSIBILITY';

        //make filter options an array
        const Options = Array.isArray(accessibilityOptions) ? accessibilityOptions : accessibilityOptions.split(",")

        //Join all filter options onto the end of the query
        if(Options && Array.isArray(Options) && Options.length > 0){
            const conditions = Options.map(option => `${option} = 1`);
            query += ' WHERE ' + conditions.join (' AND ');
        }

        //run query and return results to user
        const [rows, fields] = await db.query(query);
        res.json(rows);

    } catch(error){
        console.error('Error fetching branches accessibility: ', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


router.get('/availability', async (req, res) => {
    try{
        let query = 'SELECT * FROM BRANCH_AVAILABILITY';
        const [rows, fields] = await db.query(query);
        res.json(rows);


    }catch(error){
        console.error('Error fetching branch avilability: ', error);
        res.status(500).json({error: 'Internal Server Error'});
    }

})


//boiler plate code to preview querying and connection
async function getAllBankBranches() {
    try{
        const [rows] = await db.query('SELECT * FROM BRANCH');
        return rows;
    } catch(error){
        throw error;
    }
}

module.exports = router;