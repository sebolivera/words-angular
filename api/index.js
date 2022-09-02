const express = require("express");
const app = express();
const env = require("dotenv").config().parsed || "development";

const dbconfig = require(__dirname + '/../db/config/config.json')[env.ENVIRONMENT];


let sequelize;
if (dbconfig!=="production") {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(env.PORT || 8101, () => {
  console.log(`Example app listening on port ${env.PORT || 8101}`);
});
