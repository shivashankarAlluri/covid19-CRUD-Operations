const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let database = null;

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(5000, () => {
      console.log("Server Running");
    });
  } catch (e) {
    console.log(`database Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

//API 1
const convertDBToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const stateQuery = `
    SELECT *
    FROM 
    state;`;
  const stateDetails = await database.all(stateQuery);
  response.send(
    stateDetails.map((object) => convertDBToResponseObject(object))
  );
});

// API 2
const convertDBToResponse = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateIdQuery = `
    SELECT *
    FROM 
    state
    WHERE state_id=${stateId};`;
  const stateDetailsQuery = await database.get(stateIdQuery);
  response.send(convertDBToResponse(stateDetailsQuery));
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const districtQuery = `INSERT INTO district 
    (district_name, state_id,cases,cured,active,deaths)
    VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const updatedQuery = await database.run(districtQuery);
  response.send("District Successfully Added");
});

//API 4
const convertDB = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const district = `SELECT * FROM district
    WHERE 
    district_id=${districtId};`;
  const collectedQuery = await database.get(district);
  const updated = convertDB(collectedQuery);
  response.send(updated);
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `DELETE FROM district
    WHERE district_id=${districtId};`;
  const deletedQuery = await database.get(districtQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const districtDetails = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const districtQuery = `UPDATE district
    SET
    district_name='${districtName}', 
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtId};`;
  const updatedQuery = await database.run(districtQuery);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM 
    district 
    WHERE 
    state_id=${stateId};`;
  const stats = await database.get(query);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
const convertDBtoResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateQuery = `SELECT state_id
    FROM district
    WHERE district_id=${districtId};`;
  const stateIdQuery = await database.get(stateQuery);
  const getstateQuery = `SELECT state_name 
  FROM
  state 
  WHERE 
  state_id=${stateIdQuery.state_id};`;
  const stateName = await database.get(getstateQuery);
  response.send(convertDBtoResponseObject(stateName));
});

module.exports = app;
