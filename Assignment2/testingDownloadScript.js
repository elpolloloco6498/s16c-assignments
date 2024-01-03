const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

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
    const r2 = await secondRequest(r1, pdfUrl, token, cookie, withEmail);
    const results = checkAndWriteToFile(r2, pdfUrl, withEmail);
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

function checkAndWriteToFile(response, pdfUrl, alert) {
    let message = '';
    if (response.status === 200 && response.data.length > 100000) {
        if (response.data.includes("text-danger")) {
            message = `cannot retrieve due to authentication: ${pdfUrl}`;
            return { success: false, path: null, error_message: message };
        } else {
            try {
                console.log(response.headers['content-type'])
                const filename = pdfUrl.split('/').pop() + ".pdf";
                const path = "tmp/" + filename;
                fs.writeFile(path, response.data, "binary", function () {})
                return { success: true, path, error_message: null };
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

main("https://docsend.com/view/xugruq79ty836t4q").then(console.log).catch(console.error);
