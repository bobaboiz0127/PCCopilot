
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse, Content } from "@google/genai";
import { SYSTEM_PROMPT } from "./constants";

// We create a fresh instance when needed, but keep a default one for tools if necessary
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper to create variations with reliable Search URLs
const createOffers = (name: string, basePrice: number, image: string) => {
  const cleanQuery = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  const encodedQuery = encodeURIComponent(cleanQuery);
  
  return [
    { 
      retailer: "Best Buy", 
      price: basePrice, 
      name, 
      image, 
      // Best Buy Search URL - PREFERRED
      url: `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedQuery}` 
    },
    { 
      retailer: "Newegg", 
      price: parseFloat((basePrice * (0.95 + Math.random() * 0.1)).toFixed(2)), 
      name, 
      image, 
      // Newegg Search URL
      url: `https://www.newegg.com/p/pl?d=${encodedQuery}` 
    },
    { 
      retailer: "Microcenter", 
      price: parseFloat((basePrice * 0.92).toFixed(2)), 
      name: name + " (In-Store Bundle)", 
      image, 
      // Micro Center Search URL
      url: `https://www.microcenter.com/search/search_results.aspx?Ntt=${encodedQuery}` 
    }, 
    { 
      retailer: "B&H", 
      price: parseFloat((basePrice * (0.98 + Math.random() * 0.05)).toFixed(2)), 
      name, 
      image, 
      // B&H Search URL
      url: `https://www.bhphotovideo.com/c/search?Ntt=${encodedQuery}` 
    },
  ];
};

// Realistic Market Product Database
const MOCK_MARKET_DB: Record<string, any[]> = {
  // CPUs
  "ryzen 5 7600": createOffers("AMD Ryzen 5 7600", 199.00, "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=200"),
  "ryzen 9 7900x": createOffers("AMD Ryzen 9 7900X", 439.00, "https://images.unsplash.com/photo-1555618568-963599a07802?auto=format&fit=crop&q=80&w=200"),
  "core i5-13600k": createOffers("Intel Core i5-13600K", 289.99, "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=200"),
  "core i7-13700k": createOffers("Intel Core i7-13700K", 379.99, "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=200"),
  
  // GPUs
  "rtx 4060": createOffers("GIGABYTE GeForce RTX 4060 WINDFORCE OC", 299.99, "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=200"),
  "rtx 4070 super": createOffers("NVIDIA GeForce RTX 4070 Super", 599.99, "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=200"),
  "rtx 4080 super": createOffers("PNY GeForce RTX 4080 Super Verto OC", 999.99, "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=200"),
  "rtx 4090": createOffers("ASUS TUF Gaming GeForce RTX 4090 OC", 1799.99, "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=200"),
  
  // Motherboards
  "b650 motherboard": createOffers("MSI MAG B650 TOMAHAWK WIFI", 219.99, "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200"),
  "z790 motherboard": createOffers("ASUS ROG STRIX Z790-E GAMING WIFI", 399.99, "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200"),
  "x670 motherboard": createOffers("GIGABYTE X670 AORUS ELITE AX", 249.99, "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200"),
  
  // RAM
  "16gb ddr5 5200": createOffers("CORSAIR VENGEANCE 32GB DDR5 5200MHz", 99.99, "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=200"),
  "32gb ddr5 6000": createOffers("G.SKILL Ripjaws S5 32GB DDR5 6000MHz", 119.99, "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=200"),
  "64gb ddr5 6000": createOffers("G.SKILL Trident Z5 RGB 64GB DDR5 6000MHz", 209.99, "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=200"),
  
  // Storage
  "1tb nvme ssd": createOffers("Samsung 990 EVO 1TB NVMe SSD", 79.99, "https://images.unsplash.com/photo-1531297461136-82lw9z0u8e88?auto=format&fit=crop&q=80&w=200"),
  "2tb gen4 ssd": createOffers("WD_BLACK SN850X 2TB NVMe SSD", 159.99, "https://images.unsplash.com/photo-1531297461136-82lw9z0u8e88?auto=format&fit=crop&q=80&w=200"),
  "4tb nvme ssd": createOffers("Samsung 990 PRO 4TB NVMe SSD", 319.99, "https://images.unsplash.com/photo-1531297461136-82lw9z0u8e88?auto=format&fit=crop&q=80&w=200"),
  
  // PSU
  "650w gold psu": createOffers("CORSAIR RM650 650W 80+ Gold PSU", 89.99, "https://images.unsplash.com/photo-1587202377465-33b55855339a?auto=format&fit=crop&q=80&w=200"),
  "750w gold psu": createOffers("CORSAIR RM750e 750W 80+ Gold PSU", 109.99, "https://images.unsplash.com/photo-1587202377465-33b55855339a?auto=format&fit=crop&q=80&w=200"),
  "1000w platinum psu": createOffers("Be Quiet! Dark Power 13 1000W", 239.99, "https://images.unsplash.com/photo-1587202377465-33b55855339a?auto=format&fit=crop&q=80&w=200"),
  
  // Case / Coolers
  "atx airflow case": createOffers("NZXT H5 Flow RGB ATX Mid-Tower", 94.99, "https://images.unsplash.com/photo-1587202377465-33b55855339a?auto=format&fit=crop&q=80&w=200"),
  "full tower case": createOffers("Lian Li O11 Dynamic EVO XL", 234.99, "https://images.unsplash.com/photo-1587202377465-33b55855339a?auto=format&fit=crop&q=80&w=200"),
  "liquid cooler 240mm": createOffers("NZXT Kraken 240 240mm AIO", 139.99, "https://images.unsplash.com/photo-1526659547046-d72585c95077?auto=format&fit=crop&q=80&w=200"),
};

export const marketSearchTool = async (query: string, preferredRetailer?: string) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const lowerQuery = query.toLowerCase();
  
  let bestMatchKey = Object.keys(MOCK_MARKET_DB).find(key => lowerQuery.includes(key));
  let offers = bestMatchKey ? MOCK_MARKET_DB[bestMatchKey] : null;

  if (!offers) {
    return [];
  }

  let selectedOffer = null;

  // If retailer preference exists (comma separated support)
  if (preferredRetailer) {
    const preferences = preferredRetailer.toLowerCase().split(',').map(s => s.trim());
    // Find ALL offers that match ANY of the preferred retailers
    const validOffers = offers.filter((o: any) => 
      preferences.some(pref => o.retailer.toLowerCase().includes(pref))
    );

    if (validOffers.length > 0) {
      // Sort valid offers by price (ascending) to find the best deal among selected stores
      validOffers.sort((a: any, b: any) => a.price - b.price);
      selectedOffer = validOffers[0];
    }
  }

  // Fallback Logic
  if (!selectedOffer) {
     // Default preference: Best Buy > First available if no preference matched
     const bestBuyOffer = offers.find((o: any) => o.retailer === "Best Buy");
     selectedOffer = bestBuyOffer || offers[0];
  }

  return [{
    name: selectedOffer.name,
    price: selectedOffer.price,
    retailer: selectedOffer.retailer,
    url: selectedOffer.url, 
    sku: Math.floor(Math.random() * 9000000 + 1000000).toString(),
    rating: 4.5 + Math.random() * 0.5,
    reviews: 100 + Math.floor(Math.random() * 900),
    in_stock_online: true,
    image: selectedOffer.image
  }];
};

const marketFunctionDeclaration: FunctionDeclaration = {
  name: 'market_search',
  parameters: {
    type: Type.OBJECT,
    description: 'Find a PC component and its current market price. Returns a merchant search page URL.',
    properties: {
      query: {
        type: Type.STRING,
        description: 'The component to search for (e.g., "RTX 4070 Super", "Ryzen 5 7600")',
      },
      preferredRetailer: {
        type: Type.STRING,
        description: 'Optional. Filter results to specific retailers. Can be a single retailer or comma-separated list (e.g., "Best Buy, Newegg").',
      },
    },
    required: ['query'],
  },
};

export const createChatSession = (additionalContext: string = "", history: Content[] = []) => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history,
    config: {
      systemInstruction: SYSTEM_PROMPT + "\n" + additionalContext,
      tools: [{ functionDeclarations: [marketFunctionDeclaration] }],
    },
  });

  // Wrap the sendMessage to handle image inputs
  return {
    ...chat,
    sendMessage: async (params: { message: string, image?: { inlineData: { data: string, mimeType: string } }, functionResponses?: any[] }) => {
      if (params.functionResponses) {
        return chat.sendMessage(params);
      }
      
      if (params.image) {
        // If image is provided, construct a multipart message
        return chat.sendMessage({
          message: {
            parts: [
              { text: params.message },
              { inlineData: params.image.inlineData }
            ]
          }
        } as any); // Type assertion needed as the wrapper simplifies the signature
      }
      
      return chat.sendMessage({ message: params.message });
    }
  };
};

export const handleToolCalls = async (response: GenerateContentResponse) => {
  if (!response.functionCalls) return response;

  const functionResponses = await Promise.all(
    response.functionCalls.map(async (fc) => {
      if (fc.name === 'market_search') {
        const query = fc.args.query as string;
        // Extract optional retailer argument
        const preferredRetailer = fc.args.preferredRetailer as string | undefined;
        
        const results = await marketSearchTool(query, preferredRetailer);
        return {
          id: fc.id,
          name: fc.name,
          response: { results },
        };
      }
      return null;
    })
  );

  return functionResponses.filter(r => r !== null);
};

export const generateBuildVideo = async (prompt: string, style: 'showcase' | 'instruction' = 'showcase'): Promise<string | null> => {
  const ai = getAiClient();
  try {
    const prefix = style === 'showcase' 
      ? "Cinematic 4k highly detailed PC build hardware showcase, 10 seconds long, tech noir lighting: " 
      : "Educational instructional video, close-up of hands assembling PC parts, bright lighting, clear focus, 4k, realistic, step-by-step assembly: ";

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${prefix}${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    // Fetch the video content using the API key
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Video generation failed", e);
    throw e;
  }
};
