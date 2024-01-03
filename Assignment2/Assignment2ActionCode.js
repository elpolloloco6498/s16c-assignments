import fs from "fs"
import { file } from 'tmp-promise'
import axios from "axios";
import cheerio from "cheerio"

export default {
    name: "Download Docsend to pdf",
    description: "This action downloads a Docsend presentation to pdf into Dropbox",
    key: "download_docsend_pdf",
    version: "0.0.6",
    type: "action",
    props: {
        url: {
            type: "string",
            label: "Url"
        }
    },
    async run({ $ }) {
        // $.export("$summary", `Result is ${this.num+1}`)

        async function downloadDocsendUrl(pdfUrl, withEmail) {
            if (pdfUrl.indexOf("docsend.com") < 0) {
                return { success: false, error_message: "does not contain docsend link", path: null };
            }

            if (withEmail) {
                console.log("Trying to scrape with email");
            } else {
                console.log("Trying to scrape without email");
            }

            const r1 = await initialRequest();
            const token = getToken(r1);
            const cookie = r1.headers['set-cookie'][0].split(';')[0];
            $.export("$summary", `Extracted cookies and csrf token from first request`)
            const r2 = await secondRequest(r1, pdfUrl, token, cookie, withEmail);
            $.export("$summary", `PDF Bytes data received`)
            const results = checkAndWriteToFile(r2, pdfUrl, withEmail);
            $.export("$summary", `PDF was written to /tmp`)
            return results;
        }

        function getToken(response) {
            const $ = cheerio.load(response.data);
            const csrfToken = $('[name="csrfmiddlewaretoken"]').val();
            return csrfToken;
        }

        async function initialRequest() {
            const url = "https://docsend2pdf.com/";

            const headers = {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
                "sec-ch-ua": '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"macOS"'
            };

            const response = await axios.get(url, { headers, timeout: 10000 });
            return response;
        }

        async function secondRequest(oldRequest, pdfUrl, token, cookie, withEmail = false) {
            const url = "https://docsend2pdf.com/";

            const form_data = {
                'csrfmiddlewaretoken': token,
                'url': pdfUrl,
            };

            if (withEmail) {
                form_data['email'] = 'automation@s16vc.com';
            }

            const headers = {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "max-age=0",
                "Connection": "keep-alive",
                "Content-Type": "application/x-www-form-urlencoded",
                "Cookie": cookie,
                "Origin": "https://docsend2pdf.com",
                "Referer": "https://docsend2pdf.com/",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "same-origin",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
                "sec-ch-ua": '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"macOS"'
            };

            const encodedData = new URLSearchParams(form_data).toString();
            const response2 = await axios.post(url, encodedData, { headers, timeout: 10000, responseType: 'arraybuffer' });
            return response2;
        }

        async function checkAndWriteToFile(response, pdfUrl, alert) {
            let message = '';
            if (response.status === 200 && response.data.length > 100000) {
                if (response.data.includes("text-danger")) {
                    message = `cannot retrieve due to authentication: ${pdfUrl}`;
                    return { success: false, path: null, error_message: message };
                } else {
                    try {
                        const { path, cleanup } = await file();
                        const filepath = path + ".pdf";
                        await fs.promises.appendFile(filepath, response.data)
                        await cleanup();
                        return { success: true, path: filepath, error_message: null };
                    } catch (error) {
                        console.error("Error writing PDF file:", error.message);
                        return { success: false, path: null, error_message: `Error writing PDF file: ${error.message}` };
                    }
                }
            } else {
                if (response.data.includes("text-danger")) {
                    message = `cannot retrieve docsend due to authentication: ${response.status} ${pdfUrl}`;
                    console.log(response.data);
                } else {
                    message = `bad docsend response ${response.status}`;
                }

                return { success: false, path: null, error_message: message };
            }
        }

        async function main(pdfUrl) {
            let results = await downloadDocsendUrl(pdfUrl, false);
            if (!results.success) {
                results = await downloadDocsendUrl(pdfUrl, true);
            }

            return results;
        }

        const results = main(this.url)
        return results;
    },
  };