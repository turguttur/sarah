const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();
require('dotenv').config();

// DB Connection
const connectionQuery = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?authSource=${process.env.DB_AUTH_SOURCE}`;
mongoose.connect(connectionQuery);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const CountrySchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String
  },
  region: {
    type: String
  }
});
const Country = mongoose.model("countries", CountrySchema);

app.get('/countries', async (req, res) => {
  const region = req.query.region;
  if(region) {
    const countries = await Country.find({region});
    return res.status(200).json(countries);
  }
  else {
    const countries = await Country.find();
    return res.status(200).json(countries);
  }
});

app.get('/salesrep', async (req, res) => {
  const response = await axios.get('http://127.0.0.1:3000/countries');
  const countries = response.data;
  const regions = new Map();
  countries.map((country, index) => {
    if(regions.has(country.region)) {
      regions.set(country.region ,regions.get(country.region) + 1);
    } else {
      regions.set(country.region, 1);
    }
  });
  const result = [];
  const iterator = regions.entries();
  let item = iterator.next();
  while(!item.done) {
    result.push({
      region: item.value[0],
      minSalesReq: Math.ceil(item.value[1] / 7),
      maxSalesReq: Math.floor(item.value[1] / 3)
    });
    item = iterator.next();
  }
  return res.status(200).json(result);
});

app.get('/optimal', async (req, res) => {
  const response = await axios.get('http://127.0.0.1:3000/countries');
  const countries = response.data;
  const regions = new Map();
  countries.map((country, index) => {
    if(regions.has(country.region)) {
      let tmp = [...regions.get(country.region)]
      tmp.push(country.name);
      regions.set(country.region ,tmp);
    } else {
      regions.set(country.region, [country.name]);
    }
  });
  const result = [];
  const iterator = regions.entries();
  let item = iterator.next();
  while(!item.done) {
    let region = item.value[0];
    let countryList = item.value[1];
    result.push({
      region,
      countryList,
      countryCount: Math.floor((Math.ceil(countryList.length / 7) + Math.floor(countryList.length / 3)) / 2)
    })
    item = iterator.next();
  }
  return res.status(200).json(result);

});

const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port, () => console.log('Server is listening port ' + port));