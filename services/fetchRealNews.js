import * as cheerio from "cheerio";
import { getTodayStr } from "../utils/date.js";
import { formatDate } from "../utils/date.js";

function generateDateRange(targetDate, days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(targetDate);
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

export default async function fetchRealNews(targetStock) {
  const today = getTodayStr();
  const encodedStock = encodeURIComponent(targetStock);
  const dates = generateDateRange(today, 5);
  const results = [];
  for (let d of dates) {
    let url = `https://search.hankyung.com/search/news?query=${encodedStock}&sort=RANK%2FDESC%2CDATE%2FDESC&period=DATE&area=ALL&sdate=${d}&edate=${d}&exact=&include=&except=&hk_only=`;

    let response = await fetch(url);
    let html = await response.text();

    let $ = cheerio.load(html);
    let companyElements = $(".article > li");

    for (let i = 0; i < Math.min(5, companyElements.length); i++) {
      let li = companyElements.eq(i);

      let title = li.find("em.tit").text().trim();
      let context = li.find("p.txt").text().trim();
      let newsUrl = li.find("a").attr("href");
      let imgUrl = li.find("img").attr("src");

      if (imgUrl && imgUrl.startsWith("//")) {
        imgUrl = "https:" + imgUrl;
      }

      results.push({
        date: d, // 날짜 정보도 같이 기록하고 싶으면 남겨두고,
        title,
        context,
        news_url: newsUrl,
        img_url: imgUrl,
      });
    }
  }
  return results;
}
