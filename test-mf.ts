import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const url = "https://www.mediafire.com/file/owj6o4kif3t940b/SampleVideo_1280x720_1mb.mp4/file";
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const $ = cheerio.load(res.data);
  const downloadLink = $('#downloadButton').attr('href');
  console.log("Link:", downloadLink);
}
test();
