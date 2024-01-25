const express = require('express');
const router = express.Router();
const db = require('../database/db.js');

//EXAMPLE END POINT - USED FOR PREVIEW PURPOSES
//get /branches
router.get('/', async (req, res) => {
    try{
        //grab all info from BRANCHES table in DB and return to user
        const branches = await getAllBankBranches();
        res.json(branches);
    } catch(error){
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//usage /branch/accessibility/{branch_ID}
router.get('/accessibility/:branchId', async (req, res) => {
    //grab branch ID from request header
    const branchID = req.params.branchId;
    try{
        //get all accessibility info from BRANCH_ACCESSIBILITY for Branch_ID
        let query = `SELECT * FROM BRANCH_ACCESSIBILITY WHERE Branch_ID = ${branchID}`;
        const [rows] = await db.query(query);

        //If result is empty, throw branch not found error
        if(rows.affectedRows === 0){
            console.error("Branch not found");
            res.status(404).json({error: "Branch not found"});
        }
        //return accessibility info to user
        res.json(rows);
    } catch(error){
        console.log("Error fetching accessibility for branch", error);
        res.status(500).json({error: 'Internal Server Error', details: error.message });
    }
})

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

// This gets each branch by the ID. Test using localhost/branches/1 (if 1 is the branchID.)
router.get('/:branchId', async (req, res) => {
    //grab branchID from request header
    const branchId = req.params.branchId;

    try {
        //get branch details from DB
        const branchDetails = await getBankBranchById(branchId);

        //if branch not found, throw error
        if (!branchDetails) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        res.json(branchDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Creates a new bank Branch, POST endpoint.  Takes 3 inputs: branchId, name, phoneNumber.
router.post('/', async (req, res) => {
    const { branchId, name, phoneNumber } = req.body;

    try {
        // Perform database insert
        const result = await db.query('INSERT INTO BRANCH (Branch_ID, Name, PhoneNumber) VALUES (?, ?, ?)', [branchId, name, phoneNumber]);

        // Return the ID of the newly inserted branch
        res.status(201).json({ branchId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE endpoint to remove a bank branch by ID
router.delete('/:branchId', async (req, res) => {
    const branchId = req.params.branchId;

    try {
        // Perform database delete
        const result = await db.query('DELETE FROM BRANCH WHERE Branch_ID = ?', [branchId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT endpoint to UPDATE Branch details. Uses /branches/[branchID] to select the branch. New details in body.
router.put('/:branchId', async (req, res) => {
    const branchId = req.params.branchId;
    const { name, phoneNumber } = req.body;

    try {
        // Check if the branch with the specified ID exists
        const existingBranch = await getBankBranchById(branchId);
        if (!existingBranch) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        // Perform database update
        await db.query('UPDATE BRANCH SET Name = ?, PhoneNumber = ? WHERE Branch_ID = ?', [name, phoneNumber, branchId]);

        // Return a success message or updated details
        res.json({ message: 'Branch details updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//usage /branches/availabilit/{BranchID}
router.get('/availability/:branchId', async (req, res) => {
    const branchID = req.params.branchId;

    try{
        let query = `SELECT * FROM BRANCH_AVAILABILITY WHERE Branch_ID = ${branchID}`;
        const [rows] = await db.query(query);

        if(rows.affectedRows === 0){
            console.error("Branch does not exist");
            res.status(404).json({error: 'Branch does not exist'});
        }

        res.json(rows);
    } catch(error){
        console.log('Error fetching availability for branch: ', error);
        res.status(500).json({error: 'Internal Server Error', details: error.message });
    }
})



router.get('/availability', async (req, res) => {
    try{
        //grab all availability info about all branches from DB
        let query = 'SELECT * FROM BRANCH_AVAILABILITY';
        const [rows, fields] = await db.query(query);
        res.json(rows);

        //if error during query or connection, throw error
    }catch(error){
        console.error('Error fetching branch avilability: ', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

/*
    latitude, longitude are either the users location/chosen location
    search radius is the distance they want to see from them (IN KM!)
*/
router.get('/location/:latitude/:longitude/:searchRadius', async (req,res) => {
    function toRadians(degrees){
        return degrees * Math.PI / 180;
    }
    try{
        let latitude = toRadians(parseFloat(req.params.latitude));
        let longitude = toRadians(parseFloat(req.params.longitude));
        let searchRadius = parseFloat(req.params.searchRadius);
        let validBranches = [];
        query="SELECT * FROM BRANCH_LOCATION";
        const[rows,fields] = await db.query(query);
        for(let i=0; i<rows.length; i++){
            let lat2 = toRadians(parseFloat(rows[i]['Latitude']));
            let long2 = toRadians(parseFloat(rows[i]['Longitude']));
            /* 
            https://community.fabric.microsoft.com/t5/Desktop/How-to-calculate-lat-long-distance/td-p/1488227#:~:text=You%20need%20Latitude%20and%20Longitude,is%20Earth%20radius%20in%20km.)
            uses the harvesine formula to get the distance between the query coords and the branch coords
            distance is in KM... 
            */
            let distance = Math.acos((Math.sin(latitude) * Math.sin(lat2)) + (Math.cos(latitude)*Math.cos(lat2)) * (Math.cos(long2 - longitude))) * 6371
            if(distance<searchRadius){
                validBranches.push(rows[i]);
            }
        }
        res.json(validBranches);
    }catch(error){
        console.error('Error fetching locations: ', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.get('/location', async (req, res) => {
    try{
        //grab all location info about all branches from DB
        query="SELECT * FROM BRANCH_LOCATION";
        const [rows, fields] = await db.query(query);
        res.json(rows);

    }catch(error){
        console.error('Error fetching location data: ', error);
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

//export router 
module.exports = router;