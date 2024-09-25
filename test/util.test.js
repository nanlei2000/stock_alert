const { fixDigit } = require('../lib/util')

test('fix_digit', () => {
  const res = fixDigit(1.225)
  console.log('res', res)

  {
    const res = fixDigit(1.2)
    console.log('res', res)
  }
})
