const puppeteer = require('puppeteer');
require('events').EventEmitter.defaultMaxListeners = 250

class Webpage {
    static async findUrls(listPage) {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(listPage);
      const links = await page.$$('li.hcf-teaser a');
      const hrefAttr = await Promise.all(links.map((x, i) => x.getProperty('href')));
      const hrefs = await Promise.all(
        hrefAttr.map(handle => handle.jsonValue())
      );
      await browser.close();
      return hrefs;
    }

    static async findArticlesUrlsOnEachSearchPage(listPages) {
      const links = await Promise.all(listPages.map(listPage => {
        return Webpage.findUrls(listPage);
      }));
      return links;
    }

    static async generateBuffers(links) {
      return links.map(async (link,i) => {
        try {
          Webpage.generatePDF(link)
        } catch (err) {
          console.log("err@!!", err)
        }
        return;
      })
    }

    static async generatePDF(url) {
        const browser = await puppeteer.launch({ headless: true }); // Puppeteer can only generate pdf in headless mode.
        const page = await browser.newPage();
        // const navigationPromise = page.waitForNavigation({waitUntil: "domcontentloaded"});
        try {
          await page.goto(url, {waitUntil: 'domcontentloaded'}); // Adjust network idle as required.
        } catch (err) {
          console.log("err0", err)
        }

        const name = url.split("/");
        const fileName = `articles/${name[name.length-2]}.pdf`;
        const pdfConfig = {
            path: fileName, // Saves pdf to disk.
            format: 'A4',
            printBackground: false,
            margin: { // Word's default A4 margins
                top: '2.54cm',
                bottom: '2.54cm',
                left: '2.54cm',
                right: '2.54cm'
            }
        };
        try {
          await page.emulateMedia('screen');
        } catch (err) {
          console.log("err1", err)
        }

        try {
          const pdf = await page.pdf(pdfConfig); // Return the pdf buffer. Useful for saving the file not to disk.
        } catch (err) {
          console.log("err2", err)
        }

        await browser.close();
        return;
    }
}

const getFlattenUrlsArr = (arr) => {
  return arr.reduce((acc,next ) => {
    return acc.concat(next)
  })
}

const getOnlyUnique = (arr) => {
  return arr.reduce((acc,next ) => {
    if (!acc.includes(next)) {
      return acc.concat(next)
    }
    return acc;
  }, [])
}

(async() => {
    const listPages = [...Array(21).keys()].map((x,i) => `https://www.pnn.de/suchergebnis/artikel/?p20962100=${i+1}&sw=garnisonkirche`);
    const urls = await Webpage.findArticlesUrlsOnEachSearchPage(listPages);
    const flattenUrlsArr = getFlattenUrlsArr(urls);
    const uniqueUrls = getOnlyUnique(flattenUrlsArr);
    console.log("uniqueUrls", uniqueUrls.length);
    const generateBuffers = await Webpage.generateBuffers(uniqueUrls);

})();
