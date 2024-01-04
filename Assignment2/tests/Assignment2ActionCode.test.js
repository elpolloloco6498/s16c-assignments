const axios = require('axios');
axios.defaults.timeout = 10000;
const SECONDS = 1000;
jest.setTimeout(70 * SECONDS)

const webhook_url = 'https://eocowbx6y8mcm75.m.pipedream.net'
const docsend_url = 'https://docsend.com/view/q5vyt5xb7yyeyvf2'

test("Downloads Docsend presentation to pdf", async () => {
    const response = await axios.post(webhook_url, 
    {
        url: docsend_url,
    })
    expect(response.data.downloadSuccess).toBe(true);
});