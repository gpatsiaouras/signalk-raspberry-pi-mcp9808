const mcp9808 = require('mcp9808-temperature-sensor')

module.exports = function (app) {
  let timer = null
  let plugin = {}

  plugin.id = 'signalk-raspberry-pi-mcp9808'
  plugin.name = 'Raspberry-Pi Temperature Sensor MCP9808'
  plugin.description =
    'A signalk plugin for reading temperature from the Adafruit mcp9808 sensor'

  plugin.schema = {
    type: 'object',
    properties: {
      rate: {
        title: 'Sample Rate (in seconds)',
        type: 'number',
        default: 60
      },
      path: {
        type: 'string',
        title: 'SignalK Path',
        description:
          "This is used to build the path in Signal K. It will be appended to 'environment'",
        default: 'inside.salon'
      },
      i2c_bus: {
        type: 'integer',
        title: 'I2C bus number',
        default: 1
      },
      i2c_address: {
        type: 'string',
        title: 'I2C address',
        default: '0x77'
      }
    }
  }

  plugin.start = function (options) {
    function createDeltaMessage (temperature) {
      var values = [
        {
          path: 'environment.' + options.path + '.temperature',
          value: temperature
        }
      ]

      return {
        context: 'vessels.' + app.selfId,
        updates: [
          {
            source: {
              label: plugin.id
            },
            timestamp: new Date().toISOString(),
            values: values
          }
        ]
      }
    }

    const mcp9808Options = {
      i2cBusNumber: options.i2c_bus || 1, // optional, default 1
      i2cAddress: Number(options.i2c_address || '0x18'), // optional, default 0x18
      // alertGpioNumber: 27,
      // lowerAlertTemperature: 25,
      // upperAlertTemperature: 35,
      // criticalTemperature: 45
    }

    // Read BME280 sensor data
    function readSensorData () {
      mcp9808
        .open()
        .then(sensor =>
          sensor
            .temperature()
            .then(temp => {
              temperature = temp.celcius + 273.15
            })
            .finally(() => sensor.close())
        )
        .catch(error => {
          console.log(`MCP9808 error while reading: ${error}`)
        })
    }

    timer = setInterval(readSensorData, options.rate * 1000)
  }

  plugin.stop = function () {
    if (timer) {
      clearInterval(timer)
      timeout = null
    }
  }

  return plugin
}
