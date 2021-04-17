const express = require('express');
const format = require('sqlutils/pg/format');
const bodyParser = require('body-parser');
const cors = require('cors');
var getYouTubeID = require('get-youtube-id');
const randomId = require('random-id');
const PORT = process.env.PORT || 5000;

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

function shorten(string){
  // max length
  let length = 200
  let trimmedString = string.length > length ? string.substring(0, length) + "..." : string.substring(0, length); 
  return trimmedString
}

function markertoSQL(inputmarker){
  // flatten the coordinates object so they fit into their own columns in the database
  // console.log("inputmarker: ",inputmarker)
  let newmarker = Object.assign({}, inputmarker);
  newmarker['latitude'] = newmarker.coordinates.latitude
  newmarker['longitude'] = newmarker.coordinates.longitude
  delete newmarker['coordinates']; 

  return format('INSERT INTO markertable ?', newmarker); //returns: INSERT INTO customers (name, balance) VALUES (E'John Doe', 0)
}


function SQLreturntomarker(inputmarker){
  // console.log("inputmarker: ",inputmarker)
  let newmarker = Object.assign({}, inputmarker);
  newmarker['coordinates'] = latlong(parseFloat(newmarker.latitude),parseFloat(newmarker.longitude))
  
  delete newmarker['latitude'] 
  delete newmarker['longitude']
  return newmarker
}



function latlong(lat,long){
  return {"latitude":parseFloat(lat),"longitude":parseFloat(long)}
}
function makemarker(id,latitude,longitude,title,videoid){
  return ({"id":id,"coordinates":latlong(latitude,longitude),"title":title,"videoid":videoid,})
}




const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  // vidmarkers = [makemarker(randomId(5),-33.9391,151.0615,'yee','q6EoRBvdVPQ'),makemarker(randomId(5),-33.9827,151.1227,'penguin','yh59FEUOWxQ'),makemarker(randomId(5),-34.9391,150.0615,'yee','1ghn9e4yYHA')]
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM markertable');
    var results = { 'results': (result) ? result.rows : null};
    results = results.results
    // console.log(results)
    results = results.map(item => SQLreturntomarker(item))
    // console.log(results)
    client.release();
    res.json(results)
  } catch (err) {
    console.error(err);
    // console.log("Error " + err);
    // res.json(vidmarkers)
  }
  
  
  // res.json(vidmarkers)
  console.log('data requested')
  // res.json(vidmarkers)
});

app.post('/submit', async (req, res) => {
  recieved = req.body
  console.log("~~~~~~~~~~")
  // console.log(req)
  // console.log(req.body)
  marker = makemarker(randomId(5),recieved.latitude,recieved.longitude,shorten(recieved.title),getYouTubeID(recieved.link))
  // console.log(marker)
  console.log(markertoSQL(marker))
  try {
    const client = await pool.connect();
    pool.query(
      markertoSQL(marker),
      (err, res) => {
        console.log(err, res);
      }
    );
    client.release();
    res.json('Sucessfully added your marker!')
  } catch (err) {
    console.error(err);
    res.json("Error " + err);
  }

  
})

app.listen(PORT, () => {
  console.log(`Listening on ${ PORT }`)
});