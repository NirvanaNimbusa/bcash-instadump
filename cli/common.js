const Amount = require('bcoin/lib/btc/amount')
    , { readFileSync } = require('fs')
    , chalk = require('chalk')

const MAXFEERATE = 1000

const
  formatSat = sat  => Amount.serialize(sat, 8)
, toSat     = btcs => Amount.parse(btcs, 8)
, revHex    = hex  => hex.match(/../g).reverse().join('')

, collector   = map => (val, memo) => memo.concat([ map(val) ])
, parseInput  = s => ((p=s.split(/[:,\s]/)) => ({ hash: revHex(p[0]), index: +p[1], value: toSat(p[2]), key: p[3] }))()
, parseOutput = s => ((p=s.split(/[:,\s]/)) => ({ address: p[0], value: p[1] === 'ALL' ? p[1] : toSat(p[1]) }))()

, getLines = path => readFileSync(path).toString().split('\n').map(s => s.replace(/^\s+|\s+$/g, '')).filter(s => s.length)

, initArgs = (args, expectProxy=true) => {
  if (args.inputs)   args.input   = (args.input||[]).concat(getLines(args.inputs).map(parseInput))
  if (args.tor)      args.proxy   = 'socks5h://127.0.0.1:9150'
  if (!args.feerate) args.feerate = (Math.random()*100|0)+150 // 150 to 250

  if (expectProxy && !args.proxy && !args.noproxy) {
    printErr('no proxy was specified. set ' + chalk.yellowBright('--noproxy') + ' if you\'re sure about that, or enable one with --proxy/--tor.')
    process.exit()
  }
}

, checkFee = tx => {
    if (tx.getRate(tx.view)/1000 > MAXFEERATE) {
      printErr('woah there! are you sure you want to pay '+Amount.btc(tx.getFee())+' BCH in fees? enable ' + chalk.yellowBright('--crazyfee') + ' if you are.')
      process.exit()
    }
  }

, printErr = err =>
    console.error(chalk.red('(error)'), err.message || err || '', err.response && (err.response.body && err.response.body.errors || err.response.text) || '')

module.exports = { formatSat, toSat, parseInput, parseOutput, collector, initArgs, checkFee, printErr }