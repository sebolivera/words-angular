"use strict";
const Sequelize = require("sequelize");
const { Model } = Sequelize;

module.exports = (sequelize, DataTypes) => {
  class Level extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User);
      this.belongsTo(models.Level);
    }
  }
  Level.init(
    {
      won: {
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
    },
    {
      sequelize,
      modelName: "Level",
      tableName: "bookings",
    }
  );
  return Level;
};
