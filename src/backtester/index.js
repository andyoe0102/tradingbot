const Candlestick = require('../models/candlestick')
const Historical = require('../historical')
const { Simple } = require('../strategy')
const randomstring = require('randomstring')
const colors = require('colors/safe')

class Backtester {
  constructor({ start, end, interval, product }) {
    this.startTime = start
    this.endTime = end
    this.interval
    this.product = product
    this.historical = new Historical({
      start, end, interval, product
    })
  }

  async start() {
    try {
      const history = await this.historical.getData();
      this.strategy = new Simple({
        onBuySignal: (x) => { this.onBuySignal(x) },
        onSellSignal: (x) => { this.onSellSignal(x) }
      })

      console.log(this.strategy,'strategy');
      await Promise.all(history.map((stick, index) => {
        const sticks = history.slice(0, index + 1);
        return this.strategy.run({
          sticks, time: stick.startTime
        })
      }))


      const positions = this.strategy.getPositions()

      console.log(positions,'positions');

      positions.forEach((p) => {
        console.log(p,'p');
        p.print()
      })

      const total = positions.reduce((r, p) => {
        return r + p.profit()
      }, 0)

      const prof = `${total}`
      const colored = total > 0 ? colors.green(prof) : colors.red(prof)
      console.log(`Total: ${colored}`)
    } catch (error) {
      console.log(error)
    }
  }

  async onBuySignal({ price, time }) {
    const id = randomstring.generate(20)
    this.strategy.positionOpened({
      price, time, size: 1.0, id
    })
  }

  async onSellSignal({ price, size, time, position }) {
    this.strategy.positionClosed({
      price, time, size, id: position.id
    })
  }
}

module.exports = Backtester