// @ts-check
//const puppeteer = require("puppeteer");
import { launch } from 'puppeteer-core';
import fs from 'fs' 
//const random_useragent = require('random-useragent');
import { getRandom } from 'random-useragent';
import  moment  from 'moment'
const data = require('../json/oanda.json');
const dias = require('../json/dias.json');

export const OandaArray = [];

const getNumOfDays = (dayOfWeek, structure) => {
  if (structure.hasOwnProperty(dayOfWeek)) {
    return structure[dayOfWeek];
  } else {
    throw new Error(`No se encontró la cantidad de días para ${dayOfWeek}`);
  }
};

 export const Oanda = async () => {
  const browser = await launch({
    headless: "new",
    args: [
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  //console.log(page);
  try {
    const today = moment().format("dddd");
    const oandaStructure = dias.oanda[0];
    const cantidadPaginas = getNumOfDays(moment().format("dddd"), oandaStructure);
    const dayOfWeek = today;
    
    if (data.oanda.hasOwnProperty(dayOfWeek)) {
      const oandaDia = data.oanda[dayOfWeek][0];
      const urls = Object.values(oandaDia);
      //console.log(urls);
      
      let retryCount = 0;
      const maxRetries = 3; // Número máximo de reintentos
      
      while (OandaArray.length < cantidadPaginas && retryCount < maxRetries) {
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          //console.log(url);
          await page.setUserAgent(getRandom());
          await page.goto(url, { waitUntil: 'networkidle2' });
          await page.waitForSelector("#cc-time-series-plot", { visible: true });
          
          const inputHandle = await page.$x("//*[@id='cc-main-conversion-block']/div/div[2]/div[3]/div[2]/div[1]/div/input");
          if (inputHandle.length > 0) {
            // @ts-ignore
            const valordate = await page.evaluate((el) => el.value, inputHandle[0]);
            const valor = valordate.replace(/,/g, ".");
            const numero = Number(valor);
            OandaArray.push(numero);
            //console.log(numero);
            if (OandaArray.length >= cantidadPaginas) {
              break;
            }
          } else {
            console.log('No se encontró el elemento input');
          }
        }
        
        retryCount++;
      }
    }
    console.log('OandaRate:', OandaArray);
    await browser.close();
  } catch (err) {
    await browser.close();
    // Envío de respuesta a BaseDate.txt
    if (fs.existsSync('C:/Users/Usuario/Desktop/Tasas/src/uploads/BaseDate.txt')) {
      fs.appendFileSync('C:/Users/Usuario/Desktop/Tasas/src/uploads/BaseDate.txt', "Oanda Error," + console.error(`Error en la búsqueda: ${err}`) + ',');
    }
  }
};



