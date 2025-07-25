import * as vscode from 'vscode';
import axios from 'axios';

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

// Enhanced interfaces for additional APIs
interface IntelligenceData {
    usageId?: string;
    optimizationId?: string;
    feedback?: {
        rating: number;
        isAcceptable: boolean;
        comment?: string;
    };
}

interface MonitoringData {
    userId: string;
    threshold?: number;
    period?: string;
}

interface ExperimentationData {
    models: string[];
    prompt: string;
    expectedCompletionTokens?: number;
}

interface PricingData {
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
}

interface ProjectData {
    name: string;
    description?: string;
    budget_amount?: number;
    budget_period?: string;
    settings?: {
        enablePromptLibrary?: boolean;
        enableCostAllocation?: boolean;
    };
}

interface PromptTemplateData {
    name: string;
    content: string;
    category?: string;
    variables?: Array<{
        name: string;
        description?: string;
        defaultValue?: string;
        required: boolean;
    }>;
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
        const config = vscode.workspace.getConfiguration('costKatana');
        this.baseUrl = config.get('backendUrl') || 'https://cost-katana-backend.store/api';
        this.apiKey = config.get('apiKey');
        this.userId = config.get('userId');
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

            // Add authentication
            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            const response = await axios({
                method: method.toLowerCase(),
                url,
                headers,
                data: data ? JSON.stringify(data) : undefined,
            });

            const result = response.data;

            if (response.status >= 400) {
                return {
                    success: false,
                    error: result.error || `HTTP ${response.status}: ${response.statusText}`,
                    message: result.message
                };
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                message: 'Network error occurred'
            };
        }
    }

    // ===== CURSOR-SPECIFIC APIs =====
    async generateMagicLink(email: string): Promise<APIResponse<{ magic_link: string }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'generate_magic_link',
            email
        });
    }

    async validateConnection(): Promise<APIResponse> {
        return this.makeRequest('/cursor/health');
    }

    async trackUsage(usageData: UsageData): Promise<APIResponse<{
        cost: number;
        tokens: number;
        usage_id: string;
        smart_tip: string;
        request_type: string;
        language: string;
        estimated_monthly_cost: number;
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
        optimized_prompt: string;
        token_reduction: string;
        tokens_saved: number;
        cost_saved: number;
        techniques: string[];
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
        workspace_name: string;
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
            type: string;
            title: string;
            description: string;
            impact: string;
            potential_savings: string;
        }>;
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
            recommendations: Array<{
                type: string;
                title: string;
                description: string;
                priority: string;
            }>;
        };
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
            budget: string;
            current_spending: string;
            budget_used: string;
            status: string;
        }>;
        total_projects: number;
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
        budget: string;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'create_project',
            user_id: this.userId,
            api_key: this.apiKey,
            workspace: {
                name: projectData.name,
                description: projectData.description,
                budget_amount: projectData.budget_amount,
                budget_period: projectData.budget_period
            }
        });
    }

    // ===== INTELLIGENCE APIs =====
    async getPersonalizedTips(): Promise<APIResponse<{
        tips: Array<{
            tipId: string;
            title: string;
            message: string;
            type: string;
            priority: string;
            potentialSavings?: {
                percentage?: number;
                amount?: number;
                description: string;
            };
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_personalized_tips',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async getTipsForUsage(usageId: string): Promise<APIResponse<{
        tips: Array<{
            tipId: string;
            title: string;
            message: string;
            type: string;
            priority: string;
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', { 
            action: 'get_tips_for_usage',
            user_id: this.userId,
            api_key: this.apiKey,
            usage_id: usageId 
        });
    }

    async trackTipInteraction(tipId: string, interactionAction: 'view' | 'apply' | 'dismiss'): Promise<APIResponse> {
        return this.makeRequest('/cursor/action', 'POST', { 
            action: 'track_tip_interaction',
            user_id: this.userId,
            api_key: this.apiKey,
            tipId, 
            interaction_action: interactionAction 
        });
    }

    async scoreResponseQuality(intelligenceData: IntelligenceData): Promise<APIResponse<{
        qualityScore: number;
        scoringMethod: string;
        costSavings: {
            amount: number;
            percentage: number;
        };
        optimizationType: string[];
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'score_response_quality',
            user_id: this.userId,
            api_key: this.apiKey,
            ...intelligenceData
        });
    }

    async compareQuality(originalScore: number, optimizedScore: number): Promise<APIResponse<{
        improvement: number;
        recommendation: string;
        costImpact: number;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'compare_quality',
            user_id: this.userId,
            api_key: this.apiKey,
            originalScore,
            optimizedScore
        });
    }

    // ===== MONITORING APIs =====
    async triggerUserMonitoring(): Promise<APIResponse<{
        status: string;
        recommendations: Array<{
            type: string;
            title: string;
            description: string;
            priority: string;
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'trigger_monitoring',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async getUserUsageStatus(): Promise<APIResponse<{
        status: 'normal' | 'warning' | 'critical';
        metrics: {
            currentSpending: number;
            budgetUsed: number;
            avgTokensPerRequest: number;
            costPerToken: number;
        };
        alerts: Array<{
            type: string;
            message: string;
            severity: string;
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_user_status',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async getSmartRecommendations(): Promise<APIResponse<{
        recommendations: Array<{
            type: string;
            title: string;
            description: string;
            impact: string;
            estimatedSavings: number;
            implementation: string;
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_smart_recommendations',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    // ===== EXPERIMENTATION APIs =====
    async getAvailableModels(): Promise<APIResponse<{
        models: Array<{
            id: string;
            name: string;
            provider: string;
            pricing: {
                input: number;
                output: number;
                unit: string;
            };
            capabilities: string[];
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_available_models',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async runModelComparison(experimentationData: ExperimentationData): Promise<APIResponse<{
        comparison: Array<{
            model: string;
            provider: string;
            estimatedCost: number;
            estimatedTokens: number;
            quality: string;
            tradeoffs: string[];
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'run_model_comparison',
            user_id: this.userId,
            api_key: this.apiKey,
            ...experimentationData
        });
    }

    async estimateExperimentCost(experimentationData: ExperimentationData): Promise<APIResponse<{
        totalCost: number;
        breakdown: Array<{
            model: string;
            cost: number;
            tokens: number;
        }>;
        recommendations: string[];
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'estimate_experiment_cost',
            user_id: this.userId,
            api_key: this.apiKey,
            ...experimentationData
        });
    }

    // ===== PRICING APIs =====
    async getPricingUpdates(): Promise<APIResponse<{
        lastUpdated: string;
        providers: string[];
        changes: Array<{
            provider: string;
            model: string;
            change: string;
            impact: string;
        }>;
    }>> {
        return this.makeRequest('/pricing/updates');
    }

    async getAllPricing(): Promise<APIResponse<{
        providers: Record<string, Array<{
            model: string;
            inputPrice: number;
            outputPrice: number;
            contextWindow: number;
        }>>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_all_pricing',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async comparePricing(pricingData: PricingData): Promise<APIResponse<{
        comparison: Array<{
            model: string;
            provider: string;
            totalCost: number;
            inputCost: number;
            outputCost: number;
            costBreakdown: string;
        }>;
        cheapest: string;
        recommendations: string[];
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'compare_pricing',
            user_id: this.userId,
            api_key: this.apiKey,
            ...pricingData
        });
    }

    // ===== OPTIMIZATION APIs =====
    async getOptimizations(): Promise<APIResponse<{
        optimizations: Array<{
            id: string;
            originalPrompt: string;
            optimizedPrompt: string;
            tokensSaved: number;
            costSaved: number;
            improvementPercentage: number;
            applied: boolean;
            createdAt: string;
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_optimizations',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async applyOptimization(optimizationId: string): Promise<APIResponse<{
        success: boolean;
        appliedPrompt: string;
        message: string;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', { 
            action: 'apply_optimization',
            user_id: this.userId,
            api_key: this.apiKey,
            optimizationId 
        });
    }

    async analyzeOpportunities(): Promise<APIResponse<{
        opportunities: Array<{
            type: string;
            description: string;
            potentialSavings: number;
            difficulty: string;
            implementation: string;
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'analyze_opportunities',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    // ===== PROMPT TEMPLATE APIs =====
    async getPromptTemplates(): Promise<APIResponse<{
        templates: Array<{
            id: string;
            name: string;
            content: string;
            category: string;
            usage: {
                count: number;
                totalTokensSaved: number;
                totalCostSaved: number;
            };
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_prompt_templates',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async createPromptTemplate(templateData: PromptTemplateData): Promise<APIResponse<{
        templateId: string;
        message: string;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'create_prompt_template',
            user_id: this.userId,
            api_key: this.apiKey,
            ...templateData
        });
    }

    async useTemplate(templateId: string, variables: Record<string, string>): Promise<APIResponse<{
        prompt: string;
        estimatedTokens: number;
        estimatedCost: number;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', { 
            action: 'use_template',
            user_id: this.userId,
            api_key: this.apiKey,
            templateId, 
            variables 
        });
    }

    // ===== FORECASTING APIs =====
    async generateCostForecast(period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'): Promise<APIResponse<{
        forecast: Array<{
            period: string;
            predictedCost: number;
            confidence: number;
            factors: string[];
        }>;
        insights: string[];
    }>> {
        return this.makeRequest('/cursor/action', 'POST', { 
            action: 'generate_cost_forecast',
            user_id: this.userId,
            api_key: this.apiKey,
            period 
        });
    }

    async getPredictiveAlerts(): Promise<APIResponse<{
        alerts: Array<{
            type: string;
            message: string;
            probability: number;
            impact: string;
            recommendations: string[];
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_predictive_alerts',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    // ===== PERFORMANCE COST ANALYSIS APIs =====
    async analyzeCostPerformanceCorrelation(): Promise<APIResponse<{
        correlation: number;
        insights: string[];
        recommendations: Array<{
            type: string;
            description: string;
            impact: string;
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'analyze_cost_performance_correlation',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    async getEfficiencyScore(): Promise<APIResponse<{
        score: number;
        breakdown: {
            costEfficiency: number;
            tokenEfficiency: number;
            qualityEfficiency: number;
        };
        recommendations: string[];
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_efficiency_score',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    // ===== AGENT APIs =====
    async queryAgent(query: string, context?: any): Promise<APIResponse<{
        response: string;
        thinking?: {
            title: string;
            steps: Array<{
                step: number;
                description: string;
                reasoning: string;
            }>;
        };
        metadata: {
            tokensUsed: number;
            sources: string[];
            executionTime: number;
        };
    }>> {
        return this.makeRequest('/cursor/action', 'POST', { 
            action: 'query_agent',
            user_id: this.userId,
            api_key: this.apiKey,
            query, 
            context 
        });
    }

    async getAgentStatus(): Promise<APIResponse<{
        initialized: boolean;
        model: string;
        agentType: string;
        toolsCount: number;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_agent_status',
            user_id: this.userId,
            api_key: this.apiKey
        });
    }

    // ===== CHAT APIs =====
    async sendChatMessage(message: string, modelId: string, conversationId?: string): Promise<APIResponse<{
        messageId: string;
        conversationId: string;
        response: string;
        cost: number;
        tokenCount: number;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', { 
            action: 'send_chat_message',
            user_id: this.userId,
            api_key: this.apiKey,
            message, 
            modelId, 
            conversationId 
        });
    }

    async getConversationHistory(conversationId: string): Promise<APIResponse<{
        messages: Array<{
            id: string;
            role: string;
            content: string;
            timestamp: string;
        }>;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', {
            action: 'get_conversation_history',
            user_id: this.userId,
            api_key: this.apiKey,
            conversationId
        });
    }

    // ===== ANALYTICS APIs =====
    async getComparativeAnalytics(period1: { startDate: string; endDate: string }, period2: { startDate: string; endDate: string }): Promise<APIResponse<{
        comparison: {
            period1: {
                totalCost: number;
                totalTokens: number;
                avgCostPerRequest: number;
            };
            period2: {
                totalCost: number;
                totalTokens: number;
                avgCostPerRequest: number;
            };
            changes: {
                costChange: number;
                tokenChange: number;
                efficiencyChange: number;
            };
        };
    }>> {
        return this.makeRequest('/cursor/action', 'POST', { 
            action: 'get_comparative_analytics',
            user_id: this.userId,
            api_key: this.apiKey,
            period1, 
            period2 
        });
    }

    async exportAnalytics(format: 'csv' | 'json' = 'csv'): Promise<APIResponse<{
        downloadUrl: string;
        expiresAt: string;
    }>> {
        return this.makeRequest('/cursor/action', 'POST', { 
            action: 'export_analytics',
            user_id: this.userId,
            api_key: this.apiKey,
            format 
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

    // ===== REAL-TIME TRACKING =====
    async startRealTimeTracking(): Promise<void> {
        // This would implement SSE for real-time updates
        // For now, we'll use polling
        setInterval(async () => {
            try {
                const status = await this.getUserUsageStatus();
                if (status.success && status.data) {
                    // Emit status update event
                    vscode.window.showInformationMessage(
                        `Status: ${status.data.status.toUpperCase()} - Budget: ${status.data.metrics.budgetUsed.toFixed(1)}%`
                    );
                }
            } catch (error) {
                // Silent fail for background polling
            }
        }, 30000); // Poll every 30 seconds
    }
} 