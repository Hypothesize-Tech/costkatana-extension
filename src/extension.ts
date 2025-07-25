import * as vscode from 'vscode';
import { CostKatanaAPI } from './api';

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Cost Katana AI Optimizer extension is now active!');
    console.log('Extension context:', context.extensionPath);
    console.log('VS Code version:', vscode.version);

    try {
        const api = new CostKatanaAPI();
        console.log('✅ API instance created successfully');

        // ===== AUTOMATIC USAGE TRACKING =====
        let automaticTrackingEnabled = true;
        let lastTrackedRequest: string | null = null;

        // Monitor for AI interactions in Cursor
        const trackAIInteraction = async (prompt: string, response: string, model: string = 'gpt-4o') => {
            console.log('🔄 Automatic tracking attempt:', { prompt: prompt.substring(0, 50), model });
            if (!automaticTrackingEnabled || !api.hasApiKey) {
                console.log('❌ Automatic tracking disabled or no API key');
                return;
            }

            // Prevent duplicate tracking
            const requestHash = `${prompt.substring(0, 100)}_${response.substring(0, 100)}`;
            if (lastTrackedRequest === requestHash) {
                console.log('❌ Duplicate request, skipping');
                return;
            }
            lastTrackedRequest = requestHash;

            try {
                console.log('📡 Making automatic tracking API call');
                const result = await api.trackUsage({
                    prompt,
                    response,
                    model,
                    codeContext: {
                        file_path: vscode.window.activeTextEditor?.document.fileName,
                        language: vscode.window.activeTextEditor?.document.languageId
                    }
                });

                console.log('📡 Automatic tracking result:', result);

                if (result.success && result.data) {
                    // Show subtle notification for automatic tracking
                    vscode.window.showInformationMessage(
                        `🤖 Tracked: $${result.data.cost} (${result.data.tokens} tokens)`,
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
                console.log('❌ Automatic tracking failed:', error);
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

        // Monitor for Cursor AI commands and auto mode
        const cursorAIListener = vscode.commands.registerCommand('cursor.ai', async () => {
            console.log('🤖 Cursor AI command detected');
            await trackAIInteraction(
                'Cursor AI interaction',
                'AI response generated',
                'cursor-small'
            );
        });

        // Monitor Cursor's auto mode
        const cursorAutoModeListener = vscode.commands.registerCommand('cursor.autoComplete', async () => {
            console.log('🤖 Cursor auto mode detected');
            await trackAIInteraction(
                'Cursor auto mode',
                'Auto-completion generated',
                'cursor-auto'
            );
        });

        // Monitor Cursor's inline suggestions
        const cursorInlineSuggestionsListener = vscode.commands.registerCommand('cursor.inlineSuggest', async () => {
            console.log('🤖 Cursor inline suggestion detected');
            await trackAIInteraction(
                'Cursor inline suggestion',
                'Inline suggestion generated',
                'cursor-inline'
            );
        });

        // Monitor Cursor's chat interactions
        const cursorChatListener = vscode.commands.registerCommand('cursor.chat', async () => {
            console.log('🤖 Cursor chat detected');
            await trackAIInteraction(
                'Cursor chat interaction',
                'Chat response generated',
                'cursor-chat'
            );
        });

        // Monitor Cursor's explain code feature
        const cursorExplainListener = vscode.commands.registerCommand('cursor.explain', async () => {
            console.log('🤖 Cursor explain code detected');
            await trackAIInteraction(
                'Cursor explain code',
                'Code explanation generated',
                'cursor-explain'
            );
        });

        // ===== COMMAND REGISTRATION =====

        // Connect Account Command
        let connectAccountCommand = vscode.commands.registerCommand('cost-katana.connect-account', async () => {
            try {
                console.log('🔗 Connect account command started');
                
                const email = await vscode.window.showInputBox({
                    prompt: 'Enter your email to connect to Cost Katana',
                    placeHolder: 'your.email@example.com'
                });

                if (!email) {
                    console.log('❌ No email provided');
                    return;
                }

                console.log('📧 Email provided:', email);

                try {
                    vscode.window.showInformationMessage('Generating magic link...');
                    console.log('📡 Making API call to generate magic link');
                    
                    const response = await api.generateMagicLink(email);
                    console.log('📡 Magic link response:', response);
                    
                    if (response.success && response.data) {
                        // Test the magic link URL before opening
                        const magicLinkUrl = response.data.magic_link;
                        console.log('🔗 Generated magic link:', magicLinkUrl);
                        
                        const isUrlValid = await api.testMagicLinkUrl(magicLinkUrl);
                        if (!isUrlValid) {
                            console.warn('⚠️ Magic link URL test failed, but proceeding anyway');
                            vscode.window.showWarningMessage('Magic link generated, but URL validation failed. The link might not work properly.');
                        }
                        
                        vscode.window.showInformationMessage('Magic link generated! Opening in browser...');
                        console.log('🌐 Opening magic link in browser');
                        vscode.env.openExternal(vscode.Uri.parse(magicLinkUrl));
                        
                        // Store email for later use
                        await vscode.workspace.getConfiguration('costKatana').update('userEmail', email, true);
                        console.log('✅ Email stored in configuration');
                    } else {
                        console.error('❌ Magic link generation failed:', response.error);
                        vscode.window.showErrorMessage(`Failed to generate magic link: ${response.error}`);
                    }
                } catch (error) {
                    console.error('❌ Exception in magic link generation:', error);
                    vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            } catch (error) {
                console.error('❌ Exception in connect account command:', error);
                vscode.window.showErrorMessage(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        // Manual Track AI Usage Command
        let trackUsageCommand = vscode.commands.registerCommand('cost-katana.track-usage', async () => {
            try {
                console.log('Track usage command started');
                
                // Check if API key is configured
                if (!api.hasApiKey) {
                    console.log('No API key configured');
                    const action = await vscode.window.showErrorMessage(
                        'API key not configured. Please connect your account first.',
                        'Connect Account',
                        'Configure Manually'
                    );
                    
                    if (action === 'Connect Account') {
                        vscode.commands.executeCommand('cost-katana.connect-account');
                    } else if (action === 'Configure Manually') {
                        const apiKey = await vscode.window.showInputBox({
                            prompt: 'Enter your Cost Katana API Key',
                            password: true,
                            placeHolder: 'your-api-key-here'
                        });
                        
                        if (apiKey) {
                            api.updateApiKey(apiKey);
                            vscode.window.showInformationMessage('API key configured successfully!');
                        } else {
                            return;
                        }
                    } else {
                        return;
                    }
                }

                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    console.log('No active editor found');
                    vscode.window.showErrorMessage('No active editor found');
                    return;
                }

                console.log('Getting prompt from user');
                const prompt = await vscode.window.showInputBox({
                    prompt: 'Enter the AI prompt you used',
                    placeHolder: 'Describe what you asked the AI to do...'
                });

                if (!prompt) {
                    console.log('No prompt provided');
                    return;
                }

                console.log('Getting response from user');
                const response = await vscode.window.showInputBox({
                    prompt: 'Enter the AI response',
                    placeHolder: 'Paste the AI response here...'
                });

                if (!response) {
                    console.log('No response provided');
                    return;
                }

                console.log('Getting model selection from user');
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
                    console.log('No model selected');
                    return;
                }

                console.log('Starting API call with data:', { prompt: prompt.substring(0, 50) + '...', model });

                // Show progress
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Tracking AI usage...",
                    cancellable: false
                }, async (progress) => {
                    try {
                        progress.report({ increment: 25 });
                        console.log('Making API call to track usage');
                        
                        const result = await api.trackUsage({
                            prompt,
                            response,
                            model,
                            codeContext: {
                                file_path: editor.document.fileName,
                                language: editor.document.languageId
                            }
                        });

                        progress.report({ increment: 75 });
                        console.log('API call completed, result:', result);

                        if (result.success && result.data) {
                            progress.report({ increment: 100 });
                            vscode.window.showInformationMessage(
                                `✅ Usage tracked successfully!\n💰 Cost: $${result.data.cost}\n🔢 Tokens: ${result.data.tokens}`
                            );
                            
                            // Show smart tip if available
                            if (result.data.smart_tip) {
                                setTimeout(() => {
                                    vscode.window.showInformationMessage(`💡 Tip: ${result.data!.smart_tip}`);
                                }, 1000);
                            }
                        } else {
                            console.error('API call failed:', result.error);
                            vscode.window.showErrorMessage(
                                `❌ Failed to track usage: ${result.error || 'Unknown error'}\n\nPlease check your API key and network connection.`
                            );
                        }
                    } catch (error) {
                        console.error('Exception in track usage:', error);
                        vscode.window.showErrorMessage(
                            `❌ Error tracking usage: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your network connection and try again.`
                        );
                    }
                });
            } catch (error) {
                console.error('Exception in track usage command:', error);
                vscode.window.showErrorMessage(
                    `❌ Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        });

        // Optimize Prompt Command
        let optimizePromptCommand = vscode.commands.registerCommand('cost-katana.optimize-prompt', async () => {
            try {
                console.log('⚡ Optimize prompt command started');
                const editor = vscode.window.activeTextEditor;
                
                // Get text either from selection or show input box
                let text = '';
                if (editor && !editor.selection.isEmpty) {
                    text = editor.document.getText(editor.selection);
                    console.log('📝 Got text from selection:', text.substring(0, 50) + '...');
                } else {
                    text = await vscode.window.showInputBox({
                        prompt: 'Enter the prompt text to optimize',
                        placeHolder: 'Your prompt text here...',
                        validateInput: text => {
                            if (text.length < 10) {
                                return 'Please enter at least 10 characters';
                            }
                            return null;
                        }
                    }) || '';
                    
                    if (!text) {
                        console.log('❌ No text provided');
                        vscode.window.showInformationMessage('Please provide text to optimize');
                        return;
                    }
                }

                // Show progress
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Optimizing prompt...",
                    cancellable: false
                }, async (progress) => {
                    try {
                        progress.report({ increment: 50 });
                        console.log('📡 Making API call to optimize prompt');
                        
                        const result = await api.optimizePrompt({
                            prompt: text,
                            currentTokens: Math.ceil(text.length / 4),
                            codeContext: {
                                language: editor?.document.languageId,
                                file_path: editor?.document.fileName
                            }
                        });

                        progress.report({ increment: 100 });
                        console.log('📡 Optimization result:', result);

                        if (result.success && result.data) {
                            const action = await vscode.window.showInformationMessage(
                                `✨ Prompt optimized! Token reduction: ${result.data.token_reduction}%`,
                                'Replace Selection',
                                'Copy to Clipboard',
                                'Show Details'
                            );

                            if (action === 'Replace Selection' && editor) {
                                await editor.edit(editBuilder => {
                                    if (!editor.selection.isEmpty) {
                                        editBuilder.replace(editor.selection, result.data!.optimized_prompt);
                                    } else {
                                        editBuilder.insert(editor.selection.active, result.data!.optimized_prompt);
                                    }
                                });
                                vscode.window.showInformationMessage('✅ Text replaced with optimized prompt');
                            } else if (action === 'Copy to Clipboard') {
                                await vscode.env.clipboard.writeText(result.data.optimized_prompt);
                                vscode.window.showInformationMessage('📋 Optimized prompt copied to clipboard');
                            } else if (action === 'Show Details') {
                                // Show details in a new webview panel
                                const panel = vscode.window.createWebviewPanel(
                                    'optimizationDetails',
                                    'Optimization Details',
                                    vscode.ViewColumn.Two,
                                    { enableScripts: true }
                                );

                                panel.webview.html = getOptimizationDetailsHtml(result.data);
                            }
                        } else {
                            console.error('❌ Optimization failed:', result.error);
                            vscode.window.showErrorMessage(`Failed to optimize prompt: ${result.error}`);
                        }
                    } catch (error) {
                        console.error('❌ Exception in optimization:', error);
                        vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                });
            } catch (error) {
                console.error('❌ Exception in optimize prompt command:', error);
                vscode.window.showErrorMessage(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        // Show Analytics Command
        let showAnalyticsCommand = vscode.commands.registerCommand('cost-katana.show-analytics', async () => {
            try {
                console.log('📊 Show analytics command started');
                
                // Show loading message
                vscode.window.showInformationMessage('Loading analytics...');
                
                const result = await api.getAnalytics();
                console.log('📊 Analytics result:', result);
                
                if (result.success && result.data) {
                    const summary = result.data.summary;
                    const cursorSpecific = result.data.cursor_specific;
                    
                    // Create a beautiful webview panel for analytics
                    const panel = vscode.window.createWebviewPanel(
                        'costKatanaAnalytics',
                        'Cost Katana Analytics',
                        vscode.ViewColumn.One,
                        {
                            enableScripts: true,
                            retainContextWhenHidden: true
                        }
                    );

                    // Create beautiful HTML content
                    panel.webview.html = getAnalyticsHtml(summary, cursorSpecific);
                    
                    // Handle messages from webview
                    panel.webview.onDidReceiveMessage(
                        message => {
                            switch (message.command) {
                                case 'trackUsage':
                                    vscode.commands.executeCommand('cost-katana.track-usage');
                                    break;
                                case 'optimizePrompt':
                                    vscode.commands.executeCommand('cost-katana.optimize-prompt');
                                    break;
                                case 'getTips':
                                    vscode.commands.executeCommand('cost-katana.get-suggestions');
                                    break;
                                case 'refresh':
                                    vscode.commands.executeCommand('cost-katana.show-analytics');
                                    break;
                            }
                        },
                        undefined,
                        context.subscriptions
                    );
                    
                } else {
                    console.error('❌ Analytics failed:', result.error);
                    vscode.window.showErrorMessage(`Failed to get analytics: ${result.error}`);
                }
            } catch (error) {
                console.error('❌ Exception in show analytics:', error);
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
            try {
                console.log('💡 Get suggestions command started');
                const editor = vscode.window.activeTextEditor;
                
                // Get code either from selection or current file
                let code = '';
                let language = '';
                let filePath = '';
                
                if (editor) {
                    if (!editor.selection.isEmpty) {
                        code = editor.document.getText(editor.selection);
                    } else {
                        // If no selection, use the entire file content
                        code = editor.document.getText();
                    }
                    language = editor.document.languageId;
                    filePath = editor.document.fileName;
                    console.log('📝 Got code from editor:', {
                        language,
                        filePath,
                        codeLength: code.length
                    });
                } else {
                    console.log('❌ No active editor');
                    vscode.window.showErrorMessage('Please open a file to get suggestions');
                    return;
                }

                if (!code) {
                    console.log('❌ No code provided');
                    vscode.window.showErrorMessage('Please select code or open a file to get suggestions');
                    return;
                }

                // Show progress
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Analyzing code...",
                    cancellable: false
                }, async (progress) => {
                    try {
                        progress.report({ increment: 50 });
                        console.log('📡 Making API call to get suggestions');
                        
                        const result = await api.getSuggestions({
                            code_snippet: code,
                            language,
                            file_path: filePath
                        });

                        progress.report({ increment: 100 });
                        console.log('📡 Suggestions result:', result);

                        if (result.success && result.data) {
                            const suggestions = result.data.suggestions;
                            if (suggestions.length > 0) {
                                // Show suggestions in a webview panel
                                const panel = vscode.window.createWebviewPanel(
                                    'codeSuggestions',
                                    'Code Suggestions',
                                    vscode.ViewColumn.Two,
                                    { enableScripts: true }
                                );

                                panel.webview.html = getSuggestionsHtml(suggestions, code);
                            } else {
                                vscode.window.showInformationMessage('No suggestions available for this code');
                            }
                        } else {
                            console.error('❌ Getting suggestions failed:', result.error);
                            vscode.window.showErrorMessage(`Failed to get suggestions: ${result.error}`);
                        }
                    } catch (error) {
                        console.error('❌ Exception in getting suggestions:', error);
                        vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                });
            } catch (error) {
                console.error('❌ Exception in get suggestions command:', error);
                vscode.window.showErrorMessage(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
${analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
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

        // Toggle Automatic Tracking Command
        let toggleAutomaticTrackingCommand = vscode.commands.registerCommand('cost-katana.toggle-automatic-tracking', async () => {
            automaticTrackingEnabled = !automaticTrackingEnabled;
            const status = automaticTrackingEnabled ? 'enabled' : 'disabled';
            vscode.window.showInformationMessage(`Automatic usage tracking ${status}`);
            
            // Update configuration
            await vscode.workspace.getConfiguration('costKatana').update('automaticTracking', automaticTrackingEnabled, true);
        });

        // Configure Extension Command
        let configureExtensionCommand = vscode.commands.registerCommand('cost-katana.configure', async () => {
            const config = vscode.workspace.getConfiguration('costKatana');
            
            // Backend URL configuration
            const currentBackendUrl = (config.get('backendUrl') as string) || 'https://cost-katana-backend.store/api';
            const backendUrl = await vscode.window.showInputBox({
                prompt: 'Enter the backend URL',
                value: currentBackendUrl,
                placeHolder: 'https://cost-katana-backend.store/api'
            });
            
            if (backendUrl) {
                api.updateBaseUrl(backendUrl);
            }
            
            // API Key configuration
            const currentApiKey = (config.get('apiKey') as string) || '';
            const apiKey = await vscode.window.showInputBox({
                prompt: 'Enter your API Key',
                value: currentApiKey,
                password: true,
                placeHolder: 'your-api-key-here'
            });
            
            if (apiKey) {
                api.updateApiKey(apiKey);
            }
            
            // User ID configuration
            const currentUserId = (config.get('userId') as string) || '';
            const userId = await vscode.window.showInputBox({
                prompt: 'Enter your User ID',
                value: currentUserId,
                placeHolder: 'your-user-id-here'
            });
            
            if (userId) {
                api.updateUserId(userId);
            }
            
            vscode.window.showInformationMessage('Configuration updated successfully!');
        });

        // Test Command for debugging
        let testCommand = vscode.commands.registerCommand('cost-katana.test', async () => {
            try {
                console.log('🧪 Test command executed');
                vscode.window.showInformationMessage('✅ Cost Katana extension is working!');
                
                // Test API connection
                const config = vscode.workspace.getConfiguration('costKatana');
                const backendUrl = config.get('backendUrl') as string;
                const apiKey = config.get('apiKey') as string;
                
                const statusMessage = `
🔧 **Extension Status:**
• Backend URL: ${backendUrl || 'Not configured'}
• API Key: ${apiKey ? '✅ Configured' : '❌ Not configured'}
• Extension Version: 1.0.12
• VS Code Version: ${vscode.version}
                `.trim();
                
                vscode.window.showInformationMessage(statusMessage);
            } catch (error) {
                console.error('Test command failed:', error);
                vscode.window.showErrorMessage(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        // Health Check Command
        let healthCheckCommand = vscode.commands.registerCommand('cost-katana.health-check', async () => {
            try {
                console.log('🏥 Health check command started');
                vscode.window.showInformationMessage('Checking API health...');
                
                const result = await api.validateConnection();
                console.log('🏥 Health check result:', result);
                
                if (result.success) {
                    vscode.window.showInformationMessage('✅ API is healthy and accessible!');
                } else {
                    vscode.window.showErrorMessage(`❌ API health check failed: ${result.error}`);
                }
            } catch (error) {
                console.error('🏥 Health check failed:', error);
                vscode.window.showErrorMessage(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
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
            toggleAutomaticTrackingCommand,
            configureExtensionCommand,
            testCommand,
            healthCheckCommand,
            cursorAIListener,
            documentChangeListener,
            cursorAutoModeListener,
            cursorInlineSuggestionsListener,
            cursorChatListener,
            cursorExplainListener
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
    } catch (error) {
        console.error('Error initializing Cost Katana API:', error);
        vscode.window.showErrorMessage(`Failed to initialize Cost Katana API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to generate beautiful HTML for analytics
function getAnalyticsHtml(summary: any, cursorSpecific: any): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cost Katana Analytics</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    line-height: 1.6;
                }
                
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 8px;
                    border: 1px solid var(--vscode-panel-border);
                }
                
                .header h1 {
                    color: var(--vscode-textLink-foreground);
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                
                .header p {
                    color: var(--vscode-descriptionForeground);
                    font-size: 14px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    transition: all 0.3s ease;
                }
                
                .stat-card:hover {
                    border-color: var(--vscode-textLink-foreground);
                    transform: translateY(-2px);
                }
                
                .stat-value {
                    font-size: 32px;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                    margin-bottom: 8px;
                }
                
                .stat-label {
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .actions-section {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                .actions-section h3 {
                    color: var(--vscode-textLink-foreground);
                    margin-bottom: 15px;
                    font-size: 18px;
                }
                
                .action-buttons {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 10px;
                }
                
                .action-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .action-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                    transform: translateY(-1px);
                }
                
                .refresh-btn {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: 1px solid var(--vscode-button-secondaryBorder);
                }
                
                .refresh-btn:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                
                .usage-details {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                }
                
                .usage-details h3 {
                    color: var(--vscode-textLink-foreground);
                    margin-bottom: 15px;
                    font-size: 18px;
                }
                
                .usage-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .usage-item:last-child {
                    border-bottom: none;
                }
                
                .usage-label {
                    font-weight: 500;
                }
                
                .usage-value {
                    color: var(--vscode-textLink-foreground);
                    font-weight: bold;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding: 20px;
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Cost Katana Analytics</h1>
                    <p>AI Cost Optimization Dashboard</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">$${summary.total_spending_this_month || '0.00'}</div>
                        <div class="stat-label">Monthly Spending</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${summary.budget_used || '0%'}</div>
                        <div class="stat-label">Budget Used</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${summary.active_projects || '0'}</div>
                        <div class="stat-label">Active Projects</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${cursorSpecific.total_requests || '0'}</div>
                        <div class="stat-label">Total Requests</div>
                    </div>
                </div>
                
                <div class="usage-details">
                    <h3>🤖 Cursor Usage Details</h3>
                    <div class="usage-item">
                        <span class="usage-label">Total Requests</span>
                        <span class="usage-value">${cursorSpecific.total_requests || '0'}</span>
                    </div>
                    <div class="usage-item">
                        <span class="usage-label">Average Tokens per Request</span>
                        <span class="usage-value">${cursorSpecific.average_tokens_per_request || '0'}</span>
                    </div>
                </div>
                
                <div class="actions-section">
                    <h3>💡 Quick Actions</h3>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="trackUsage()">📊 Track Usage</button>
                        <button class="action-btn" onclick="optimizePrompt()">⚡ Optimize Prompt</button>
                        <button class="action-btn" onclick="getTips()">💡 Get Tips</button>
                        <button class="action-btn refresh-btn" onclick="refresh()">🔄 Refresh</button>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Cost Katana AI Optimizer v1.0.15 • Powered by AI Cost Optimization</p>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function trackUsage() {
                    vscode.postMessage({ command: 'trackUsage' });
                }
                
                function optimizePrompt() {
                    vscode.postMessage({ command: 'optimizePrompt' });
                }
                
                function getTips() {
                    vscode.postMessage({ command: 'getTips' });
                }
                
                function refresh() {
                    vscode.postMessage({ command: 'refresh' });
                }
            </script>
        </body>
        </html>
    `;
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

    // Function to generate HTML for optimization details
    function getOptimizationDetailsHtml(data: any): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Optimization Details</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        padding: 20px;
                        line-height: 1.6;
                    }
                    
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    .header {
                        margin-bottom: 30px;
                    }
                    
                    .header h1 {
                        color: var(--vscode-textLink-foreground);
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    
                    .stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .stat-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 20px;
                    }
                    
                    .stat-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 8px;
                    }
                    
                    .stat-label {
                        font-size: 14px;
                        color: var(--vscode-descriptionForeground);
                    }
                    
                    .code-section {
                        margin-top: 30px;
                    }
                    
                    .code-section h2 {
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 15px;
                    }
                    
                    .code-block {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 20px;
                        font-family: 'Courier New', monospace;
                        white-space: pre-wrap;
                        overflow-x: auto;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✨ Optimization Results</h1>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-value">${data.token_reduction}%</div>
                            <div class="stat-label">Token Reduction</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${data.original_tokens}</div>
                            <div class="stat-label">Original Tokens</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${data.optimized_tokens}</div>
                            <div class="stat-label">Optimized Tokens</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">$${data.cost_savings}</div>
                            <div class="stat-label">Cost Savings</div>
                        </div>
                    </div>
                    
                    <div class="code-section">
                        <h2>Original Prompt</h2>
                        <div class="code-block">${data.original_prompt}</div>
                    </div>
                    
                    <div class="code-section">
                        <h2>Optimized Prompt</h2>
                        <div class="code-block">${data.optimized_prompt}</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Function to generate HTML for code suggestions
    function getSuggestionsHtml(suggestions: any[], code: string): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Code Suggestions</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        padding: 20px;
                        line-height: 1.6;
                    }
                    
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    .header {
                        margin-bottom: 30px;
                    }
                    
                    .header h1 {
                        color: var(--vscode-textLink-foreground);
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    
                    .suggestion-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 20px;
                    }
                    
                    .suggestion-title {
                        color: var(--vscode-textLink-foreground);
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    
                    .suggestion-description {
                        color: var(--vscode-editor-foreground);
                        margin-bottom: 15px;
                    }
                    
                    .suggestion-priority {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    
                    .priority-high {
                        background: var(--vscode-errorForeground);
                        color: var(--vscode-editor-background);
                    }
                    
                    .priority-medium {
                        background: var(--vscode-warningForeground);
                        color: var(--vscode-editor-background);
                    }
                    
                    .priority-low {
                        background: var(--vscode-notificationsInfoIcon-foreground);
                        color: var(--vscode-editor-background);
                    }
                    
                    .code-section {
                        margin-top: 30px;
                    }
                    
                    .code-section h2 {
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 15px;
                    }
                    
                    .code-block {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 20px;
                        font-family: 'Courier New', monospace;
                        white-space: pre-wrap;
                        overflow-x: auto;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💡 Code Suggestions</h1>
                    </div>
                    
                    ${suggestions.map(s => `
                        <div class="suggestion-card">
                            <div class="suggestion-title">${s.title}</div>
                            <div class="suggestion-description">${s.description}</div>
                            <div class="suggestion-priority priority-${s.priority.toLowerCase()}">${s.priority}</div>
                        </div>
                    `).join('')}
                    
                    <div class="code-section">
                        <h2>Analyzed Code</h2>
                        <div class="code-block">${code}</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

export function deactivate() {
    console.log('Cost Katana AI Optimizer extension is now deactivated!');
}