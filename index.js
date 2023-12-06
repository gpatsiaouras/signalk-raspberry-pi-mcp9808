const mcp9808 = require("mcp9808-temperature-sensor");

module.exports = function (app) {
  let timer;
  let sensor;
  let plugin = {};

  plugin.id = "signalk-raspberry-pi-mcp9808";
  plugin.name = "Raspberry-Pi Temperature Sensor MCP9808";
  plugin.description =
    "A signalk plugin for reading temperature from the Adafruit mcp9808 sensor";

  plugin.schema = {
    type: "object",
    properties: {
      rate: {
        title: "Sample Rate (in seconds)",
        type: "number",
        default: 60,
      },
      path: {
        type: "string",
        title: "SignalK Path",
        description:
          "This is used to build the path in Signal K. It will be appended to 'environment'",
        default: "inside.salon",
      },
      i2c_bus: {
        type: "integer",
        title: "I2C bus number",
        default: 1,
      },
      i2c_address: {
        type: "string",
        title: "I2C address",
        default: "0x18",
      },
    },
  };

  plugin.start = function (options) {
    function createDeltaMessage(temperature) {
      var values = [
        {
          path: "environment." + options.path + ".temperature",
          value: temperature,
        },
      ];

      return {
        context: "vessels." + app.selfId,
        updates: [
          {
            source: {
              label: plugin.id,
            },
            timestamp: new Date().toISOString(),
            values: values,
          },
        ],
      };
    }

    const mcp9808Options = {
      i2cBusNumber: options.i2c_bus || 1, // optional, default 1
      i2cAddress: Number(options.i2c_address || "0x18"), // optional, default 0x18
      // alertGpioNumber: 27,
      // lowerAlertTemperature: 25,
      // upperAlertTemperature: 35,
      // criticalTemperature: 45
    };

    function readTemperature() {
      sensor
        .temperature()
        .then((temp) => {
          console.log(`Temperature C : ${temp.celsius}`);
          const temperature = temp.celsius + 273.15;
          const delta = createDeltaMessage(temperature);
          app.handleMessage(plugin.id, delta);
        })
        .catch((error) => {
          console.log(`MCP9808 error while reading: ${error}`);
        });
    }

    mcp9808
      .open()
      .then((response_sensor) => {
        console.log("MCP9808 sensor initialized");
        sensor = response_sensor;
        timer = setInterval(readTemperature, options.rate * 1000);
        console.log("Started timer");
      })
      .catch((error) => {
        console.log(`Error while opening the sensor: ${error}`);
      });
  };

  plugin.stop = function () {
    if (timer) {
      clearInterval(timer);
      timeout = null;
    }
    if (sensor) {
      sensor.close();
      sensor = undefined;
    }
  };

  return plugin;
};
