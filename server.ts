import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK to prevent startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Running in mock/fallback mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper to provide nice mock responses if API Key is not set
function generateMockCrateDiggerReply(
  userMessage: string,
  collection: any[],
  wishlist: any[],
  budget: { monthlyBudget: number; overdraftAllowed: boolean }
): { reply: string; action: any | null } {
  const lowercaseMsg = userMessage.toLowerCase();
  
  // Calculate remaining budget
  const spent = collection
    .filter((r: any) => r.purchasePrice && !r.isWishlist)
    .reduce((sum: number, r: any) => sum + (Number(r.purchasePrice) || 0), 0);
  const remaining = budget.monthlyBudget - spent;

  // 1. Try to detect a record purchase logging
  // Example: "I picked up Kind of Blue, VG+, sleeve is G. Cost me 25 bucks"
  if (lowercaseMsg.includes("picked up") || lowercaseMsg.includes("bought") || lowercaseMsg.includes("logged") || lowercaseMsg.includes("log a")) {
    // Attempt simple regex parse for a record
    let title = "Unknown Album";
    let artist = "Unknown Artist";
    let price = 20;
    let mediaGrade = "VG+";
    let sleeveGrade = "VG";

    if (lowercaseMsg.includes("kind of blue")) {
      title = "Kind of Blue";
      artist = "Miles Davis";
      price = 25;
      mediaGrade = "VG+";
      sleeveGrade = "G";
    } else if (lowercaseMsg.includes("a love supreme")) {
      title = "A Love Supreme";
      artist = "John Coltrane";
      price = 35;
      mediaGrade = "NM";
      sleeveGrade = "NM";
    } else if (lowercaseMsg.includes("blue note")) {
      title = "Blue Note Masterpiece";
      artist = "Thelonious Monk";
      price = 200;
      mediaGrade = "VG+";
      sleeveGrade = "VG+";
    } else {
      // General extraction attempt
      const match = userMessage.match(/(?:picked up|bought)\s+([^,]+)(?:by\s+([^,]+))?/i);
      if (match) {
        title = match[1].trim();
        if (match[2]) artist = match[2].trim();
      }
    }

    // Check budget
    if (price > remaining && !budget.overdraftAllowed) {
      const shortfall = price - remaining;
      return {
        reply: `### ⚠️ Budget Shortfall Warning\n\nYour remaining budget is **$${remaining.toFixed(2)}** and logging **"${title}"** by **${artist}** would cost **$${price.toFixed(2)}**.\n\nThat's a **$${shortfall.toFixed(2)}** shortfall!\n\nWould you like me to go over budget anyway? Say **"yes, override"** or click **Override Budget** in the control panel to bypass.`,
        action: null
      };
    }

    return {
      reply: `### 🎵 Logged to Collection!\n\nI've logged **"${title}"** by **${artist}** into your physical crate.\n- **Media Grade**: \`${mediaGrade}\`\n- **Sleeve Grade**: \`${sleeveGrade}\`\n- **Purchase Price**: $${price.toFixed(2)}\n\nThis fits comfortably within your budget of $${budget.monthlyBudget.toFixed(2)}. Excellent digging!`,
      action: {
        type: "ADD_RECORD",
        payload: {
          title,
          artist,
          mediaGrade,
          sleeveGrade,
          purchasePrice: price,
          estimatedValue: price * 1.2,
          isWishlist: false
        }
      }
    };
  }

  // 2. Budget overrides
  if (lowercaseMsg.includes("override") || lowercaseMsg.includes("yes, override")) {
    return {
      reply: `### 🔓 Budget Overdraft Enabled!\n\nI've overridden the monthly limit for you. You can now log premium items, but remember, true crate digging is about finding gems on a dime!`,
      action: {
        type: "SET_OVERDRAFT",
        payload: { allowed: true }
      }
    };
  }

  // 3. Wishlist additions
  if (lowercaseMsg.includes("wishlist") || lowercaseMsg.includes("dig for next")) {
    if (lowercaseMsg.includes("coltrane") || lowercaseMsg.includes("supreme")) {
      return {
        reply: `### 📋 Added to Wishlist!\n\nI've added John Coltrane's **"A Love Supreme"** to your Dig List.\n- **Estimated Price**: ~$38.00\n- **Target Grade**: NM\n\nThis is a superb addition to your digital crate since you don't have any John Coltrane in your collection yet.`,
        action: {
          type: "ADD_RECORD",
          payload: {
            title: "A Love Supreme",
            artist: "John Coltrane",
            mediaGrade: "NM",
            sleeveGrade: "NM",
            estimatedValue: 38,
            isWishlist: true
          }
        }
      };
    }

    return {
      reply: `### 📋 Wishlist Recommendation\n\nWhat should we dig for next? I highly recommend finding a copy of **"A Love Supreme"** by John Coltrane. It typically estimates at **$38.00** for a NM reissue, which fits beautifully in your budget.`,
      action: null
    };
  }

  // Default fallback chat response
  return {
    reply: `### 📻 Hello! I'm CrateDigger AI.\n\nI can help you organize and catalog your physical record collection, manage your wishlist, estimate fair market values, and keep your budget in check.\n\nTry telling me: \n- *"I bought Kind of Blue on VG+ for 25 dollars."*\n- *"What should I dig for next this month?"*\n- *"Log a $200 rare Blue Note pressing."*`,
    action: null
  };
}

// Chat API Route using Gemini or fallbacks
app.post("/api/chat", async (req, res) => {
  const { messages, collection, wishlist, budget, userMessage } = req.body;

  const spent = (collection || [])
    .filter((r: any) => r.purchasePrice && !r.isWishlist)
    .reduce((sum: number, r: any) => sum + (Number(r.purchasePrice) || 0), 0);
  const remaining = (budget?.monthlyBudget || 200) - spent;

  const ai = getGeminiClient();

  if (!ai) {
    // API key missing - use our custom rules-based mock engine which perfectly matches the instruction flow!
    const mockRes = generateMockCrateDiggerReply(userMessage, collection || [], wishlist || [], {
      monthlyBudget: budget?.monthlyBudget || 200,
      overdraftAllowed: budget?.overdraftAllowed || false,
    });
    return res.json(mockRes);
  }

  try {
    const formattedCollection = (collection || [])
      .map((r: any) => `- "${r.title}" by ${r.artist} [Media: ${r.mediaGrade}, Sleeve: ${r.sleeveGrade}, Price: $${r.purchasePrice || 0}, Est: $${r.estimatedValue || 0}]`)
      .join("\n");

    const formattedWishlist = (wishlist || [])
      .map((r: any) => `- "${r.title}" by ${r.artist} [Media: ${r.mediaGrade}, Est: $${r.estimatedValue || 0}]`)
      .join("\n");

    const systemPrompt = `You are CrateDigger, an elite personal AI agent for vinyl and record collectors.
You help log physical record collections, manage wishlists (Dig Lists), estimate prices, and strictly enforce a monthly digging budget at the tool layer.

Current User State:
- Records in collection:
${formattedCollection || "No records logged yet."}

- Records in wishlist:
${formattedWishlist || "Wishlist is empty."}

- Monthly Budget Limit: $${budget?.monthlyBudget || 200}
- Total Spent this month: $${spent.toFixed(2)}
- Remaining budget: $${remaining.toFixed(2)}
- Overdraft/Over-budget allowed: ${budget?.overdraftAllowed ? "YES" : "NO"}

GRADING SCALE RULES:
Grading is critical for valuation:
- M (Mint): Perfect, pristine reissue or sealed copy.
- NM (Near Mint): Like new, no scuffs, plays flawlessly.
- VG+ (Very Good Plus): Light signs of use, minor scuffs, minimal noise. Excellent.
- VG (Very Good): Visible light scratches, slight surface noise during soft passages, but good player.
- G+/G (Good/Good Plus): Heavy wear, crackle, cover might have splits or ring wear.
- P (Poor): Scratched, may skip, cover split completely.

BUDGET ENFORCEMENT PROTOCOL:
1. When a user tells you they bought, picked up, or want to log a record:
   - Carefully extract the title, artist, media/sleeve grades, and purchase price from their input.
   - If purchase price is NOT specified, estimate a fair price (e.g., reissues $20-35, original/rare $50-150 depending on artist and condition).
   - If the price is higher than the remaining budget of $${remaining.toFixed(2)} AND budget overdraft is NOT allowed (overdraftAllowed is false):
     * You MUST calculate the exact shortfall.
     * Explain the shortfall clearly to the user.
     * Tell them they have exceeded their budget and REFUSE to execute the ADD_RECORD action yet.
     * Inform them they must override the budget constraint by saying "yes, override" or clicking "Override Budget". Do NOT return an action block for adding the record.
   - If the price fits in the budget, OR if overdraft is allowed (overdraftAllowed is true):
     * Log it using the ADD_RECORD action with the appropriate payload.

2. Wishlist recommendations:
   - Suggest great vinyl releases that fit comfortably within their remaining budget.
   - For example, if they have no John Coltrane and have $42 remaining, suggest reissues like "A Love Supreme" in NM (typically ~$38) which fits perfectly.

YOU MUST RESPOND WITH A JSON OBJECT containing exactly two keys:
- "reply": (string) Your markdown-formatted response written in the persona of CrateDigger (passionate about record stores, deep grooves, high fidelity, and finding bargain gems). Keep it descriptive and dynamic!
- "action": (object or null) An action to perform on the frontend:
  * To add a record to collection: { "type": "ADD_RECORD", "payload": { "title": string, "artist": string, "mediaGrade": "M"|"NM"|"VG+"|"VG"|"G+"|"G"|"P", "sleeveGrade": "M"|"NM"|"VG+"|"VG"|"G+"|"G"|"P", "purchasePrice": number, "estimatedValue": number, "isWishlist": false } }
  * To add to wishlist: { "type": "ADD_RECORD", "payload": { "title": string, "artist": string, "mediaGrade": "NM", "sleeveGrade": "NM", "estimatedValue": number, "isWishlist": true } }
  * To override/enable overdraft budget: { "type": "SET_OVERDRAFT", "payload": { "allowed": true } }
  * To change monthly budget: { "type": "UPDATE_BUDGET", "payload": { "monthlyBudget": number } }
  * To remove a record: { "type": "REMOVE_RECORD", "payload": { "title": string, "artist": string } }

Do not output any introductory or tailing conversational text outside the JSON object itself. Respond in clean JSON.`;

    const chatSession = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    const response = await chatSession.sendMessage({
      message: userMessage
    });

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);

  } catch (error) {
    console.error("Gemini API error:", error);
    // Graceful degradation fallback
    const fallbackRes = generateMockCrateDiggerReply(userMessage, collection || [], wishlist || [], {
      monthlyBudget: budget?.monthlyBudget || 200,
      overdraftAllowed: budget?.overdraftAllowed || false,
    });
    res.json({
      reply: `### 📻 Live Mode Connection Notice\n\nI encountered an issue connecting to my core Gemini brain, so I'm running in local offline mode. \n\n${fallbackRes.reply}`,
      action: fallbackRes.action
    });
  }
});

// Price Estimator API Route using Gemini or fallback
app.post("/api/estimate", async (req, res) => {
  const { title, artist, mediaGrade, sleeveGrade, releaseYear } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    // Generate a quick realistic mock estimate
    const basePrices: Record<string, number> = {
      "kind of blue": 30,
      "a love supreme": 35,
      "dark side of the moon": 40,
      "abbey road": 28,
      "rumours": 25,
      "pet sounds": 32,
    };
    const key = String(title).toLowerCase();
    let price = 25;
    for (const k of Object.keys(basePrices)) {
      if (key.includes(k)) {
        price = basePrices[k];
        break;
      }
    }
    // Adjust for grading
    const multipliers: Record<string, number> = {
      "M": 1.5, "NM": 1.2, "VG+": 1.0, "VG": 0.8, "G+": 0.6, "G": 0.4, "P": 0.15
    };
    const mediaMult = multipliers[mediaGrade as string] || 1.0;
    const sleeveMult = multipliers[sleeveGrade as string] || 1.0;
    const estimatedVal = price * ((mediaMult + sleeveMult) / 2);

    return res.json({
      estimatedValue: Math.round(estimatedVal),
      confidence: "High (Mock Mode)",
      notes: `Offline estimation based on typical historical sales of reissues or original pressings in similar condition. Media: ${mediaGrade}, Sleeve: ${sleeveGrade}.`
    });
  }

  try {
    const prompt = `Give me a fair-market price estimate (USD) for a vinyl record:
Album: "${title}" by ${artist}
Release Year: ${releaseYear || "Unknown"}
Media Condition: ${mediaGrade}
Sleeve Condition: ${sleeveGrade}

Respond ONLY in JSON format with keys:
- "estimatedValue": number (single USD integer representing the average price based on recent Discogs/eBay sales)
- "notes": string (brief 1-2 sentence explanation of the pricing context, e.g. rarity of pressing or impact of visual grade scuffs)
- "confidence": string ("High" | "Medium" | "Low")`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);

  } catch (error) {
    console.error("Estimation error:", error);
    res.json({
      estimatedValue: 25,
      confidence: "Low (Fallback)",
      notes: "Fallback standard estimate due to pricing server connection error."
    });
  }
});

// Vite middleware and production static assets routing
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development full-stack server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production full-stack server running on port ${PORT}`);
  });
}
