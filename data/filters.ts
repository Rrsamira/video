
import { AIFilter } from '../types';

export const AI_FILTERS: AIFilter[] = [
    // Cinematic Filters
    { id: "h-blockbuster", name: "Hollywood Blockbuster", icon: "🎥", category: "cinematic", tags: ["ai", "cinematic", "premium"], description: "Big-budget movie look with enhanced colors and contrast", premium: true, style: { filter: 'contrast(1.2) saturate(1.3) brightness(1.1)' } },
    { id: "neo-noir", name: "Neo-Noir", icon: "🕶️", category: "cinematic", tags: ["ai", "dramatic", "dark"], description: "Mysterious and dramatic film noir style", style: { filter: 'contrast(1.5) brightness(0.7) saturate(0.5)' } },
    { id: "scifi", name: "Sci-Fi Futuristic", icon: "🚀", category: "cinematic", tags: ["ai", "futuristic", "blue"], description: "Futuristic blue-tinted sci-fi movie effect", style: { filter: 'hue-rotate(180deg) brightness(1.2) saturate(1.5)' } },
    { id: "anime", name: "Anime Style", icon: "🌸", category: "cinematic", tags: ["ai", "anime", "vibrant"], description: "Japanese anime-style color grading", style: { filter: 'saturate(1.8) contrast(1.1) brightness(1.1)' } },
    { id: "wes-anderson", name: "Wes Anderson", icon: "🎨", category: "cinematic", tags: ["ai", "pastel"], description: "Symmetrical framing and pastel color palette", style: { filter: 'sepia(0.2) saturate(1.4) hue-rotate(-10deg) brightness(1.05)' } },
    
    // Color Grading
    { id: "teal-orange", name: "Teal & Orange", icon: "🌅", category: "color", tags: ["ai", "hollywood"], description: "Popular Hollywood teal and orange color grading", style: { filter: 'contrast(1.1) saturate(1.2) sepia(0.1)' } },
    { id: "golden-hour", name: "Golden Hour", icon: "🌇", category: "color", tags: ["ai", "warm", "sunset"], description: "Warm golden sunset lighting effect", style: { filter: 'sepia(0.4) saturate(1.5) brightness(1.1) hue-rotate(-15deg)' } },
    { id: "cool-blue", name: "Cool Blue", icon: "❄️", category: "color", tags: ["ai", "cool", "blue"], description: "Cool blue tone color grading", style: { filter: 'hue-rotate(190deg) saturate(0.8) brightness(0.9)' } },
    { id: "vibrant", name: "Vibrant Boost", icon: "🌈", category: "color", tags: ["ai", "vibrant"], description: "Enhanced color saturation and vibrancy", style: { filter: 'saturate(2)' } },
    
    // Vintage
    { id: "vhs", name: "80s VHS", icon: " cassette", category: "vintage", tags: ["ai", "80s", "vhs"], description: "Classic VHS tape aesthetic", style: { filter: 'contrast(0.9) brightness(1.1) saturate(1.2) sepia(0.2)' } },
    { id: "retro-70s", name: "70s Retro", icon: "🕺", category: "vintage", tags: ["ai", "70s", "retro"], description: "1970s vintage film look", style: { filter: 'sepia(0.5) contrast(0.8) brightness(1.1)' } },
    { id: "polaroid", name: "Polaroid", icon: "📷", category: "vintage", tags: ["ai", "polaroid"], description: "Instant Polaroid photo look", style: { filter: 'contrast(1.1) brightness(1.1) saturate(0.8) sepia(0.2)' } },
    { id: "blackwhite", name: "Classic B&W", icon: "⚫", category: "vintage", tags: ["bw", "classic"], description: "Timeless black and white cinematography", style: { filter: 'grayscale(1) contrast(1.2)' } },
    
    // Artistic
    { id: "oil-painting", name: "Oil Painting", icon: "🖼️", category: "artistic", tags: ["ai", "painting"], description: "Classic oil painting effect", premium: true },
    { id: "watercolor", name: "Watercolor", icon: "🎨", category: "artistic", tags: ["ai", "watercolor"], description: "Soft watercolor painting style" },
    { id: "sketch", name: "Sketch Drawing", icon: "✏️", category: "artistic", tags: ["ai", "sketch"], description: "Pencil sketch drawing effect" },
    { id: "pop-art", name: "Pop Art", icon: "🟡", category: "artistic", tags: ["ai", "popart"], description: "Andy Warhol pop art style" },
    
    // AI Advanced
    { id: "sky-replace", name: "AI Sky Replacement", icon: "🌌", category: "ai", tags: ["ai", "sky"], description: "Automatically replace sky with AI", new: true, premium: true },
    { id: "super-res", name: "AI Super Resolution", icon: "🔍", category: "ai", tags: ["ai", "enhance"], description: "Enhance video quality with AI", premium: true },
    { id: "slow-mo", name: "AI Slow Motion", icon: "🐌", category: "ai", tags: ["ai", "slowmo"], description: "AI-powered smooth slow motion", new: true }
];

export const CATEGORIES = [
    { id: 'all', name: 'All Filters' },
    { id: 'cinematic', name: 'Cinematic' },
    { id: 'color', name: 'Color Grading' },
    { id: 'vintage', name: 'Vintage' },
    { id: 'artistic', name: 'Artistic' },
    { id: 'ai', name: 'AI Powered' }
];
