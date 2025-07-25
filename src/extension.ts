import * as vscode from 'vscode';
import { CostKatanaAPI } from './api';

export function activate(context: vscode.ExtensionContext) {
    console.log('Cost Katana AI Optimizer extension is now active!');

    const api = new CostKatanaAPI();

    // ===== AUTOMATIC USAGE TRACKING =====
    let automaticTrackingEnabled = true;
    let lastTrackedRequest: string | null = null;

    // Monitor for AI interactions in Cursor
    const trackAIInteraction = async (prompt: string, response: string, model: string = 'gpt-4o') => {
        if (!automaticTrackingEnabled || !api.hasApiKey) {
            return;
        }

        // Prevent duplicate tracking
        const requestHash = `${prompt.substring(0, 100)}_${response.substring(0, 100)}`;
        if (lastTrackedRequest === requestHash) {
            return;
        }
        lastTrackedRequest = requestHash;

        try {
            const result = await api.trackUsage({
                prompt,
                response,
                model,
                codeContext: {
                    file_path: vscode.window.activeTextEditor?.document.fileName,
                    language: vscode.window.activeTextEditor?.document.languageId
                }
            });

            if (result.success && result.data) {
                // Show subtle notification for automatic tracking
                vscode.window.showInformationMessage(
                    `🤖 Tracked: $${result.data.cost.toFixed(6)} (${result.data.tokens} tokens)`,
                    'View Details'
                ).then(selection => {
                    if (selection === 'View Details') {
                        vscode.commands.executeCommand('cost-katana.show-analytics');
                    }
                });

                // Show smart tip if available
                if (result.data.smart_tip) {
                    setTimeout(() => {
                        vscode.window.showInformationMessage(result.data!.smart_tip);
                    }, 1000);
                }
            }
        } catch (error) {
            // Silent fail for automatic tracking
            console.log('Automatic tracking failed:', error);
        }
    };

    // Monitor document changes for potential AI interactions
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (!automaticTrackingEnabled) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor || event.document !== editor.document) return;

        // Look for patterns that suggest AI-generated content
        const changes = event.contentChanges;
        for (const change of changes) {
            if (change.text.length > 50 && change.text.includes('\n')) {
                // This might be AI-generated content
                // We'll track it as a potential AI interaction
                await trackAIInteraction(
                    'AI-generated content detected',
                    change.text,
                    'gpt-4o'
                );
            }
        }
    });

    // Monitor for Cursor AI commands
    const cursorAIListener = vscode.commands.registerCommand('cursor.ai', async () => {
        // This will be called when Cursor AI is used
        // We'll track it as an AI interaction
        await trackAIInteraction(
            'Cursor AI interaction',
            'AI response generated',
            'cursor-small'
        );
    });

    // ===== COMMAND REGISTRATION =====

    // Connect Account Command
    let connectAccountCommand = vscode.commands.registerCommand('cost-katana.connect-account', async () => {
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
                
                // Store email for later use
                await vscode.workspace.getConfiguration('costKatana').update('userEmail', email, true);
            } else {
                vscode.window.showErrorMessage(`Failed to generate magic link: ${response.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Manual Track AI Usage Command
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
                
                // Show smart tip if available
                if (result.data.smart_tip) {
                    vscode.window.showInformationMessage(result.data.smart_tip);
                }
            } else {
                vscode.window.showErrorMessage(`Failed to track usage: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Optimize Prompt Command
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

    // Show Analytics Command
    let showAnalyticsCommand = vscode.commands.registerCommand('cost-katana.show-analytics', async () => {
        try {
            const result = await api.getAnalytics();
            
            if (result.success && result.data) {
                const summary = result.data.summary;
                const cursorSpecific = result.data.cursor_specific;
                
                // Create a more detailed analytics display
                const analyticsMessage = `
📊 **Cost Katana Analytics**

💰 **Spending Summary:**
• Monthly Spending: ${summary.total_spending_this_month}
• Budget Used: ${summary.budget_used}
• Active Projects: ${summary.active_projects}

🤖 **Cursor Usage:**
• Total Requests: ${cursorSpecific.total_requests}
• Avg Tokens/Request: ${cursorSpecific.average_tokens_per_request}

💡 **Quick Actions:**
• Track Usage: Cost Katana: Track AI Usage
• Optimize Prompts: Cost Katana: Optimize Prompt
• Get Tips: Cost Katana: Get Personalized Tips
                `.trim();

                vscode.window.showInformationMessage(analyticsMessage);
            } else {
                vscode.window.showErrorMessage(`Failed to get analytics: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Setup Workspace Command
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
                    `✅ Workspace "${workspaceName}" connected to project "${result.data.project_name}"`
                );
            } else {
                vscode.window.showErrorMessage(`Failed to setup workspace: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Get Suggestions Command
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

    // Analyze Code Command
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
                    `🔍 **Code Analysis Results**

📊 **Metrics:**
• Complexity Score: ${analysis.complexityScore}
• Lines of Code: ${analysis.lines}
• Functions: ${analysis.functions}
• Classes: ${analysis.classes}

🎯 **Optimization Potential:** ${analysis.optimizationPotential}

💡 **Recommendations:**
${analysis.recommendations.map((rec, i) => `${i + 1}. ${rec.title} (${rec.priority})`).join('\n')}
                `.trim()
                );
            } else {
                vscode.window.showErrorMessage(`Failed to analyze code: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ===== ADDITIONAL COMMANDS FROM README =====

    // Get Model Recommendations Command
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

    // Get Personalized Tips Command
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

    // Toggle Automatic Tracking Command
    let toggleAutomaticTrackingCommand = vscode.commands.registerCommand('cost-katana.toggle-automatic-tracking', async () => {
        automaticTrackingEnabled = !automaticTrackingEnabled;
        const status = automaticTrackingEnabled ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Automatic usage tracking ${status}`);
        
        // Update configuration
        await vscode.workspace.getConfiguration('costKatana').update('automaticTracking', automaticTrackingEnabled, true);
    });

    // Register all commands
    context.subscriptions.push(
        connectAccountCommand,
        trackUsageCommand,
        optimizePromptCommand,
        showAnalyticsCommand,
        setupWorkspaceCommand,
        getSuggestionsCommand,
        analyzeCodeCommand,
        getModelRecommendationsCommand,
        getPersonalizedTipsCommand,
        toggleAutomaticTrackingCommand,
        cursorAIListener,
        documentChangeListener
    );

    // Start real-time tracking
    api.startRealTimeTracking();

    // Show welcome message
    vscode.window.showInformationMessage(
        '🚀 Cost Katana AI Optimizer activated! Use "Cost Katana: Connect Account" to get started.',
        'Connect Account'
    ).then(selection => {
        if (selection === 'Connect Account') {
            vscode.commands.executeCommand('cost-katana.connect-account');
        }
    });
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