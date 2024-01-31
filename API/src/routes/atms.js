const express = require('express');
const router = express.Router();
const db = require('../database/db.js');

//fetch all ATMS
router.get('/', async (req, res) => {
    try{
        const atms = await getAllAtms();
        res.json(atms);
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});
router.get('/location', async (req, res) => {
  try{
    query="SELECT * FROM ATM_LOCATION";
    const [rows, fields] = await db.query(query);
    res.json(rows);
  }catch(error){
    console.error('Error fetching location data: ', error);
    res.status(500).json({error: 'Internal Server Error'});
  }
});
/*
 * latitude, longitude are either the users location/chosen location 
 * search radius is the distance they want to see from them (in km!)
 */
router.get('/location/:latitude/:longitude/:searchRadius', async (req,res) => {
  function toRadians(degrees){
    return degrees * Math.PI / 180;
  }
  try{
    let latitude = toRadians(parseFloat(req.params.latitude));
    let longitude = toRadians(parseFloat(req.params.longitude));
    let searchRadius = parseFloat(req.params.searchRadius);
    let validAtms = [];
    query = "SELECT * FROM ATM_LOCATION";
    const[rows, fields] = await db.query(query);
    for (let i=0; i<rows.length; i++){
      let lat2 = toRadians(parseFloat(rows[i]['Latitude']));
      let long2 = toRadians(parseFloat(rows[i]['Longitude']));
                  /* 
            https://community.fabric.microsoft.com/t5/Desktop/How-to-calculate-lat-long-distance/td-p/1488227#:~:text=You%20need%20Latitude%20and%20Longitude,is%20Earth%20radius%20in%20km.)
            uses the harvesine formula to get the distance between the query coords and the atm coords
            distance is in KM... 
            */
      let distance = Math.acos((Math.sin(latitude) * Math.sin(lat2)) + (Math.cos(latitude)*Math.cos(lat2)) * (Math.cos(long2 - longitude))) * 6371 
      if(distance<searchRadius){
        validAtms.push(rows[i]);
      }
    }
      res.json(validAtms);
    }catch(error){
      console.error('Error fetching locations: ', error);
      res.status(500).json({error: 'Internal Server Error'});
    }
});

// /availability goes here 


// availability/filter is here but yeah not sure about the functionality 


//need to put the availability/:atmId one here 

// Creates a new atm, POST endpoint. Takes 5 inputs: atmID, branchID, twentyFourHourAccess, minimumWithdrawalAmount, external
router.post('/', async (req, res) => {
  const { atmId, branchID, twentyFourHourAccess, minimumWithdrawalAmount, external } = req.body;
  
  try {
    // perform database insert
    const result = await db.query('INSERT INTO ATM (ATM_ID, BRANCH_ID, 24HoursAccess, MinimumPossibleAmount, External) VALUES (?, ?, ?, ?, ?)', [atmId, branchID, twentyFourHourAccess, minimumWithdrawalAmount, external]);

    // return the id of the newly inserted atm 
    res.status(201).json({atmId});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error'});
  }
});

// this gets atm by the ID. test using localhost3000:/atms/A006921A (where "A006921A" is an example atmID)
router.get('/:atmId', async (req, res) => {
  // grab atmID from request header
  const atmId = req.params.atmId;
  try{
    const atmDetails = await getAtmById(atmId);

    if (!atmDetails) {
      return res.status(404).json({ error: 'ATM not found' });
    }
    res.json(atmDetails) 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}) 
// DELETE endpoint to remove an ATM by ID 
router.delete('/:atmID', async (req, res)=> {
  const atmID = req.params.atmId;
  
  try {
    //performs database delete
    const result = await db.query('DELETE FROM ATM WHERE ATM_ID = ?', [atmId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({error: 'ATM not found'});
    }
    res.json({message:'ATM deleted successfully'});
  } catch (error) {
    console.error(error);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

// PUT endpoint to UPDATE atm details. Uses /atms/[atmID] to select the atm. New details in body.
router.put('/:atmId', async (req, res) => {
  const atmId = req.params.atmId;
  const { twentyFourHourAccess, minimumWithdrawalAmount, external } = req.body;

  try {
    // check if the ATM with the specified id exists
    const existingATM = await getAtmById(atmId);
    if (!existingATM) {
      return res.status(404).json({error: 'ATM not found'});
    }

    // perform atm UPDATE
    await db.query('UPDATE ATM SET 24HoursAccess = ?, MinimumPossibleAmount = ?, External = ? WHERE ATM_ID = ?', [twentyFourHourAccess, minimumWithdrawalAmount, external]);

    // return a success message or updated details
    res.json({message: 'ATM details updated successfully'});
  } catch (error) {
      console.error(error);
      res.status(500).json({error: 'Internal Server Error'});
  }
});

async function getAllAtms(){
  try {
      const [rows] = await db.query("SELECT * FROM ATM");
      return rows;
  }catch(error){
    throw error;
  }
}

async function getAtmById(atmId){
  const [rows] = await db.query('SELECT * FROM ATM WHERE ATM_ID = ?', [atmId]);

  if (rows.length === 0) {
    return null; // no ATM
  }
  return rows[0]; // returns the first result.
}

module.exports = router;
