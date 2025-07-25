const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const FinancialSummary = require("../models/FinancialSummary");

const router = express.Router();

const API_KEY = "f829a70ff7a97b41e53e6f4c190b288d85052c15";
const FIN_URL = "https://opendart.fss.or.kr/api/stockTotqySttus.json";
const currentYear = 2025;
const REPORT_CODES = [11013, 11012, 11014, 11011];

// 주가 크롤링
async function fetchStockPrice(stockCode) {
  const url = `https://finance.naver.com/item/main.nhn?code=${stockCode}`;
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const priceText = $("#chart_area .rate_info .no_today .blind")
    .first()
    .text()
    .replace(/,/g, "");
  const price = parseInt(priceText, 10);

  if (isNaN(price)) throw new Error("주가 파싱 실패");
  return price;
}
