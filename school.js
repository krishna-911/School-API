const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const haversine = require('haversine');

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'schoolDB',
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database.');
  }
});


app.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  
  if (!name || !address || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  
  const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(query, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
  });
});


app.get('/listSchools', (req, res) => {
  const { latitude, longitude } = req.query;

  
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Invalid latitude or longitude' });
  }

  const userLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };

  
  const query = 'SELECT * FROM schools';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    
    const schoolsWithDistance = results.map((school) => {
      const schoolLocation = { latitude: school.latitude, longitude: school.longitude };
      return {
        ...school,
        distance: haversine(userLocation, schoolLocation),
      };
    });

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(schoolsWithDistance);
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
