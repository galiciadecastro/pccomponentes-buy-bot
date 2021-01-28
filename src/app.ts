import chromedriver from 'chromedriver'
import { ICard, IProps } from './models'
import { WebDriver, Builder, By, Key, WebElementCondition, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { Telegraf } from 'telegraf'
import { elementIsDisabled } from 'selenium-webdriver/lib/until'
import puppeteer from 'puppeteer'

chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build())

export default class Bot {
  // class properties
  email: string
  password: string
  link: string
  maxPrice?: number
  card?: ICard
  refreshRate?: number
  phone?: string
  debug: boolean

  // map props to class properties
  constructor({ email, password, link, maxPrice, card, refreshRate, debug = false }: IProps) {
    ;(this.email = email),
      (this.password = password),
      (this.link = link),
      (this.maxPrice = maxPrice),
      (this.card = card),
      (this.refreshRate = refreshRate),
      (this.debug = debug)
  }

  // main method
  async run() {
    try {
      // this creates a new chrome window
      const browser = await puppeteer.launch({ headless: !this.debug, defaultViewport: null })
      const page = await browser.newPage()
      // await this.login(page)
      await this.runItem(page)
      // await this.buyItem(driver)
    } catch (err) {
      console.error('ERROR NOT CAUGHT WHILE RUNNING BOT. MORE INFO BELOW')
      console.error(err)
    }
  }

  async login(page: puppeteer.Page) {
    await page
      .goto('https://www.pccomponentes.com/login', { waitUntil: 'networkidle2' })
      .then(async () => {
        // fills the form and logs in
        await page.$("input[data-cy='email']").then(async value => {
          await value?.focus()
          await page.keyboard.type(this.email.trim())
        })
        await page.$("input[data-cy='password']").then(async value => {
          await value?.focus()
          await page.keyboard.type(this.password.trim())
          await page.keyboard.press('Enter')
        })
        await page.waitForNavigation({ waitUntil: 'networkidle2' })
        // checks if logged in
        if (!(page.url() == 'https://www.pccomponentes.com/'))
          throw Error(`ERROR: Login to account with email ${this.email} failed`)
        console.log(`Successfully logged in as ${this.email}`)
      })
  }

  async runItem(page: puppeteer.Page) {
    // navigates to the item link provided
    let stock: boolean = false
    let price: number | undefined
    while (!stock) {
      // this loop will play till stock is available, then to the next step
      await page.waitForTimeout(this.refreshRate || 5000)
      await page.goto(this.link).then(async () => {
        // when item is not in stock, the button that informs you that there's no stock has the id 'notify-me'. If it's found there's not stock.
        const buyButtons = await page.$('#btnsWishAddBuy')
        const notifyMeButton = await page.$('#notify-me')

        if (buyButtons !== null && notifyMeButton === null) {
          price = Number(
            (await page.evaluate(() =>
              document.getElementById('precio-main')!.getAttribute('data-price')
            )) ?? undefined
          )
          console.log(`PRECIO: ${price}`)
          /* await page.evaluate(() => {
            // price = Number(document.getElementById('precio-id')?.getAttribute('data-price'))
          }) */
          await page
            .$("div[id='precio-main']")
            .then(async value => {
              price = Number((await value?.getProperty('data-price'))?.jsonValue()) ?? undefined
              console.log(`PRECIO: ${price}`)
            })
            .catch(() => {
              console.log('Current price not found. Buying anyway')
            })
          // checks if current price is below max price before continuing
          if (!this.maxPrice || (this.maxPrice && price && price <= this.maxPrice)) {
            stock = true
            console.log(`PRODUCT IN STOCK! Starting buy process`)
          } else {
            console.log(
              `Price is above max. Max price set - ${this.maxPrice}€. Current price - ${price}€`
            )
          }
        } else {
          // Else, proceeds to check the price and compare it to the maximum price if provided
          console.log(`Product is not yet in stock (${new Date().toUTCString()})`)
        }
      })
    }
  }

  async buyItem(page: puppeteer.Page) {
    /*await page
      .$("div[id='contenedor-principal']")
      .then(async value => {
        await page.goto(
          `https://www.pccomponentes.com/cart/addItem/${await value?.getProperty('data-id')}`,
          { waitUntil: 'networkidle2' }
        )
      })
      .catch(async () => {
        console.log('Not found product id. Forcing click of all buy buttons')
        const buyButtons = await page.$$('.buy-button')
        let clickedButton = false
        buyButtons.forEach(async buyButton => {
          if (!clickedButton)
            try {
              await buyButton.click()
              clickedButton = true
            } catch {
              console.log('Buy button not found, attempting another one...')
            }
        })
      })
    await page.goto('https://www.pccomponentes.com/cart/order', { waitUntil: 'networkidle2' })

    await page.waitForSelector('.card-name').then(async value => {})

    // checks if the account has an added card, if not it adds the provided one
    await driver.wait(until.elementsLocated(By.className('h5 card-name'))).then(async value => {
      if ((await value[0].getAttribute('outerText')) === 'Nombre aquí')
        if (this.card) {
          await this.addCard(driver)
        } else {
          console.log(
            "You don't have any card on your account and you didn't provide any. Selecting transfer as payment"
          )
          await driver
            .findElements(By.className('js-payment js-parent qa-payment-5  payment-select'))
            .then(value => value[0].click())
          await driver.sleep(500)
        }
    })

    // i don't give a shit, force click the buy button
    while ((await driver.getCurrentUrl()) === 'https://www.pccomponentes.com/cart/order') {
      try {
        await driver
          .findElements(By.className('c-indicator margin-top-0'))
          .then(values => values[0].click())
        if (!this.debug)
          await driver
            .findElement(By.id('GTM-carrito-finalizarCompra'))
            .then(value => value.click())
      } catch {}
    }

    for (var i = 0; i < 50; i++) console.log('COMPRADO')*/
  }

  async addCard(driver: WebDriver) {
    // clicking add card button
    await driver
      .wait(until.elementLocated(By.id('addNewCard')))
      .then(value => value.click())
      .catch(() => console.error("Didn't find the add card button"))
    const iFrames = await driver.findElements(By.className('js-iframe'))
    /* Card values are secured in 3 different IFrames, 
    we'll switch to each one and introduce the values */
    if (iFrames.length === 3) {
      // Card number
      await driver.switchTo().frame(iFrames[0])
      await driver
        .findElement(By.id('encryptedCardNumber'))
        .then(value => value.sendKeys(parseInt(this.card?.num.trim()!, 10)))
      await driver.switchTo().defaultContent()
      // Expiry date
      await driver.switchTo().frame(iFrames[1])
      await driver
        .findElement(By.id('encryptedExpiryDate'))
        .then(value => value.sendKeys(parseInt(this.card?.expiryDate.trim()!, 10)))
      await driver.switchTo().defaultContent()
      // CVC
      await driver.switchTo().frame(iFrames[2])
      await driver
        .findElement(By.id('encryptedSecurityCode'))
        .then(value => value.sendKeys(parseInt(this.card?.cvc.trim()!, 10)))
      await driver.switchTo().defaultContent()
      // Card name
      await driver
        .findElements(By.className('adyen-checkout__card__holderName__input'))
        .then(value => value[0].sendKeys(this.card?.name.trim()!))
      // Button add card
      await driver
        .findElements(By.className('adyen-checkout__button adyen-checkout__button--pay'))
        .then(value => value[0].click())
    } else {
      throw Error(`ERROR: Only ${iFrames.length} found. There must be 3 iframes`)
    }
  }
}
