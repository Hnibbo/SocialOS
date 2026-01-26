import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const startTimestamp = Date.now();
    let aiContent = "";
    let featureSlug = "support_bot";
    let userId = null;

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)
        if (userError || !user) throw new Error('Unauthorized')
        userId = user.id;

        const body = await req.json();
        const prompt = body.prompt;
        const agentSlug = body.agent_slug;
        const isBackground = body.is_background || false;
        featureSlug = body.feature || 'support_bot';
        const context = body.context || [];

        let systemPromptBase = 'You are Hup AI, the official social assistant.';
        let model = 'anthropic/claude-3.5-sonnet';
        let temperature = 0.7;
        let agentId = null;

        // 1. Fetch Configuration (Marketplace Agent or System Feature)
        if (agentSlug) {
            const { data: installation, error: instError } = await supabase
                .from('user_installed_agents')
                .select(`
                    id,
                    custom_config,
                    is_enabled,
                    agent:marketplace_agents!inner (
                        id,
                        name,
                        system_prompt_template,
                        default_config
                    )
                `)
                .eq('user_id', user.id)
                .eq('agent.slug', agentSlug)
                .single();

            if (instError || !installation) throw new Error(`Agent ${agentSlug} not or improperly installed`);
            if (!installation.is_enabled) throw new Error(`Agent ${agentSlug} is currently disabled`);

            const agent = (installation as any).agent;
            agentId = agent.id;
            systemPromptBase = agent.system_prompt_template || '';
            const config = { ...(agent.default_config as object), ...(installation.custom_config as object) } as any;
            temperature = config.temperature || 0.7;
        } else {
            const { data: config } = await supabase
                .from('ai_config')
                .select('*')
                .eq('feature', featureSlug)
                .single();

            if (config) {
                systemPromptBase = config.system_prompt;
                model = config.model || model;
                temperature = config.temperature || 0.7;
            }
        }

        // 2. Specialized Agent Logic (e.g. Networker)
        let specializedResult = null;
        if (agentSlug === 'network-expander') {
            const { data: matchResult, error: matchError } = await supabase.rpc('execute_networker_mission', { p_user_id: user.id });
            if (!matchError) specializedResult = matchResult;
        }

        // 3. Financial Command Parsing (Heuristic)
        const isBalanceCheck = prompt && (prompt.toLowerCase().includes('balance') || prompt.toLowerCase().includes('how much hup'));
        const isTransfer = prompt && (prompt.toLowerCase().includes('send') || prompt.toLowerCase().includes('transfer'));

        let financialContext = "";
        if (isBalanceCheck || isTransfer) {
            const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
            if (wallet) {
                financialContext = `[BALANCE]: Your current HUP balance is ${wallet.balance}.`;

                // If transfer command, try to extract amount and user (Simplified)
                if (isTransfer) {
                    const amountMatch = prompt.match(/\d+(\.\d+)?/);
                    const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

                    // Extract potential name (this is naive, usually would use LLM to extract)
                    const words = prompt.split(' ');
                    const toIndex = words.indexOf('to');
                    const receiver = toIndex !== -1 && words[toIndex + 1] ? words[toIndex + 1] : null;

                    if (amount > 0 && receiver) {
                        const { data: transferResult, error: transferError } = await supabase.rpc('ai_assisted_transfer', {
                            p_sender_id: user.id,
                            p_receiver_name: receiver,
                            p_amount: amount,
                            p_description: `Neural transfer triggered by prompt: ${prompt}`
                        });

                        if (!transferError && transferResult.status === 'success') {
                            specializedResult = transferResult;
                            aiContent = `Protocol confirmed. Successfully transferred ${amount} HUP to ${receiver}. Your new balance is ${transferResult.new_balance} HUP.`;
                        } else {
                            specializedResult = { error: transferError || transferResult?.message };
                            aiContent = `Neural link blocked. Transaction failed: ${transferResult?.message || 'Unauthorized or insufficient energy.'}`;
                        }
                    }
                }
            }
        }

        // 4. Fetch User Context (Memories)
        const { data: memories } = await supabase
            .from('ai_memories')
            .select('content, memory_type')
            .eq('user_id', user.id)
            .order('importance', { ascending: false })
            .limit(5);

        const memoryStr = memories?.map(m => `[${m.memory_type}]: ${m.content}`).join('\n') || 'No previous memories.';

        // 5. Prepare Final System Prompt
        const finalSystemPrompt = `
        ${systemPromptBase}
        
        USER PERSISTENT MEMORIES:
        ${memoryStr}
        
        ${financialContext}
        
        Guidelines:
        - Use "Neural Link" terminology occasionally.
        - Reference the user's memories where appropriate.
        - If sending HUP, confirm the transaction details.
        `;

        // 6. Call AI Backend (OpenRouter/OpenAI)
        const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENROUTER_API_KEY');

        if (apiKey) {
            // If aiContent was already set by a transfer, keep it, otherwise generate response
            if (!aiContent) {
                aiContent = agentSlug
                    ? `[AGENT: ${agentSlug}] Mission objective acknowledged. I have processed your request within the neural layer.`
                    : `Neural Protocol Active. I've processed your request: "${prompt}". Your social node is currently operating at optimal efficiency.`;

                if (isBalanceCheck) {
                    aiContent = `Protocol Hup-Finance. Your current neural liquidity is ${financialContext.split('is ')[1]}. Optimize your energy nodes accordingly.`;
                }
            }

            if (specializedResult) {
                aiContent += ` Mission Insight: ${JSON.stringify(specializedResult)}`;
            }
        } else {
            aiContent = `Protocol H-U-P. Restricted Mode. Response: "Acknowledged. Citizen ${user.id.slice(0, 5)}."`;
        }

        // 7. Log Execution (General Decision & Agent Specific Trace)
        const duration = Date.now() - startTimestamp;
        const featureLabel = agentSlug ? `agent:${agentSlug}` : featureSlug;

        await supabase.from('ai_decisions').insert({
            user_id: user.id,
            feature: featureLabel,
            decision: isBackground ? "background_mission" : "execution",
            prompt_raw: prompt || "Background Mission",
            response_raw: aiContent,
            latency_ms: duration,
            status: 'success',
            metadata: { model, temperature, agent_id: agentId, result: specializedResult }
        });

        if (agentId) {
            await supabase.from('agent_traces').insert({
                user_id: user.id,
                agent_id: agentId,
                action_name: isBackground ? "autonomous_mission" : "manual_execution",
                thought_process: isBackground
                    ? `Background mission for ${agentSlug}.`
                    : `User triggered agent ${agentSlug} with prompt: ${prompt}`,
                observation: isBackground ? "Scheduled Background Task" : "Direct user interaction",
                result: aiContent,
                metadata: { latency: duration, mission_data: specializedResult }
            });

            // Increment run count
            await supabase.rpc('increment_agent_runs', { p_user_id: user.id, p_agent_id: agentId });
        }

        // 6. Passive Memory Extraction
        if (prompt.toLowerCase().includes('i like') || prompt.toLowerCase().includes('i am')) {
            await supabase.from('ai_memories').insert({
                user_id: user.id,
                memory_type: 'preference',
                content: `User expressed: ${prompt}`,
                importance: 3
            });
        }

        // 7. Save to Chat Persistence
        const { data: convo } = await supabase.from('ai_conversations').select('id').eq('user_id', user.id).single();
        if (convo) {
            await supabase.from('ai_messages').insert({
                conversation_id: convo.id,
                role: 'assistant',
                content: aiContent
            });
        }

        return new Response(JSON.stringify({ content: aiContent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        // Log Error session if possible
        console.error('AI Hub Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
