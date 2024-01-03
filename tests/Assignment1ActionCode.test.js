const axios = require('axios');

const webhook_url = 'https://eoevx0279vzbysf.m.pipedream.net'

test("Adds one to input number", async () => {
    const response = await axios.post(webhook_url, 
    {
        num: 1,
    })
    expect(response.data.result).toBe(2);
});

test("Adds one to a negative number", async () => {
    const response = await axios.post(webhook_url, {
        num: -5,
    });
    expect(response.data.result).toBe(-4);
});

test("Adds one to a decimal number", async () => {
    const response = await axios.post(webhook_url, {
        num: 3.5,
    });
    expect(response.data.result).toBe(4.5);
});

test("Adds one to zero", async () => {
    const response = await axios.post(webhook_url, {
        num: 0,
    });
    expect(response.data.result).toBe(1);
});

test("Adds one to a large number", async () => {
    const response = await axios.post(webhook_url, {
        num: 1000000,
    });
    expect(response.data.result).toBe(1000001);
});