import * as vscode from 'vscode';

interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface UsageData {
    prompt: string;
    response: string;
    model: string;
    codeContext?: {
        file_path?: string;
        language?: string;
        code_snippet?: string;
    };
}

interface OptimizationData {
    prompt: string;
    currentTokens: number;
    codeContext?: {
        language?: string;
        file_path?: string;
    };
}

interface WorkspaceData {
    name: string;
    path: string;
    language: string;
    framework: string;
}

interface CodeAnalysisData {
    code_snippet: string;
    language: string;
    file_path: string;
}

interface SuggestionsData {
    code_snippet: string;
    language: string;
    file_path: string;
}

interface ProjectData {
    name: string;
    description?: string;
}

export class CostKatanaAPI {
    private baseUrl: string;
    private apiKey: string | undefined;
    private userId: string | undefined;

    // Getter for apiKey to allow external access
    get hasApiKey(): boolean {
        return !!this.apiKey;
    }

    constructor() {
        console.log('🔧 Initializing CostKatanaAPI');
        const config = vscode.workspace.getConfiguration('costKatana');
        this.baseUrl = config.get('backendUrl') || 'https://cost-katana-backend.store/api';
        this.apiKey = config.get('apiKey');
        this.userId = config.get('userId');
        
        console.log('🔧 API Configuration:');
        console.log('  - Base URL:', this.baseUrl);
        console.log('  - API Key:', this.apiKey ? '✅ Configured' : '❌ Not configured');
        console.log('  - User ID:', this.userId || '❌ Not configured');
    }

    private async makeRequest<T>(
        endpoint: string,
        method: 'GET' | 'POST' = 'GET',
        data?: any
    ): Promise<APIResponse<T>> {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add authentication headers if available
            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            console.log(`Making ${method} request to: ${url}`);
            if (data) {
                console.log('Request data:', JSON.stringify(data, null, 2));
            }

            const requestOptions: RequestInit = {
                method: method,
                headers: headers,
                body: data ? JSON.stringify(data) : undefined,
            };

            const response = await fetch(url, requestOptions);
            const result = await response.json() as APIResponse<T>;
            
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(result, null, 2));

            if (!response.ok) {
                return {
                    success: false,
                    error: (result as any).error || `HTTP ${response.status}: ${response.statusText}`,
                    message: (result as any).message || 'Request failed'
                };
            }

            return result;
        } catch (error) {
            console.error('API request failed:', error);
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                return {
                    success: false,
                    error: `Cannot connect to backend server. Please check if the backend URL is correct: ${this.baseUrl}`,
                    message: 'Network connection failed'
                };
            }
            
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                message: 'Network error occurred'
            };
        }
    }

    // ===== CURSOR-SPECIFIC APIs (MATCHING BACKEND) =====
    async generateMagicLink(email: string): Promise<APIResponse<{ magic_link: string }>> {
        // Try the cursor-specific endpoint first
        const cursorResponse = await this.makeRequest<{ magic_link: string }>('/cursor/action', 'POST', {
            action: 'generate_magic_link',
            email
        });
        
        if (cursorResponse.success) {
            return cursorResponse;
        }
        
        // Fallback to direct magic link endpoint
        console.log('Cursor endpoint failed, trying direct magic link endpoint');
        return this.makeRequest<{ magic_link: string }>('/auth/magic-link', 'POST', {
            email
        });
    }

    async validateConnection(): Promise<APIResponse> {
        // Try multiple health check endpoints
        const endpoints = ['/cursor/health', '/health', '/api/health'];
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint);
                if (response.success) {
                    return response;
                }
            } catch (error) {
                console.log(`Health check failed for ${endpoint}:`, error);
            }
        }
        
        return {
            success: false,
            error: 'All health check endpoints failed'
        };
    }

    async trackUsage(usageData: UsageData): Promise<APIResponse<{
        cost: string;
        tokens: number;
        usage_id: string;
        smart_tip: string;
        suggestions: string[];
        message: string;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'track_usage',
            user_id: this.userId,
            api_key: this.apiKey,
            ai_request: {
                prompt: usageData.prompt,
                response: usageData.response,
                model: usageData.model,
                request_type: 'code_generation',
                success: true,
                tokens_used: {
                    prompt_tokens: Math.ceil(usageData.prompt.length / 4),
                    completion_tokens: Math.ceil(usageData.response.length / 4),
                    total_tokens: Math.ceil(usageData.prompt.length / 4) + Math.ceil(usageData.response.length / 4)
                }
            },
            code_context: usageData.codeContext,
            workspace: {
                name: vscode.workspace.name || 'Unknown Workspace',
                path: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                language: usageData.codeContext?.language || 'unknown'
            }
        });
    }

    async optimizePrompt(optimizationData: OptimizationData): Promise<APIResponse<{
        original_prompt: string;
        optimized_prompt: string;
        token_reduction: number;
        original_tokens: number;
        optimized_tokens: number;
        cost_savings: string;
        quality_preserved: boolean;
        suggestions: string[];
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'optimize_prompt',
            user_id: this.userId,
            api_key: this.apiKey,
            optimization_request: {
                prompt: optimizationData.prompt,
                current_tokens: optimizationData.currentTokens,
                target_reduction: 20,
                preserve_quality: true,
                context: `Language: ${optimizationData.codeContext?.language || 'unknown'}`
            },
            code_context: optimizationData.codeContext
        });
    }

    async getAnalytics(): Promise<APIResponse<{
        summary: {
            total_spending_this_month: string;
            budget_used: string;
            active_projects: number;
        };
        cursor_specific: {
            total_requests: number;
            average_tokens_per_request: number;
            recent_activity: Array<{
                model: string;
                tokens: number;
                cost: string;
                timestamp: string;
            }>;
        };
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_analytics',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async setupWorkspace(workspaceData: WorkspaceData): Promise<APIResponse<{
        project_id: string;
        project_name: string;
        message: string;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'workspace_setup',
            user_id: this.userId,
            api_key: this.apiKey,
            workspace: workspaceData
        });
    }

    async getSuggestions(suggestionsData: SuggestionsData): Promise<APIResponse<{
        suggestions: Array<{
            title: string;
            description: string;
            priority: string;
            action: string;
        }>;
        context: {
            language: string;
            file_path: string;
        };
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_suggestions',
            user_id: this.userId,
            api_key: this.apiKey,
            code_context: {
                code_snippet: suggestionsData.code_snippet,
                language: suggestionsData.language,
                file_path: suggestionsData.file_path
            }
        });
    }

    async analyzeCode(analysisData: CodeAnalysisData): Promise<APIResponse<{
        analysis: {
            complexityScore: number;
            lines: number;
            functions: number;
            classes: number;
            optimizationPotential: string;
            recommendations: string[];
        };
        recommendations: string[];
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'analyze_code',
            user_id: this.userId,
            api_key: this.apiKey,
            code_context: {
                code_snippet: analysisData.code_snippet,
                language: analysisData.language,
                file_path: analysisData.file_path
            }
        });
    }

    async getProjects(): Promise<APIResponse<{
        projects: Array<{
            id: string;
            name: string;
            description: string;
            created_at: string;
            updated_at: string;
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_projects',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async createProject(projectData: ProjectData): Promise<APIResponse<{
        project_id: string;
        project_name: string;
        message: string;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'create_project',
            user_id: this.userId,
            api_key: this.apiKey,
            name: projectData.name
        });
    }

    // ===== UTILITY METHODS =====
    updateApiKey(apiKey: string) {
        this.apiKey = apiKey;
        // Update VS Code settings
        vscode.workspace.getConfiguration('costKatana').update('apiKey', apiKey, true);
    }

    updateUserId(userId: string) {
        this.userId = userId;
        // Update VS Code settings
        vscode.workspace.getConfiguration('costKatana').update('userId', userId, true);
    }

    updateBaseUrl(baseUrl: string) {
        this.baseUrl = baseUrl;
        // Update VS Code settings
        vscode.workspace.getConfiguration('costKatana').update('backendUrl', baseUrl, true);
    }

    // Test magic link URL
    async testMagicLinkUrl(url: string): Promise<boolean> {
        try {
            console.log('🔗 Testing magic link URL:', url);
            const response = await fetch(url, { method: 'HEAD' });
            console.log('🔗 Magic link test response:', response.status, response.statusText);
            return response.ok;
        } catch (error) {
            console.error('🔗 Magic link test failed:', error);
            return false;
        }
    }

    // ===== REAL-TIME TRACKING =====
    async startRealTimeTracking(): Promise<void> {
        // Simple polling for now
        setInterval(async () => {
            try {
                const analytics = await this.getAnalytics();
                if (analytics.success && analytics.data) {
                    // Show status update
                    vscode.window.showInformationMessage(
                        `📊 Cost Katana Status: ${analytics.data.summary.budget_used} budget used`
                    );
                }
            } catch (error) {
                // Silent fail for background polling
            }
        }, 60000); // Poll every minute
    }
} 