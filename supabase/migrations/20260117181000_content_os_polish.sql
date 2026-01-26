-- SOCIAL OS: CONTENT OS POLISH
-- Upgrading seed content for the Vision page

UPDATE public.platform_pages 
SET content = '[
    {"id": "h1", "type": "hero", "data": {"title": "The Neural Social Layer", "subtitle": "Activate your node in the global social OS.", "buttonText": "Sync Now", "buttonLink": "/map"}},
    {"id": "s1", "type": "stats", "data": {"items": [{"label": "Active Nodes", "value": "1.2M+"}, {"label": "Daily Transmissions", "value": "45M"}, {"label": "Network Energy", "value": "98.4%"}]}},
    {"id": "f1", "type": "features", "data": {"title": "Autonomous Infrastructure", "items": [{"title": "Live Map", "description": "Real-time presence visualization with neural heatmaps."}, {"title": "Smart Wallet", "description": "Seamless cross-border transfers and asset vaulting."}, {"title": "AI Agents", "description": "Autonomous curators managing your social experience."}]}},
    {"id": "t1", "type": "text", "data": {"body": "Hup is the first operating system designed for human social dynamics. By integrating geospatial data, financial infrastructure, and AI reasoning, we create an environment where connections are meaningful, autonomous, and financially rewarding."}},
    {"id": "c1", "type": "cta", "data": {"title": "Join the Expansion", "buttonText": "Start Transmitting", "buttonLink": "/signup"}}
]'::jsonb
WHERE slug = 'vision';
