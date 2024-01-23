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

async function getAllAtms(){
    const [rows] = await db.query("SELECT * FROM ATM");
    return rows;
}

module.exports = router;