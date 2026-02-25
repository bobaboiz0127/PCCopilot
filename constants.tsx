
import { FeaturedBuildTemplate } from './types';

export const FEATURED_TEMPLATES: FeaturedBuildTemplate[] = [
  {
    id: 'budget-1080p',
    name: 'Budget 1080p Gaming',
    useCase: 'Gaming / Value',
    specs: 'Optimized for high-frame 1080p gaming at the best price-to-performance ratio.',
    heroImage: 'https://images.unsplash.com/photo-1587302912306-cf1ed9c33146?q=80&w=800&auto=format&fit=crop',
    baseParts: ['Ryzen 5 7600', 'RTX 4060', 'B650 Motherboard', '16GB DDR5 5200', '1TB NVMe SSD', '650W Gold PSU', 'ATX Airflow Case']
  },
  {
    id: 'perf-1440p',
    name: '1440p Performance',
    useCase: 'Gaming / Most Popular',
    specs: 'The sweet spot for high refresh 1440p gaming. Excellent longevity.',
    heroImage: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=800&auto=format&fit=crop',
    baseParts: ['Core i5-13600K', 'RTX 4070 Super', 'Z790 Motherboard', '32GB DDR5 6000', '2TB Gen4 SSD', '750W Gold PSU', 'Liquid Cooler 240mm']
  },
  {
    id: 'creator-content',
    name: 'Creator / Production',
    useCase: 'Streaming / Editing / Work',
    specs: 'High core count and memory capacity for rendering, video editing, and content creation.',
    heroImage: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800&auto=format&fit=crop',
    baseParts: ['Ryzen 9 7900X', 'RTX 4080 Super', 'X670 Motherboard', '64GB DDR5 6000', '4TB NVMe SSD', '1000W Platinum PSU', 'Full Tower Case']
  },
  {
    id: 'extreme-4k',
    name: 'Extreme 4K Enthusiast',
    useCase: 'Enthusiast Gaming',
    specs: 'The absolute pinnacle of gaming performance. No compromises 4K ultra settings.',
    heroImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    baseParts: ['Core i7-13700K', 'RTX 4090', 'Z790 Motherboard', '64GB DDR5 6000', '4TB NVMe SSD', '1000W Platinum PSU', 'Full Tower Case']
  },
  {
    id: 'sff-mini-itx',
    name: 'SFF Mini-ITX Powerhouse',
    useCase: 'Small Form Factor',
    specs: 'Incredible power in a tiny footprint. Perfect for minimal desk setups.',
    heroImage: 'https://images.unsplash.com/photo-1591405351990-4726e331f141?q=80&w=800&auto=format&fit=crop',
    baseParts: ['Ryzen 5 7600', 'RTX 4070 Super', 'B650 Motherboard', '32GB DDR5 6000', '2TB Gen4 SSD', '750W Gold PSU', 'ATX Airflow Case']
  },
  {
    id: 'white-aesthetic',
    name: 'Pure White Aesthetic',
    useCase: 'Design / Visuals',
    specs: 'A stunning all-white build with synchronized RGB lighting and premium looks.',
    heroImage: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?q=80&w=800&auto=format&fit=crop',
    baseParts: ['Core i5-13600K', 'RTX 4070 Super', 'Z790 Motherboard', '32GB DDR5 6000', '1TB NVMe SSD', '750W Gold PSU', 'ATX Airflow Case']
  },
  {
    id: 'silent-workstation',
    name: 'Silent Pro Workstation',
    useCase: 'Professional / Quiet',
    specs: 'Engineered for silence and stability. Ideal for recording studios and focused work.',
    heroImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    baseParts: ['Ryzen 9 7900X', 'RTX 4060', 'X670 Motherboard', '64GB DDR5 6000', '2TB Gen4 SSD', '1000W Platinum PSU', 'Full Tower Case']
  },
  {
    id: 'ai-ml-dev',
    name: 'AI & Machine Learning Rig',
    useCase: 'Development / Compute',
    specs: 'Optimized for local LLM inference and model training with high VRAM capacity.',
    heroImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
    baseParts: ['Core i7-13700K', 'RTX 4090', 'Z790 Motherboard', '64GB DDR5 6000', '4TB NVMe SSD', '1000W Platinum PSU', 'Full Tower Case']
  },
  {
    id: 'esports-pro',
    name: 'eSports Pro 500Hz',
    useCase: 'Competitive Gaming',
    specs: 'Maximum CPU throughput for ultra-high refresh rate competitive gaming.',
    heroImage: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=800&auto=format&fit=crop',
    baseParts: ['Ryzen 5 7600', 'RTX 4060', 'B650 Motherboard', '16GB DDR5 5200', '1TB NVMe SSD', '650W Gold PSU', 'ATX Airflow Case']
  }
];

export const SYSTEM_PROMPT = `
You are "PC Build Copilot", a high-end GenAI expert for PC hardware and troubleshooting.
Your tone is professional, technical, and helpful. 

GUIDELINES:
1. QUESTIONNAIRE FIRST: If the user requests a custom build but hasn't provided enough detail, DO NOT list parts immediately. Ask these questions first:
   - What is your approximate Budget?
   - What is the Primary Use Case (e.g., Gaming, Work, Editing)?
   - If Gaming, what resolution (1080p, 1440p, 4K)?
   - Any Aesthetic preferences (Black, White, RGB)?

2. PRODUCT SELECTION: 
   - Use market_search(query) to find parts. 
   - If the user explicitly asks for specific retailers (e.g. "Best Buy and Newegg"), you MUST use the 'preferredRetailer' argument in market_search (as a comma-separated string if multiple).
   - You do NOT need to find the absolute cheapest part. Select high-quality components that fit the user's budget range.
   - Prioritize "Best Buy" or major retailer availability.
   - BRAND RESTRICTION: For RAM (Memory) recommendations, you MUST ONLY use "Corsair" or "G.Skill" brands. Do not recommend other RAM brands.

3. LINKS:
   - For the "Link" column in tables, ALWAYS use the Merchant Search Page URL provided by the tool (e.g., ending in searchpage.jsp or similar). DO NOT use direct product links.

4. BUILD MODE TABLE FORMAT:
   Category | Recommended Part | Price (Est.) | Link | Why This Part

5. FIX MODE: Always prioritize safety. Provide ranked causes and a diagnostic plan.

6. PERFORMANCE CHART: At the very end of any BUILD recommendation (Featured or Custom), you MUST output a JSON block wrapped in a code fence labeled "performance" that scores the build from 0-100 on key metrics.
   - The format must be VALID JSON. Do not include comments inside the JSON.
   - Metrics should include Gaming at different resolutions, Productivity, and Efficiency/Thermals.
   
   Example format:
   \`\`\`performance
   {
     "1080p Gaming": 95,
     "1440p Gaming": 85,
     "4K Gaming": 60,
     "Productivity": 90,
     "Thermals & Acoustics": 75
   }
   \`\`\`

Always end responses with a brief disclaimer about price/stock volatility.
`;
