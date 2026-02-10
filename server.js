const express = require('express');
const axios = require('axios');
const app = express();
dotenv = require('dotenv');
const PORT = process.env.PORT || 3000;

app.use(express.json());
dotenv.config();
const OFFICIAL_EMAIL = "pranav1426.be23@chitkara.edu.in";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper Functions
function generateFibonacci(n) {
    if (n <= 0) return [];
    if (n === 1) return [0];
    
    const fib = [0, 1];
    for (let i = 2; i < n; i++) {
        fib.push(fib[i - 1] + fib[i - 2]);
    }
    return fib;
}

function isPrime(num) {
    if (num < 2) return false;
    if (num === 2) return true;
    if (num % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(num); i += 2) {
        if (num % i === 0) return false;
    }
    return true;
}

function filterPrimes(arr) {
    return arr.filter(num => isPrime(num));
}

function gcd(a, b) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

function calculateHCF(arr) {
    if (arr.length === 0) return 0;
    if (arr.length === 1) return arr[0];
    
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
        result = gcd(result, arr[i]);
    }
    return result;
}

function lcm(a, b) {
    return (a * b) / gcd(a, b);
}

function calculateLCM(arr) {
    if (arr.length === 0) return 0;
    if (arr.length === 1) return arr[0];
    
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
        result = lcm(result, arr[i]);
    }
    return result;
}

async function getAIResponse(question) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: `Answer the following question with only a single word or very short phrase (maximum 2-3 words): ${question}`
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const answer = response.data.candidates[0].content.parts[0].text.trim();
        return answer;
    } catch (error) {
        console.error('AI API Error:', error.response?.data || error.message);
        throw new Error('Failed to get AI response');
    }
}

// POST /bfhl endpoint
app.post('/bfhl', async (req, res) => {
    try {
        const body = req.body;
        const keys = Object.keys(body);
        
        // Validate exactly one key
        if (keys.length !== 1) {
            return res.status(400).json({
                is_success: false,
                error: 'Request must contain exactly one key'
            });
        }
        
        const key = keys[0];
        const value = body[key];
        let data;
        
        switch (key) {
            case 'fibonacci':
                if (typeof value !== 'number' || value < 0) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'fibonacci requires a non-negative integer'
                    });
                }
                data = generateFibonacci(value);
                break;
                
            case 'prime':
                if (!Array.isArray(value)) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'prime requires an array of integers'
                    });
                }
                data = filterPrimes(value);
                break;
                
            case 'lcm':
                if (!Array.isArray(value) || value.length === 0) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'lcm requires a non-empty array of integers'
                    });
                }
                data = calculateLCM(value);
                break;
                
            case 'hcf':
                if (!Array.isArray(value) || value.length === 0) {
                    return res.status(400).json({
                        is_success: false,
                        error: 'hcf requires a non-empty array of integers'
                    });
                }
                data = calculateHCF(value);
                break;
                
            case 'AI':
                if (typeof value !== 'string' || value.trim() === '') {
                    return res.status(400).json({
                        is_success: false,
                        error: 'AI requires a non-empty question string'
                    });
                }
                data = await getAIResponse(value);
                break;
                
            default:
                return res.status(400).json({
                    is_success: false,
                    error: `Unknown key: ${key}. Valid keys are: fibonacci, prime, lcm, hcf, AI`
                });
        }
        
        res.json({
            is_success: true,
            official_email: OFFICIAL_EMAIL,
            data: data
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            is_success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// GET /health endpoint
app.get('/health', (req, res) => {
    res.json({
        is_success: true,
        official_email: OFFICIAL_EMAIL
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});