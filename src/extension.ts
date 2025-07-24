import * as vscode from 'vscode';
import { CostKatanaAPI } from './api';

export function activate(context: vscode.ExtensionContext) {
    console.log('Cost Katana AI Optimizer extension is now active!');

    const api = new CostKatanaAPI();

    // Register commands
    let connectCommand = vscode.commands.registerCommand('cost-katana.connect', async () => {
        const email = await vscode.window.showInputBox({
            prompt: 'Enter your email to connect to Cost Katana',
            placeHolder: 'your.email@example.com'
        });

        if (!email) {
            return;
        }

        try {
            vscode.window.showInformationMessage('Generating magic link...');
            const response = await api.generateMagicLink(email);
            
            if (response.success && response.data) {
                vscode.window.showInformationMessage('Magic link generated! Opening in browser...');
                vscode.env.openExternal(vscode.Uri.parse(response.data.magic_link));
            } else {
                vscode.window.showErrorMessage(`Failed to generate magic link: ${response.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    let trackUsageCommand = vscode.commands.registerCommand('cost-katana.track-usage', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const prompt = await vscode.window.showInputBox({
            prompt: 'Enter the AI prompt you used',
            placeHolder: 'Describe what you asked the AI to do...'
        });

        if (!prompt) {
            return;
        }

        const response = await vscode.window.showInputBox({
            prompt: 'Enter the AI response',
            placeHolder: 'Paste the AI response here...'
        });

        if (!response) {
            return;
        }

        const model = await vscode.window.showQuickPick([
            // OpenAI Models
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4.1',
            'gpt-4.5-preview',
            'gpt-3.5-turbo',
            // Anthropic Models
            'claude-3.5-sonnet',
            'claude-3.5-haiku',
            'claude-3.7-sonnet',
            'claude-4-opus',
            'claude-4-sonnet',
            'claude-3-opus',
            'claude-3-sonnet',
            'claude-3-haiku',
            // Google Models
            'gemini-2.0-pro',
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            // Deepseek Models
            'deepseek-r1',
            'deepseek-r1-05-28',
            'deepseek-v3',
            'deepseek-v3.1',
            // Grok Models
            'grok-2',
            'grok-3-beta',
            'grok-3-mini',
            'grok-4',
            // Anthropic o1/o3 Models
            'o1',
            'o1-mini',
            'o3',
            'o3-mini',
            'o4-mini',
            // Cursor Models
            'cursor-small'
        ], {
            placeHolder: 'Select the AI model used'
        });

        if (!model) {
            return;
        }

        try {
            const result = await api.trackUsage({
                prompt,
                response,
                model,
                codeContext: {
                    file_path: editor.document.fileName,
                    language: editor.document.languageId
                }
            });

            if (result.success && result.data) {
                vscode.window.showInformationMessage(
                    `Usage tracked! Cost: $${result.data.cost.toFixed(6)}, Tokens: ${result.data.tokens}`
                );
            } else {
                vscode.window.showErrorMessage(`Failed to track usage: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    let optimizePromptCommand = vscode.commands.registerCommand('cost-katana.optimize-prompt', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
            vscode.window.showErrorMessage('Please select the prompt text to optimize');
            return;
        }

        try {
            const result = await api.optimizePrompt({
                prompt: text,
                currentTokens: Math.ceil(text.length / 4),
                codeContext: {
                    language: editor.document.languageId,
                    file_path: editor.document.fileName
                }
            });

            if (result.success && result.data) {
                const action = await vscode.window.showInformationMessage(
                    `Prompt optimized! Token reduction: ${result.data.token_reduction}`,
                    'Replace in Editor',
                    'Copy to Clipboard'
                );

                if (action === 'Replace in Editor') {
                    await editor.edit(editBuilder => {
                        if (!selection.isEmpty) {
                            editBuilder.replace(editor.selection, result.data!.optimized_prompt);
                        } else {
                            editBuilder.insert(editor.selection.active, result.data!.optimized_prompt);
                        }
                    });
                } else if (action === 'Copy to Clipboard') {
                    await vscode.env.clipboard.writeText(result.data.optimized_prompt);
                    vscode.window.showInformationMessage('Optimized prompt copied to clipboard!');
                }
            } else {
                vscode.window.showErrorMessage(`Failed to optimize prompt: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    let setupWorkspaceCommand = vscode.commands.registerCommand('cost-katana.setup-workspace', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const workspaceName = await vscode.window.showInputBox({
            prompt: 'Enter workspace name',
            value: workspaceFolders[0].name,
            placeHolder: 'My Project'
        });

        if (!workspaceName) {
            return;
        }

        const language = await vscode.window.showQuickPick([
            'javascript',
            'typescript',
            'python',
            'java',
            'c#',
            'go',
            'rust',
            'php',
            'ruby',
            'other'
        ], {
            placeHolder: 'Select primary language'
        });

        if (!language) {
            return;
        }

        try {
            const result = await api.setupWorkspace({
                name: workspaceName,
                path: workspaceFolders[0].uri.fsPath,
                language,
                framework: 'unknown'
            });

            if (result.success && result.data) {
                vscode.window.showInformationMessage(
                    `Workspace "${workspaceName}" connected to project "${result.data.project_name}"`
                );
            } else {
                vscode.window.showErrorMessage(`Failed to setup workspace: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    let getSuggestionsCommand = vscode.commands.registerCommand('cost-katana.get-suggestions', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
            vscode.window.showErrorMessage('Please select code to get suggestions for');
            return;
        }

        try {
            const result = await api.getSuggestions({
                code_snippet: text,
                language: editor.document.languageId,
                file_path: editor.document.fileName
            });

            if (result.success && result.data) {
                const suggestions = result.data.suggestions;
                if (suggestions.length > 0) {
                    const items = suggestions.map(s => `${s.title}: ${s.description}`);
                    const selected = await vscode.window.showQuickPick(items, {
                        placeHolder: 'Select a suggestion to view details'
                    });
                    
                    if (selected) {
                        vscode.window.showInformationMessage(selected);
                    }
                } else {
                    vscode.window.showInformationMessage('No suggestions available for this code');
                }
            } else {
                vscode.window.showErrorMessage(`Failed to get suggestions: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    let analyzeCodeCommand = vscode.commands.registerCommand('cost-katana.analyze-code', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
            vscode.window.showErrorMessage('Please select code to analyze');
            return;
        }

        try {
            const result = await api.analyzeCode({
                code_snippet: text,
                language: editor.document.languageId,
                file_path: editor.document.fileName
            });

            if (result.success && result.data) {
                const analysis = result.data.analysis;
                vscode.window.showInformationMessage(
                    `Code Analysis: Complexity Score ${analysis.complexityScore}, ` +
                    `${analysis.lines} lines, ${analysis.functions} functions, ` +
                    `Optimization Potential: ${analysis.optimizationPotential}`
                );
            } else {
                vscode.window.showErrorMessage(`Failed to analyze code: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    let showAnalyticsCommand = vscode.commands.registerCommand('cost-katana.show-analytics', async () => {
        try {
            const result = await api.getAnalytics();
            
            if (result.success && result.data) {
                const summary = result.data.summary;
                const cursorSpecific = result.data.cursor_specific;
                
                vscode.window.showInformationMessage(
                    `Analytics Summary:\n` +
                    `Monthly Spending: ${summary.total_spending_this_month}\n` +
                    `Budget Used: ${summary.budget_used}\n` +
                    `Active Projects: ${summary.active_projects}\n` +
                    `Cursor Requests: ${cursorSpecific.total_requests}\n` +
                    `Avg Tokens/Request: ${cursorSpecific.average_tokens_per_request}`
                );
            } else {
                vscode.window.showErrorMessage(`Failed to get analytics: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    let getModelRecommendationsCommand = vscode.commands.registerCommand('cost-katana.get-model-recommendations', async () => {
        const taskType = await vscode.window.showQuickPick([
            'Simple code generation',
            'Complex algorithm implementation',
            'Code review and analysis',
            'Bug fixing',
            'Documentation generation',
            'Testing code',
            'Refactoring',
            'Performance optimization'
        ], {
            placeHolder: 'Select your task type'
        });

        if (!taskType) return;

        const budget = await vscode.window.showQuickPick([
            'Low cost (under $0.01 per request)',
            'Medium cost (under $0.10 per request)',
            'High cost (unlimited budget)'
        ], {
            placeHolder: 'Select your budget preference'
        });

        if (!budget) return;

        // Generate recommendations based on task and budget
        const recommendations = getModelRecommendations(taskType, budget);
        
        const selected = await vscode.window.showQuickPick(
            recommendations.map(r => `${r.model} - ${r.reason} ($${r.estimatedCost}/request)`),
            {
                placeHolder: 'Select a recommended model'
            }
        );

        if (selected) {
            vscode.window.showInformationMessage(`Selected: ${selected}`);
        }
    });

    // ===== INTELLIGENCE COMMANDS =====
    let getPersonalizedTipsCommand = vscode.commands.registerCommand('cost-katana.get-personalized-tips', async () => {
        try {
            const result = await api.getPersonalizedTips();
            
            if (result.success && result.data) {
                const tips = result.data.tips;
                const selected = await vscode.window.showQuickPick(
                    tips.map(tip => `${tip.title} - ${tip.priority} priority`),
                    {
                        placeHolder: 'Select a tip to view details'
                    }
                );

                if (selected) {
                    const tip = tips.find(t => `${t.title} - ${t.priority} priority` === selected);
                    if (tip) {
                        vscode.window.showInformationMessage(
                            `${tip.title}\n\n${tip.message}\n\nPotential Savings: ${tip.potentialSavings?.description || 'Not specified'}`
                        );
                    }
                }
            } else {
                vscode.window.showErrorMessage(`Failed to get tips: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    let scoreResponseQualityCommand = vscode.commands.registerCommand('cost-katana.score-response-quality', async () => {
        const rating = await vscode.window.showQuickPick([
            '1 - Poor',
            '2 - Fair',
            '3 - Good',
            '4 - Very Good',
            '5 - Excellent'
        ], {
            placeHolder: 'Rate the response quality'
        });

        if (!rating) return;

        const isAcceptable = await vscode.window.showQuickPick([
            'Yes - Response meets requirements',
            'No - Response needs improvement'
        ], {
            placeHolder: 'Is the response acceptable?'
        });

        if (!isAcceptable) return;

        try {
            const result = await api.scoreResponseQuality({
                feedback: {
                    rating: parseInt(rating.split(' ')[0]),
                    isAcceptable: isAcceptable.startsWith('Yes'),
                    comment: 'Rated via Cursor extension'
                }
            });

            if (result.success && result.data) {
                vscode.window.showInformationMessage(
                    `Quality Score: ${result.data.qualityScore}/100\n` +
                    `Cost Savings: $${result.data.costSavings.amount.toFixed(4)} (${result.data.costSavings.percentage}%)\n` +
                    `Optimization Types: ${result.data.optimizationType.join(', ')}`
                );
            } else {
                vscode.window.showErrorMessage(`Failed to score quality: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ===== MONITORING COMMANDS =====
    let triggerMonitoringCommand = vscode.commands.registerCommand('cost-katana.trigger-monitoring', async () => {
        try {
            const result = await api.triggerUserMonitoring();
            
            if (result.success && result.data) {
                const recommendations = result.data.recommendations;
                if (recommendations.length > 0) {
                    const selected = await vscode.window.showQuickPick(
                        recommendations.map(rec => `${rec.title} - ${rec.priority} priority`),
                        {
                            placeHolder: 'Select a recommendation to view details'
                        }
                    );

                    if (selected) {
                        const rec = recommendations.find(r => `${r.title} - ${r.priority} priority` === selected);
                        if (rec) {
                            vscode.window.showInformationMessage(
                                `${rec.title}\n\n${rec.description}\n\nPriority: ${rec.priority}`
                            );
                        }
                    }
                } else {
                    vscode.window.showInformationMessage('No recommendations at this time. Your usage looks good!');
                }
            } else {
                vscode.window.showErrorMessage(`Failed to trigger monitoring: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    let getUserStatusCommand = vscode.commands.registerCommand('cost-katana.get-user-status', async () => {
        try {
            const result = await api.getUserUsageStatus();
            
            if (result.success && result.data) {
                const status = result.data;
                const alerts = status.alerts.length > 0 ? 
                    `\n\nAlerts:\n${status.alerts.map(a => `• ${a.message} (${a.severity})`).join('\n')}` : '';

                vscode.window.showInformationMessage(
                    `Status: ${status.status.toUpperCase()}\n` +
                    `Current Spending: $${status.metrics.currentSpending.toFixed(2)}\n` +
                    `Budget Used: ${status.metrics.budgetUsed.toFixed(1)}%\n` +
                    `Avg Tokens/Request: ${status.metrics.avgTokensPerRequest}\n` +
                    `Cost/Token: $${status.metrics.costPerToken.toFixed(6)}${alerts}`
                );
            } else {
                vscode.window.showErrorMessage(`Failed to get status: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ===== EXPERIMENTATION COMMANDS =====
    let runModelComparisonCommand = vscode.commands.registerCommand('cost-katana.run-model-comparison', async () => {
        const prompt = await vscode.window.showInputBox({
            prompt: 'Enter your prompt for model comparison',
            placeHolder: 'e.g., Write a function to sort an array...'
        });

        if (!prompt) return;

        const models = await vscode.window.showQuickPick([
            'gpt-4o,claude-3.5-sonnet,gemini-2.5-pro',
            'gpt-4o-mini,claude-3.5-haiku,deepseek-v3.1',
            'claude-4-opus,gpt-4.1,o1'
        ], {
            placeHolder: 'Select models to compare (comma-separated)'
        });

        if (!models) return;

        try {
            const result = await api.runModelComparison({
                models: models.split(','),
                prompt: prompt,
                expectedCompletionTokens: 200
            });

            if (result.success && result.data) {
                const comparison = result.data.comparison;
                const selected = await vscode.window.showQuickPick(
                    comparison.map(c => `${c.model} - $${c.estimatedCost.toFixed(4)} - ${c.quality}`),
                    {
                        placeHolder: 'Select a model to see details'
                    }
                );

                if (selected) {
                    const comp = comparison.find(c => `${c.model} - $${c.estimatedCost.toFixed(4)} - ${c.quality}` === selected);
                    if (comp) {
                        vscode.window.showInformationMessage(
                            `${comp.model} (${comp.provider})\n` +
                            `Estimated Cost: $${comp.estimatedCost.toFixed(4)}\n` +
                            `Estimated Tokens: ${comp.estimatedTokens}\n` +
                            `Quality: ${comp.quality}\n` +
                            `Tradeoffs: ${comp.tradeoffs.join(', ')}`
                        );
                    }
                }
            } else {
                vscode.window.showErrorMessage(`Failed to compare models: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ===== PRICING COMMANDS =====
    let comparePricingCommand = vscode.commands.registerCommand('cost-katana.compare-pricing', async () => {
        const inputTokens = await vscode.window.showInputBox({
            prompt: 'Enter number of input tokens',
            placeHolder: '1000'
        });

        if (!inputTokens) return;

        const outputTokens = await vscode.window.showInputBox({
            prompt: 'Enter number of output tokens',
            placeHolder: '500'
        });

        if (!outputTokens) return;

        try {
            const result = await api.comparePricing({
                inputTokens: parseInt(inputTokens),
                outputTokens: parseInt(outputTokens)
            });

            if (result.success && result.data) {
                const comparison = result.data.comparison;
                const selected = await vscode.window.showQuickPick(
                    comparison.map(c => `${c.model} - $${c.totalCost.toFixed(6)}`),
                    {
                        placeHolder: 'Select a model to see cost breakdown'
                    }
                );

                if (selected) {
                    const comp = comparison.find(c => `${c.model} - $${c.totalCost.toFixed(6)}` === selected);
                    if (comp) {
                        vscode.window.showInformationMessage(
                            `${comp.model} (${comp.provider})\n` +
                            `Total Cost: $${comp.totalCost.toFixed(6)}\n` +
                            `Input Cost: $${comp.inputCost.toFixed(6)}\n` +
                            `Output Cost: $${comp.outputCost.toFixed(6)}\n` +
                            `Breakdown: ${comp.costBreakdown}`
                        );
                    }
                }
            } else {
                vscode.window.showErrorMessage(`Failed to compare pricing: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ===== FORECASTING COMMANDS =====
    let generateForecastCommand = vscode.commands.registerCommand('cost-katana.generate-forecast', async () => {
        const period = await vscode.window.showQuickPick([
            'weekly',
            'monthly',
            'quarterly'
        ], {
            placeHolder: 'Select forecast period'
        });

        if (!period) return;

        try {
            const result = await api.generateCostForecast(period as 'weekly' | 'monthly' | 'quarterly');
            
            if (result.success && result.data) {
                const forecast = result.data.forecast;
                const insights = result.data.insights;

                const forecastSummary = forecast.map(f => 
                    `${f.period}: $${f.predictedCost.toFixed(2)} (${f.confidence}% confidence)`
                ).join('\n');

                const insightsText = insights.length > 0 ? `\n\nInsights:\n${insights.map(i => `• ${i}`).join('\n')}` : '';

                vscode.window.showInformationMessage(
                    `Cost Forecast (${period}):\n${forecastSummary}${insightsText}`
                );
            } else {
                vscode.window.showErrorMessage(`Failed to generate forecast: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ===== AGENT COMMANDS =====
    let queryAgentCommand = vscode.commands.registerCommand('cost-katana.query-agent', async () => {
        const query = await vscode.window.showInputBox({
            prompt: 'Ask the AI agent a question about cost optimization',
            placeHolder: 'e.g., How can I reduce my AI costs by 50%?'
        });

        if (!query) return;

        try {
            const result = await api.queryAgent(query);
            
            if (result.success && result.data) {
                const response = result.data.response;
                const thinking = result.data.thinking;
                const metadata = result.data.metadata;

                let message = response;
                if (thinking) {
                    message += `\n\nThinking Process:\n${thinking.steps.map(s => `${s.step}. ${s.description}`).join('\n')}`;
                }
                message += `\n\nTokens Used: ${metadata.tokensUsed}`;
                message += `\nExecution Time: ${metadata.executionTime}ms`;

                vscode.window.showInformationMessage(message);
            } else {
                vscode.window.showErrorMessage(`Failed to query agent: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ===== OPTIMIZATION COMMANDS =====
    let analyzeOpportunitiesCommand = vscode.commands.registerCommand('cost-katana.analyze-opportunities', async () => {
        try {
            const result = await api.analyzeOpportunities();
            
            if (result.success && result.data) {
                const opportunities = result.data.opportunities;
                const selected = await vscode.window.showQuickPick(
                    opportunities.map(opp => `${opp.type} - $${opp.potentialSavings.toFixed(2)} savings`),
                    {
                        placeHolder: 'Select an opportunity to view details'
                    }
                );

                if (selected) {
                    const opp = opportunities.find(o => `${o.type} - $${o.potentialSavings.toFixed(2)} savings` === selected);
                    if (opp) {
                        vscode.window.showInformationMessage(
                            `${opp.type}\n\n${opp.description}\n\n` +
                            `Potential Savings: $${opp.potentialSavings.toFixed(2)}\n` +
                            `Difficulty: ${opp.difficulty}\n\n` +
                            `Implementation:\n${opp.implementation}`
                        );
                    }
                }
            } else {
                vscode.window.showErrorMessage(`Failed to analyze opportunities: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ===== PROMPT TEMPLATE COMMANDS =====
    let getPromptTemplatesCommand = vscode.commands.registerCommand('cost-katana.get-prompt-templates', async () => {
        try {
            const result = await api.getPromptTemplates();
            
            if (result.success && result.data) {
                const templates = result.data.templates;
                const selected = await vscode.window.showQuickPick(
                    templates.map(t => `${t.name} (${t.category}) - ${t.usage.count} uses`),
                    {
                        placeHolder: 'Select a template to view details'
                    }
                );

                if (selected) {
                    const template = templates.find(t => `${t.name} (${t.category}) - ${t.usage.count} uses` === selected);
                    if (template) {
                        vscode.window.showInformationMessage(
                            `${template.name}\n\n${template.content}\n\n` +
                            `Category: ${template.category}\n` +
                            `Usage: ${template.usage.count} times\n` +
                            `Tokens Saved: ${template.usage.totalTokensSaved}\n` +
                            `Cost Saved: $${template.usage.totalCostSaved.toFixed(4)}`
                        );
                    }
                }
            } else {
                vscode.window.showErrorMessage(`Failed to get templates: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Register all commands
    context.subscriptions.push(
        connectCommand,
        trackUsageCommand,
        optimizePromptCommand,
        setupWorkspaceCommand,
        getSuggestionsCommand,
        analyzeCodeCommand,
        showAnalyticsCommand,
        getModelRecommendationsCommand,
        getPersonalizedTipsCommand,
        scoreResponseQualityCommand,
        triggerMonitoringCommand,
        getUserStatusCommand,
        runModelComparisonCommand,
        comparePricingCommand,
        generateForecastCommand,
        queryAgentCommand,
        analyzeOpportunitiesCommand,
        getPromptTemplatesCommand
    );
}

function getModelRecommendations(taskType: string, budget: string): Array<{model: string, reason: string, estimatedCost: number}> {
    const recommendations = [];

    if (budget.includes('Low cost')) {
        if (taskType.includes('Simple')) {
            recommendations.push(
                { model: 'gpt-4o-mini', reason: 'Fast and cost-effective for simple tasks', estimatedCost: 0.0001 },
                { model: 'claude-3.5-haiku', reason: 'Great for basic code generation', estimatedCost: 0.0002 },
                { model: 'gemini-2.5-flash', reason: 'Very fast and cheap', estimatedCost: 0.0001 }
            );
        } else {
            recommendations.push(
                { model: 'gpt-3.5-turbo', reason: 'Good balance of cost and quality', estimatedCost: 0.001 },
                { model: 'deepseek-v3.1', reason: 'Excellent for coding tasks', estimatedCost: 0.0005 }
            );
        }
    } else if (budget.includes('Medium cost')) {
        recommendations.push(
            { model: 'gpt-4o', reason: 'Best overall performance', estimatedCost: 0.01 },
            { model: 'claude-3.5-sonnet', reason: 'Excellent reasoning capabilities', estimatedCost: 0.02 },
            { model: 'gemini-2.5-pro', reason: 'Great for complex tasks', estimatedCost: 0.015 }
        );
    } else {
        recommendations.push(
            { model: 'claude-4-opus', reason: 'Best reasoning and analysis', estimatedCost: 0.05 },
            { model: 'gpt-4.1', reason: 'Most capable model', estimatedCost: 0.04 },
            { model: 'o1', reason: 'Advanced reasoning for complex problems', estimatedCost: 0.06 }
        );
    }

    return recommendations;
}

export function deactivate() {
    console.log('Cost Katana AI Optimizer extension is now deactivated!');
}