import axios from 'axios';

async function test() {
  const url = "https://www.mediafire.com/file/owj6o4kif3t940b/SampleVideo_1280x720_1mb.mp4/file";
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  
  const match = res.data.match(/id="downloadButton"\s+href="([^"]+)"/);
  console.log("Link:", match ? match[1] : null);
}
test();
