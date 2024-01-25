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
            return res.status(404).json({error: 'Missing options parameter - use ?options=option1,option2,... after accessibility to specifiy accessibility filter(s)'});
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
        const [rows] = await db.query(query);
        res.json(rows);

    } catch(error){
        console.error('Error fetching branches accessibility: ', error);
        res.status(500).json({error: 'Internal Server Error', details: error.message});
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
        console.error("Error creating new branch: ", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
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
        console.error("Error deleting branch: ", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message});
    }
});


//usage /branches/availability
router.get('/availability', async (req, res) => {
    try{
        //grab all availability info about all branches from DB
        let query = 'SELECT * FROM BRANCH_AVAILABILITY';
        const [rows] = await db.query(query);
        res.json(rows);

        //if error during query or connection, throw error
    }catch(error){
        console.error('Error fetching branch avilability: ', error);
        res.status(500).json({error: 'Internal Server Error', details: error.message });
    }
})

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

//usage /branches/location
router.get('/location', async (req, res) => {
    try{
        //grab all location info about all branches from DB
        let query="SELECT * FROM BRANCH_LOCATION";
        const [rows] = await db.query(query);
        res.json(rows);

    }catch(error){
        console.error('Error fetching location data: ', error);
        res.status(500).json({error: 'Internal Server Error', details: error.message });
    }
})

router.get('/location-town/:town', async (req, res) => {
    const town = req.params.town;
    try{
        let query=`SELECT * FROM BRANCH_LOCATION WHERE Town = ${town}`;
        const [rows] = await db.query(query);
        res.json(rows);
    }catch(error){
        console.error("Error fetching branch for this town", error);
        res.status(500).json({error: 'Internal Server Error', details: error.message });
    };
})

// This gets each branch by the ID. Test using localhost/branches/1 (if 1 is the branchID.)
router.get('/:branchId', async (req, res) => {
    //grab branchID from request header
    const branchId = req.params.branchId;

    try {
        let query = `SELECT * FROM BRANCH WHERE Branch_ID = ${branchId}`;

        //get branch details from DB
        const [branchDetails] = await db.query(query);

        //if branch not found, throw error
        if (!branchDetails) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        res.json(branchDetails);
    } catch (error) {
        console.error("Error fetching branch: ", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// PUT endpoint to UPDATE Branch details. Uses /branches/{branchID} to select the branch. New details in body.
router.put('/:branchId', async (req, res) => {
    const branchId = req.params.branchId;
    const { name, phoneNumber } = req.body;

    try {
        // Check if the branch with the specified ID exists
        let query = `SELECT * FROM BRANCH WHERE Branch_ID = ${branchId}`;
        const [existingBranch] = await db.query(query);
        if (!existingBranch) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        // Perform database update
        await db.query('UPDATE BRANCH SET Name = ?, PhoneNumber = ? WHERE Branch_ID = ?', [name, phoneNumber, branchId]);

        // Return a success message or updated details
        res.json({ message: 'Branch details updated successfully' });
    } catch (error) {
        console.error("Error updating branch details: ", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
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