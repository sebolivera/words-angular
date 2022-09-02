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
        this.hasMany(levelData)
    }
  }
  Level.init(
    {
      sizeX: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      sizeY:{
        allowNull:false,
        type:DataTypes.INTEGER
      },
      name:{
        allowNull:false,
        type:DataTypes.STRING
      },
      debug:{
        defaultValue:false,
        allowNull:false,
        type:DataTypes.BOOLEAN
      },
      defaultLetters:{
        allowNull:true,
        type:DataTypes.JSON
      },
      defaultEntities:{
        allowNull:true,
        type:DataTypes.JSON
      },
      defaultPlayer:{
        allowNull:false,
        type:DataTypes.JSON
      }
    },
    {
      sequelize,
      modelName: "Level",
      tableName: "bookings",
    }
  );
  return Level;
};
