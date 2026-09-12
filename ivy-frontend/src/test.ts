import { apiFetch } from './api.js';

async function test() {
    const limit = 50;
    const promises = [
      apiFetch(`/v1/listings?offset=0&limit=${limit}`),
      apiFetch(`/v1/listings?offset=50&limit=${limit}`),
      apiFetch(`/v1/listings?offset=100&limit=${limit}`),
      apiFetch(`/v1/listings?offset=150&limit=${limit}`)
    ];
    
    const results = await Promise.all(promises);
    const allListings = [...results[0].results, ...results[1].results, ...results[2].results, ...results[3].results].filter(l => l.is_live);
    
    const prices = allListings.map(l => l.price).filter(p => p > 0).sort((a, b) => a - b);
    console.log("Prices array length:", prices.length);
    console.log("Prices first 5:", prices.slice(0, 5));
    console.log("Prices last 5:", prices.slice(-5));
    console.log("Contains NaN?", prices.includes(NaN));
    console.log("Contains undefined?", prices.includes(undefined));
    
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
    console.log("Median Price:", medianPrice);
}

test();
